import { NextApiRequest, NextApiResponse } from 'next'
import NextAuth, { NextAuthOptions } from 'next-auth'
import Credentials from 'next-auth/providers/credentials'
import DiscordProvider from 'next-auth/providers/discord'

import { User as BaseUser, getMe, login, loginDiscord } from '@/services/user'

declare module 'next-auth' {
  interface User {
    id: string
    email: string
    role: 'ADMIN' | 'TEACHER' | 'STUDENT'
    firstName: string
    lastName: string
    phoneNumber: string | null
    accessToken: string
    discordId?: string
  }

  interface Session {
    user: User
    expires: string
  }
}

const options: NextAuthOptions = {
  providers: [
    DiscordProvider({
      clientId: process.env.DISCORD_CLIENT_ID as string,
      clientSecret: process.env.DISCORD_CLIENT_SECRET as string,
    }),
    Credentials({
      id: 'credentials',
      credentials: {
        email: { type: 'text' },
        password: { type: 'password' },
        token: { type: 'text' },
      },
      authorize: async (credentials, req) => {
        if (!credentials) {
          throw new Error('กรุณากรอกชื่อผู้ใช้และรหัสผ่าน')
        }

        const headers = req.headers && {
          Referer: req.headers.Referer as string,
          'User-Agent': req.headers['user-agent'] as string,
        }

        const { accessToken } = await login(credentials, { ...headers })
        const user = await getMe(accessToken, { ...headers })

        return { accessToken, ...user }
      },
    }),
    Credentials({
      id: 'credentials-token',
      credentials: {
        accessToken: { type: 'text' },
      },
      authorize: async (credentials, req) => {
        if (!credentials) {
          throw new Error('โทเคนไม่ถูกต้อง')
        }

        const headers = req.headers && {
          Referer: req.headers.Referer as string,
          'User-Agent': req.headers['user-agent'] as string,
        }

        const { accessToken } = credentials
        const user = await getMe(credentials.accessToken, { ...headers })

        return { accessToken, ...user }
      },
    }),
  ],
  callbacks: {
    jwt: async ({ token, user, account, trigger }) => {
      if (trigger === 'update') {
        const _user = await getMe(
          (token as { accessToken: string }).accessToken,
          {},
        )
        return { ...token, ...user, ..._user }
      }

      if (account?.provider === 'discord') {

        if (token?.accessToken) {
          try {
            const apiUrl = process.env.NEXT_PUBLIC_API_URL

            const res = await fetch(`${apiUrl}/discord-id`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
                Authorization: `Bearer ${token.accessToken}`,
              },
              body: JSON.stringify({
                discordId: account.providerAccountId,
                email: token.email || user?.email || '',
              }),
            })

            if (!res.ok) {
              throw new Error('Backend failed to link discord id')
            }

            const _updatedUser = await getMe(token.accessToken as string, {})
            return { ...token, ..._updatedUser }

          } catch (error) {
            console.error('Failed to link Discord via backend:', error)
            throw new Error('ไม่สามารถเชื่อมต่อ Discord ได้ในขณะนี้')
          }
        }

        else if (user) {
          try {
            const nameParts = user.name?.split(' ') || ['Discord', 'User']
            const firstName = nameParts[0]
            const lastName = nameParts.slice(1).join(' ') || ''

            const backendData = await loginDiscord({
              discordId: account.providerAccountId,
              email: user.email || '',
              firstName: firstName,
              lastName: lastName,
            })
            const _fullUser = await getMe(backendData.accessToken, {})

            return { ...token, ...backendData, ..._fullUser }
          } catch (error) {
            console.error('Failed to login with Discord via backend:', error)
            throw new Error('ไม่สามารถเข้าสู่ระบบด้วย Discord ได้ในขณะนี้')
          }
        }
      }

      if (user) {
        return { ...token, ...user }
      }

      return token
    },
    session: async ({ session, token }) => {
      const _token = token as BaseUser & { accessToken: string }
      session.user = _token
      return session
    },
  },
  session: {
    strategy: 'jwt',
    maxAge: 7 * 24 * 60 * 60,
  },
  pages: {
    signIn: '/login',
  },
}

export const authOptions = options

export default function auth(req: NextApiRequest, res: NextApiResponse) {
  return NextAuth(req, res, options)
}
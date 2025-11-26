import { User } from 'next-auth'
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: ({ token }) => {
      if (!token) {
        return false
      }
      const user = token as unknown as User | null
      if (!user) {
        return false
      }

      return true
    },
  },
})

export const config = {
  matcher: ['/dashboard/:page*'],
}

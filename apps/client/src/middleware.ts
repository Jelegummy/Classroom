import { User } from 'next-auth'
import { withAuth } from 'next-auth/middleware'

export default withAuth({
  callbacks: {
    authorized: ({ token, req }) => {
      if (!token) {
        return false
      }
      const user = token as unknown as User | null
      if (
        req.nextUrl.pathname.startsWith('/backstage') &&
        user?.role !== 'TEACHER' &&
        user?.role !== 'ADMIN' &&
        user?.role !== 'STUDENT'
      ) {
        return false
      }

      return true
    },
  },
})

export const config = {
  matcher: ['/dashboard/:page*'],
}

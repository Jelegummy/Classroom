import { UnauthorizedException } from '@nestjs/common'
import { FastifyRequest } from 'fastify'

export type Context = FastifyRequest & {
  raw: {
    user: {
      id: string
      email: string
      firstName: string
      lastName: string
      role: 'STUDENT' | 'ADMIN' | 'TEACHER'
      phoneNumber: string | null
      schoolId?: string
    } | null
  }
}

export const getUserFromContext = (ctx: Context) => {
  const user = ctx.raw.user
  if (!user) {
    throw new UnauthorizedException('Unauthorized')
  }

  return user
}

import { UnauthorizedException } from '@nestjs/common'
import { FastifyRequest } from 'fastify'

export type Context = FastifyRequest & {
  raw: {
    user: {
      id: string
      email: string
      firstName: string
      lastName: string
      role: 'USER' | 'ADMIN'
      phoneNumber: string | null
      address: string | null
      province: string | null
      district: string | null
      country: string | null
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

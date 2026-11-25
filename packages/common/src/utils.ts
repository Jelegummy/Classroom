import { ForbiddenException, UnauthorizedException } from '@nestjs/common'
import { FastifyRequest } from 'fastify'
import { timingSafeEqual } from 'node:crypto'

export type Role = 'STUDENT' | 'ADMIN' | 'TEACHER'

export type ContextUser = {
  id: string
  email: string
  firstName: string
  lastName: string
  role: Role
  phoneNumber: string | null
  schoolId: string
}

export type Context = FastifyRequest & {
  raw: {
    user: ContextUser | null
  }
}

export const getUserFromContext = (ctx: Context): ContextUser => {
  const user = ctx.raw.user
  if (!user) {
    throw new UnauthorizedException('Unauthorized')
  }

  return user
}

export const isStaff = (user: Pick<ContextUser, 'role'>) =>
  user.role === 'TEACHER' || user.role === 'ADMIN'

/** Returns the authenticated user, or throws 401/403. */
export const requireRole = (ctx: Context, roles: Role[], action?: string) => {
  const user = getUserFromContext(ctx)
  if (!roles.includes(user.role)) {
    throw new ForbiddenException(
      action
        ? `Only ${roles.join(', ').toLowerCase()} can ${action}`
        : 'Forbidden',
    )
  }

  return user
}

export const requireStaff = (ctx: Context, action?: string) =>
  requireRole(ctx, ['TEACHER', 'ADMIN'], action)

/** Admins may act on anything; everyone else only on records they own. */
export const assertOwnerOrAdmin = (
  user: Pick<ContextUser, 'id' | 'role'>,
  ownerId: string | null | undefined,
  message = 'You are not the owner of this resource',
) => {
  if (user.role !== 'ADMIN' && ownerId !== user.id) {
    throw new ForbiddenException(message)
  }
}

/**
 * Fields of a user that are safe to return to other users.
 * Never select `password` (or `user: true`) in API responses.
 */
export const publicUserSelect = {
  id: true,
  email: true,
  firstName: true,
  lastName: true,
  role: true,
  points: true,
  discordId: true,
} as const

/** Constant-time comparison for shared secrets sent by the bots. */
export const assertBotSecret = (
  provided: string | undefined,
  expected: string,
) => {
  const a = Buffer.from(provided ?? '', 'utf-8')
  const b = Buffer.from(expected, 'utf-8')
  if (!expected || a.length !== b.length || !timingSafeEqual(a, b)) {
    throw new UnauthorizedException('Invalid bot secret')
  }
}

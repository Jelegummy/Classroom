import { AuthService } from '@app/auth'
import { PrismaService } from '@app/db'
import { Injectable, NestMiddleware } from '@nestjs/common'
import { FastifyReply, FastifyRequest } from 'fastify'

import { Context } from './utils'

type Request = FastifyRequest['raw'] & Context['raw']

@Injectable()
export class UserMiddleware implements NestMiddleware {
  constructor(
    private readonly authService: AuthService,
    private readonly db: PrismaService,
  ) {}

  async use(req: Request, _res: FastifyReply['raw'], next: () => void) {
    req.user = null

    const header = req.headers.authorization
    const token = header?.startsWith('Bearer ') ? header.slice(7) : undefined
    if (!token) {
      return next()
    }

    try {
      const { id } = this.authService.verifyToken(token)
      req.user = await this.db.user.findUnique({
        where: { id },
        select: {
          id: true,
          email: true,
          firstName: true,
          lastName: true,
          role: true,
          phoneNumber: true,
          schoolId: true,
        },
      })
    } catch {
      // Invalid/expired token: treat the request as anonymous.
      req.user = null
    }

    return next()
  }
}

import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common'
import { FastifyReply, FastifyRequest } from 'fastify'

type PrismaKnownError = {
  name: 'PrismaClientKnownRequestError'
  code: string
  meta?: Record<string, unknown>
}

const isPrismaKnownError = (e: unknown): e is PrismaKnownError =>
  typeof e === 'object' &&
  e !== null &&
  (e as { name?: string }).name === 'PrismaClientKnownRequestError' &&
  typeof (e as { code?: unknown }).code === 'string'

const PRISMA_STATUS: Record<string, [HttpStatus, string]> = {
  P2002: [HttpStatus.CONFLICT, 'Resource already exists'],
  P2003: [
    HttpStatus.BAD_REQUEST,
    'Related resource does not exist or is still in use',
  ],
  P2025: [HttpStatus.NOT_FOUND, 'Resource not found'],
}

/**
 * Returns `{ statusCode, message }` for every error, maps well-known Prisma
 * errors to 4xx responses and never leaks internal error details for 500s.
 */
@Catch()
export class HttpExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger('HttpExceptionFilter')

  catch(exception: unknown, host: ArgumentsHost) {
    if (host.getType() !== 'http') {
      throw exception
    }

    const ctx = host.switchToHttp()
    const reply = ctx.getResponse<FastifyReply>()
    const request = ctx.getRequest<FastifyRequest>()

    let status = HttpStatus.INTERNAL_SERVER_ERROR
    let body: Record<string, unknown> = {
      statusCode: status,
      message: 'Internal server error',
    }

    if (exception instanceof HttpException) {
      status = exception.getStatus()
      const res = exception.getResponse()
      body =
        typeof res === 'string'
          ? { statusCode: status, message: res }
          : { statusCode: status, ...(res as object) }
    } else if (isPrismaKnownError(exception) && PRISMA_STATUS[exception.code]) {
      const [prismaStatus, message] = PRISMA_STATUS[exception.code]
      status = prismaStatus
      body = { statusCode: status, message }
    }

    if (status >= 500) {
      this.logger.error(
        `${request.method} ${request.url}`,
        exception instanceof Error ? exception.stack : String(exception),
      )
    }

    void reply.status(status).send(body)
  }
}

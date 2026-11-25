import {
  CallHandler,
  ExecutionContext,
  HttpException,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common'
import { FastifyRequest } from 'fastify'
import { tap } from 'rxjs'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger('HTTP')

  intercept(ctx: ExecutionContext, next: CallHandler) {
    if (ctx.getType() !== 'http') {
      return next.handle()
    }

    const start = Date.now()
    const { method, url } = ctx.switchToHttp().getRequest<FastifyRequest>()

    return next.handle().pipe(
      tap({
        next: () => this.logger.log(`${method} ${url} ${Date.now() - start}ms`),
        error: (err: unknown) => {
          const status = err instanceof HttpException ? err.getStatus() : 500
          const line = `${method} ${url} ${status} ${Date.now() - start}ms`
          if (status >= 500) {
            this.logger.error(line)
          } else {
            this.logger.warn(line)
          }
        },
      }),
    )
  }
}

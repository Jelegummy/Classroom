import {
  CallHandler,
  ExecutionContext,
  Injectable,
  Logger,
  NestInterceptor,
} from '@nestjs/common'
import { FastifyRequest } from 'fastify'
import { tap } from 'rxjs'

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  private readonly logger = new Logger()

  intercept(ctx: ExecutionContext, next: CallHandler) {
    const start = Date.now()

    const { method, url } = ctx.switchToHttp().getRequest() as FastifyRequest

    return next.handle().pipe(
      tap({
        next: () => this.logger.log(`${method} ${url} ${Date.now() - start}ms`),
        error: () =>
          this.logger.error(`${method} ${url} ${Date.now() - start}ms`),
      }),
    )
  }
}

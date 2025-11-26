import { AuthModule } from '@app/auth'
import { LoggingInterceptor, UserMiddleware } from '@app/common'
// import { env, mailerConfig } from '@app/config'
import { mailerConfig } from '@app/config'
import { PrismaModule } from '@app/db'
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { MailerModule } from '@nestjs-modules/mailer'
// import { MinioModule } from 'nestjs-minio-client'
import { ZodValidationPipe } from 'nestjs-zod'

import { UserModule } from './api/user/user.module'

@Module({
  imports: [
    UserModule,
    AuthModule,
    PrismaModule,
    MailerModule.forRoot(mailerConfig),
    // MinioModule.register({
    //   endPoint: env.MINIO_ENDPOINT,
    //   port: 443,
    //   useSSL: true,
    //   accessKey: env.MINIO_ACCESS_KEY,
    //   secretKey: env.MINIO_SECRET_KEY,
    //   isGlobal: true,
    // }),
  ],
  providers: [
    {
      provide: APP_PIPE,
      useClass: ZodValidationPipe,
    },
    {
      provide: APP_INTERCEPTOR,
      useClass: LoggingInterceptor,
    },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserMiddleware).forRoutes('*')
  }
}

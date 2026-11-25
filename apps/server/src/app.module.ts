import { AuthModule } from '@app/auth'
import {
  HttpExceptionFilter,
  LoggingInterceptor,
  UserMiddleware,
} from '@app/common'
import { mailerConfig } from '@app/config'
import { PrismaModule } from '@app/db'
import { MiddlewareConsumer, Module, NestModule } from '@nestjs/common'
import { APP_FILTER, APP_INTERCEPTOR, APP_PIPE } from '@nestjs/core'
import { MailerModule } from '@nestjs-modules/mailer'
import { ZodValidationPipe } from 'nestjs-zod'

import { AnnounceModule } from './api/announce/announce.module'
import { AssignmentModule } from './api/assignment/assignment.module'
import { AttendanceModule } from './api/attendance/attendance.module'
import { CharacterModule } from './api/character/character.module'
import { ClassroomModule } from './api/classroom/classroom.module'
import { GameModule } from './api/game/game.module'
import { ItemsModule } from './api/items/items.module'
import { PaymentModule } from './api/payment/payment.module'
import { SchoolModule } from './api/school/school.module'
import { TutorModule } from './api/tutor/tuter.module'
import { UserModule } from './api/user/user.module'

@Module({
  imports: [
    PrismaModule,
    AuthModule,
    MailerModule.forRoot(mailerConfig),
    UserModule,
    SchoolModule,
    ClassroomModule,
    TutorModule,
    GameModule,
    AttendanceModule,
    PaymentModule,
    CharacterModule,
    ItemsModule,
    AnnounceModule,
    AssignmentModule,
  ],
  providers: [
    { provide: APP_PIPE, useClass: ZodValidationPipe },
    { provide: APP_INTERCEPTOR, useClass: LoggingInterceptor },
    { provide: APP_FILTER, useClass: HttpExceptionFilter },
  ],
})
export class AppModule implements NestModule {
  configure(consumer: MiddlewareConsumer) {
    consumer.apply(UserMiddleware).forRoutes('{*splat}')
  }
}

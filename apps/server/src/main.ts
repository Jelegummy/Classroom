import { assertServerEnv, env } from '@app/config'
import multipart from '@fastify/multipart'
import { Logger } from '@nestjs/common'
import { NestFactory } from '@nestjs/core'
import {
  FastifyAdapter,
  NestFastifyApplication,
} from '@nestjs/platform-fastify'
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger'

import { AppModule } from './app.module'

const logger = new Logger('Bootstrap')

const main = async () => {
  assertServerEnv()

  const app = await NestFactory.create<NestFastifyApplication>(
    AppModule,
    new FastifyAdapter({
      trustProxy: true,
      bodyLimit: 20 * 1024 * 1024,
    }),
    {
      bodyParser: true,
      cors: {
        origin: env.CORS_ORIGINS,
        credentials: true,
        methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
      },
    },
  )

  // Fastify plugin types don't line up exactly with Nest's re-exported instance type.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  await app.register(multipart as any, {
    limits: { files: 5, fileSize: 20 * 1024 * 1024 },
  })

  if (!env.isProduction) {
    const config = new DocumentBuilder()
      .setTitle('Classroom API')
      .addBearerAuth({
        name: 'Authorization',
        bearerFormat: 'Bearer',
        type: 'http',
      })
      .build()
    const document = SwaggerModule.createDocument(app, config)
    SwaggerModule.setup('api', app, document)
  }

  app.enableShutdownHooks()
  await app.listen({ host: '0.0.0.0', port: env.PORT })
  logger.log(`Server  at http://127.0.0.1:${env.PORT}/[paths]`)
  if (!env.isProduction) {
    logger.log(`Swagger at http://127.0.0.1:${env.PORT}/api`)
  }
}

process.on('unhandledRejection', reason => {
  logger.error('Unhandled promise rejection', reason as Error)
})

main().catch(error => {
  logger.error('Failed to start server', error)
  process.exit(1)
})

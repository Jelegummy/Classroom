import {
  Injectable,
  Logger,
  OnModuleDestroy,
  OnModuleInit,
} from '@nestjs/common'
import { PrismaPg } from '@prisma/adapter-pg'

import { PrismaClient } from './generated/client'

const toInt = (value: string | undefined, fallback: number) => {
  const parsed = Number(value)

  return Number.isFinite(parsed) && parsed > 0 ? parsed : fallback
}

@Injectable()
export class PrismaService
  extends PrismaClient
  implements OnModuleInit, OnModuleDestroy
{
  private readonly logger = new Logger(PrismaService.name)

  constructor() {
    super({
      adapter: new PrismaPg({
        connectionString: process.env.DATABASE_URL,
        max: toInt(process.env.DATABASE_POOL_MAX, 10),
        idleTimeoutMillis: 30_000,
        connectionTimeoutMillis: 10_000,
      }),
    })
  }

  async onModuleInit() {
    await this.$connect()
    this.logger.log('Database connected')
  }

  async onModuleDestroy() {
    await this.$disconnect()
  }
}

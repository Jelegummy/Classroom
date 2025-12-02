import { PrismaModule } from './prisma.module'
import { PrismaService } from './prisma.service'
import { PrismaClient, Prisma as PrismaTypes } from './generated/client'
import type * as PrismaModels from './generated/client'

export { PrismaTypes, PrismaClient, PrismaModule, PrismaService, PrismaModels }

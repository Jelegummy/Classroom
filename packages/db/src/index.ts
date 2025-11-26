import { PrismaModule } from './prisma.module'
import { PrismaService } from './prisma.service'
import { PrismaClient, Prisma as PrismaTypes } from '../dist/client'
import type * as PrismaModels from '../dist/client'

export { PrismaTypes, PrismaClient, PrismaModule, PrismaService, PrismaModels }

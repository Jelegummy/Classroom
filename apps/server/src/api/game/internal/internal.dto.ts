import { time } from 'console'
import { createZodDto, patchNestJsSwagger } from 'nestjs-zod'
import { z } from 'zod'

export class CreateGameArgs extends createZodDto(
  z.object({
    name: z.string().min(1),
    bossName: z.string().min(1),
    imageUrl: z.string().optional(),
    maxHp: z.number().min(1),
    timeLimit: z.number().min(1),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
  }),
) {}

export class UpdateGameArgs extends createZodDto(
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    bossName: z.string().min(1),
    imageUrl: z.string().optional(),
    maxHp: z.number().min(1),
    timeLimit: z.number().min(1),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
  }),
) {}

patchNestJsSwagger()

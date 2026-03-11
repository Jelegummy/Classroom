import { createZodDto, patchNestJsSwagger } from 'nestjs-zod'
import { z } from 'zod'

export class CreateCharacterDto extends createZodDto(
  z.object({
    bossName: z.string().min(1),
    pointBoss: z.number().min(0).optional(),
    maxHp: z.number().min(1).optional(),
    timeLimit: z.number().min(1).optional(),
    description: z.string().optional(),
    modelUrl: z.string().optional(),
    imageUrl: z.string().optional(),
  }),
) {}

patchNestJsSwagger()

import { createZodDto, patchNestJsSwagger } from 'nestjs-zod'
import { z } from 'zod'

export class CreateGameArgs extends createZodDto(
  z.object({
    name: z.string().min(1),
    imageUrl: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
    classroomId: z.string().min(1),
    characterId: z.string().min(1),
    timeLimit: z.number().min(0).optional(),
    damageBoost: z.number().min(0).optional(),
    maxHpBoss: z.number().min(0).optional(),
  }),
) {}

export class UpdateGameArgs extends createZodDto(
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    imageUrl: z.string().optional(),
    description: z.string().optional(),
    isActive: z.boolean().default(true),
  }),
) {}

export class AttackGameArgs extends createZodDto(
  z.object({
    gameId: z.string().min(1),
    damage: z.number().min(1),
  }),
) {}

patchNestJsSwagger()

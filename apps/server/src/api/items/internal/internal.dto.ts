import { createZodDto, patchNestJsSwagger } from 'nestjs-zod'
import { z } from 'zod'

export class ItemsArgs extends createZodDto(
  z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.number().int().min(0),
    effectValue: z.number().int().optional(),
    imageUrl: z.string().url().optional(),
    type: z.enum(['ATTACK_BOOST', 'TIME_EXTEND']),
  }),
) {}

export class UpdateItemsArgs extends createZodDto(
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.number().int().min(0),
    effectValue: z.number().int().optional(),
    type: z.enum(['ATTACK_BOOST', 'TIME_EXTEND']),
  }),
) {}

export class SpacialItemsArgs extends createZodDto(
  z.object({
    amount: z.number().int().min(1).max(1000),
  }),
) {}

export class BuyItemsArgs extends createZodDto(
  z.object({
    userId: z.string().min(1),
    itemId: z.string().min(1),
    gameId: z.string().min(1).optional(),
    amount: z.number().int().min(1).max(1000),
  }),
) {}

patchNestJsSwagger()

import { createZodDto, patchNestJsSwagger } from 'nestjs-zod'
import { effect, z } from 'zod'

export class ItemsArgs extends createZodDto(
  z.object({
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.number().min(0),
    effectValue: z.number().optional(),
    type: z.enum(['ATTACK_BOOST', 'TIME_EXTEND']),
  }),
) {}

export class UpdateItemsArgs extends createZodDto(
  z.object({
    id: z.string().min(1),
    name: z.string().min(1),
    description: z.string().optional(),
    price: z.number().min(0),
    effectValue: z.number().optional(),
    type: z.enum(['ATTACK_BOOST', 'TIME_EXTEND']),
  }),
) {}

export class SpacialItemsArgs extends createZodDto(
  z.object({
    amount: z.number().min(1),
  }),
) {}

export class BuyItemsArgs extends createZodDto(
  z.object({
    userId: z.string().min(1),
    itemId: z.string().min(1),
    amount: z.number().min(1),
  }),
) {}

patchNestJsSwagger()

import { createZodDto, patchNestJsSwagger } from 'nestjs-zod'
import { z } from 'zod'

export class UpdateUserArgs extends createZodDto(
  z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    address: z.string().optional(),
    phoneNumber: z.string().optional(),
    province: z.string().optional(),
    district: z.string().optional(),
    country: z.string().optional(),
  }),
) {}

export class UpdatePasswordArgs extends createZodDto(
  z.object({
    oldpassword: z.string().min(8),
    newPassword: z.string().min(8),
  }),
) {}

patchNestJsSwagger()

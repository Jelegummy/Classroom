import { createZodDto, patchNestJsSwagger } from 'nestjs-zod'
import { z } from 'zod'

export class RegisterArgs extends createZodDto(
  z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phoneNumber: z.string().optional(),
    address: z.string().optional(),
    province: z.string().optional(),
    district: z.string().optional(),
    country: z.string().optional(),
  }),
) {}

export class LoginArgs extends createZodDto(
  z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
) {}

patchNestJsSwagger()

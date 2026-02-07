import { createZodDto, patchNestJsSwagger } from 'nestjs-zod'
import { z } from 'zod'

export class RegisterArgs extends createZodDto(
  z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string().min(1),
    lastName: z.string().min(1),
    phoneNumber: z.string().optional(),
    schoolId: z.string().min(1).optional(),
    schoolName: z.string().min(1).optional(),
  }),
) {}

export class LoginArgs extends createZodDto(
  z.object({
    email: z.string().email(),
    password: z.string().min(8),
  }),
) {}

patchNestJsSwagger()

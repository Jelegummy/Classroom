import { createZodDto, patchNestJsSwagger } from 'nestjs-zod'
import { z } from 'zod'

export class UpdateUserArgs extends createZodDto(
  z.object({
    firstName: z.string().optional(),
    lastName: z.string().optional(),
    phoneNumber: z.string().optional(),
    studentId: z.string().optional(),
    teacherId: z.string().optional(),
    major: z.string().optional(),
  }),
) {}

export class UpdatePasswordArgs extends createZodDto(
  z.object({
    oldpassword: z.string().min(8),
    newPassword: z.string().min(8),
  }),
) {}

export class CreateUserArgs extends createZodDto(
  z.object({
    email: z.string().email(),
    password: z.string().min(8),
    firstName: z.string(),
    lastName: z.string(),
    role: z.enum(['STUDENT', 'TEACHER', 'ADMIN']),
    schoolId: z.string().min(1).optional(),
    schoolName: z.string().min(1).optional(),
  }),
) {}

export class ConnectDiscordArgs extends createZodDto(
  z.object({
    discordId: z.string().min(1),
  }),
) {}

patchNestJsSwagger()

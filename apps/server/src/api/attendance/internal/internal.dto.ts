import { createZodDto, patchNestJsSwagger } from 'nestjs-zod'
import { z } from 'zod'

export class CreateGameAttendanceDto extends createZodDto(
  z.object({
    activeGameId: z.string(), // ID Game Session
    userId: z.string(),
    classroomId: z.string(),
    scoreEarned: z.number().min(0),
    status: z.enum(['PRESENT', 'LATE', 'ABSENT']),
  }),
) {}

patchNestJsSwagger()

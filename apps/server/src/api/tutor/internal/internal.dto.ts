import { createZodDto, patchNestJsSwagger } from 'nestjs-zod'
import { start } from 'repl'
import { z } from 'zod'

export class CreateTutorArgs extends createZodDto(
  z.object({
    botLink: z.string().optional(),
    startTime: z.coerce.date().optional(),
    dataContent: z.string().optional(),
    discordChannelId: z.string().optional(),
    classroomId: z.string().min(1),
  }),
) {}

patchNestJsSwagger()

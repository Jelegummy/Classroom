import { createZodDto, patchNestJsSwagger } from 'nestjs-zod'
import { z } from 'zod'

export class CreateTutorVoiceLogArgs extends createZodDto(
  z.object({
    topic: z.string().min(1),
    summary: z.string().min(1),
    dataContent: z.record(z.any()),
  }),
) {}

patchNestJsSwagger()

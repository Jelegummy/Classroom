import { createZodDto, patchNestJsSwagger } from 'nestjs-zod'
import { z } from 'zod'

export class CreateTutorVoiceLogArgs extends createZodDto(
  z.object({
    topic: z.string().min(1),
    summary: z.string().min(1),
    dataContent: z.record(z.any()),
    // The bot sends null when the R2 upload fails; keep the log anyway.
    audioUrl: z.string().min(1).nullish(),
    voiceChannelName: z.string().min(1),
  }),
) {}

patchNestJsSwagger()

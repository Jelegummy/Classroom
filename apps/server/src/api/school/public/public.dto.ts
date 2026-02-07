import { createZodDto, patchNestJsSwagger } from 'nestjs-zod'
import { z } from 'zod'

export class SchoolPublicDto extends createZodDto(
  z.object({
    name: z.string().min(1),
    address: z.string().min(1).optional(),
  }),
) {}

patchNestJsSwagger()

//Not used yet

import { createZodDto, patchNestJsSwagger } from "nestjs-zod";
import { z } from "zod";

export class CreateCharacterDto extends createZodDto(
    z.object({
        name: z.string().optional(),
        description: z.string().optional(),
        modelUrl: z.string().optional(),
        imageUrl: z.string().optional(),
    }),
) { }

patchNestJsSwagger();
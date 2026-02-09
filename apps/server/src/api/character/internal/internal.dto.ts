import { createZodDto, patchNestJsSwagger } from "nestjs-zod";
import { z } from "zod";

export class CreateCharacterDto extends createZodDto(
    z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        modelUrl: z.string().optional(),
        imageUrl: z.string().optional(),
    }),
) { }

patchNestJsSwagger();
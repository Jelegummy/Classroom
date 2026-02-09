import { createZodDto, patchNestJsSwagger } from "nestjs-zod";
import { z } from "zod";

export class CreateCharacterDto extends createZodDto(
    z.object({
        bossName: z.string().min(1),
        maxHp: z.number().min(1),
        timeLimit: z.number().min(1),
        description: z.string().optional(),
        modelUrl: z.string().optional(),
        imageUrl: z.string().optional(),
    }),
) { }

patchNestJsSwagger();
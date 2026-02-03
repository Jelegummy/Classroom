import { createZodDto, patchNestJsSwagger } from "nestjs-zod";
import { z } from "zod";

export class CreateClassroomArgs extends createZodDto(
    z.object({
        name: z.string().min(1),
        title: z.string().optional(),
        // code: z.string().min(1)
    })
) { }

export class UpdateClassroomArgs extends createZodDto(
    z.object({
        id: z.string().min(1),
        name: z.string().min(1).optional(),
        title: z.string().optional(),
        hoverImage: z.string().optional(),
    })
) { }

export class JoinCodeArgs extends createZodDto(
    z.object({
        code: z.string().min(1),
    })
) { }

patchNestJsSwagger();
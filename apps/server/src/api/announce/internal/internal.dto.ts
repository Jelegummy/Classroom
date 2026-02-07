import { createZodDto, patchNestJsSwagger } from "nestjs-zod";
import { z } from "zod";

export class CreateAnnounceArgs extends createZodDto(
    z.object({
        message: z.string().min(1),
        title: z.string().min(1),
        filePdf: z.string().optional(),
        classroomId: z.string().min(1),
    })
) { }

export class UpdateAnnounceArgs extends createZodDto(
    z.object({
        message: z.string().min(1),
        title: z.string().min(1),
        filePdf: z.string().optional(),
    })
) { }

patchNestJsSwagger();
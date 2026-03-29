import { createZodDto, patchNestJsSwagger } from 'nestjs-zod'
import { z } from 'zod'

patchNestJsSwagger()
export class GetAssignmentArgs extends createZodDto(
  z.object({
    assignmentId: z.string().uuid(),
  }),
) {}

export class DeleteAssignmentArgs extends createZodDto(
  z.object({
    assignmentId: z.string().uuid(),
  }),
) {}

export class GetAssignmentsByClassroomArgs extends createZodDto(
  z.object({
    classroomId: z.string().uuid(),
  }),
) {}

export class GetSubmissionsByAssignmentArgs extends createZodDto(
  z.object({
    assignmentId: z.string().uuid(),
    classroomId: z.string().uuid(),
  }),
) {}

export class ApproveSubmissionArgs extends createZodDto(
  z.object({
    submissionId: z.string().uuid(),
    isApproved: z.boolean(),
  }),
) {}

export class GetAnswerHistoryArgs extends createZodDto(
  z.object({
    submissionId: z.string().uuid(),
  }),
) {}
export class SubmitHomeworkArgs extends createZodDto(
  z.object({
    userId: z.string().uuid(),
    classroomAssignmentId: z.string().uuid(),
    score: z.number().int().min(0),
    answerHistory: z.array(
      z.object({
        role: z.enum(['bot', 'student']),
        content: z.string(),
        is_correct: z.boolean().optional(),
      }),
    ),
  }),
) {}

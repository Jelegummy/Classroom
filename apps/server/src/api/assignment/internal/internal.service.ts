import { PrismaService } from '@app/db'
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { Context, getUserFromContext } from '@app/common'
import { CheckStatus } from '@app/db/dist/generated/enums'

@Injectable()
export class AssignmentInternalService {
  constructor(private readonly db: PrismaService) { }

  async getAssignment(args: { assignmentId: string }, ctx: Context) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new UnauthorizedException('User not authenticated')
    }

  const assignment = await this.db.assignment.findUnique({
    where: {
      id: args.assignmentId,
    },
    select: {
      id: true,
      title: true,
      chatHistory: true,
      filePdf: true,
      description: true,
      creatorId: true,

      classrooms: {
        select: {
          classroomId: true,
          dueDate: true,
          submissions: {
            select: {
              id: true,
              userId: true,
              score: true,
              isApproved: true,
              submittedAt: true,
            },
          },
        },
      },
    },
  })

  if (!assignment) {
    throw new NotFoundException('Assignment not found')
  }

  return assignment
}
  
  async deleteAssignment(args: { assignmentId: string }, ctx: Context) {
    const user = getUserFromContext(ctx)
    if (!user) {
      throw new UnauthorizedException('User not authenticated')
    }

  if (!args.assignmentId) {
    throw new BadRequestException('assignmentId is required')
  }

  await this.db.classroomOnAssignment.deleteMany({
    where: { assignmentId: args.assignmentId },
  })

  await this.db.assignment.delete({
    where: { id: args.assignmentId },
  })

  return {
    message: 'Assignment deleted successfully',
  }
}

  async getAllAssignments(ctx: Context , classroomId?: string) {
    const user = getUserFromContext(ctx)
    if (!user) {
      throw new UnauthorizedException('User not authenticated')
    }

  return this.db.assignment.findMany({
    where: {
      classrooms: {
        some: { classroomId: classroomId },
      },
    },
    select: {
      id: true,
      title: true,
      status: true,
      classrooms: {
        where: { classroomId: classroomId },
        select: {
          dueDate: true,
          submissions: {
            select: {
              id: true,
              userId: true,
            },
          },
        },
      },
    },
  })
  }
  
  async getSubmissionsByAssignment(assignmentId: string, classroomId: string) {
  const classroomAssignment = await this.db.classroomOnAssignment.findFirst({
    where: {
      assignmentId,
      classroomId,
    },
  })

  if (!classroomAssignment) {
    throw new NotFoundException('Assignment not found in classroom')
  }

  return this.db.homeworkSubmission.findMany({
    where: {
      classroomAssignmentId: classroomAssignment.id,
    },
    select: {
      id: true,
      isApproved: true,
      submittedAt: true,
      score: true,
      aiFeedback: true,
      transcription: true,
      user: {
        select: {
          id: true,
          firstName: true,
          lastName: true,
          studentId: true,
        },
      },
    },
    orderBy: {
      submittedAt: 'desc',
    },
  })
}

async approveSubmission(submissionId: string, isApproved: boolean) {
  const submission = await this.db.homeworkSubmission.findUnique({
    where: { id: submissionId },
  })

  if (!submission) {
    throw new NotFoundException('Submission not found')
  }

  return this.db.homeworkSubmission.update({
    where: { id: submissionId },
    data: { isApproved },
  })
}

async getAnswerHistory(submissionId: string) {
  const submission = await this.db.homeworkSubmission.findUnique({
    where: { id: submissionId },
    select: {
      id: true,
      answerHistory: true,
      user: {
        select: {
          firstName: true,
          lastName: true,
        },
      },
    },
  })

  if (!submission) {
    throw new NotFoundException('Submission not found')
  }

  return submission
}
}


import { PrismaService } from '@app/db'
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { Context, getUserFromContext } from '@app/common'
import { ApproveSubmissionArgs, SubmitAssignmentArgs } from './internal.dto'

@Injectable()
export class AssignmentInternalService {
  constructor(private readonly db: PrismaService) {}

  private requireUser(ctx: Context) {
    const user = getUserFromContext(ctx)
    if (!user) {
      throw new UnauthorizedException('User not found')
    }
    return user
  }

  async getAssignment(args: { assignmentId: string }, ctx: Context) {
    const user = this.requireUser(ctx)

    const assignment = await this.db.assignment.findUnique({
      where: {
        id: args.assignmentId,
      },
      select: {
        id: true,
        title: true,
        chatHistory: true,
        answerFile: true,
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
    const user = this.requireUser(ctx)

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

  async getAllAssignments(ctx: Context, classroomId?: string) {
    const user = this.requireUser(ctx)

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
          where: classroomId ? { classroomId: classroomId } : {},
          select: {
            classroomId: true,
            dueDate: true,
            submissions: {
              select: {
                id: true,
                userId: true,
                isApproved: true,
                score: true,
              },
            },
          },
        },
      },
    })
  }

  async submitAssignment(args: SubmitAssignmentArgs, ctx: Context) {
    const user = this.requireUser(ctx)
    return this.db.homeworkSubmission.create({
      data: {
        userId: user.id,
        classroomAssignmentId: args.classroomAssignmentId,
        score: args.score,
        answerHistory: args.answerHistory,
      },
    })
  }

  async getSubmissionsByAssignment(
    assignmentId: string,
    classroomId: string,
    ctx: Context,
  ) {
    const user = this.requireUser(ctx)
    const classroomAssignment = await this.db.classroomOnAssignment.findFirst({
      where: {
        assignmentId,
        classroomId,
      },
    })

    if (!classroomAssignment) {
      throw new NotFoundException('Assignment not found in this classroom')
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

  async getSubmissionDetail(submissionId: string, ctx: Context) {
    const user = this.requireUser(ctx)
    const submission = await this.db.homeworkSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        score: true,
        isApproved: true,
        submittedAt: true,
        aiFeedback: true,
        transcription: true,
        answerHistory: true,
        user: {
          select: {
            id: true,
            firstName: true,
            lastName: true,
            studentId: true,
          },
        },
        classroomAssignment: {
          select: {
            classroomId: true,
            assignmentId: true,
            assignment: {
              select: {
                title: true,
                description: true,
              },
            },
          },
        },
      },
    })

    if (!submission) {
      throw new NotFoundException('Submission not found')
    }

    return submission
  }

  private calculateResult(score: number) {
    const MAX_SCORE = 5
    const isPassed = score / MAX_SCORE >= 0.7
    return { currentScore: score, MAX_SCORE, isPassed, pointsToAdd: score }
  }

  private async updateUserPoints(tx: any, userId: string, points: number) {
    await tx.user.update({
      where: { id: userId },
      data: { points: { increment: points } },
    })
  }

  private async updateClassroomScore(
    tx: any,
    userId: string,
    classroomId: string,
    points: number,
  ) {
    await tx.classroomOnUser.update({
      where: { userId_classroomId: { userId, classroomId } },
      data: { score: { increment: points } },
    })
  }

  private async upsertAttendance(
    tx: any,
    userId: string,
    submissionId: string,
    points: number,
  ) {
    await tx.attendance.upsert({
      where: {
        userId_homeworkSubmissionId: {
          userId,
          homeworkSubmissionId: submissionId,
        },
      },
      update: { scoreEarned: points, status: 'PRESENT' },
      create: {
        userId,
        homeworkSubmissionId: submissionId,
        scoreEarned: points,
        status: 'PRESENT',
      },
    })
  }

  async approveSubmission(args: ApproveSubmissionArgs, ctx: Context) {
    const user = this.requireUser(ctx)

    const submission = await this.db.homeworkSubmission.findUnique({
      where: { id: args.submissionId },
      include: {
        user: true,
        classroomAssignment: true,
      },
    })

    if (!submission) {
      throw new NotFoundException('Submission not found')
    }

    if (submission.isApproved && args.isApproved) {
      throw new BadRequestException('Already approved')
    }

    const { currentScore, MAX_SCORE, isPassed, pointsToAdd } =
      this.calculateResult(submission.score ?? 0)
    const updated = await this.db.$transaction(async tx => {
      const subUpdate = await tx.homeworkSubmission.update({
        where: { id: args.submissionId },
        data: { isApproved: args.isApproved },
      })

      if (args.isApproved) {
        await this.updateUserPoints(tx, submission.userId, pointsToAdd)
        await this.updateClassroomScore(
          tx,
          submission.userId,
          submission.classroomAssignment.classroomId,
          pointsToAdd,
        )
        await this.upsertAttendance(
          tx,
          submission.userId,
          submission.id,
          pointsToAdd,
        )
      }
      return subUpdate
    })
    return {
      id: updated.id,
      studentName:
        `${submission.user.firstName} ${submission.user.lastName || ''}`.trim(),
      result: {
        rawScore: currentScore,
        fullScore: MAX_SCORE,
        isPassed,
        pointsAwarded: args.isApproved ? pointsToAdd : 0,
      },
      totalUserPoints:
        submission.user.points + (args.isApproved ? pointsToAdd : 0),
    }
  }

  async getClassroomAssignment(assignmentId: string, classroomId: string) {
    const result = await this.db.classroomOnAssignment.findFirst({
      where: { assignmentId, classroomId },
      select: {
        id: true,
        dueDate: true,
        assignment: {
          select: {
            title: true,
            status: true,
          },
        },
      },
    })
    if (!result) throw new NotFoundException('ClassroomAssignment not found')
    return result
  }
}

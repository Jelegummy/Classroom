import {
  Context,
  ContextUser,
  assertBotSecret,
  assertOwnerOrAdmin,
  getUserFromContext,
  isStaff,
  requireStaff,
} from '@app/common'
import { env } from '@app/config'
import { PrismaService } from '@app/db'
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { ApproveSubmissionArgs, SubmitHomeworkArgs } from './internal.dto'

/** Number of questions asked per AI homework-checking session. */
const MAX_SCORE = 5
const PASS_RATIO = 0.7

@Injectable()
export class AssignmentInternalService {
  constructor(private readonly db: PrismaService) {}

  /** Assignments visible to the user: those attached to one of their classrooms. */
  private memberScope(user: Pick<ContextUser, 'id' | 'role'>) {
    return user.role === 'ADMIN'
      ? {}
      : {
          classrooms: {
            some: { classroom: { users: { some: { userId: user.id } } } },
          },
        }
  }

  async getAssignment(args: { assignmentId: string }, ctx: Context) {
    const user = getUserFromContext(ctx)

    const assignment = await this.db.assignment.findFirst({
      where: { id: args.assignmentId, ...this.memberScope(user) },
      select: {
        id: true,
        title: true,
        answerFile: isStaff(user), // expected answers are for teachers only
        chatHistory: true,
        filePdf: true,
        description: true,
        creatorId: true,
        classrooms: {
          select: {
            id: true,
            classroomId: true,
            dueDate: true,
            submissions: {
              // Students only see their own submissions.
              where: isStaff(user) ? {} : { userId: user.id },
              select: {
                id: true,
                userId: true,
                score: true,
                isApproved: true,
                submittedAt: true,
              },
              orderBy: { submittedAt: 'desc' },
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
    const user = requireStaff(ctx, 'delete assignments')

    const assignment = await this.db.assignment.findUnique({
      where: { id: args.assignmentId },
      select: { creatorId: true },
    })
    if (!assignment) {
      throw new NotFoundException('Assignment not found')
    }
    assertOwnerOrAdmin(user, assignment.creatorId)

    const submissionScope = {
      classroomAssignment: { assignmentId: args.assignmentId },
    }
    await this.db.$transaction([
      this.db.attendance.deleteMany({
        where: { homeworkSubmission: submissionScope },
      }),
      this.db.homeworkSubmission.deleteMany({ where: submissionScope }),
      this.db.classroomOnAssignment.deleteMany({
        where: { assignmentId: args.assignmentId },
      }),
      this.db.assignment.delete({ where: { id: args.assignmentId } }),
    ])

    return { message: 'Assignment deleted successfully' }
  }

  async getAllAssignments(ctx: Context, classroomId?: string) {
    const user = getUserFromContext(ctx)

    // Without a classroomId this used to return every assignment in the system.
    return this.db.assignment.findMany({
      where: {
        ...this.memberScope(user),
        ...(classroomId ? { classrooms: { some: { classroomId } } } : {}),
        ...(isStaff(user) ? {} : { status: 'PUBLISHED' as const }),
      },
      select: {
        id: true,
        title: true,
        status: true,
        classrooms: {
          where: classroomId ? { classroomId } : {},
          select: {
            classroomId: true,
            dueDate: true,
            submissions: {
              where: isStaff(user) ? {} : { userId: user.id },
              select: { id: true, userId: true, isApproved: true, score: true },
            },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async getSubmissionsByAssignment(
    assignmentId: string,
    classroomId: string,
    ctx: Context,
  ) {
    const user = getUserFromContext(ctx)

    const classroomAssignment = await this.db.classroomOnAssignment.findFirst({
      where: {
        assignmentId,
        classroomId,
        ...(user.role === 'ADMIN'
          ? {}
          : { classroom: { users: { some: { userId: user.id } } } }),
      },
      select: { id: true },
    })
    if (!classroomAssignment) {
      throw new NotFoundException('Assignment not found in classroom')
    }

    return this.db.homeworkSubmission.findMany({
      where: {
        classroomAssignmentId: classroomAssignment.id,
        ...(isStaff(user) ? {} : { userId: user.id }),
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
      orderBy: { submittedAt: 'desc' },
    })
  }

  async approveSubmission(args: ApproveSubmissionArgs, ctx: Context) {
    // Previously students could approve (and earn points for) their own work.
    requireStaff(ctx, 'approve submissions')

    const submission = await this.db.homeworkSubmission.findUnique({
      where: { id: args.submissionId },
      include: {
        user: { select: { firstName: true, lastName: true, points: true } },
        classroomAssignment: { select: { classroomId: true } },
      },
    })
    if (!submission) {
      throw new NotFoundException('Submission not found')
    }

    const currentScore = submission.score ?? 0
    const isPassed = currentScore / MAX_SCORE >= PASS_RATIO
    const pointsToAdd = currentScore

    const awarded = await this.db.$transaction(async tx => {
      // Conditional flip makes concurrent/double approvals a no-op.
      const { count } = await tx.homeworkSubmission.updateMany({
        where: { id: submission.id, isApproved: !args.isApproved },
        data: { isApproved: args.isApproved },
      })
      if (count === 0) {
        if (args.isApproved) {
          throw new BadRequestException('Already approved')
        }

        return false
      }
      if (!args.isApproved) {
        return false
      }

      // Points are granted only once per submission, even if it is
      // un-approved and approved again.
      const alreadyAwarded = await tx.attendance.findUnique({
        where: {
          userId_homeworkSubmissionId: {
            userId: submission.userId,
            homeworkSubmissionId: submission.id,
          },
        },
        select: { id: true },
      })
      if (alreadyAwarded) {
        return false
      }

      await tx.user.update({
        where: { id: submission.userId },
        data: { points: { increment: pointsToAdd } },
      })
      await tx.classroomOnUser.updateMany({
        where: {
          userId: submission.userId,
          classroomId: submission.classroomAssignment.classroomId,
        },
        data: { score: { increment: pointsToAdd } },
      })
      await tx.attendance.create({
        data: {
          userId: submission.userId,
          homeworkSubmissionId: submission.id,
          scoreEarned: pointsToAdd,
          status: 'PRESENT',
        },
      })

      return true
    })

    return {
      id: submission.id,
      studentName:
        `${submission.user.firstName} ${submission.user.lastName || ''}`.trim(),
      result: {
        rawScore: currentScore,
        fullScore: MAX_SCORE,
        isPassed,
        pointsAwarded: awarded ? pointsToAdd : 0,
      },
      totalUserPoints: submission.user.points + (awarded ? pointsToAdd : 0),
    }
  }

  async getAnswerHistory(submissionId: string, ctx: Context) {
    const user = getUserFromContext(ctx)

    const submission = await this.db.homeworkSubmission.findUnique({
      where: { id: submissionId },
      select: {
        id: true,
        userId: true,
        answerHistory: true,
        user: { select: { firstName: true, lastName: true } },
      },
    })
    // Students may only read their own answer history.
    if (!submission || (!isStaff(user) && submission.userId !== user.id)) {
      throw new NotFoundException('Submission not found')
    }

    return submission
  }

  async getClassroomAssignment(
    assignmentId: string,
    classroomId: string,
    ctx: Context,
  ) {
    const user = getUserFromContext(ctx)

    const result = await this.db.classroomOnAssignment.findFirst({
      where: {
        assignmentId,
        classroomId,
        ...(user.role === 'ADMIN'
          ? {}
          : { classroom: { users: { some: { userId: user.id } } } }),
      },
      select: { id: true },
    })
    if (!result) {
      throw new NotFoundException('ClassroomAssignment not found')
    }

    return result
  }

  /** Called by the assignment bot once an AI checking session finishes. */
  async submitHomework(args: SubmitHomeworkArgs, botSecret?: string) {
    assertBotSecret(botSecret, env.BOT_API_SECRET)

    const enrolled = await this.db.classroomOnAssignment.findFirst({
      where: {
        id: args.classroomAssignmentId,
        classroom: { users: { some: { userId: args.userId } } },
      },
      select: { id: true },
    })
    if (!enrolled) {
      throw new BadRequestException(
        'User is not enrolled in the classroom of this assignment',
      )
    }

    return this.db.homeworkSubmission.create({
      data: {
        userId: args.userId,
        classroomAssignmentId: args.classroomAssignmentId,
        score: Math.min(args.score, MAX_SCORE),
        answerHistory: args.answerHistory,
      },
    })
  }
}

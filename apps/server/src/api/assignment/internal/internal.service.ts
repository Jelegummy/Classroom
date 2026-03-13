import { PrismaService } from '@app/db'
import {
  Injectable,
  BadRequestException,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'
import { Context, getUserFromContext } from '@app/common'
import { CheckStatus } from '@app/db/dist/generated/enums'
import { ApproveSubmissionArgs, SubmitHomeworkArgs } from './internal.dto'

@Injectable()
export class AssignmentInternalService {
  constructor(private readonly db: PrismaService) {}

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

  async getAllAssignments(ctx: Context, classroomId?: string) {
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
                isApproved: true,
                score: true,
              },
            },
          },
        },
      },
    })
  }

  async getSubmissionsByAssignment(
    assignmentId: string,
    classroomId: string,
    ctx: Context,
  ) {
    const user = getUserFromContext(ctx)
    if (!user) {
      throw new UnauthorizedException('User not authenticated')
    }
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

  
  async approveSubmission(args: ApproveSubmissionArgs, ctx: Context) {
    const user = getUserFromContext(ctx)
    if (!user) {
      throw new UnauthorizedException('User not authenticated')
    }

    // 1. Fetch data พร้อมดึง classroomId จาก Assignment
    const submission = await this.db.homeworkSubmission.findUnique({
      where: { id: args.submissionId },
      include: {
        user: true,
        classroomAssignment: true, // เพื่อเอา classroomId
      },
    })

    if (!submission) {
      throw new NotFoundException('Submission not found')
    }

    if (submission.isApproved && args.isApproved) {
      throw new BadRequestException('Already approved')
    }

    // 2. Logic การคำนวณผ่านเกณฑ์ 70%
    const currentScore = submission.score ?? 0
    const MAX_SCORE = 5
    const isPassed = currentScore / MAX_SCORE >= 0.7
    const pointsToAdd = isPassed ? 5 : 1

    // 3. Database Transaction
    const updated = await this.db.$transaction(async tx => {
      // A) Update สถานะการส่งงาน
      const subUpdate = await tx.homeworkSubmission.update({
        where: { id: args.submissionId },
        data: { isApproved: args.isApproved },
      })

      if (args.isApproved) {
        // B) Update คะแนนรวมของ User (Global Points)
        await tx.user.update({
          where: { id: submission.userId },
          data: { points: { increment: pointsToAdd } },
        })

        // C) Update คะแนนในห้องเรียน (Classroom Score)
        // ใช้ userId และ classroomId เป็น Unique identifier
        await tx.classroomOnUser.update({
          where: {
            userId_classroomId: {
              userId: submission.userId,
              classroomId: submission.classroomAssignment.classroomId,
            },
          },
          data: {
            score: { increment: pointsToAdd },
          },
        })

        //บันทึกลง Attendance (Session Record)
        await tx.attendance.upsert({
          where: {
            userId_homeworkSubmissionId: {
              userId: submission.userId,
              homeworkSubmissionId: submission.id,
            },
          },
          update: {
            scoreEarned: pointsToAdd,
            status: 'PRESENT',
          },
          create: {
            userId: submission.userId,
            homeworkSubmissionId: submission.id,
            scoreEarned: pointsToAdd,
            status: 'PRESENT',
          },
        })
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

  async getAnswerHistory(submissionId: string, ctx: Context) {
    const user = getUserFromContext(ctx)
    if (!user) {
      throw new UnauthorizedException('User not authenticated')
    }
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
  async getClassroomAssignment(assignmentId: string, classroomId: string) {
    const result = await this.db.classroomOnAssignment.findFirst({
      where: { assignmentId, classroomId },
      select: { id: true },
    })
    if (!result) throw new NotFoundException('ClassroomAssignment not found')
    return result
  }

  async submitHomework(args: SubmitHomeworkArgs) {
    return this.db.homeworkSubmission.create({
      data: {
        userId: args.userId,
        classroomAssignmentId: args.classroomAssignmentId,
        score: args.score,
        answerHistory: args.answerHistory,
      },
    })
  }
}

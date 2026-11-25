import { Context } from '@app/common'
import {
  Body,
  Controller,
  Delete,
  Get,
  Headers,
  HttpCode,
  HttpStatus,
  Param,
  Post,
  Query,
  Req,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { ApproveSubmissionArgs, SubmitHomeworkArgs } from './internal.dto'
import { AssignmentInternalService } from './internal.service'

@ApiTags('Assignment - Internal')
@Controller('/assignment/internal')
export class AssignmentInternalController {
  constructor(private readonly service: AssignmentInternalService) {}

  @Get('/get-assignment/:assignmentId')
  async getAssignment(
    @Param('assignmentId') assignmentId: string,
    @Req() ctx: Context,
  ) {
    const res = await this.service.getAssignment({ assignmentId }, ctx)

    return { statusCode: HttpStatus.OK, data: res }
  }

  @Delete('/delete/:assignmentId')
  async deleteAssignment(
    @Param('assignmentId') assignmentId: string,
    @Req() ctx: Context,
  ) {
    await this.service.deleteAssignment({ assignmentId }, ctx)

    return {
      statusCode: HttpStatus.OK,
      message: 'Assignment deleted successfully',
    }
  }

  @Get('/all')
  async getAllAssignments(
    @Req() ctx: Context,
    @Query('classroomId') classroomId?: string,
  ) {
    const res = await this.service.getAllAssignments(ctx, classroomId)

    return { statusCode: HttpStatus.OK, data: res }
  }

  @Get('/submissions/:assignmentId/:classroomId')
  async getSubmissionsByAssignment(
    @Param('assignmentId') assignmentId: string,
    @Param('classroomId') classroomId: string,
    @Req() ctx: Context,
  ) {
    const res = await this.service.getSubmissionsByAssignment(
      assignmentId,
      classroomId,
      ctx,
    )

    return { statusCode: HttpStatus.OK, data: res }
  }

  @Post('/approvesubmission')
  async approveSubmission(
    @Body() args: ApproveSubmissionArgs,
    @Req() ctx: Context,
  ) {
    const res = await this.service.approveSubmission(args, ctx)

    return { statusCode: HttpStatus.OK, message: res }
  }

  @Get('/answerhistory/:submissionId')
  async getAnswerHistory(
    @Param('submissionId') submissionId: string,
    @Req() ctx: Context,
  ) {
    const res = await this.service.getAnswerHistory(submissionId, ctx)

    return { statusCode: HttpStatus.OK, data: res }
  }

  @Get('/classroom-assignment/:assignmentId/:classroomId')
  async getClassroomAssignment(
    @Param('assignmentId') assignmentId: string,
    @Param('classroomId') classroomId: string,
    @Req() ctx: Context,
  ) {
    const res = await this.service.getClassroomAssignment(
      assignmentId,
      classroomId,
      ctx,
    )

    return { statusCode: HttpStatus.OK, data: res }
  }
  @Post('/submit')
  @HttpCode(HttpStatus.OK)
  async submitHomework(
    @Body() args: SubmitHomeworkArgs,
    @Headers('x-bot-secret') botSecret?: string,
  ) {
    const res = await this.service.submitHomework(args, botSecret)

    return { statusCode: HttpStatus.OK, data: res }
  }
}

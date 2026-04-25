import {
  Body,
  Controller,
  HttpCode,
  HttpStatus,
  Post,
  Get,
  Req,
  Query,
  Param,
  Delete,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { AssignmentInternalService } from './internal.service'
import { ApproveSubmissionArgs, SubmitAssignmentArgs } from './internal.dto'
import { Context } from '@app/common'

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
  } //TODO : fix Route

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
  } //TODO : fix Route

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
  } //TODO : fix Route

  @Get('/submission/:submissionId')
  async getSubmissionDetail(
    @Param('submissionId') submissionId: string,
    @Req() ctx: Context,
  ) {
    const res = await this.service.getSubmissionDetail(submissionId, ctx)

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

  @Get('/classroom-assignment/:assignmentId/:classroomId')
  async getClassroomAssignment(
    @Param('assignmentId') assignmentId: string,
    @Param('classroomId') classroomId: string,
  ) {
    const res = await this.service.getClassroomAssignment(
      assignmentId,
      classroomId,
    )
    return { statusCode: HttpStatus.OK, data: res }
  }

  @Post('/submit')
  @HttpCode(HttpStatus.OK)
  async submitAssignment(
    @Body() args: SubmitAssignmentArgs,
    @Req() ctx: Context,
  ) {
    const res = await this.service.submitAssignment(args, ctx)
    return { statusCode: HttpStatus.OK, data: res }
  }
}

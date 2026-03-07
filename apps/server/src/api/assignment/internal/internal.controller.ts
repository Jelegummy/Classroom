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
import { GetAssignmentArgs, DeleteAssignmentArgs, GetAssignmentsByClassroomArgs, GetSubmissionsByAssignmentArgs, ApproveSubmissionArgs, GetAnswerHistoryArgs } from './internal.dto'
import { Context } from '@app/common'

@ApiTags('Assignment - Internal')
@Controller('/assignment/internal')
export class AssignmentInternalController {
  constructor(private readonly service: AssignmentInternalService) { }

  @Get('/get-assignment/:assignmentId')
  async getAssignment(@Param('assignmentId') assignmentId: string, @Req() ctx: Context) {
    const res = await this.service.getAssignment({assignmentId}, ctx)

    return { statusCode : HttpStatus.OK, data: res }
  } //TODO : fix Route

  @Delete('/delete/:assignmentId')
    async deleteAssignment(@Param('assignmentId') assignmentId: string, @Req() ctx: Context) {
      await this.service.deleteAssignment({assignmentId}, ctx)
      return { statusCode: HttpStatus.OK, message: 'Assignment deleted successfully' }
    } //TODO : fix Route
  
  @Get('/all')
  async getAllAssignments(@Req() ctx: Context, @Param('classroomId') classroomId?: string) {
    const res = await this.service.getAllAssignments(ctx, classroomId)
      
    return { statusCode: HttpStatus.OK, data: res }
  } //TODO : fix Route
  
  @Get('getsubmissions')
@HttpCode(HttpStatus.OK)
async getSubmissionsByAssignment(
  @Query() query: GetSubmissionsByAssignmentArgs,
) {
  return this.service.getSubmissionsByAssignment(
    query.assignmentId,
    query.classroomId,
  )
}

@Post('approvesubmission')
@HttpCode(HttpStatus.OK)
async approveSubmission(@Body() body: ApproveSubmissionArgs) {
  return this.service.approveSubmission(body.submissionId, body.isApproved)
}

@Get('getanswerhistory')
@HttpCode(HttpStatus.OK)
async getAnswerHistory(@Body() query: GetAnswerHistoryArgs) {
  return this.service.getAnswerHistory(query.submissionId)
}
}
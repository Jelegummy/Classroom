import { Controller, Get, HttpStatus, Param, Req } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { SchoolInternalService } from './internal.service'
import { Context } from '@app/common'

@ApiTags('School')
@Controller('school/internal')
export class SchoolInternalController {
  constructor(private readonly service: SchoolInternalService) {}

  @Get('/all')
  async getAllSchools(@Req() ctx: Context) {
    const res = await this.service.getAllSchools(ctx)

    return { statusCode: HttpStatus.OK, data: res }
  }

  @Get('/:id')
  async getSchoolById(@Req() ctx: Context, @Param('id') id: string) {
    const res = await this.service.getSchoolById(ctx, id)

    return { statusCode: HttpStatus.OK, data: res }
  }
}

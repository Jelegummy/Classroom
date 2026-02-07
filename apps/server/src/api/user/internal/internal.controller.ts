import { Context } from '@app/common'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Req,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { UpdatePasswordArgs, UpdateUserArgs } from './internal.dto'
import { UserInternalService } from './internal.service'

@ApiTags('User - Internal')
@Controller('user/internal')
export class UserInternalController {
  constructor(private readonly service: UserInternalService) {}

  @Get('/me')
  async getMe(@Req() ctx: Context) {
    const res = await this.service.getMe(ctx)

    return { statusCode: HttpStatus.OK, data: res }
  }

  @Patch('/')
  async updateUser(@Body() args: UpdateUserArgs, @Req() ctx: Context) {
    await this.service.updateUser(args, ctx)

    return { statusCode: HttpStatus.OK }
  }

  @Patch('/password')
  async updatePassword(@Body() args: UpdatePasswordArgs, @Req() ctx: Context) {
    await this.service.updatePassword(args, ctx)

    return { statusCode: HttpStatus.OK }
  }

  @Get('/all')
  async getAllUsers(@Req() ctx: Context) {
    const res = await this.service.getAllUsers(ctx)

    return { statusCode: HttpStatus.OK, data: res }
  }

  @Delete('/:id')
  async deleteUser(@Param('id') id: string, @Req() ctx: Context) {
    await this.service.deleteUser({ id }, ctx)

    return { statusCode: HttpStatus.OK }
  }
}

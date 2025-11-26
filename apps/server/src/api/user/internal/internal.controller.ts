import { Context } from '@app/common'
import { Body, Controller, Get, HttpStatus, Patch, Req } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { UpdatePasswordArgs, UpdateUserArgs } from './internal.dto'
import { UserInternalService } from './internal.service'

@ApiTags('User - Internal')
@Controller('user/internal')
export class UserInternalController {
  constructor(private readonly service: UserInternalService) {}

  @Get('/me')
  getMe(@Req() ctx: Context) {
    const res = this.service.getMe(ctx)

    return { statussCode: HttpStatus.OK, data: res }
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
}

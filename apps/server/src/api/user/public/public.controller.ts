import { Body, Controller, Headers, HttpStatus, Post } from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { LoginArgs, LoginDiscordArgs, RegisterArgs, RegisterDiscordArgs } from './public.dto'
import { UserPublicService } from './public.service'

@ApiTags('User - Public')
@Controller('user/public')
export class UserPublicController {
  constructor(private readonly service: UserPublicService) { }

  @Post('/register')
  async register(@Body() args: RegisterArgs) {
    await this.service.register(args)

    return { statusCode: HttpStatus.CREATED }
  }

  @Post('/login')
  async login(@Body() args: LoginArgs) {
    const res = await this.service.login(args)

    return { statusCode: HttpStatus.OK, data: res }
  }

  @Post('/users/register-discord')
  async registerDiscord(
    @Body() args: RegisterDiscordArgs,
    @Headers('x-bot-secret') botSecret: 'super-secret-bot-key',
  ) {
    const res = await this.service.registerDiscord(args, botSecret)

    return { statusCode: HttpStatus.CREATED, data: res }
  }

  @Post('/users/discord')
  async loginDiscord(@Body() args: LoginDiscordArgs) {
    const res = await this.service.loginDiscord(args)

    return { statusCode: HttpStatus.OK, data: res }
  }
}

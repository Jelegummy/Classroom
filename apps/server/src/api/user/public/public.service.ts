import { AuthService } from '@app/auth'
import { PrismaService } from '@app/db'
import { BadRequestException, Injectable } from '@nestjs/common'

import { LoginArgs, RegisterArgs } from './public.dto'

@Injectable()
export class UserPublicService {
  constructor(
    private readonly db: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async register(args: RegisterArgs) {
    const { email, password, ...rest } = args

    const exist = await this.db.user.findUnique({ where: { email } })
    if (exist) {
      throw new BadRequestException('User already exists.')
    }

    const hashedPassword = await this.authService.hashPassword(password)
    const user = await this.db.user.create({
      data: {
        ...rest,
        email,
        password: hashedPassword,
      },
    })

    return user
  }

  async login(args: LoginArgs) {
    const user = await this.db.user.findUnique({
      where: { email: args.email },
    })
    if (!user) {
      throw new BadRequestException('Invalid email or password.')
    }

    const isPassword = await this.authService.verifyPassword(
      args.password,
      user.password,
    )
    if (!isPassword) {
      throw new BadRequestException('Invalid email or password.')
    }

    return { accessToken: this.authService.generateToken(user.id) }
  }
}

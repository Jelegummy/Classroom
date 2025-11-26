import { AuthService } from '@app/auth'
import { Context, getUserFromContext } from '@app/common'
import { PrismaService } from '@app/db'
import { Injectable } from '@nestjs/common'

import { UpdatePasswordArgs, UpdateUserArgs } from './internal.dto'

@Injectable()
export class UserInternalService {
  constructor(
    private readonly db: PrismaService,
    private readonly authService: AuthService,
  ) {}

  getMe(ctx: Context) {
    const user = getUserFromContext(ctx)

    return user
  }

  async updateUser(args: UpdateUserArgs, ctx: Context) {
    const user = getUserFromContext(ctx)

    await this.db.user.update({
      where: { id: user.id },
      data: args,
    })
  }

  async updatePassword(args: UpdatePasswordArgs, ctx: Context) {
    const _user = getUserFromContext(ctx)
    const { oldpassword, newPassword } = args

    const user = await this.db.user.findUnique({
      where: { id: _user.id },
    })
    if (!user) {
      throw new Error('User not found')
    }

    const isPasswordValid = await this.authService.verifyPassword(
      oldpassword,
      user.password,
    )
    if (!isPasswordValid) {
      throw new Error('Invalid password')
    }

    const newHashedPassword = await this.authService.hashPassword(newPassword)
    await this.db.user.update({
      where: { id: _user.id },
      data: { password: newHashedPassword },
    })
  }
}

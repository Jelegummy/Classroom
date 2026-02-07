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

  async getMe(ctx: Context) {
    const user = getUserFromContext(ctx)
    if (!user) {
      throw new Error('User not found')
    }

    const users = await this.db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        studentId: true,
        teacherId: true,
        major: true,
        role: true,

        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })
    return users
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

  async getAllUsers(ctx: Context) {
    const user = getUserFromContext(ctx)

    if (user.role !== 'ADMIN') {
      throw new Error('Only admins can access all users')
    }

    const users = await this.db.user.findMany({
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        studentId: true,
        teacherId: true,
        major: true,
        role: true,
        createdAt: true,
        updatedAt: true,
        school: {
          select: {
            id: true,
            name: true,
          },
        },
      },
    })

    return users
  }

  async deleteUser(args: { id: string }, ctx: Context) {
    const user = getUserFromContext(ctx)

    if (user.role !== 'ADMIN') {
      throw new Error('Only admins can delete users')
    }

    await this.db.user.delete({
      where: { id: args.id },
    })
  }
}

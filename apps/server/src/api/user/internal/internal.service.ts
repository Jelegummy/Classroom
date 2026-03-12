import { AuthService } from '@app/auth'
import { Context, getUserFromContext } from '@app/common'
import { PrismaService } from '@app/db'
import { Injectable } from '@nestjs/common'

import {
  CreateUserArgs,
  UpdatePasswordArgs,
  UpdateUserArgs,
} from './internal.dto'

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
        points: true,
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
      user.password || '',
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
        points: true,
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

  async getUserPoint(args: { id: string }, ctx: Context) {
    const user = getUserFromContext(ctx)

    if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
      throw new Error('Only admins can access user points')
    }

    const res = await this.db.user.findUnique({
      where: { id: args.id },
      select: {
        points: true,
      },
    })

    if (!res) {
      throw new Error('User not found')
    }

    return res
  }

  async createUser(args: CreateUserArgs, ctx: Context) {
    const user = getUserFromContext(ctx)

    if (user.role !== 'ADMIN') {
      throw new Error('Only admins can create users')
    }

    const { email, password, schoolId, schoolName, ...rest } = args

    const exist = await this.db.user.findUnique({ where: { email } })
    if (exist) {
      throw new Error('User already exists')
    }

    const hashedPassword = await this.authService.hashPassword(password)

    return this.db.$transaction(async tx => {
      let finalSchoolId = '6c18f70e-9457-4f2b-904c-29927997ad69'
      const user = await tx.user.create({
        data: {
          ...rest,
          email,
          password: hashedPassword,
          role: 'STUDENT',
          schoolId: finalSchoolId,
        },
      })

      return { userId: user.id, schoolId: finalSchoolId }
    })
  }
}

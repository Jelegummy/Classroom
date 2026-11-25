import { AuthService } from '@app/auth'
import {
  Context,
  getUserFromContext,
  requireRole,
  requireStaff,
} from '@app/common'
import { PrismaService } from '@app/db'
import {
  BadRequestException,
  ConflictException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { resolveSchoolId } from '../school.resolver'
import {
  ConnectDiscordArgs,
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

    const me = await this.db.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        email: true,
        firstName: true,
        lastName: true,
        phoneNumber: true,
        points: true,
        studentId: true,
        discordId: true,
        teacherId: true,
        major: true,
        role: true,
        school: { select: { id: true, name: true } },
      },
    })
    if (!me) {
      throw new NotFoundException('User not found')
    }

    return me
  }

  async updateUser(args: UpdateUserArgs, ctx: Context) {
    const user = getUserFromContext(ctx)

    await this.db.user.update({ where: { id: user.id }, data: args })
  }

  async updatePassword(args: UpdatePasswordArgs, ctx: Context) {
    const { id } = getUserFromContext(ctx)
    const { oldpassword, newPassword } = args

    const user = await this.db.user.findUnique({
      where: { id },
      select: { password: true },
    })
    if (!user) {
      throw new NotFoundException('User not found')
    }

    const isPasswordValid = await this.authService.verifyPassword(
      oldpassword,
      user.password,
    )
    if (!isPasswordValid) {
      throw new BadRequestException('Invalid password')
    }

    await this.db.user.update({
      where: { id },
      data: { password: await this.authService.hashPassword(newPassword) },
    })
  }

  async getAllUsers(ctx: Context) {
    requireRole(ctx, ['ADMIN'], 'access all users')

    return this.db.user.findMany({
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
        school: { select: { id: true, name: true } },
      },
      orderBy: { createdAt: 'desc' },
    })
  }

  async deleteUser(args: { id: string }, ctx: Context) {
    const admin = requireRole(ctx, ['ADMIN'], 'delete users')
    if (admin.id === args.id) {
      throw new BadRequestException('You cannot delete your own account')
    }

    // Prisma maps a remaining FK reference (P2003) to a 400 via the exception filter.
    await this.db.user.delete({ where: { id: args.id } })
  }

  async getUserPoint(args: { id: string }, ctx: Context) {
    requireStaff(ctx, 'access user points')

    const res = await this.db.user.findUnique({
      where: { id: args.id },
      select: { points: true },
    })
    if (!res) {
      throw new NotFoundException('User not found')
    }

    return res
  }

  async createUser(args: CreateUserArgs, ctx: Context) {
    requireRole(ctx, ['ADMIN'], 'create users')

    const { email, password, schoolId, schoolName, ...rest } = args

    const exist = await this.db.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (exist) {
      throw new ConflictException('User already exists')
    }

    const hashedPassword = await this.authService.hashPassword(password)

    return this.db.$transaction(async tx => {
      const finalSchoolId = await resolveSchoolId(tx, { schoolId, schoolName })
      const user = await tx.user.create({
        data: {
          ...rest, // includes the requested role (previously always STUDENT)
          email,
          password: hashedPassword,
          schoolId: finalSchoolId,
        },
        select: { id: true },
      })

      return { userId: user.id, schoolId: finalSchoolId }
    })
  }

  async connectDiscord(args: ConnectDiscordArgs, ctx: Context) {
    const loggedInUser = getUserFromContext(ctx)
    const { discordId } = args

    const existingDiscordUser = await this.db.user.findFirst({
      where: { discordId },
      select: { id: true },
    })
    if (existingDiscordUser && existingDiscordUser.id !== loggedInUser.id) {
      throw new ConflictException('Discord ID นี้ถูกเชื่อมต่อกับบัญชีอื่นไปแล้ว')
    }

    const updatedUser = await this.db.user.update({
      where: { id: loggedInUser.id },
      data: { discordId },
      select: { id: true, schoolId: true },
    })

    return {
      accessToken: this.authService.generateToken(loggedInUser.id),
      userId: updatedUser.id,
      schoolId: updatedUser.schoolId,
    }
  }
}

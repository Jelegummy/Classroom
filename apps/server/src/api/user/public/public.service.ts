import { AuthService } from '@app/auth'
import { assertBotSecret } from '@app/common'
import { env } from '@app/config'
import { PrismaService } from '@app/db'
import {
  BadRequestException,
  Injectable,
  NotFoundException,
} from '@nestjs/common'

import { resolveSchoolId } from '../school.resolver'
import {
  LoginArgs,
  LoginDiscordArgs,
  RegisterArgs,
  RegisterDiscordArgs,
} from './public.dto'

const splitFullName = (fullName: string) => {
  const parts = fullName.trim().split(/\s+/)

  return { firstName: parts[0] ?? '', lastName: parts.slice(1).join(' ') }
}

@Injectable()
export class UserPublicService {
  constructor(
    private readonly db: PrismaService,
    private readonly authService: AuthService,
  ) {}

  async register(args: RegisterArgs) {
    const { email, password, schoolId, schoolName, ...rest } = args

    const exist = await this.db.user.findUnique({
      where: { email },
      select: { id: true },
    })
    if (exist) {
      throw new BadRequestException('User already exists.')
    }

    const hashedPassword = await this.authService.hashPassword(password)

    return this.db.$transaction(async tx => {
      const finalSchoolId = await resolveSchoolId(tx, { schoolId, schoolName })
      const user = await tx.user.create({
        data: {
          ...rest,
          email,
          password: hashedPassword,
          role: 'STUDENT',
          schoolId: finalSchoolId,
        },
        select: { id: true },
      })

      return { userId: user.id, schoolId: finalSchoolId }
    })
  }

  async login(args: LoginArgs) {
    const user = await this.db.user.findUnique({
      where: { email: args.email },
      select: { id: true, password: true },
    })

    const isPassword = await this.authService.verifyPassword(
      args.password,
      user?.password,
    )
    if (!user || !isPassword) {
      throw new BadRequestException('Invalid email or password.')
    }

    // Transparently upgrade legacy (fixed-salt) hashes on successful login.
    if (user.password && this.authService.shouldRehash(user.password)) {
      const password = await this.authService.hashPassword(args.password)
      await this.db.user.update({ where: { id: user.id }, data: { password } })
    }

    return { accessToken: this.authService.generateToken(user.id) }
  }

  async registerDiscord(args: RegisterDiscordArgs, botSecret?: string) {
    assertBotSecret(botSecret, env.BOT_API_SECRET)

    const { firstName, lastName } = splitFullName(args.realName)

    const user = await this.db.user.findFirst({
      where: {
        firstName,
        ...(lastName ? { lastName } : {}),
        // Do not let a Discord account claim a user already linked elsewhere.
        OR: [{ discordId: null }, { discordId: args.discordId }],
      },
      select: { id: true },
    })

    if (!user) {
      throw new NotFoundException(
        'ไม่พบข้อมูลของคุณในระบบ โปรดตรวจสอบว่าคุณได้สมัครสมาชิกบนเว็บไซต์ และสะกดชื่อถูกต้อง',
      )
    }

    return this.db.user.update({
      where: { id: user.id },
      data: { discordId: args.discordId },
      select: { id: true, firstName: true, lastName: true, discordId: true },
    })
  }

  async loginDiscord(args: LoginDiscordArgs) {
    const { email, discordId, firstName, lastName, schoolId } = args

    let user = await this.db.user.findFirst({
      where: { OR: [{ discordId }, { email }] },
      select: { id: true, schoolId: true, discordId: true },
    })

    if (user && !user.discordId) {
      user = await this.db.user.update({
        where: { id: user.id },
        data: { discordId },
        select: { id: true, schoolId: true, discordId: true },
      })
    }

    if (!user) {
      user = await this.db.$transaction(async tx =>
        tx.user.create({
          data: {
            discordId,
            email,
            firstName: firstName || 'Discord User',
            lastName: lastName || '',
            schoolId: await resolveSchoolId(tx, { schoolId }),
            role: 'STUDENT',
          },
          select: { id: true, schoolId: true, discordId: true },
        }),
      )
    }

    return {
      accessToken: this.authService.generateToken(user.id),
      userId: user.id,
      schoolId: user.schoolId,
    }
  }
}

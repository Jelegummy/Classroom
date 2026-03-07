import { AuthService } from '@app/auth'
import { PrismaService } from '@app/db'
import {
  BadRequestException,
  Injectable,
  NotFoundException,
  UnauthorizedException,
} from '@nestjs/common'

import { LoginArgs, LoginDiscordArgs, RegisterArgs, RegisterDiscordArgs } from './public.dto'

@Injectable()
export class UserPublicService {
  constructor(
    private readonly db: PrismaService,
    private readonly authService: AuthService,
  ) { }

  async register(args: RegisterArgs) {
    const { email, password, schoolId, schoolName, ...rest } = args

    const exist = await this.db.user.findUnique({ where: { email } })
    if (exist) {
      throw new BadRequestException('User already exists.')
    }

    const hashedPassword = await this.authService.hashPassword(password)

    return this.db.$transaction(async tx => {
      let finalSchoolId = "6c18f70e-9457-4f2b-904c-29927997ad69" // hardcode now - will fix this later (wait mail to be sent to user before creating school and user)

      // if (!finalSchoolId) {
      //   if (!schoolName) {
      //     throw new BadRequestException('School name is required')
      //   }

      //   let school = await tx.school.findFirst({
      //     where: { name: schoolName },
      //   })

      //   if (!school) {
      //     school = await tx.school.create({
      //       data: { name: schoolName },
      //     })
      //   } // wait mail to be sent before creating user (and fix this api)

      //   finalSchoolId = school.id
      // }

      const user = await tx.user.create({
        data: {
          ...rest,
          email,
          password: hashedPassword,
          role: 'ADMIN',
          schoolId: finalSchoolId,
        },
      })

      return { userId: user.id, schoolId: finalSchoolId }
    })
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
      user.password || '',
    )
    // if (user.password) {
    //   throw new BadRequestException('บัญชีนี้เชื่อมต่อกับ Discord ไว้ กรุณาเข้าสู่ระบบด้วย Discord')
    // }
    if (!isPassword) {
      throw new BadRequestException('Invalid email or password.')
    }

    return { accessToken: this.authService.generateToken(user.id) }
  }

  async registerDiscord(args: RegisterDiscordArgs, botSecret: string) {
    if (botSecret !== 'super-secret-bot-key') {
      throw new UnauthorizedException('Invalid bot secret')
    }

    const nameParts = args.realName.trim().split(/\s+/)
    const firstName = nameParts[0] || ''
    const lastName = nameParts.slice(1).join(' ') || ''

    const user = await this.db.user.findFirst({
      where: {
        discordId: args.discordId,
        firstName: firstName,
        ...(lastName ? { lastName: lastName } : {}),
      },
    })

    if (!user) {
      throw new NotFoundException(
        'ไม่พบข้อมูลของคุณในระบบ โปรดตรวจสอบว่าคุณได้สมัครสมาชิกบนเว็บไซต์ และสะกดชื่อถูกต้อง',
      )
    }

    const updatedUser = await this.db.user.update({
      where: { id: user.id },
      data: {
        discordId: args.discordId,
      },
    })

    return updatedUser
  }

  async loginDiscord(args: LoginDiscordArgs) {
    const { email, discordId, firstName, lastName, ...rest } = args

    if (!email) {
      throw new BadRequestException('Email is required.')
    }

    let user = await this.db.user.findFirst({
      where: {
        OR: [
          { discordId: discordId },
          { email: email },
        ],
      },
    })

    if (user && !user.discordId) {
      user = await this.db.user.update({
        where: { id: user.id },
        data: { discordId: discordId },
      })
    }

    if (!user) {
      user = await this.db.$transaction(async tx => {
        let finalSchoolId = "6c18f70e-9457-4f2b-904c-29927997ad69" // hardcode now

        return await tx.user.create({
          data: {
            ...rest,
            discordId: discordId,
            email: email,
            firstName: firstName || 'Discord User',
            lastName: lastName || '',
            schoolId: finalSchoolId,
            role: 'STUDENT',
          },
        })
      })
    }

    const accessToken = await this.authService.generateToken(user.id)

    return {
      accessToken,
      userId: user.id,
      schoolId: user.schoolId
    }
  }
}

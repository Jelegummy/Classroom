import { Context, getUserFromContext } from '@app/common'
import { PrismaService } from '@app/db'
import { Injectable } from '@nestjs/common'

@Injectable()
export class SchoolInternalService {
  constructor(private readonly db: PrismaService) {}

  async getAllSchools(ctx: Context) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new Error('User not found')
    }

    if (user.role !== 'ADMIN') {
      throw new Error('Only admins can access all schools')
    }

    const schools = await this.db.school.findMany()

    return schools
  }

  async getSchoolById(ctx: Context, id: string) {
    const user = getUserFromContext(ctx)

    if (!user) {
      throw new Error('User not found')
    }

    if (user.role !== 'ADMIN') {
      throw new Error('Only admins can access school details')
    }

    const school = await this.db.school.findUnique({ where: { id } })

    if (!school) {
      throw new Error('School not found')
    }

    return school
  }
}

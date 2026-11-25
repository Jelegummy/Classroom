import { Context, requireRole } from '@app/common'
import { PrismaService } from '@app/db'
import { Injectable, NotFoundException } from '@nestjs/common'

@Injectable()
export class SchoolInternalService {
  constructor(private readonly db: PrismaService) {}

  async getAllSchools(ctx: Context) {
    requireRole(ctx, ['ADMIN'], 'access all schools')

    return this.db.school.findMany({ orderBy: { name: 'asc' } })
  }

  async getSchoolById(ctx: Context, id: string) {
    requireRole(ctx, ['ADMIN'], 'access school details')

    const school = await this.db.school.findUnique({ where: { id } })
    if (!school) {
      throw new NotFoundException('School not found')
    }

    return school
  }
}

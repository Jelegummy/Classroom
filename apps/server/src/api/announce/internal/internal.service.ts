import {
  Context,
  assertOwnerOrAdmin,
  getUserFromContext,
  requireStaff,
} from '@app/common'
import { PrismaService } from '@app/db'
import { Injectable, NotFoundException } from '@nestjs/common'

import { CreateAnnounceArgs, UpdateAnnounceArgs } from './internal.dto'

@Injectable()
export class AnnounceInternalService {
  constructor(private readonly db: PrismaService) {}

  private async getOwnedAnnounce(
    user: Parameters<typeof assertOwnerOrAdmin>[0],
    id: string,
  ) {
    const announce = await this.db.classroomAnnounce.findUnique({
      where: { id },
      select: { creatorId: true },
    })
    if (!announce) {
      throw new NotFoundException('Announcement not found')
    }
    assertOwnerOrAdmin(user, announce.creatorId)
  }

  async createAnnounce(args: CreateAnnounceArgs, ctx: Context) {
    const user = requireStaff(ctx, 'create announcements')

    if (user.role !== 'ADMIN') {
      const membership = await this.db.classroomOnUser.findUnique({
        where: {
          userId_classroomId: {
            userId: user.id,
            classroomId: args.classroomId,
          },
        },
        select: { userId: true },
      })
      if (!membership) {
        throw new NotFoundException('Classroom not found or access denied')
      }
    }

    return this.db.classroomAnnounce.create({
      data: {
        title: args.title,
        message: args.message,
        filePdf: args.filePdf,
        classroomId: args.classroomId,
        creatorId: user.id,
      },
    })
  }

  async updateAnnounce(
    args: UpdateAnnounceArgs,
    ctx: Context,
    where: { id: string },
  ) {
    const user = requireStaff(ctx, 'update announcements')
    await this.getOwnedAnnounce(user, where.id)

    return this.db.classroomAnnounce.update({
      where: { id: where.id },
      data: { title: args.title, message: args.message, filePdf: args.filePdf },
    })
  }

  async deleteAnnounce(ctx: Context, where: { id: string }) {
    const user = requireStaff(ctx, 'delete announcements')
    await this.getOwnedAnnounce(user, where.id)

    await this.db.classroomAnnounce.delete({ where: { id: where.id } })
  }

  /** Announcements are visible to members of the classroom (and admins). */
  private visibleTo(user: { id: string; role: string }) {
    return user.role === 'ADMIN'
      ? {}
      : { classroom: { users: { some: { userId: user.id } } } }
  }

  async getAnnounce(ctx: Context, where: { id: string }) {
    const user = getUserFromContext(ctx)

    const announce = await this.db.classroomAnnounce.findFirst({
      where: { id: where.id, ...this.visibleTo(user) },
    })
    if (!announce) {
      throw new NotFoundException('Announcement not found')
    }

    return announce
  }

  async getAllAnnounces(ctx: Context) {
    const user = getUserFromContext(ctx)

    return this.db.classroomAnnounce.findMany({
      where: this.visibleTo(user),
      orderBy: { createdAt: 'desc' },
    })
  }
}

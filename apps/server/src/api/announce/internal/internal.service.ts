import { PrismaService } from "@app/db";
import { Injectable, UnauthorizedException } from "@nestjs/common";
import { CreateAnnounceArgs, UpdateAnnounceArgs } from "./internal.dto";
import { Context, getUserFromContext } from "@app/common";

@Injectable()
export class AnnounceInternalService {
    constructor(
        private readonly db: PrismaService,
    ) { }

    async createAnnounce(args: CreateAnnounceArgs, ctx: Context) {
        const user = getUserFromContext(ctx);

        if (!user) {
            throw new UnauthorizedException('User not found')
        }

        if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
            throw new UnauthorizedException('Only teachers and admins can create announces')
        }

        const announce = await this.db.classroomAnnounce.create({
            data: {
                title: args.title,
                message: args.message,
                filePdf: args.filePdf,
                classroomId: args.classroomId,
                creatorId: user.id,
            },

        })

        return announce
    }

    async updateAnnounce(args: UpdateAnnounceArgs, ctx: Context, where: { id: string }) {
        const user = getUserFromContext(ctx);

        if (!user) {
            throw new UnauthorizedException('User not found')
        }

        if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
            throw new UnauthorizedException('Only teachers and admins can create announces')
        }

        const announce = await this.db.classroomAnnounce.update({
            where: { id: where.id },
            data: {
                title: args.title,
                message: args.message,
                filePdf: args.filePdf,
            },
        })

        return announce
    }

    async deleteAnnounce(ctx: Context, where: { id: string }) {
        const user = getUserFromContext(ctx);

        if (!user) {
            throw new UnauthorizedException('User not found')
        }

        if (user.role !== 'TEACHER' && user.role !== 'ADMIN') {
            throw new UnauthorizedException('Only teachers and admins can create announces')
        }

        await this.db.classroomAnnounce.delete({
            where: { id: where.id },
        })
    }

    async getAnnounce(ctx: Context, where: { id: string }) {
        const user = getUserFromContext(ctx);

        if (!user) {
            throw new UnauthorizedException('User not found')
        }

        const announce = await this.db.classroomAnnounce.findUnique({
            where: { id: where.id },
        })

        return announce
    }

    async getAllAnnounces(ctx: Context) {
        const user = getUserFromContext(ctx);

        if (!user) {
            throw new UnauthorizedException('User not found')
        }

        const announces = await this.db.classroomAnnounce.findMany()

        return announces
    }
}
import { PrismaService } from "@app/db";
import { BadRequestException, Injectable, UnauthorizedException, } from "@nestjs/common";
import { CreateTutorArgs } from "./internal.dto";
import { Context, getUserFromContext } from "@app/common";

@Injectable()
export class TutorInternalService {
    constructor(private readonly db: PrismaService) { }

    async createTutor(args: CreateTutorArgs, ctx: Context) {
        const user = getUserFromContext(ctx)

        if (!user) {
            throw new UnauthorizedException('User not found')
        }

        const tutor = await this.db.tutor.create({
            data: {
                botLink: args.botLink,
                startTime: args.startTime,
                dataContent: args.dataContent || '',
                discordChannelId: args.discordChannelId || '',
                host: {
                    connect: { id: user.id }
                },
            }
        })

        await this.db.classroomOnTutor.create({
            data: {
                tutorId: tutor.id,
                classroomId: args.classroomId,
            }
        })

        return tutor
    }

    async getAllTutors(ctx: Context) {
        const user = getUserFromContext(ctx)

        if (!user) {
            throw new UnauthorizedException('User not found')
        }

        // if (!user.schoolId) {
        //     throw new BadRequestException('User does not have an associated schoolId');
        // }

        const tutors = await this.db.tutor.findMany({
            // where: {
            //     host: {
            //         schoolId: user.schoolId
            //     }
            // },
            include: {
                host: true,
                classroomSessions: {
                    include: {
                        classroom: true
                    }
                }
            }
        })

        return tutors
    }

    async getTutorById(id: string, ctx: Context) {
        const user = getUserFromContext(ctx)

        if (!user) {
            throw new UnauthorizedException('User not found')
        }

        const tutor = await this.db.tutor.findUnique({
            where: {
                id,
                host: {
                    schoolId: user.schoolId
                }
            },
            include: {
                host: true,
                classroomSessions: {
                    include: {
                        classroom: true
                    }
                }
            }
        })

        if (!tutor) {
            throw new UnauthorizedException('Tutor not found')
        }

        return tutor
    }
}
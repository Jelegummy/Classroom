import { PrismaService } from "@app/db";
import { BadRequestException, Injectable } from "@nestjs/common";
import { SchoolPublicDto } from "./public.dto";

@Injectable()
export class SchoolPublicService {
    constructor(
        private readonly db: PrismaService
    ) { }

    async createSchool(args: SchoolPublicDto) {
        const { name } = args;

        const exist = await this.db.school.findUnique({ where: { name } });
        if (exist) {
            throw new BadRequestException('School already exists.');
        }

        const school = await this.db.school.create({
            data: {
                name: name,
                address: args.address || null,
            }
        })

        return school;
    }
}

//Not used yet

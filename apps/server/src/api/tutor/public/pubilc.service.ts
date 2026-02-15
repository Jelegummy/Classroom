import { PrismaService } from "@app/db";
import { Injectable, UnauthorizedException } from "@nestjs/common";

@Injectable()
export class TutorPublicService {
    constructor(
        private readonly db: PrismaService,
    ) { }

    async updateTutorBot(id: string, args: any, botSecret?: string) {
        // 1. เช็คก่อนว่านี่คือ Bot ยิงมาหรือเปล่า? (ใช้ Secret Key)
        const isValidBot = botSecret === process.env.BOT_API_SECRET; // อย่าลืมใส่ BOT_API_SECRET ใน .env ของ NestJS

        let queryWhere: any = { id };

        // 2. ถ้าไม่ใช่ Bot แปลว่าเป็น User ทั่วไปกดบนเว็บ -> ค่อยเช็ค Context
        if (!isValidBot) {

            // เพิ่มเงื่อนไขว่าต้องเป็นโฮสต์ของโรงเรียนตัวเอง
            queryWhere = {
                id,
            };
        }

        // 3. ค้นหาห้องเรียน
        const tutor = await this.db.tutor.findUnique({
            where: queryWhere
        });

        if (!tutor) {
            throw new UnauthorizedException('Tutor not found or you have no permission');
        }

        // 4. ทำการอัปเดตข้อมูล
        const updatedTutor = await this.db.tutor.update({
            where: { id },
            data: {
                botLink: args.botLink || tutor.botLink,
                dataContent: args.dataContent || tutor.dataContent, // บันทึก JSON ที่บอทส่งมา
                discordChannelId: args.discordChannelId || tutor.discordChannelId,
            }
        });

        return updatedTutor;
    }
}
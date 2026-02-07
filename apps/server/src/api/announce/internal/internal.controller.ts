import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { AnnounceInternalService } from "./internal.service";
import { CreateAnnounceArgs, UpdateAnnounceArgs } from "./internal.dto";
import { Context } from "@app/common";

@ApiTags('Announce - Internal')
@Controller('announce/internal')
export class AnnounceInternalController {
    constructor(private readonly service: AnnounceInternalService) { }

    @Post('/create')
    async craeteAnnounce(@Body() args: CreateAnnounceArgs, @Req() ctx: Context) {
        const res = await this.service.createAnnounce(args, ctx);

        return { statusCode: HttpStatus.OK, data: res }
    }

    @Patch('/update/:id')
    async updateAnnounce(@Body() args: UpdateAnnounceArgs, @Req() ctx: Context, @Param('id') id: string) {
        const res = await this.service.updateAnnounce(args, ctx, { id });

        return { statusCode: HttpStatus.OK, data: res }
    }

    @Delete('/delete/:id')
    async deleteAnnounce(@Req() ctx: Context, @Param('id') id: string) {
        await this.service.deleteAnnounce(ctx, { id });

        return { statusCode: HttpStatus.OK }
    }

    @Get('/:id')
    async getAnnounce(@Req() ctx: Context, @Param('id') id: string) {
        const res = await this.service.getAnnounce(ctx, { id });

        return { statusCode: HttpStatus.OK, data: res }
    }

    @Get('/all')
    async getAllAnnounces(@Req() ctx: Context) {
        const res = await this.service.getAllAnnounces(ctx);

        return { statusCode: HttpStatus.OK, data: res }
    }
}
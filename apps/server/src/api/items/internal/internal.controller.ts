import { Body, Controller, Delete, Get, HttpStatus, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { ItemsInternalService } from "./internal.service";
import { ItemsArgs, UpdateItemsArgs } from "./internal.dto";
import { Context } from "@app/common";

@ApiTags('Items - Internal')
@Controller('items/internal')
export class ItemsInternalController {
    constructor(private readonly service: ItemsInternalService) { }

    @Post('/create')
    async createItems(@Body() args: ItemsArgs, @Req() ctx: Context) {
        const res = await this.service.createItems(args, ctx);

        return { statusCode: HttpStatus.OK, data: res }
    }

    @Patch('/update')
    async UpdateItems(@Body() args: UpdateItemsArgs, @Req() ctx: Context) {
        const res = await this.service.updateItems(args, ctx);

        return { statusCode: HttpStatus.OK, data: res }
    }

    @Delete('/delete/:id')
    async deleteItems(@Param('id') id: string, @Req() ctx: Context) {
        await this.service.deleteItems({ id }, ctx);

        return { statusCode: HttpStatus.OK }
    }

    @Get('/item/:id')
    async getItems(@Param('id') id: string, @Req() ctx: Context) {
        const res = await this.service.getItems({ id }, ctx);

        return { statusCode: HttpStatus.OK, data: res }
    }

    @Get('/all')
    async getAllItems(@Req() ctx: Context) {
        const res = await this.service.getAllItems(ctx);

        return { statusCode: HttpStatus.OK, data: res }
    }

}
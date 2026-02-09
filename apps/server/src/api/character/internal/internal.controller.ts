import { Body, Controller, Get, HttpStatus, Param, Patch, Post, Req } from "@nestjs/common";
import { ApiTags } from "@nestjs/swagger";
import { CharacterInternalService } from "./internal.service";
import { CreateCharacterDto } from "./internal.dto";
import { Context } from "@app/common";

@ApiTags('character-internal')
@Controller('character/internal')
export class CharacterInternalController {
    constructor(private readonly service: CharacterInternalService) { }

    @Post('/create/character')
    async createCharacter(@Body() args: CreateCharacterDto, @Req() ctx: Context) {
        const res = await this.service.createCharacter(args, ctx)

        return { statusCode: HttpStatus.OK, data: res }
    }

    @Get('/all')
    async getAllCharacters(@Req() ctx: Context) {
        const res = await this.service.getAllCharacters(ctx)

        return { statusCode: HttpStatus.OK, data: res }
    }

    @Get('/character/:id')
    async getCharacter(@Req() ctx: Context, @Param('id') id: string) {
        const res = await this.service.getCharacter(ctx, { id })

        return { statusCode: HttpStatus.OK, data: res }
    }
}
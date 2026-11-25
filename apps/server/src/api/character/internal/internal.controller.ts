import { Context } from '@app/common'
import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Post,
  Req,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'

import { CreateCharacterDto } from './internal.dto'
import { CharacterInternalService } from './internal.service'

@ApiTags('character-internal')
@Controller('character/internal')
export class CharacterInternalController {
  constructor(private readonly service: CharacterInternalService) {}

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

  @Delete('/delete/:id')
  async deleteCharacter(@Req() ctx: Context, @Param('id') id: string) {
    const res = await this.service.deleteCharacter(ctx, { id })

    return { statusCode: HttpStatus.OK, data: res }
  }
}

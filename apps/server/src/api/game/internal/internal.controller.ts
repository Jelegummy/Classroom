import {
  Body,
  Controller,
  Delete,
  Get,
  HttpStatus,
  Param,
  Patch,
  Post,
  Req,
} from '@nestjs/common'
import { ApiTags } from '@nestjs/swagger'
import { GameInternalService } from './internal.service'
import { AttackGameArgs, CreateGameArgs, UpdateGameArgs } from './internal.dto'
import { Context } from '@app/common'

@ApiTags('game-internal')
@Controller('game/internal')
export class GameInternalController {
  constructor(private readonly service: GameInternalService) { }

  @Post('/create')
  async createGameSession(@Body() args: CreateGameArgs, @Req() ctx: Context) {
    const res = await this.service.createGameSession(args, ctx)

    return { statusCode: HttpStatus.OK, data: res }
  }

  @Patch('/update')
  async updateGameSession(@Body() args: UpdateGameArgs, @Req() ctx: Context) {
    const res = await this.service.updateGameSession(args, ctx)

    return { statusCode: HttpStatus.OK, data: res }
  }

  @Get('/all')
  async getAllGameSessions(@Req() ctx: Context) {
    const res = await this.service.getAllGameSessions(ctx)

    return { statusCode: HttpStatus.OK, data: res }
  }

  @Get('/game/:id')
  async getGameSession(@Req() ctx: Context, @Param('id') id: string) {
    const res = await this.service.getGameSession({ id }, ctx)

    return { statusCode: HttpStatus.OK, data: res }
  }

  @Delete('/delete/:id')
  async deleteGameSession(@Param('id') id: string, @Req() ctx: Context) {
    await this.service.deleteGameSession({ id }, ctx)

    return { statusCode: HttpStatus.OK }
  }

  @Post('Item/item-in-game/:gameId/:itemId')
  async addItemToGame(
    @Req() ctx: Context,
    @Param('gameId') gameId: string,
    @Param('itemId') itemId: string,
  ) {
    const res = await this.service.addItemToGame(ctx, { gameId }, { itemId })

    return { statusCode: HttpStatus.OK, data: res }
  }

  @Post('/attack')
  async attackBoss(@Req() ctx: Context, @Body() args: AttackGameArgs) {
    const res = await this.service.attackBoss(ctx, args)

    return { statusCode: HttpStatus.OK, data: res }
  }

  @Get('/leaderboard/:gameId')
  async getLeaderboard(@Param('id') id: string, @Req() ctx: Context) {
    const res = await this.service.getGameLeaderboard(ctx, { id })

    return { statusCode: HttpStatus.OK, data: res }
  }

  @Post('join/:gameId')
  async joinGame(@Req() ctx: Context, @Param('gameId') gameId: string) {
    const res = await this.service.joinGame(ctx, { gameId })

    return { statusCode: HttpStatus.OK, data: res }
  }

  @Patch('start/:gameId')
  async startGame(@Req() ctx: Context, @Param('gameId') gameId: string) {
    const res = await this.service.startGame(ctx, { gameId })

    return { statusCode: HttpStatus.OK, data: res }
  }

  // @Patch('Item/update-item-from-game/:gameId/:itemId')
  // async updateItemFromGame(@Req() ctx: Context, @Param('gameId') gameId: string, @Param('itemId') itemId: string) {
  //     const res = await this.service.updateItemFromGame(ctx, { gameId }, { itemId });

  //     return { statusCode: HttpStatus.OK, data: res }
  // }
}

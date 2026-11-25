import { env } from '@app/config'
import { Logger } from '@nestjs/common'
import {
  ConnectedSocket,
  MessageBody,
  SubscribeMessage,
  WebSocketGateway,
  WebSocketServer,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

const isRoomId = (value: unknown): value is string =>
  typeof value === 'string' && value.length > 0 && value.length <= 64

@WebSocketGateway({ cors: { origin: env.CORS_ORIGINS, credentials: true } })
export class GameGateway {
  private readonly logger = new Logger(GameGateway.name)

  @WebSocketServer()
  server!: Server

  @SubscribeMessage('join-game-room')
  handleJoinRoom(
    @MessageBody() gameId: unknown,
    @ConnectedSocket() client: Socket,
  ) {
    if (!isRoomId(gameId)) {
      return
    }
    void client.join(gameId)
    this.logger.debug(`Client ${client.id} joined room: ${gameId}`)
  }

  @SubscribeMessage('leave-game-room')
  handleLeaveRoom(
    @MessageBody() gameId: unknown,
    @ConnectedSocket() client: Socket,
  ) {
    if (!isRoomId(gameId)) {
      return
    }
    void client.leave(gameId)
    this.logger.debug(`Client ${client.id} left room: ${gameId}`)
  }

  broadcastGameState(gameId: string, updatedGameData: unknown) {
    this.server?.to(gameId).emit('game-state-updated', updatedGameData)
  }
}

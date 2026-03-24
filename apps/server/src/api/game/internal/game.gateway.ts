import {
  WebSocketGateway,
  WebSocketServer,
  SubscribeMessage,
  MessageBody,
  ConnectedSocket,
} from '@nestjs/websockets'
import { Server, Socket } from 'socket.io'

@WebSocketGateway({ cors: { origin: '*' } })
export class GameGateway {
  @WebSocketServer()
  server!: Server

  @SubscribeMessage('join-game-room')
  handleJoinRoom(
    @MessageBody() gameId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.join(gameId)
    console.log(`Client ${client.id} joined room: ${gameId}`)
  }

  @SubscribeMessage('leave-game-room')
  handleLeaveRoom(
    @MessageBody() gameId: string,
    @ConnectedSocket() client: Socket,
  ) {
    client.leave(gameId)
    console.log(`Client ${client.id} left room: ${gameId}`)
  }

  broadcastGameState(gameId: string, updatedGameData: any) {
    this.server.to(gameId).emit('game-state-updated', updatedGameData)
  }
}

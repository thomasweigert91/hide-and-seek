import {
  WebSocketGateway,
  WebSocketServer,
  OnGatewayConnection,
  OnGatewayDisconnect,
  SubscribeMessage,
  ConnectedSocket,
  MessageBody,
} from '@nestjs/websockets';
import { Server, Socket } from 'socket.io';
import { Direction, EventsService } from './events.service';

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  private waitingRoomId: string | null = null;

  constructor(private readonly eventsService: EventsService) {}

  @SubscribeMessage('move')
  handleMove(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { direction: Direction },
  ) {
    const { roomId, role } = socket.data;

    if (!role || !roomId) return;

    const updatedState = this.eventsService.applyMove(
      roomId,
      role,
      body.direction,
    );

    if (updatedState) {
      this.server.to(roomId).emit('gameState', updatedState);
    }
  }

  handleDisconnect(socket: Socket) {
    const roomId = socket.data.roomId;

    if (roomId === this.waitingRoomId) {
      this.waitingRoomId = null;
      console.log('Waiting player has left, room resetted');
      return;
    }

    if (roomId) {
      this.server.to(roomId).emit('playerLeft', {
        message: 'Your opponent has quit. You won!',
      });

      this.eventsService.deleteGame(roomId);
    }
  }

  handleConnection(socket: Socket) {
    if (this.waitingRoomId === null) {
      //Player 1 waits for opponent
      const roomId = crypto.randomUUID();
      socket.join(roomId);

      this.waitingRoomId = roomId;

      socket.data.roomId = roomId;
      socket.data.role = 'SEEKER';

      console.log(`socket id: ${socket.id}, room: ${roomId}`);
      socket.emit('waitingForOpponent', { role: 'SEEKER', roomId });
    } else {
      // Player 2 connected, match starts
      const roomId = this.waitingRoomId;
      socket.join(roomId);
      this.waitingRoomId = null;

      console.log(
        `socket id: ${socket.id} in preexisting room: ${roomId}, Match starts!`,
      );

      socket.data.roomId = roomId;
      socket.data.role = 'HIDER';

      socket.emit('roleAssigned', { role: 'HIDER', roomId });

      const initialState = this.eventsService.createGame(roomId);
      this.server.to(roomId).emit('gameStarted', initialState);
    }
  }
}

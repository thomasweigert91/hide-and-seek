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

type RoomInfo = {
  id: string;
  roomName: string;
  playerCount: number;
  status: 'WAITING' | 'IN_GAME';
};

@WebSocketGateway({ cors: { origin: '*' } })
export class EventsGateway implements OnGatewayConnection, OnGatewayDisconnect {
  @WebSocketServer() server: Server;

  constructor(private readonly eventsService: EventsService) {}

  private waitingRoomId: string | null = null;

  private timers = new Map<string, NodeJS.Timeout>();
  private rooms = new Map<string, RoomInfo>();

  private broadcastRoomlist() {
    const list = Array.from(this.rooms.values());
    this.server.emit('roomsList', list);
  }

  private startTimer(roomId: string) {
    this.stopTimer(roomId);

    const timer = setInterval(() => {
      const state = this.eventsService.getGame(roomId);

      if (!state || state.status !== 'RUNNING') {
        this.stopTimer(roomId);
        return;
      }

      state.timeRemaining -= 1;

      if (state.timeRemaining <= 0) {
        state.status = 'FINISHED';
        state.winner = 'HIDER';
        this.stopTimer(roomId);

        this.server.to(roomId).emit('gameState', state);
      } else {
        this.server
          .to(roomId)
          .emit('timer', { timeRemaining: state.timeRemaining });
      }
    }, 1000);
    this.timers.set(roomId, timer);
  }

  private stopTimer(roomId: string) {
    const timer = this.timers.get(roomId);

    if (timer) {
      clearInterval(timer);
      this.timers.delete(roomId);
    }
  }

  private joinMatchmaking(socket: Socket) {
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

      this.startTimer(roomId);
    }
  }

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
      if (updatedState.status === 'FINISHED') {
        this.stopTimer(roomId);
      }

      this.server.to(roomId).emit('gameState', updatedState);
    }
  }

  @SubscribeMessage('restart')
  handleRestart(@ConnectedSocket() socket: Socket) {
    const oldRoomId = socket.data.roomId;

    if (oldRoomId) {
      socket.leave(oldRoomId);
    }
    this.joinMatchmaking(socket);
  }

  handleDisconnect(socket: Socket) {
    const roomId = socket.data.roomId;

    if (roomId === this.waitingRoomId) {
      this.waitingRoomId = null;
      console.log('Waiting player has left, room resetted');
      return;
    }

    if (roomId) {
      this.stopTimer(roomId);
      this.server.to(roomId).emit('playerLeft', {
        message: 'Your opponent has quit. You won!',
      });

      this.eventsService.deleteGame(roomId);
      this.rooms.delete(roomId);
      this.broadcastRoomlist();
    }
  }

  handleConnection(socket: Socket) {
    socket.emit('roomsList', Array.from(this.rooms.values()));
  }

  @SubscribeMessage('createRoom')
  handleCreateRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomName: string; roomId?: string },
  ) {
    const roomId = (
      body.roomId || Math.random().toString(36).substring(2, 6)
    ).toUpperCase();
    const roomName = body.roomName?.trim() || `Room ${roomId}`;

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.role = 'SEEKER';

    this.rooms.set(roomId, {
      id: roomId,
      roomName,
      playerCount: 1,
      status: 'WAITING',
    });

    socket.emit('roleAssigned', { role: 'SEEKER', roomId });
    this.broadcastRoomlist();

    console.log(`[Lobby] Room ${roomId} created by Player ${socket.id}`);
  }

  @SubscribeMessage('joinRoom')
  handleJoinRoom(
    @ConnectedSocket() socket: Socket,
    @MessageBody() body: { roomId: string },
  ) {
    const roomId = body.roomId.toUpperCase();
    const roomInfo = this.rooms.get(roomId);

    if (!roomInfo) {
      socket.emit('error', {
        message: `Room ${roomId} does not exist anymore`,
      });
      return;
    }

    if (roomInfo.playerCount >= 2 || roomInfo.status === 'IN_GAME') {
      socket.emit('error', { message: 'The room is full' });
      return;
    }

    socket.join(roomId);
    socket.data.roomId = roomId;
    socket.data.role = 'HIDER';

    roomInfo.playerCount = 2;
    roomInfo.status = 'IN_GAME';
    this.broadcastRoomlist();

    socket.emit('roleAssigned', { role: 'HIDER', roomId });

    const initialState = this.eventsService.createGame(roomId);
    this.server.to(roomId).emit('gameStarted', initialState);
    this.startTimer(roomId);

    console.log(
      `[Lobby] Player ${socket.id} connected as HIDER into room ${roomId}. Game starts now!`,
    );
  }
}

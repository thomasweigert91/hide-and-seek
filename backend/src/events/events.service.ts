import { Injectable } from '@nestjs/common';

export type Role = 'SEEKER' | 'HIDER';
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type GameStatus = 'WAITING' | 'RUNNING' | 'FINISHED';
export type Delta = { dx: number; dy: number };

export interface Position {
  x: number;
  y: number;
}

type GameState = {
  status: GameStatus;
  gridSize: number;
  seekerPos: Position;
  hiderPos: Position;
  timeRemaining: number;
  winner: Role | null;
};

const DELTAS: Record<Direction, Delta> = {
  UP: { dx: 0, dy: -1 },
  DOWN: { dx: 0, dy: 1 },
  LEFT: { dx: -1, dy: 0 },
  RIGHT: { dx: 1, dy: 0 },
};

@Injectable()
export class EventsService {
  private games = new Map<string, GameState>();

  createGame(roomId: string, gridSize: number = 10): GameState {
    const initialState: GameState = {
      gridSize,
      seekerPos: { x: 0, y: 0 },
      hiderPos: { x: gridSize - 1, y: gridSize - 1 },
      status: 'RUNNING',
      winner: null,
      timeRemaining: 60,
    };

    this.games.set(roomId, initialState);
    return initialState;
  }

  getGame(roomId: string): GameState | undefined {
    return this.games.get(roomId);
  }
  deleteGame(roomId: string) {
    this.games.delete(roomId);
  }

  applyMove(roomId: string, role: Role, direction: Direction) {
    const state = this.games.get(roomId);

    if (!state || state.status !== 'RUNNING') return null;

    const currentPos = role === 'SEEKER' ? state.seekerPos : state.hiderPos;

    const delta = DELTAS[direction];

    const newX = currentPos.x + delta.dx;
    const newY = currentPos.y + delta.dy;

    if (
      newX < 0 ||
      newX >= state.gridSize ||
      newY < 0 ||
      newY >= state.gridSize
    ) {
      return state;
    }

    if (role === 'SEEKER') {
      state.seekerPos = { x: newX, y: newY };
    } else {
      state.hiderPos = { x: newX, y: newY };
    }

    if (
      state.seekerPos.x === state.hiderPos.x &&
      state.seekerPos.y === state.hiderPos.y
    ) {
      state.status = 'FINISHED';
      state.winner = 'SEEKER';
    }

    return state;
  }
}

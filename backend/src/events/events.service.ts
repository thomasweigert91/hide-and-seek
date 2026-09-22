import { Injectable } from '@nestjs/common';

export type Role = 'SEEKER' | 'HIDER';
export type Direction = 'UP' | 'DOWN' | 'LEFT' | 'RIGHT';
export type TileKind = 'FLOOR' | 'WALL' | 'ICE';
export type GameStatus = 'WAITING' | 'RUNNING' | 'FINISHED';
export type Delta = { dx: number; dy: number };
export type Terrain = TileKind[][];

const sleep = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

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
  terrain: Terrain;
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

  private checkCatch(state: GameState) {
    if (
      state.seekerPos.x === state.hiderPos.x &&
      state.seekerPos.y === state.hiderPos.y
    ) {
      state.status = 'FINISHED';
      state.winner = 'SEEKER';
    }
  }

  private hasPath(terrain: Terrain, gridSize: number): boolean {
    const queue = [[0, 0]];
    const visited = new Set<string>(['0,0']);

    while (queue.length > 0) {
      const [cx, cy] = queue.shift()!;

      if (cx === gridSize - 1 && cy === gridSize - 1) {
        return true;
      }

      for (const { dx, dy } of Object.values(DELTAS)) {
        const neighborX = cx + dx;
        const neighborY = cy + dy;

        if (
          neighborX >= 0 &&
          neighborX < gridSize &&
          neighborY >= 0 &&
          neighborY < gridSize &&
          terrain[neighborY][neighborX] !== 'WALL' &&
          !visited.has(`${neighborX},${neighborY}`)
        ) {
          visited.add(`${neighborX},${neighborY}`);
          queue.push([neighborX, neighborY]);
        }
      }
    }
    return false;
  }

  private generateRandomMap(gridSize: number): Terrain {
    let terrain: Terrain;
    let attempts = 0;

    do {
      terrain = Array.from({ length: gridSize }, () =>
        Array.from({ length: gridSize }, () => 'FLOOR'),
      );

      for (let y = 0; y < gridSize; y++) {
        for (let x = 0; x < gridSize; x++) {
          const isSeekerStart = x <= 1 && y <= 1;
          const isHiderStart = x >= gridSize - 2 && y >= gridSize - 2;

          if (isSeekerStart || isHiderStart) continue;

          const random = Math.random();

          if (random < 0.15) {
            terrain[y][x] = 'WALL';
          } else if (random < 0.27) {
            terrain[y][x] = 'ICE';
          }
        }
      }
      attempts++;
    } while (!this.hasPath(terrain, gridSize) && attempts < 20);

    return terrain;
  }

  createGame(roomId: string, gridSize: number = 10): GameState {
    const terrain = this.generateRandomMap(gridSize);
    // const wallY = Math.floor(gridSize / 2);

    // for (let x = 1; x <= gridSize - 3; x++) {
    //   terrain[wallY][x] = 'WALL';
    // }

    // const iceY = wallY + 2;
    // for (let x = 1; x <= gridSize - 3; x++) {
    //   terrain[iceY][x] = 'ICE';
    // }

    const initialState: GameState = {
      gridSize,
      seekerPos: { x: 0, y: 0 },
      hiderPos: { x: gridSize - 1, y: gridSize - 1 },
      status: 'RUNNING',
      winner: null,
      timeRemaining: 60,
      terrain,
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

  async applyMove(
    roomId: string,
    role: Role,
    direction: Direction,
    onStep: (state: GameState) => void,
  ): Promise<GameState | null> {
    const state = this.games.get(roomId);
    if (!state || state.status !== 'RUNNING') return null;
    const currentPos = role === 'SEEKER' ? state.seekerPos : state.hiderPos;
    const delta = DELTAS[direction];
    const nextX = currentPos.x + delta.dx;
    const nextY = currentPos.y + delta.dy;
    // 1. Spielfeldrand & Wand prüfen
    if (
      nextX < 0 ||
      nextX >= state.gridSize ||
      nextY < 0 ||
      nextY >= state.gridSize ||
      state.terrain[nextY][nextX] === 'WALL'
    ) {
      return state;
    }

    currentPos.x = nextX;
    currentPos.y = nextY;
    this.checkCatch(state);
    onStep(state);
    while (
      state.terrain[currentPos.y][currentPos.x] === 'ICE' &&
      state.status === 'RUNNING'
    ) {
      await sleep(200);

      if (state.status !== 'RUNNING') break;
      const slideX = currentPos.x + delta.dx;
      const slideY = currentPos.y + delta.dy;

      if (
        slideX < 0 ||
        slideX >= state.gridSize ||
        slideY < 0 ||
        slideY >= state.gridSize ||
        state.terrain[slideY][slideX] === 'WALL'
      ) {
        break;
      }

      currentPos.x = slideX;
      currentPos.y = slideY;
      this.checkCatch(state);
      onStep(state);
    }
    return state;
  }
}

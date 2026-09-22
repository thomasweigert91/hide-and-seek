import { create } from "zustand";
import { io, Socket } from "socket.io-client";
import { playSound } from "@/lib/sound";

export type Position = {
  x: number;
  y: number;
};

export type Role = "SEEKER" | "HIDER";

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export type TileKind = "FLOOR" | "WALL" | "ICE";

export type GameState = {
  status: "WAITING" | "RUNNING" | "FINISHED";
  gridSize: number;
  seekerPos: Position;
  hiderPos: Position;
  winner: Role | null;
  timeRemaining: number;
  terrain: TileKind[][];
  items: (ItemKind | null)[][];
};

export type ConnectRoomOptions = {
  roomId: string;
  isHost: boolean;
  roomName?: string;
  gridSize?: number;
};

export type GameStoreState = {
  socket: Socket | null;
  isConnected: boolean;
  roomId: string | null;
  role: Role | null;
  gameState: GameState | null;
  statusMessage: string;
  error: string | null;

  // Actions
  connectRoom: (options: ConnectRoomOptions) => void;
  disconnectRoom: () => void;
  move: (direction: Direction) => void;
  restart: () => void;
  reset: () => void;
};

export type ItemKind = "TIME";

const initialState = {
  socket: null,
  isConnected: false,
  roomId: null,
  role: null,
  gameState: null,
  statusMessage: "Verbinde mit Server...",
  error: null,
};

export const useGameStore = create<GameStoreState>((set, get) => ({
  ...initialState,

  connectRoom: ({ roomId, isHost, roomName, gridSize }) => {
    // Falls bereits eine Socket-Verbindung besteht, vorher trennen
    const currentSocket = get().socket;
    if (currentSocket) {
      currentSocket.emit("leaveRoom");
      currentSocket.disconnect();
    }

    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000";
    const newSocket = io(socketUrl);

    set({
      socket: newSocket,
      roomId,
      role: isHost ? "SEEKER" : null,
      statusMessage: "Verbinde mit Server...",
      error: null,
    });

    const finalRoomName = roomName || `Room ${roomId}`;
    const finalGridSize = gridSize || 10;

    newSocket.on("connect", () => {
      set({ isConnected: true });
      if (isHost) {
        newSocket.emit("createRoom", {
          roomId,
          roomName: finalRoomName,
          gridSize: finalGridSize,
        });
        set({ statusMessage: "Warte auf zweiten Spieler..." });
      } else {
        newSocket.emit("joinRoom", { roomId });
      }
    });

    newSocket.on("roleAssigned", (data: { role: Role }) => {
      set({ role: data.role });
    });

    newSocket.on("roomJoined", (data: { role: Role }) => {
      set({ role: data.role });
    });

    newSocket.on("gameStarted", (state: GameState) => {
      set({ gameState: state, statusMessage: "Spiel läuft!" });
    });

    newSocket.on("gameState", (state: GameState) => {
      set((prev) => {
        const myRole = prev.role;
        if (myRole && prev.gameState && state.status === "RUNNING") {
          const oldPos =
            myRole === "SEEKER"
              ? prev.gameState.seekerPos
              : prev.gameState.hiderPos;
          const newPos = myRole === "SEEKER" ? state.seekerPos : state.hiderPos;

          if (
            oldPos &&
            newPos &&
            (oldPos.x !== newPos.x || oldPos.y !== newPos.y)
          ) {
            playSound("step");
          }
        }

        return {
          gameState: state,
          statusMessage:
            state.status === "FINISHED"
              ? `Spiel vorbei! Gewinner: ${state.winner}`
              : prev.statusMessage,
        };
      });
    });

    newSocket.on("timer", (data: { timeRemaining: number }) => {
      set((prev) => ({
        gameState: prev.gameState
          ? { ...prev.gameState, timeRemaining: data.timeRemaining }
          : null,
      }));
    });

    newSocket.on("playerLeft", (data: { message: string }) => {
      set((prev) => ({
        statusMessage: data.message,
        gameState: prev.gameState
          ? { ...prev.gameState, status: "FINISHED", winner: null }
          : null,
      }));
    });

    newSocket.on("error", (err: { message: string }) => {
      set({
        error: err.message,
        statusMessage: `Fehler: ${err.message}`,
      });
    });

    newSocket.on("disconnect", () => {
      set({ isConnected: false });
    });
  },

  disconnectRoom: () => {
    const { socket } = get();
    if (socket) {
      socket.emit("leaveRoom");
      socket.disconnect();
    }
    set({ ...initialState });
  },

  move: (direction: Direction) => {
    const { socket, gameState } = get();
    if (socket && gameState?.status === "RUNNING") {
      socket.emit("move", { direction });
    }
  },

  restart: () => {
    const { socket } = get();
    if (socket) {
      socket.emit("restart");
    }
  },

  reset: () => {
    set({ ...initialState });
  },
}));

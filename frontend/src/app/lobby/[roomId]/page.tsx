/* eslint-disable react-hooks/set-state-in-effect */
"use client";

import { GameBoard } from "@/components/GameBoard";
import { useKeyboardMovement } from "@/hooks/useKeyboardMovement";
import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";

type Position = { x: number; y: number };
type Role = "SEEKER" | "HIDER";

type GameState = {
  status: "WAITING" | "RUNNING" | "FINISHED";
  gridSize: number;
  seekerPos: Position;
  hiderPos: Position;
  winner: Role | null;
  timeRemaining: number;
};

export default function LobbyPage() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [role, setRole] = useState<Role | null>(null);
  const [statusMessage, setStatusMessage] = useState("Connecting to server...");

  useEffect(() => {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000";
    const newSocket = io(socketUrl);
    setSocket(newSocket);

    newSocket.on("waitingForOpponent", (data: { role: Role }) => {
      setRole(data.role);
      setStatusMessage("Waiting for Player 2");
    });

    newSocket.on("roleAssigned", (data: { role: Role }) => {
      setRole(data.role);
    });

    newSocket.on("gameStarted", (state: GameState) => {
      setGameState(state);
      setStatusMessage("Game has started");
    });

    newSocket.on("gameState", (state: GameState) => {
      setGameState(state);
      if (state.status === "FINISHED") {
        setStatusMessage(`Game is over. Winner: ${state.winner}`);
      }
    });

    newSocket.on("playerLeft", (data: { message: string }) => {
      setStatusMessage(data.message);
    });

    newSocket.on("timer", (data: { timeRemaining: number }) => {
      setGameState((prev) =>
        prev ? { ...prev, timeRemaining: data.timeRemaining } : null,
      );
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  useKeyboardMovement(socket, gameState?.status === "RUNNING");

  const handleRestart = () => {
    setGameState(null);
    setRole(null);
    setStatusMessage("Seeking New Game...");
    socket?.emit("restart");
  };

  return (
    <div className="flex flex-col flex-1 items-center justify-center bg-zinc-50 font-sans dark:bg-black">
      <main className="flex flex-1 w-full max-w-3xl flex-col items-center justify-between py-32 px-16 bg-white dark:bg-black sm:items-start">
        <h1 className="text-2xl font-bold">Hide and Seek</h1>
        <p className="text-zinc-400">{statusMessage}</p>
        <p>Time Left: {gameState?.timeRemaining}</p>

        {gameState && (
          <>
            <GameBoard
              gridSize={gameState.gridSize}
              seekerPos={gameState.seekerPos}
              hiderPos={gameState.hiderPos}
              myRole={role ?? "SEEKER"}
            />
            <button
              className="border-2 border-amber-300 p-2 text-amber-200 rounded-md"
              onClick={handleRestart}
            >
              RESTART
            </button>
          </>
        )}
      </main>
    </div>
  );
}

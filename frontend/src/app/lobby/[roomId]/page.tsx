"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { io, Socket } from "socket.io-client";
import { GameBoard } from "@/components/GameBoard";
import { useKeyboardMovement } from "@/hooks/useKeyboardMovement";

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

export default function GameRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const searchParams = useSearchParams();
  const isHost = searchParams.get("host") === "true";

  const [socket, setSocket] = useState<Socket | null>(null);
  const [gameState, setGameState] = useState<GameState | null>(null);
  const [role, setRole] = useState<Role | null>(isHost ? "SEEKER" : null);
  const [statusMessage, setStatusMessage] = useState("Verbinde mit Server...");
  const [copied, setCopied] = useState(false);

  useEffect(() => {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000";
    const newSocket = io(socketUrl);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(newSocket);

    const roomName = searchParams.get("name") || `Room ${roomId}`;

    newSocket.on("connect", () => {
      if (isHost) {
        newSocket.emit("createRoom", { roomId, roomName });
        setStatusMessage("Warte auf zweiten Spieler...");
      } else {
        newSocket.emit("joinRoom", { roomId });
      }
    });

    newSocket.on("roleAssigned", (data: { role: Role }) => {
      setRole(data.role);
    });

    newSocket.on("roomJoined", (data: { role: Role }) => {
      setRole(data.role);
    });

    newSocket.on("gameStarted", (state: GameState) => {
      setGameState(state);
      setStatusMessage("Spiel läuft!");
    });

    newSocket.on("gameState", (state: GameState) => {
      setGameState(state);
      if (state.status === "FINISHED") {
        setStatusMessage(`Spiel vorbei! Gewinner: ${state.winner}`);
      }
    });

    newSocket.on("timer", (data: { timeRemaining: number }) => {
      setGameState((prev) =>
        prev ? { ...prev, timeRemaining: data.timeRemaining } : null,
      );
    });

    newSocket.on("error", (err: { message: string }) => {
      setStatusMessage(`Fehler: ${err.message}`);
    });

    return () => {
      newSocket.disconnect();
    };
  }, [roomId, isHost]);

  useKeyboardMovement(socket, gameState?.status === "RUNNING");

  function copyInviteLink() {
    navigator.clipboard.writeText(window.location.href.split("?")[0]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-4 text-white">
      <div className="mb-6 flex flex-col items-center gap-2 text-center">
        <div className="flex items-center gap-3">
          <h1 className="text-xl font-bold">
            Raum: <span className="font-mono text-blue-400">{roomId}</span>
          </h1>
          {isHost && gameState?.status !== "RUNNING" && (
            <button
              onClick={copyInviteLink}
              className="rounded-lg bg-zinc-800 px-3 py-1 text-xs text-zinc-300 hover:bg-zinc-700"
            >
              {copied ? "✅ Kopiert!" : "📋 Link kopieren"}
            </button>
          )}
        </div>

        <p className="text-sm text-zinc-400">{statusMessage}</p>
        {role && (
          <p className="text-sm font-semibold text-amber-400">
            Deine Rolle: {role === "SEEKER" ? "👁️ Sucher" : "🥷 Verstecker"}
          </p>
        )}

        {gameState?.status === "RUNNING" && (
          <div className="mt-2 rounded-lg bg-zinc-900 px-4 py-1.5 font-mono text-lg font-bold border border-zinc-800">
            ⏱️ {gameState.timeRemaining}s
          </div>
        )}
      </div>

      {!gameState && (
        <div className="mt-8 flex flex-col items-center gap-4">
          <div className="flex items-center gap-3 rounded-xl border border-zinc-800 bg-zinc-900/60 px-6 py-4 text-zinc-400">
            <span className="h-2.5 w-2.5 rounded-full bg-amber-400 animate-pulse" />
            <span>Warte auf einen Mitspieler, um das Spiel zu starten...</span>
          </div>

          <Link
            href="/"
            className="flex items-center gap-2 rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-5 py-2.5 text-sm font-semibold text-zinc-300 shadow-md transition-all hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
          >
            ← Back to Dashboard
          </Link>
        </div>
      )}

      {gameState && (
        <GameBoard
          gridSize={gameState.gridSize}
          seekerPos={gameState.seekerPos}
          hiderPos={gameState.hiderPos}
          myRole={role ?? "SEEKER"}
        />
      )}
    </div>
  );
}

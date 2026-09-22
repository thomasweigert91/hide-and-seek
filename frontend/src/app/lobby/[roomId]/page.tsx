"use client";

import Link from "next/link";
import { use, useEffect, useState } from "react";
import { useSearchParams } from "next/navigation";
import { GameBoard } from "@/components/GameBoard";
import { useKeyboardMovement } from "@/hooks/useKeyboardMovement";
import { useGameStore } from "@/store/useGameStore";
import { useGameSounds } from "@/hooks/useGameSounds";

export default function GameRoomPage({
  params,
}: {
  params: Promise<{ roomId: string }>;
}) {
  const { roomId } = use(params);
  const searchParams = useSearchParams();
  const isHost = searchParams.get("host") === "true";
  const roomName = searchParams.get("name") || undefined;
  const gridSize = Number(searchParams.get("gridSize")) || undefined;

  const [copied, setCopied] = useState(false);

  const gameState = useGameStore((state) => state.gameState);
  const role = useGameStore((state) => state.role);
  const statusMessage = useGameStore((state) => state.statusMessage);
  const connectRoom = useGameStore((state) => state.connectRoom);
  const disconnectRoom = useGameStore((state) => state.disconnectRoom);
  const restart = useGameStore((state) => state.restart);

  useEffect(() => {
    connectRoom({ roomId, isHost, roomName, gridSize });

    return () => {
      disconnectRoom();
    };
  }, [roomId, isHost, roomName, gridSize, connectRoom, disconnectRoom]);

  useKeyboardMovement(gameState?.status === "RUNNING");

  function copyInviteLink() {
    navigator.clipboard.writeText(window.location.href.split("?")[0]);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  function handleRestart() {
    restart();
  }

  useGameSounds();

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

        {gameState?.status === "FINISHED" && (
          <div className="mt-3 flex items-center gap-3">
            <button
              onClick={handleRestart}
              className="rounded-xl bg-blue-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-blue-500/20 transition-all hover:bg-blue-500 active:scale-95"
            >
              🔄 Nochmal spielen (Restart)
            </button>
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
          terrain={gameState.terrain}
          items={gameState.items}
        />
      )}
    </div>
  );
}

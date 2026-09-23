import { useEffect, useRef } from "react";
import { useGameStore } from "@/store/useGameStore";
import { playSound } from "@/lib/sound";

export function useGameSounds() {
  const gameState = useGameStore((state) => state.gameState);
  const role = useGameStore((state) => state.role);
  const prevStateRef = useRef(gameState);

  useEffect(() => {
    const prevState = prevStateRef.current;
    prevStateRef.current = gameState;

    if (!prevState || !gameState || !role || gameState.status !== "RUNNING") {
      return;
    }

    const oldPos = role === "SEEKER" ? prevState.seekerPos : prevState.hiderPos;
    const newPos = role === "SEEKER" ? gameState.seekerPos : gameState.hiderPos;

    if (oldPos.x !== newPos.x || oldPos.y !== newPos.y) {
      playSound("step");
    }
  }, [gameState, role]);
}

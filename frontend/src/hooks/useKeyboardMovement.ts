import { useEffect } from "react";
import { Socket } from "socket.io-client";
import { Direction, useGameStore } from "@/store/useGameStore";

export type { Direction };

export function useKeyboardMovement(
  socketOrEnabled?: Socket | boolean | null,
  isMyTurn = true,
) {
  const storeMove = useGameStore((state) => state.move);
  const storeSocket = useGameStore((state) => state.socket);

  const isSocketProvided =
    socketOrEnabled !== undefined &&
    socketOrEnabled !== null &&
    typeof socketOrEnabled === "object";

  const enabled =
    typeof socketOrEnabled === "boolean" ? socketOrEnabled : isMyTurn;

  const activeSocket = isSocketProvided ? socketOrEnabled : storeSocket;

  useEffect(() => {
    if (!enabled) return;
    if (isSocketProvided && !activeSocket) return;
    if (!isSocketProvided && !storeSocket) return;

    function onKeyDown(event: KeyboardEvent) {
      const keyName = event.key;
      if (
        ["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(keyName)
      ) {
        event.preventDefault();
      }

      let direction: Direction | null = null;

      switch (keyName) {
        case "ArrowUp":
          direction = "UP";
          break;
        case "ArrowDown":
          direction = "DOWN";
          break;
        case "ArrowLeft":
          direction = "LEFT";
          break;
        case "ArrowRight":
          direction = "RIGHT";
          break;
      }

      if (direction) {
        if (isSocketProvided) {
          activeSocket?.emit("move", { direction });
        } else {
          storeMove(direction);
        }
      }
    }

    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [activeSocket, enabled, isSocketProvided, storeMove, storeSocket]);
}

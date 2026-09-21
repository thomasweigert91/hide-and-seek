import { useEffect } from "react";
import { Socket } from "socket.io-client";

export type Direction = "UP" | "DOWN" | "LEFT" | "RIGHT";

export function useKeyboardMovement(socket: Socket | null, isMyTurn = true) {
  useEffect(() => {
    if (!socket || !isMyTurn) return;

    function onKeyDown(event: KeyboardEvent) {
      const keyName = event.key;
      if (["ArrowUp", "ArrowDown", "ArrowLeft", "ArrowRight"].includes(keyName))
        event.preventDefault();

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
        socket?.emit("move", { direction });
      }
    }
    window.addEventListener("keydown", onKeyDown);
    return () => window.removeEventListener("keydown", onKeyDown);
  }, [socket, isMyTurn]);
}

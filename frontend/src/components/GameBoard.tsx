import Link from "next/link";
import { FC } from "react";
import { Tile } from "./Tile";
import { TileKind } from "@/store/useGameStore";

type GameBoardProps = {
  gridSize?: number;
  seekerPos?: { x: number; y: number };
  hiderPos?: { x: number; y: number };
  myRole?: "SEEKER" | "HIDER";
  terrain?: TileKind[][];
};
const VISION_RADIUS = 1;

export const GameBoard: FC<GameBoardProps> = ({
  gridSize = 10,
  seekerPos = { x: 0, y: 5 },
  hiderPos = { x: 6, y: 7 },
  myRole,
  terrain,
}) => {
  const cells = Array.from({ length: gridSize * gridSize }, (_, index) => {
    const x = index % gridSize;
    const y = Math.floor(index / gridSize);
    return { x, y };
  });

  const myPos = myRole === "SEEKER" ? seekerPos : hiderPos;

  const tokenSizeClass =
    gridSize >= 15
      ? "text-xs"
      : gridSize >= 12
        ? "text-sm"
        : gridSize <= 8
          ? "text-xl"
          : "text-base";

  const gapClass = gridSize >= 14 ? "gap-0.5 p-1.5" : "gap-1 p-2";

  return (
    <div className="flex flex-col items-center gap-6">
      <div
        className={`grid ${gapClass} rounded-xl border-4 border-zinc-800 bg-zinc-950 shadow-2xl`}
        style={{
          width: "min(85vw, 500px)",
          height: "min(85vw, 500px)",
          gridTemplateColumns: `repeat(${gridSize}, minmax(0, 1fr))`,
          gridTemplateRows: `repeat(${gridSize}, minmax(0, 1fr))`,
        }}
      >
        {cells.map(({ x, y }) => {
          const distance = Math.max(
            Math.abs(x - myPos.x),
            Math.abs(y - myPos.y),
          );
          const inVision = distance <= VISION_RADIUS;

          const showHider =
            hiderPos?.x === x &&
            hiderPos?.y === y &&
            (myRole === "HIDER" || inVision);
          const showSeeker =
            seekerPos?.x === x &&
            seekerPos?.y === y &&
            (myRole === "SEEKER" || inVision);
          return (
            <Tile
              key={`${x}-${y}`}
              kind={terrain?.[y]?.[x] ?? "FLOOR"}
              x={x}
              y={y}
              fogged={!inVision}
            >
              {showSeeker && (
                <div
                  className={`flex h-4/5 w-4/5 items-center justify-center rounded-full bg-red-600 font-bold text-white shadow-lg shadow-red-500/50 animate-pulse ${tokenSizeClass}`}
                >
                  👁️
                </div>
              )}

              {showHider && (
                <div
                  className={`flex h-4/5 w-4/5 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/50 ${tokenSizeClass}`}
                >
                  🥷
                </div>
              )}
            </Tile>
          );
        })}
      </div>

      <Link
        href="/"
        className="flex items-center gap-2 rounded-xl border border-zinc-700/80 bg-zinc-900/90 px-5 py-2.5 text-sm font-semibold text-zinc-300 shadow-md transition-all hover:border-zinc-500 hover:bg-zinc-800 hover:text-white"
      >
        ← Back to Dashboard
      </Link>
    </div>
  );
};

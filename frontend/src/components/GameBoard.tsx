import { FC } from "react";

type GameBoardProps = {
  gridSize: number;
  seekerPos: { x: number; y: number };
  hiderPos: { x: number; y: number };
  myRole: "SEEKER" | "HIDER";
};

export const GameBoard: FC<GameBoardProps> = ({
  gridSize = 10,
  seekerPos = { x: 0, y: 5 },
  hiderPos = { x: 6, y: 7 },
  myRole,
}) => {
  const cells = Array.from({ length: gridSize * gridSize }, (_, index) => {
    const x = index % gridSize;
    const y = Math.floor(index / gridSize);
    return { x, y };
  });

  return (
    <div className="flex flex-col items-center gap-4">
      <div
        className="grid grid-cols-10 grid-rows-10 gap-1 rounded-xl border-4 border-zinc-800 bg-zinc-950 p-2 shadow-2xl"
        style={{ width: "min(85vw, 500px)", height: "min(85vw, 500px)" }}
      >
        {cells.map(({ x, y }) => {
          const isSeeker = seekerPos.x === x && seekerPos.y === y;
          const isHider = hiderPos.x === x && hiderPos.y === y;
          return (
            <div
              key={`${x}-${y}`}
              className={`relative flex items-center justify-center rounded transition-all duration-150 ${
                (x + y) % 2 === 0 ? "bg-zinc-900/60" : "bg-zinc-800/40"
              } border border-zinc-800/30`}
            >
              {isSeeker && (
                <div className="flex h-4/5 w-4/5 items-center justify-center rounded-full bg-red-600 font-bold text-white shadow-lg shadow-red-500/50 animate-pulse">
                  👁️
                </div>
              )}

              {isHider && (
                <div className="flex h-4/5 w-4/5 items-center justify-center rounded-full bg-blue-600 font-bold text-white shadow-lg shadow-blue-500/50">
                  🥷
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};

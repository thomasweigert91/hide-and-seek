import { FC, ReactNode } from "react";
import { TileKind, ItemKind } from "@/store/useGameStore";

type TileProps = {
  kind: TileKind;
  item?: ItemKind | null;
  x: number;
  y: number;
  fogged: boolean;
  children?: ReactNode;
};

const tileStyles: Record<TileKind, { even: string; odd: string }> = {
  FLOOR: {
    even: "bg-zinc-900/60 border-zinc-800/30",
    odd: "bg-zinc-800/40 border-zinc-800/30",
  },
  WALL: {
    even: "bg-zinc-700 border-zinc-600",
    odd: "bg-zinc-700 border-zinc-600",
  },
  ICE: {
    even: "bg-sky-900/40 border-sky-700/30",
    odd: "bg-sky-900/40 border-sky-700/30",
  },
  MUD: {
    even: "bg-amber-950/70 border-amber-900/40",
    odd: "bg-amber-900/50 border-amber-900/40",
  },
};

export const Tile: FC<TileProps> = ({ kind, x, y, fogged, children, item }) => {
  console.log("🚀 ~ Tile ~ item:", item);

  const base =
    "relative flex items-center justify-center rounded transition-all duration-200 border";
  const look = fogged
    ? "bg-zinc-950 border-zinc-900 opacity-30"
    : tileStyles[kind][(x + y) % 2 === 0 ? "even" : "odd"];

  return (
    <div className={`${base} ${look}`}>
      {!fogged && item && <span className="absolute text-md">⏱️</span>}
      {children}
    </div>
  );
};

import Link from "next/link";
import { FC } from "react";

type RoomListItem = {
  id: string;
  roomName: string;
  playerCount: number;
  status: "WAITING" | "IN_GAME";
};

export type RoomListProps = {
  rooms: RoomListItem[];
};

export const RoomList = ({ rooms }: RoomListProps) => {
  return (
    <div className="overflow-hidden rounded-2xl border-zinc-800 bg-zinc-900 shadow-xl p-8">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-zinc-800 bg-zinc-900/80 text-xs uppercase shadow-xl text-left">
            <th className="px-6 py-3.5">Room Name</th>
            <th className="px-6 py-3.5">Room Code</th>
            <th className="px-6 py-3.5">Room Status</th>
            <th className="px-6 py-3.5">Players</th>
            <th className="px-6 py-3.5">Action</th>
          </tr>
        </thead>
        <tbody className="divide-y divide-zinc-800/60 text-sm">
          {rooms.length === 0 ? (
            <tr>
              <td colSpan={5} className="py-8 text-center text-zinc-500">
                There are no rooms open currently. Create the first room!
              </td>
            </tr>
          ) : (
            rooms.map(({ roomName, id, playerCount, status }) => {
              return (
                <tr key={id}>
                  <td className="px-6 py-4 font-medium text-white">
                    {roomName}
                  </td>
                  <td className="px-6 py-4 font-mono text-zinc-400">{id}</td>
                  <td className="px-6 py-4">
                    {status === "WAITING" ? (
                      <span className="rounded-full bg-amber-500/10 px-2.5 py-1 text-xs text-amber-400 border border-amber-500/20">
                        Wartet
                      </span>
                    ) : (
                      <span className="rounded-full bg-blue-500/10 px-2.5 py-1 text-xs text-blue-400 border border-blue-500/20">
                        Im Spiel
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4">{`${playerCount}/2`}</td>
                  <td className="px-6 py-4">
                    <Link
                      href={`/lobby/${id}`}
                      className="rounded-lg bg-emerald-600 px-3.5 py-1.5 text-xs font-semibold text-white hover:bg-emerald-500 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
                    >
                      Enter
                    </Link>
                  </td>
                </tr>
              );
            })
          )}
        </tbody>
      </table>
    </div>
  );
};

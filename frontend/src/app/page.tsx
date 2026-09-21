"use client";

import { useEffect, useState } from "react";
import { io, Socket } from "socket.io-client";
import { RoomList } from "@/components/RoomList";
import { CreateRoomForm } from "@/components/CreateRoomForm";

type RoomInfo = {
  id: string;
  roomName: string;
  playerCount: number;
  status: "WAITING" | "IN_GAME";
};

export default function Home() {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [rooms, setRooms] = useState<RoomInfo[]>([]);

  useEffect(() => {
    const socketUrl =
      process.env.NEXT_PUBLIC_SOCKET_URL || "http://localhost:8000";
    const newSocket = io(socketUrl);
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setSocket(newSocket);

    // Live-Update der Raumtabelle
    newSocket.on("roomsList", (list: RoomInfo[]) => {
      setRooms(list);
    });

    return () => {
      newSocket.disconnect();
    };
  }, []);

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-zinc-950 p-6 text-white">
      <div className="w-full max-w-3xl space-y-6">
        {/* Header & Raum erstellen Formular */}
        <div className="flex flex-col sm:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold tracking-tight">
              Hide & Seek Lobbies
            </h1>
            <p className="text-sm text-zinc-400">
              Choose a room or create your own.
            </p>
          </div>

          <div className="w-full sm:w-80">
            <CreateRoomForm socket={socket} />
          </div>
        </div>

        {/* Die Tabelle aller offenen Räume */}
        <RoomList rooms={rooms} />
      </div>
    </div>
  );
}

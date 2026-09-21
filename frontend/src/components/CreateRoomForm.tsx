"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";
import { Socket } from "socket.io-client";

type FormState = {
  error?: string | null;
};

export const CreateRoomForm = ({ socket }: { socket: Socket | null }) => {
  const router = useRouter();

  async function createRoomAction(
    _prevState: FormState,
    formData: FormData,
  ): Promise<FormState> {
    const roomName = (formData.get("roomName") as string).trim();

    if (!roomName) {
      return { error: "Please insert a roomname" };
    }

    if (!socket) {
      return { error: "No connection to server" };
    }

    socket.emit("createRoom", { roomName });

    socket.once("roleAssigned", ({ roomId }) => {
      router.push(`/lobby/${roomId}`);
    });

    return { error: null };
  }

  const [state, formAction, isPending] = useActionState(createRoomAction, {
    error: null,
  });

  return (
    <form action={formAction} className="space-y-3">
      <label
        htmlFor="roomName"
        className="block text-sm font-medium text-zinc-300 mb-1"
      >
        Room Name
      </label>
      <input
        id="roomName"
        name="roomName"
        type="text"
        placeholder="Insert your roomname"
        disabled={isPending}
        className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500 disabled:opacity-50"
      />
      {state.error && <p className="text-xs text-red-400">{state.error}</p>}
      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-blue-600 px-4 py-2 font-semibold text-sm hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/20"
      >
        {isPending ? "Creating room..." : "Create room"}
      </button>
    </form>
  );
};

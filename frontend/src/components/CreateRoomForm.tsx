"use client";

import { useRouter } from "next/navigation";
import { useActionState } from "react";

type FormState = {
  error?: string | null;
};

export const CreateRoomForm = () => {
  const router = useRouter();

  async function createRoomAction(
    _prevState: FormState,
    formData: FormData,
  ): Promise<FormState> {
    const roomName = (formData.get("roomName") as string).trim();
    const gridSize = (formData.get("gridSize") as string) || "10";

    if (!roomName) {
      return { error: "Please insert a roomname" };
    }

    const roomId = Math.random().toString(36).substring(2, 6).toUpperCase();
    router.push(
      `/lobby/${roomId}?host=true&name=${encodeURIComponent(roomName)}&gridSize=${gridSize}`,
    );

    return { error: null };
  }

  const [state, formAction, isPending] = useActionState(createRoomAction, {
    error: null,
  });

  return (
    <form action={formAction} className="space-y-4">
      <div>
        <label
          htmlFor="roomName"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          Room Name
        </label>
        <input
          id="roomName"
          name="roomName"
          type="text"
          placeholder="Insert your roomname"
          disabled={isPending}
          className="w-full rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2 text-sm text-white placeholder:text-zinc-500 transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
        />
      </div>

      <div>
        <label
          htmlFor="gridSize"
          className="block text-sm font-medium text-zinc-300 mb-1.5"
        >
          Grid Size
        </label>
        <div className="relative">
          <select
            id="gridSize"
            name="gridSize"
            defaultValue="10"
            disabled={isPending}
            className="w-full appearance-none rounded-xl border border-zinc-700 bg-zinc-800 px-3.5 py-2 pr-10 text-sm text-white cursor-pointer transition-colors focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500 disabled:opacity-50"
          >
            <option value="8" className="bg-zinc-800 text-white">
              8 × 8 (Compact)
            </option>
            <option value="10" className="bg-zinc-800 text-white">
              10 × 10 (Standard)
            </option>
            <option value="12" className="bg-zinc-800 text-white">
              12 × 12 (Medium)
            </option>
            <option value="15" className="bg-zinc-800 text-white">
              15 × 15 (Large)
            </option>
          </select>
          <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center pr-3 text-zinc-400">
            <svg
              className="h-4 w-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M19 9l-7 7-7-7"
              />
            </svg>
          </div>
        </div>
      </div>

      {state.error && <p className="text-xs text-red-400">{state.error}</p>}

      <button
        type="submit"
        disabled={isPending}
        className="w-full rounded-xl bg-blue-600 px-4 py-2.5 font-semibold text-sm hover:bg-blue-500 disabled:opacity-50 transition-colors shadow-lg shadow-blue-500/20 active:scale-[0.99]"
      >
        {isPending ? "Creating room..." : "Create room"}
      </button>
    </form>
  );
};

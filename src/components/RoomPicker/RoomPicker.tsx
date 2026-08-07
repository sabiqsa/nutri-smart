"use client";

import { useRouter } from "next/navigation";

import { ROOM_OPTIONS } from "@/constants/patient-options";

export function RoomPicker({ value }: { value: string }) {
  const router = useRouter();

  return (
    <select
      value={value}
      onChange={(e) => router.push(e.target.value ? `?room=${encodeURIComponent(e.target.value)}` : "?")}
      className="rounded-card w-full border border-outline-variant bg-surface-container-lowest px-3 py-2 text-sm"
    >
      <option value="">Pilih Ruangan...</option>
      {ROOM_OPTIONS.map((room) => (
        <option key={room} value={room}>
          {room}
        </option>
      ))}
    </select>
  );
}

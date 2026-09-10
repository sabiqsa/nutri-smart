"use client";

import { useRouter } from "next/navigation";

import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { ROOM_OPTIONS } from "@/constants/patient-options";

// Radix Select items can't have an empty-string value — this sentinel
// stands in for "no room selected / clear filter".
const ALL_ROOMS = "__all__";

export function RoomPicker({ value }: { value: string }) {
  const router = useRouter();

  return (
    <Select
      value={value || ALL_ROOMS}
      onValueChange={(v) => router.push(v === ALL_ROOMS ? "?" : `?room=${encodeURIComponent(v)}`)}
    >
      <SelectTrigger className="w-full">
        <SelectValue placeholder="Pilih Ruangan..." />
      </SelectTrigger>
      <SelectContent>
        <SelectItem value={ALL_ROOMS}>Pilih Ruangan...</SelectItem>
        {ROOM_OPTIONS.map((room) => (
          <SelectItem key={room} value={room}>
            {room}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}

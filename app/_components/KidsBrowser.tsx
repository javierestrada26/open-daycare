"use client";

import { useState } from "react";
import { KidCard } from "./KidCard";
import type { KidCardVm, RoomVm } from "../_lib/kids";

type KidsBrowserProps = {
  rooms: RoomVm[];
  kids: KidCardVm[];
};

function roomCountLabel(count: number): string {
  return count === 1 ? "1 niño" : `${count} niños`;
}

export function KidsBrowser({ rooms, kids }: KidsBrowserProps) {
  const [query, setQuery] = useState("");
  const q = query.trim().toLowerCase();

  return (
    <div className="flex flex-col gap-[22px]">
      <div className="flex items-center gap-[11px] bg-surface border border-border-cream rounded-[14px] px-4 py-3">
        <svg
          width="18"
          height="18"
          viewBox="0 0 24 24"
          fill="none"
          stroke="#B0A290"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <circle cx="11" cy="11" r="7" />
          <path d="m21 21-4.3-4.3" />
        </svg>
        <input
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder="Buscar niño…"
          className="flex-1 bg-transparent border-none text-[15px] text-ink outline-none placeholder:text-ink-placeholder"
        />
      </div>

      {rooms.map((room) => {
        const roomKids = kids.filter((k) => k.roomId === room.id);
        const visible =
          q === ""
            ? roomKids
            : roomKids.filter((k) => k.name.toLowerCase().includes(q));

        return (
          <section key={room.id}>
            <div className="flex items-center gap-3 mb-[14px]">
              <span className="text-[12.5px] font-extrabold tracking-[0.8px] text-ink">
                SALA {room.name.toUpperCase()}
              </span>
              <span className="text-[13px] text-ink-faint">
                {roomCountLabel(roomKids.length)}
              </span>
              <span className="flex-1 h-px bg-rule" />
            </div>

            {roomKids.length === 0 ? (
              <p className="text-[14px] text-ink-muted">
                Aún no hay niños en esta sala
              </p>
            ) : visible.length === 0 ? null : (
              <div className="grid grid-cols-2 gap-[14px]">
                {visible.map((kid) => (
                  <KidCard key={kid.slug} kid={kid} />
                ))}
              </div>
            )}
          </section>
        );
      })}
    </div>
  );
}

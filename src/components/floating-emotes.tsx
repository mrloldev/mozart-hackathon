"use client";

import { useQuery } from "convex/react";
import { useEffect, useRef, useState } from "react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";

const EMOTE_MAP: Record<string, string> = {
  tomato: "🍅",
  fire: "🔥",
  heart: "❤️",
  clap: "👏",
  skull: "💀",
};

interface VisibleEmote {
  id: string;
  type: string;
  left: number;
  rotation: number;
  scale: number;
  side: "left" | "right" | "full";
}

export default function FloatingEmotes({
  roomId,
  team0Id,
  team1Id,
  direction = "up",
}: {
  roomId: Id<"rooms">;
  team0Id?: Id<"teams">;
  team1Id?: Id<"teams">;
  direction?: "up" | "down";
}) {
  const emotes = useQuery(api.audience.getRecentEmotes, { roomId });
  const [visible, setVisible] = useState<Map<string, VisibleEmote>>(new Map());
  const seenRef = useRef<Set<string>>(new Set());

  useEffect(() => {
    if (!emotes?.length) return;
    for (const e of emotes) {
      const key = `${e._id}-${e.createdAt}`;
      if (seenRef.current.has(key)) continue;
      seenRef.current.add(key);

      let side: "left" | "right" | "full" = "full";
      if (team0Id && team1Id && (e as any).teamId) {
        side = (e as any).teamId === team0Id ? "left" : "right";
      }

      const rangeMin = side === "left" ? 5 : side === "right" ? 55 : 10;
      const rangeMax = side === "left" ? 45 : side === "right" ? 95 : 90;

      setVisible((prev) => {
        const next = new Map(prev);
        next.set(key, {
          id: key,
          type: e.type,
          left: Math.random() * (rangeMax - rangeMin) + rangeMin,
          rotation: (Math.random() - 0.5) * 30,
          scale: 0.8 + Math.random() * 0.6,
          side,
        });
        return next;
      });
      setTimeout(() => {
        setVisible((prev) => {
          const next = new Map(prev);
          next.delete(key);
          return next;
        });
      }, 2500);
    }
  }, [emotes, team0Id, team1Id]);

  return (
    <div className="pointer-events-none fixed inset-0 z-40 overflow-hidden">
      {Array.from(visible.entries()).map(([key, { type, left, rotation, scale }]) => (
        <span
          key={key}
          className={`absolute text-4xl ${
            direction === "down"
              ? "top-0 animate-float-down"
              : "bottom-0 animate-float-up-far"
          }`}
          style={{
            left: `${left}%`,
            transform: `translateX(-50%) rotate(${rotation}deg) scale(${scale})`,
          }}
        >
          {EMOTE_MAP[type] ?? "✨"}
        </span>
      ))}
    </div>
  );
}

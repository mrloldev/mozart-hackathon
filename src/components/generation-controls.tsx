"use client";

import Image from "next/image";
import { TEAM_COLORS } from "@/constants/game";
import type { Role } from "@/types/game";

interface Player {
  _id: string;
  name: string;
  avatarUrl: string;
  role: Role;
}

export default function GenerationControls({
  player,
  teamIndex,
  currentRole,
  onGenerate,
  isGenerating,
}: {
  player: Player;
  teamIndex: number;
  currentRole: (typeof import("@/constants/game").ROLES)[number];
  onGenerate: (prompt: string) => Promise<void>;
  isGenerating: boolean;
}) {
  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const form = e.currentTarget;
    const prompt = (form.elements.namedItem("prompt") as HTMLInputElement)?.value?.trim();
    if (!prompt || isGenerating) return;
    await onGenerate(prompt);
  };

  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-6 py-8">
      <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-white/20">
        <Image
          src={player.avatarUrl}
          alt={player.name}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="text-center">
        <p className={`text-xl font-black ${TEAM_COLORS[teamIndex].color}`}>
          {player.name}&apos;s Turn
        </p>
        <p className="mt-1 text-sm text-white/60">
          {currentRole.id === "beat"
            ? "Describe the beat (e.g. boom-tss-ka-tss)"
            : "Describe the melody (e.g. add piano melody)"}
        </p>
      </div>

      {isGenerating ? (
        <div className="flex flex-col items-center gap-4 text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-white/30 border-t-white" />
          <span className="text-sm font-bold text-white/80">Generating your track…</span>
          <span className="text-xs text-white/40">This can take up to a minute</span>
        </div>
      ) : (
        <form onSubmit={handleSubmit} className="flex w-full max-w-md flex-col gap-4">
          <input
            name="prompt"
            type="text"
            placeholder={
              currentRole.id === "beat"
                ? "e.g. boom-tss-ka-tss, synthwave baseline"
                : "e.g. add classical piano, smooth jazz sax"
            }
            className="w-full rounded-lg border border-white/20 bg-white/5 px-4 py-3 text-white placeholder:text-white/40 focus:border-white/40 focus:outline-none"
            maxLength={500}
          />
          <button
            type="submit"
            className="w-full bg-amber-500 px-5 py-3 text-sm font-bold text-amber-950 transition-all hover:bg-amber-400"
          >
            GENERATE
          </button>
        </form>
      )}
    </div>
  );
}

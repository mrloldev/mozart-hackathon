"use client";

import { Mic, Square } from "lucide-react";
import Image from "next/image";
import { ROLE_CHALLENGE, TEAM_COLORS, MAX_RECORDING_TIME } from "@/constants/game";
import type { LocalPlayer, Role } from "@/types/game";
import RecordingWaveform from "@/components/recording-waveform";

export default function LocalRecordingControls({
  player,
  teamIndex,
  currentRole,
  isRecording,
  recordingTime,
  onStartRecording,
  onStopRecording,
}: {
  player: LocalPlayer;
  teamIndex: number;
  currentRole: (typeof import("@/constants/game").ROLES)[number];
  isRecording: boolean;
  recordingTime: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
}) {
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
          {ROLE_CHALLENGE[currentRole.id as Role]}
        </p>
      </div>

      {isRecording ? (
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <RecordingWaveform />
            <span className="text-sm font-bold text-white/80">{MAX_RECORDING_TIME - recordingTime}s left</span>
          </div>
          <button
            onClick={onStopRecording}
            className="flex items-center gap-2 bg-white/10 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-white/20"
          >
            <Square size={16} fill="currentColor" />
            STOP
          </button>
        </div>
      ) : (
        <button
          onClick={onStartRecording}
          className="flex items-center gap-2 bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-400"
        >
          <Mic size={18} />
          RECORD
        </button>
      )}
    </div>
  );
}

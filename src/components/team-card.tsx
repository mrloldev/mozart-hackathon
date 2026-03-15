"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Check, Pencil, Play, Square } from "lucide-react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ROLES, TEAM_COLORS } from "@/constants/game";
import type { Role } from "@/types/game";
import type { Id } from "@/convex/_generated/dataModel";
import EditableName from "@/components/editable-name";
import StaticWaveform from "@/components/static-waveform";

interface TeamPlayer {
  _id: Id<"players">;
  name: string;
  avatarUrl: string;
  role: Role;
  hasRecorded?: boolean;
  recordingUrl?: string | null;
}

interface Team {
  _id: Id<"teams">;
  name: string;
  players: TeamPlayer[];
  isConnected?: boolean;
}

function PlayerAudioPreview({
  recordingUrl,
  teamIndex,
}: {
  recordingUrl: string;
  teamIndex: number;
}) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    audioRef.current?.pause();
    audioRef.current = null;
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
      return;
    }
    const audio = new Audio(recordingUrl);
    audioRef.current = audio;
    audio.onended = stop;
    audio.play().then(() => {
      setIsPlaying(true);
      const tick = () => {
        setProgress(audio.currentTime);
        setDuration(audio.duration || 0);
        if (!audio.paused) rafRef.current = requestAnimationFrame(tick);
      };
      rafRef.current = requestAnimationFrame(tick);
    }).catch(stop);
  }, [isPlaying, recordingUrl, stop]);

  const colors = TEAM_COLORS[teamIndex] ?? TEAM_COLORS[0];
  const prog = duration > 0 ? progress / duration : 0;

  return (
    <button
      type="button"
      onClick={toggle}
      className="flex w-full items-center gap-2 rounded-lg bg-white/[0.04] p-2 transition-colors hover:bg-white/[0.07] active:scale-[0.99]"
    >
      <div
        className={`flex h-6 w-6 shrink-0 items-center justify-center rounded-full ${colors.bgColor} text-white`}
      >
        {isPlaying ? <Square size={10} fill="currentColor" /> : <Play size={10} fill="currentColor" />}
      </div>
      <div className="min-w-0 flex-1">
        <StaticWaveform
          url={recordingUrl}
          progress={prog}
          height={20}
          barColor="rgba(255,255,255,0.15)"
          playedColor={colors.playedColor}
        />
      </div>
    </button>
  );
}

export default function TeamCard({
  team,
  teamIndex,
  isEditable = false,
  isActive = false,
  activeRole,
  onTeamNameChange,
  onPlayerNameChange,
}: {
  team: Team;
  teamIndex: number;
  isEditable?: boolean;
  isActive?: boolean;
  activeRole?: Role;
  onTeamNameChange?: (name: string) => void;
  onPlayerNameChange?: (playerId: Id<"players">, name: string) => void;
}) {
  const colors = TEAM_COLORS[teamIndex] ?? TEAM_COLORS[0];

  return (
    <motion.div
      className={`overflow-hidden rounded-2xl transition-all ${
        isActive ? `ring-2 ${colors.ring} ${colors.glow}` : "ring-1 ring-white/[0.06]"
      }`}
      layout
    >
      {/* Team header with gradient */}
      <div className={`${colors.bgGradient} px-4 py-2.5`}>
        {isEditable && onTeamNameChange ? (
          <div className="flex justify-center">
            <EditableName
              value={team.name}
              onChange={onTeamNameChange}
              className="text-center text-base font-black uppercase tracking-wider text-white"
              suffix={<Pencil size={14} strokeWidth={2.5} className="shrink-0 text-white/60" />}
            />
          </div>
        ) : (
          <h3 className="text-center text-base font-black uppercase tracking-wider text-white">{team.name}</h3>
        )}
      </div>

      {/* Players */}
      <div className={`${colors.bgTint} p-3`}>
        <div className="flex flex-col gap-2">
          {team.players.map((player) => {
            const role = ROLES.find((r) => r.id === player.role);
            const isCurrentTurn = isActive && activeRole === player.role;

            return (
              <motion.div
                layout
                key={player._id}
                className={`flex items-center gap-3 rounded-xl p-2.5 transition-all ${
                  isCurrentTurn
                    ? `bg-white/[0.08] ring-1 ${colors.ring}`
                    : player.hasRecorded
                      ? "bg-emerald-500/[0.06]"
                      : "bg-white/[0.02]"
                }`}
              >
                {/* Avatar - bigger for game feel */}
                <div className={`relative h-12 w-12 shrink-0 overflow-hidden rounded-full ring-2 ${
                  isCurrentTurn ? colors.ring : player.hasRecorded ? "ring-emerald-500/40" : "ring-white/[0.06]"
                }`}>
                  <Image
                    src={player.avatarUrl}
                    alt={player.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  {isEditable && onPlayerNameChange ? (
                    <EditableName
                      value={player.name}
                      onChange={(name) => onPlayerNameChange(player._id, name)}
                      className="font-bold text-white"
                      suffix={<Pencil size={12} strokeWidth={2.5} className="shrink-0 text-white/30" />}
                    />
                  ) : (
                    <p className="truncate font-bold text-white">{player.name}</p>
                  )}
                  {player.recordingUrl && (
                    <div className="mt-1.5">
                      <PlayerAudioPreview recordingUrl={player.recordingUrl} teamIndex={teamIndex} />
                    </div>
                  )}
                  <div className={`flex items-center gap-1.5 text-xs text-white/40 ${player.recordingUrl ? "mt-1" : ""}`}>
                    {role && <role.Icon size={12} strokeWidth={2.5} className={colors.color} />}
                    <span className="truncate">{role?.label}</span>
                    {player.hasRecorded && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 400, damping: 15 }}
                      >
                        <Check size={12} strokeWidth={2.5} className="text-emerald-400" />
                      </motion.div>
                    )}
                  </div>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

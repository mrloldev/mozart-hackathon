"use client";

import { Play, Stop, Trophy } from "@phosphor-icons/react";
import Image from "next/image";
import { useCallback, useRef, useState } from "react";
import { motion } from "framer-motion";
import { TEAM_COLORS } from "@/constants/game";
import { mixTrackUrls } from "@/lib/audio-mix";
import StaticWaveform from "@/components/static-waveform";
import type { Id } from "../../convex/_generated/dataModel";

interface TeamPlayer {
  _id: Id<"players">;
  name: string;
  avatarUrl: string;
  role: "beat" | "melody" | "vocals";
  recordingUrl?: string | null;
}

interface Team {
  _id: Id<"teams">;
  name: string;
  players: TeamPlayer[];
  trackUrls?: (string | null)[];
  hasInstrumental?: boolean;
  combinedMixUrl?: string | null;
}

interface RoomSong {
  lyrics: string;
  audioUrl?: string | null;
}

interface Room {
  teams: Team[];
  song?: RoomSong | null;
}

const ROLE_LABELS: Record<string, string> = {
  beat: "Beat",
  melody: "Melody",
  vocals: "Vocals",
};

const ROLE_ORDER: ("beat" | "melody" | "vocals")[] = ["beat", "melody", "vocals"];

function getTrackUrls(players: TeamPlayer[]): (string | null)[] {
  return ROLE_ORDER.map(
    (role) => players.find((p) => p.role === role)?.recordingUrl ?? null
  );
}

function getUrlsForTeam(team: Team): (string | null)[] {
  if (team.trackUrls?.some((u) => u != null && u.length > 0)) return team.trackUrls!;
  return getTrackUrls(team.players);
}

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

function MiniPlayer({
  label,
  color,
  isPlaying,
  progress,
  duration,
  onToggle,
}: {
  label: string;
  color: string;
  isPlaying: boolean;
  progress: number;
  duration: number;
  onToggle: () => void;
}) {
  return (
    <button
      onClick={onToggle}
      className="flex w-full items-center gap-3 rounded-lg border border-white/6 bg-white/[0.03] p-3 transition-all hover:bg-white/[0.06] active:scale-[0.98]"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all ${
          isPlaying ? "bg-white/15 text-white" : `${color} text-white`
        }`}
      >
        {isPlaying ? <Stop size={16} weight="fill" /> : <Play size={16} weight="fill" />}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-white">{label}</span>
          {duration > 0 && (
            <span className="text-[10px] font-medium tabular-nums text-white/30">
              {isPlaying ? formatTime(progress) : formatTime(duration)} 
            </span>
          )}
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className={`h-full rounded-full transition-all duration-300 ease-linear ${color}`}
            style={{ width: `${isPlaying && duration > 0 ? (progress / duration) * 100 : 0}%` }}
          />
        </div>
      </div>
    </button>
  );
}

export default function ResultsView({
  room,
  teamId,
  voteTally,
  audienceCount,
}: {
  room: Room;
  teamId?: Id<"teams"> | null;
  voteTally?: Record<string, number>;
  audienceCount?: number;
}) {
  const [playingKey, setPlayingKey] = useState<string | null>(null);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const stopAll = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    audioRef.current?.pause();
    audioRef.current = null;
    setPlayingKey(null);
    setProgress(0);
    setDuration(0);
  }, []);

  const startProgressTracking = useCallback((audio: HTMLAudioElement) => {
    const tick = () => {
      setProgress(audio.currentTime);
      setDuration(audio.duration || 0);
      if (!audio.paused) rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);
  }, []);

  const handlePlayCombined = useCallback(
    async (team: Team) => {
      const key = `combined-${team._id}`;
      if (playingKey === key) { stopAll(); return; }
      stopAll();
      setPlayingKey(key);
      try {
        if (team.combinedMixUrl) {
          const audio = new Audio(team.combinedMixUrl);
          audioRef.current = audio;
          audio.onended = stopAll;
          await audio.play();
          startProgressTracking(audio);
        } else {
          const urls = getUrlsForTeam(team);
          if (!urls.some((u) => u != null && u.length > 0)) { stopAll(); return; }
          const blob = await mixTrackUrls(urls);
          if (!blob.size) throw new Error("Empty mix");
          const url = URL.createObjectURL(blob);
          const audio = new Audio(url);
          audioRef.current = audio;
          audio.onended = () => { URL.revokeObjectURL(url); stopAll(); };
          await audio.play();
          startProgressTracking(audio);
        }
      } catch (err) {
        console.error("[ResultsView] Combined mix failed:", err);
        stopAll();
      }
    },
    [playingKey, stopAll, startProgressTracking]
  );

  const handlePlaySolo = useCallback(
    (team: Team, role: "beat" | "melody" | "vocals") => {
      const key = `solo-${team._id}-${role}`;
      if (playingKey === key) { stopAll(); return; }
      stopAll();
      const urls = getUrlsForTeam(team);
      const roleIndex = ROLE_ORDER.indexOf(role);
      const url = urls[roleIndex];
      if (!url?.length) return;
      setPlayingKey(key);
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => stopAll();
      audio.play().then(() => startProgressTracking(audio)).catch((err) => {
        console.error("[ResultsView] Solo play failed:", err);
        stopAll();
      });
    },
    [playingKey, stopAll, startProgressTracking]
  );

  const team0 = room.teams[0];
  const team1 = room.teams[1];
  const votes0 = voteTally && team0 ? (voteTally[team0._id] ?? 0) : 0;
  const votes1 = voteTally && team1 ? (voteTally[team1._id] ?? 0) : 0;
  const total = votes0 + votes1;
  const winnerIndex = votes1 > votes0 ? 1 : 0;

  const sortedTeams = [...room.teams].map((t, i) => ({ team: t, originalIndex: i }));
  if (total > 0) {
    sortedTeams.sort((a, b) => {
      const aVotes = voteTally ? (voteTally[a.team._id] ?? 0) : 0;
      const bVotes = voteTally ? (voteTally[b.team._id] ?? 0) : 0;
      return bVotes - aVotes;
    });
  }

  return (
    <div className="overflow-y-auto">
      <motion.div
        className="mx-auto max-w-4xl space-y-6 px-4 py-6 pb-24"
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.5 }}
      >
        {/* Header — contextual based on win/loss */}
        <div className="text-center">
          {total > 0 && teamId ? (
            (() => {
              const myVotes = voteTally ? (voteTally[teamId] ?? 0) : 0;
              const opponentVotes = total - myVotes;
              const won = myVotes > opponentVotes;
              return (
                <>
                  <h2 className={`text-3xl font-black tracking-tight sm:text-4xl ${won ? "text-cyan-400" : "text-white/60"}`}>
                    {won ? "YOU WON!" : "YOU LOST"}
                  </h2>
                  <p className="mt-1 text-sm text-white/40">
                    {won ? "Your team got the most votes" : "Better luck next round"}
                  </p>
                </>
              );
            })()
          ) : (
            <>
              <h2 className="text-3xl font-black tracking-tight text-white sm:text-4xl">
                ROUND COMPLETE
              </h2>
              <p className="mt-1 text-sm text-white/40">Listen to each team&apos;s creation</p>
            </>
          )}
        </div>

        {/* Vote bar */}
        {total > 0 && team0 && team1 && (
          <motion.div
            className="rounded-xl border border-white/8 bg-white/5 p-4"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            <div className="mb-2 flex items-center justify-between text-sm font-bold">
              <span className="text-cyan-400">{team0.name}</span>
              <span className="text-white/30">{total} votes</span>
              <span className="text-orange-400">{team1.name}</span>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-white/10">
              <div
                className="h-full bg-cyan-500 transition-all duration-700 ease-out"
                style={{ width: `${(votes0 / total) * 100}%` }}
              />
              <div
                className="h-full bg-orange-500 transition-all duration-700 ease-out"
                style={{ width: `${(votes1 / total) * 100}%` }}
              />
            </div>
            <div className="mt-1.5 flex justify-between text-xs font-semibold text-white/40">
              <span>{votes0}</span>
              <span>{votes1}</span>
            </div>
            {audienceCount !== undefined && audienceCount > 0 && (
              <p className="mt-2 text-center text-xs text-white/30">
                {audienceCount} audience members voted
              </p>
            )}
          </motion.div>
        )}

        {/* Team cards — winner first */}
        <div className="grid gap-6 md:grid-cols-2">
          {sortedTeams.map(({ team, originalIndex }, renderIdx) => {
            const colors = TEAM_COLORS[originalIndex] ?? TEAM_COLORS[0];
            const teamVotes = voteTally ? (voteTally[team._id] ?? 0) : 0;
            const isWinner = originalIndex === winnerIndex && total > 0;
            const combinedKey = `combined-${team._id}`;
            const isCombinedPlaying = playingKey === combinedKey;
            const urlsForTeam = team.trackUrls ?? getTrackUrls(team.players);
            const hasTrack = urlsForTeam.some((u) => u != null && u.length > 0);
            const canShowCombinedMix = !!team.combinedMixUrl || (team.hasInstrumental === true && hasTrack);

            return (
              <motion.div
                key={team._id}
                className={`overflow-hidden rounded-xl border ${isWinner ? colors.border : "border-white/8"}`}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: 0.4 + renderIdx * 0.15 }}
              >
                <div className={`${colors.bgColor} px-4 py-3`}>
                  <div className="flex items-center justify-between">
                    <h3 className="text-lg font-black text-white">{team.name}</h3>
                    <div className="flex items-center gap-2">
                      {isWinner && (
                        <span className="flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-0.5 text-xs font-black text-white">
                          <Trophy size={12} weight="fill" />
                          WINNER
                        </span>
                      )}
                      {voteTally && (
                        <span className="text-xs font-semibold text-white/70">
                          {teamVotes} votes
                        </span>
                      )}
                    </div>
                  </div>
                </div>

                <div className="space-y-2 bg-white/[0.03] p-4">
                  <div className="flex items-center gap-2">
                    {team.players.map((player) => (
                      <div key={player._id} className="flex items-center gap-1.5">
                        <div className="relative h-6 w-6 shrink-0 overflow-hidden rounded-full ring-1 ring-white/10">
                          <Image
                            src={player.avatarUrl}
                            alt={player.name}
                            fill
                            className="object-cover"
                            unoptimized
                          />
                        </div>
                        <span className="text-xs text-white/50">{player.name}</span>
                      </div>
                    ))}
                  </div>

                  {hasTrack && (
                    <>
                      {canShowCombinedMix && (
                        <MiniPlayer
                          label="Combined Mix"
                          color={colors.bgColor}
                          isPlaying={isCombinedPlaying}
                          progress={isCombinedPlaying ? progress : 0}
                          duration={isCombinedPlaying ? duration : 0}
                          onToggle={() => handlePlayCombined(team)}
                        />
                      )}
                      <div className="mt-3 space-y-2 rounded-lg border border-white/6 bg-black/20 p-3">
                        <p className="text-[10px] font-semibold uppercase tracking-wider text-white/40">
                          Track record
                        </p>
                        {ROLE_ORDER.map((role) => {
                          const url = urlsForTeam[ROLE_ORDER.indexOf(role)];
                          if (!url) return null;
                          const soloKey = `solo-${team._id}-${role}`;
                          const isSoloPlaying = playingKey === soloKey;
                          const prog =
                            (isCombinedPlaying || isSoloPlaying) && duration > 0
                              ? progress / duration
                              : 0;
                          return (
                            <button
                              key={role}
                              type="button"
                              onClick={() => handlePlaySolo(team, role)}
                              className="flex w-full items-center gap-3 rounded-lg p-2 -m-2 transition-colors hover:bg-white/5 active:scale-[0.99]"
                            >
                              <div
                                className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full transition-colors ${
                                  isSoloPlaying ? "bg-white/15 text-white" : "bg-white/5 text-white/60 hover:bg-white/10"
                                }`}
                              >
                                {isSoloPlaying ? (
                                  <Stop size={12} weight="fill" />
                                ) : (
                                  <Play size={12} weight="fill" />
                                )}
                              </div>
                              <span className="w-14 shrink-0 text-left text-xs font-medium text-white/60">
                                {ROLE_LABELS[role]}
                              </span>
                              <div className="min-w-0 flex-1">
                                <StaticWaveform
                                  url={url}
                                  progress={prog}
                                  height={24}
                                  barColor="rgba(255,255,255,0.25)"
                                  playedColor={
                                    originalIndex === 0
                                      ? "rgba(6,182,212,0.85)"
                                      : "rgba(249,115,22,0.85)"
                                  }
                                />
                              </div>
                            </button>
                          );
                        })}
                      </div>
                    </>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>
      </motion.div>
    </div>
  );
}

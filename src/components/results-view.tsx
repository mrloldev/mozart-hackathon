"use client";

import { Play, Square, Trophy, Crown, Loader2, Home } from "lucide-react";
import Image from "next/image";
import Link from "next/link";
import { useCallback, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
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
  rawTrackUrls?: (string | null)[];
  hasInstrumental?: boolean;
  combinedMixUrl?: string | null;
}

interface Room {
  teams: Team[];
  isPublic?: boolean;
  song?: { lyrics: string; audioUrl?: string | null } | null;
}

const ROLE_LABELS: Record<string, string> = { beat: "Beat", melody: "Melody", vocals: "Vocals" };
const ROLE_ORDER: ("beat" | "melody" | "vocals")[] = ["beat", "melody", "vocals"];

function getTrackUrls(players: TeamPlayer[]): (string | null)[] {
  return ROLE_ORDER.map((role) => players.find((p) => p.role === role)?.recordingUrl ?? null);
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

  const playAudio = useCallback(async (key: string, urlOrFactory: string | (() => Promise<string>)) => {
    if (playingKey === key) { stopAll(); return; }
    stopAll();
    setPlayingKey(key);
    try {
      const url = typeof urlOrFactory === "string" ? urlOrFactory : await urlOrFactory();
      const audio = new Audio(url);
      audioRef.current = audio;
      audio.onended = () => { if (typeof urlOrFactory !== "string") URL.revokeObjectURL(url); stopAll(); };
      await audio.play();
      startProgressTracking(audio);
    } catch (err) {
      console.error("[ResultsView] Playback failed:", err);
      stopAll();
    }
  }, [playingKey, stopAll, startProgressTracking]);

  const handlePlayRaw = useCallback((team: Team) => {
    playAudio(`raw-${team._id}`, async () => {
      const urls = team.rawTrackUrls ?? getUrlsForTeam(team);
      const blob = await mixTrackUrls(urls);
      return URL.createObjectURL(blob);
    });
  }, [playAudio]);

  const handlePlayAI = useCallback((team: Team) => {
    if (team.combinedMixUrl) {
      playAudio(`ai-${team._id}`, team.combinedMixUrl);
    } else {
      playAudio(`ai-${team._id}`, async () => {
        const urls = getUrlsForTeam(team);
        const blob = await mixTrackUrls(urls);
        return URL.createObjectURL(blob);
      });
    }
  }, [playAudio]);

  const handlePlaySolo = useCallback((team: Team, role: "beat" | "melody" | "vocals") => {
    const urls = getUrlsForTeam(team);
    const url = urls[ROLE_ORDER.indexOf(role)];
    if (!url?.length) return;
    playAudio(`solo-${team._id}-${role}`, url);
  }, [playAudio]);

  const isPublic = room.isPublic === true;
  const team0 = room.teams[0];
  const team1 = room.teams[1];
  const votes0 = voteTally && team0 ? (voteTally[team0._id] ?? 0) : 0;
  const votes1 = voteTally && team1 ? (voteTally[team1._id] ?? 0) : 0;
  const total = votes0 + votes1;
  const winnerIndex = votes1 > votes0 ? 1 : 0;
  const bothAIReady = room.teams.length >= 2 && room.teams.every((t) => t.hasInstrumental === true);
  const votingClosed = bothAIReady;

  const sortedTeams = [...room.teams].map((t, i) => ({ team: t, originalIndex: i }));
  if (total > 0) {
    sortedTeams.sort((a, b) => {
      const aVotes = voteTally ? (voteTally[a.team._id] ?? 0) : 0;
      const bVotes = voteTally ? (voteTally[b.team._id] ?? 0) : 0;
      return bVotes - aVotes;
    });
  }

  return (
    <div className="flex min-h-0 min-w-0 flex-1 flex-col items-center overflow-y-auto overflow-x-hidden">
      <div className="w-[70vw] max-w-4xl px-4 py-6 pb-12">

        {/* ═══ DRAMATIC RESULT HEADER ═══ */}
        <motion.div
          className="mb-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {votingClosed && total > 0 && teamId ? (
            (() => {
              const myVotes = voteTally ? (voteTally[teamId] ?? 0) : 0;
              const opponentVotes = total - myVotes;
              const won = myVotes > opponentVotes;
              const tied = myVotes === opponentVotes;

              return (
                <div className="relative overflow-hidden py-4">
                  {won && (
                    <motion.div
                      className="pointer-events-none absolute inset-0 rounded-3xl bg-cyan-400/10"
                      initial={{ opacity: 0.5, scale: 1.2 }}
                      animate={{ opacity: 0, scale: 1.5 }}
                      transition={{ duration: 1 }}
                    />
                  )}

                  <motion.div
                    initial={{ scale: 0, rotate: -15 }}
                    animate={{ scale: 1, rotate: 0 }}
                    transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 10 }}
                    className="mb-4 inline-block"
                  >
                    {won && <Crown size={64} fill="currentColor" strokeWidth={0} className="text-cyan-400 drop-shadow-[0_0_20px_rgba(34,211,238,0.6)]" />}
                    {!won && !tied && <Trophy size={48} fill="currentColor" strokeWidth={0} className="text-white/15" />}
                    {tied && <Trophy size={48} fill="currentColor" strokeWidth={0} className="text-amber-400 drop-shadow-[0_0_16px_rgba(251,191,36,0.5)]" />}
                  </motion.div>

                  <motion.h1
                    className={`font-display text-3xl font-black uppercase leading-none tracking-wide sm:text-5xl sm:tracking-wider ${
                      tied ? "text-amber-300" : won ? "text-cyan-300 text-glow-cyan" : "text-white/40"
                    }`}
                    initial={{ opacity: 0, y: 20, scale: 1.2 }}
                    animate={{ opacity: 1, y: 0, scale: 1 }}
                    transition={{ delay: 0.5, type: "spring", stiffness: 200, damping: 15 }}
                  >
                    {tied ? "TIE!" : won ? "VICTORY" : "DEFEAT"}
                  </motion.h1>

                  <motion.p
                    className="mt-2 text-sm font-medium text-white/25"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ delay: 0.7 }}
                  >
                    {tied ? "Both teams tied" : won ? "Your team dominated" : "Better luck next battle"}
                  </motion.p>
                </div>
              );
            })()
          ) : (
            <div className="py-4">
              <motion.h1
                className="font-display text-3xl font-black uppercase leading-none tracking-wide text-white sm:text-5xl sm:tracking-wider"
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ type: "spring", stiffness: 200, damping: 15 }}
              >
                {votingClosed ? "RESULTS" : "BATTLE OVER"}
              </motion.h1>
              {!votingClosed && !bothAIReady && (
                <motion.div
                  className="mt-3 flex items-center justify-center gap-2"
                  animate={{ opacity: [0.5, 1, 0.5] }}
                  transition={{ duration: 2, repeat: Infinity }}
                >
                  <Loader2 size={14} className="animate-spin text-cyan-400/60" />
                  <span className="text-sm font-bold text-cyan-400/50">
                    Generating AI mixes...
                  </span>
                </motion.div>
              )}
              {!votingClosed && isPublic && (
                <motion.p
                  className="mt-1 text-xs text-white/25"
                  initial={{ opacity: 0 }}
                  animate={{ opacity: 1 }}
                  transition={{ delay: 0.3 }}
                >
                  Audience voting in progress
                </motion.p>
              )}
            </div>
          )}
        </motion.div>

        {/* ═══ VOTE BAR ═══ */}
        {isPublic && (total > 0 || !votingClosed) && team0 && team1 && (
          <motion.div
            className="mb-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.4 }}
          >
            <div className="flex items-end justify-between mb-2">
              <div>
                <span className="font-display text-lg font-black text-cyan-400">{votes0}</span>
                <p className="text-[10px] font-bold uppercase text-white/25">{team0.name}</p>
              </div>
              <span className="text-[10px] font-bold text-white/15">{total} total</span>
              <div className="text-right">
                <span className="font-display text-lg font-black text-orange-400">{votes1}</span>
                <p className="text-[10px] font-bold uppercase text-white/25">{team1.name}</p>
              </div>
            </div>
            <div className="flex h-3 overflow-hidden rounded-full bg-white/4">
              <motion.div
                className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400"
                animate={{ width: `${total > 0 ? (votes0 / total) * 100 : 50}%` }}
                transition={{ duration: 1, ease: [.23, 1, .32, 1] }}
              />
              <motion.div
                className="h-full bg-gradient-to-r from-orange-400 to-orange-500"
                animate={{ width: `${total > 0 ? (votes1 / total) * 100 : 50}%` }}
                transition={{ duration: 1, ease: [.23, 1, .32, 1] }}
              />
            </div>
            {audienceCount !== undefined && audienceCount > 0 && (
              <p className="mt-1.5 text-center text-[10px] text-white/15">{audienceCount} watching</p>
            )}
          </motion.div>
        )}

        {/* ═══ TEAM RESULT CARDS ═══ */}
        <div className="space-y-4 lg:grid lg:grid-cols-2 lg:gap-4 lg:space-y-0">
          {sortedTeams.map(({ team, originalIndex }, renderIdx) => {
            const colors = TEAM_COLORS[originalIndex] ?? TEAM_COLORS[0];
            const teamVotes = voteTally ? (voteTally[team._id] ?? 0) : 0;
            const isWinner = originalIndex === winnerIndex && total > 0;
            const urlsForTeam = team.trackUrls ?? getTrackUrls(team.players);
            const rawUrls = team.rawTrackUrls ?? urlsForTeam;
            const hasTrack = urlsForTeam.some((u) => u != null && u.length > 0);
            const hasRawTracks = rawUrls.some((u) => u != null && u.length > 0);
            const aiMixReady = !!team.combinedMixUrl || (team.hasInstrumental === true && hasTrack);

            return (
              <motion.div
                key={team._id}
                className={`overflow-hidden rounded-2xl ${
                  isWinner
                    ? `ring-2 ${colors.ring} ${colors.glowStrong}`
                    : "ring-1 ring-white/6"
                }`}
                initial={{ opacity: 0, y: 30, scale: 0.95 }}
                animate={{ opacity: 1, y: 0, scale: 1 }}
                transition={{ delay: 0.5 + renderIdx * 0.15, type: "spring", stiffness: 200, damping: 20 }}
              >
                {/* Team banner */}
                <div className={`${colors.bgGradient} px-4 py-3`}>
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex min-w-0 items-center gap-2.5">
                      <div className="flex shrink-0 -space-x-2">
                        {team.players.map((p) => (
                          <div key={p._id} className="relative h-8 w-8 shrink-0 overflow-hidden rounded-full ring-2 ring-white/20">
                            <Image src={p.avatarUrl} alt={p.name} fill className="object-cover" unoptimized />
                          </div>
                        ))}
                      </div>
                      <div className="min-w-0">
                        <h3 className="truncate font-display text-base font-black uppercase tracking-wider text-white">{team.name}</h3>
                        {isPublic && voteTally && (
                          <p className="text-[10px] font-bold text-white/50">{teamVotes} votes</p>
                        )}
                      </div>
                    </div>
                    {isWinner && (
                      <motion.div
                        className="flex h-7 shrink-0 items-center gap-1 rounded-full bg-white/20 px-2.5"
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ delay: 0.8 + renderIdx * 0.15, type: "spring", stiffness: 300, damping: 12 }}
                      >
                        <Trophy size={12} fill="currentColor" strokeWidth={0} className="text-white" />
                        <span className="text-[9px] font-black uppercase tracking-wider text-white">Winner</span>
                      </motion.div>
                    )}
                  </div>
                </div>

                {/* Audio players */}
                <div className={`${colors.bgTint} p-3`}>
                  {hasTrack && (
                    <div className="space-y-2">
                      {/* Main players: Raw + AI */}
                      <div className="grid grid-cols-2 gap-2">
                        {hasRawTracks && (
                          <PlayButton
                            label="Raw Mix"
                            isPlaying={playingKey === `raw-${team._id}`}
                            progress={playingKey === `raw-${team._id}` ? progress : 0}
                            duration={playingKey === `raw-${team._id}` ? duration : 0}
                            colors={colors}
                            onToggle={() => handlePlayRaw(team)}
                          />
                        )}
                        {aiMixReady ? (
                          <PlayButton
                            label="AI Mix"
                            isPlaying={playingKey === `ai-${team._id}`}
                            progress={playingKey === `ai-${team._id}` ? progress : 0}
                            duration={playingKey === `ai-${team._id}` ? duration : 0}
                            colors={colors}
                            onToggle={() => handlePlayAI(team)}
                            accent
                          />
                        ) : (
                          <div className="flex flex-col items-center justify-center gap-1.5 rounded-xl border border-white/6 bg-white/2 p-3">
                            <Loader2 size={20} className="animate-spin text-white/20" />
                            <span className="text-[10px] font-black uppercase tracking-wider text-white/25">
                              AI Mix
                            </span>
                            <span className="text-[8px] font-bold text-white/15">Generating...</span>
                          </div>
                        )}
                      </div>

                      {/* Solo tracks */}
                      <div className="rounded-xl border border-white/4 bg-black/20 p-2.5">
                        <p className="mb-1.5 text-[9px] font-black uppercase tracking-widest text-white/20">
                          Solo tracks
                        </p>
                        <div className="space-y-1">
                          {ROLE_ORDER.map((role) => {
                            const url = urlsForTeam[ROLE_ORDER.indexOf(role)];
                            if (!url) return null;
                            const soloKey = `solo-${team._id}-${role}`;
                            const isSoloPlaying = playingKey === soloKey;
                            const prog = isSoloPlaying && duration > 0 ? progress / duration : 0;
                            return (
                              <button
                                key={role}
                                type="button"
                                onClick={() => handlePlaySolo(team, role)}
                                className="flex w-full items-center gap-2 rounded-lg p-1.5 transition-colors hover:bg-white/4 active:scale-[0.99]"
                              >
                                <div className={`flex h-5 w-5 shrink-0 items-center justify-center rounded-full ${
                                  isSoloPlaying ? "bg-white/15 text-white" : "bg-white/4 text-white/40"
                                }`}>
                                  {isSoloPlaying ? <Square size={8} fill="currentColor" /> : <Play size={8} fill="currentColor" />}
                                </div>
                                <span className="w-10 shrink-0 text-left text-[9px] font-bold uppercase text-white/30">
                                  {ROLE_LABELS[role]}
                                </span>
                                <div className="min-w-0 flex-1">
                                  <StaticWaveform
                                    url={url}
                                    progress={prog}
                                    height={16}
                                    barColor="rgba(255,255,255,0.1)"
                                    playedColor={colors.playedColor}
                                  />
                                </div>
                              </button>
                            );
                          })}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </motion.div>
            );
          })}
        </div>

        {/* Back to home */}
        <motion.div
          className="mt-10 flex justify-center pb-8"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1 }}
        >
          <Link
            href="/"
            className="flex items-center gap-2.5 rounded-full border border-white/10 bg-white/5 px-6 py-3 font-display text-sm font-black uppercase tracking-wider text-white/60 transition-all hover:bg-white/10 hover:text-white active:scale-95"
          >
            <Home size={16} />
            Back to Home
          </Link>
        </motion.div>
      </div>
    </div>
  );
}

function PlayButton({
  label,
  isPlaying,
  progress,
  duration,
  colors,
  onToggle,
  accent,
}: {
  label: string;
  isPlaying: boolean;
  progress: number;
  duration: number;
  colors: (typeof TEAM_COLORS)[0];
  onToggle: () => void;
  accent?: boolean;
}) {
  const p = isPlaying && duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <button
      onClick={onToggle}
      className={`relative flex flex-col items-center gap-1.5 overflow-hidden rounded-xl border p-3 transition-all active:scale-[0.97] ${
        isPlaying
          ? `border-white/15 ${colors.glow}`
          : accent
            ? `${colors.border} bg-white/3 hover:bg-white/5`
            : "border-white/6 bg-white/3 hover:bg-white/5"
      }`}
    >
      <div className={`flex h-9 w-9 items-center justify-center rounded-full ${
        isPlaying ? "bg-white/15 text-white" : `${colors.bgGradient} text-white`
      }`}>
        {isPlaying ? <Square size={16} fill="currentColor" /> : <Play size={16} fill="currentColor" />}
      </div>
      <span className="text-[10px] font-black uppercase tracking-wider text-white/60">{label}</span>
      {duration > 0 && (
        <span className="text-[9px] tabular-nums text-white/20">
          {isPlaying ? formatTime(progress) : formatTime(duration)}
        </span>
      )}
      <div className="absolute bottom-0 left-0 right-0 h-[2px] bg-white/4">
        <motion.div
          className={`h-full ${colors.barColor}`}
          animate={{ width: `${p}%` }}
          transition={{ duration: 0.3 }}
        />
      </div>
    </button>
  );
}

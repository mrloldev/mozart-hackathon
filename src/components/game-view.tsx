"use client";

import { useQuery } from "convex/react";
import { Music, Headphones } from "lucide-react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { api } from "../../convex/_generated/api";
import { ROLES, TEAM_COLORS } from "@/constants/game";
import type { Id } from "../../convex/_generated/dataModel";
import TeamCard from "./team-card";
import RecordingControls from "./recording-controls";
import ResultsView from "./results-view";
import SongPlayer from "./song-player";

interface RoomSong {
  title: string;
  lyrics: string;
  audioUrl?: string | null;
}

interface RoomTeam {
  _id: Id<"teams">;
  name: string;
  teamIndex?: number;
  isConnected?: boolean;
  players: {
    _id: Id<"players">;
    name: string;
    avatarUrl: string;
    role: "beat" | "melody" | "vocals";
    hasRecorded?: boolean;
    recordingUrl?: string | null;
  }[];
}

interface Room {
  _id: Id<"rooms">;
  phase: string;
  currentRoleIndex: number;
  currentTeamTurn: number;
  teams: RoomTeam[];
  song?: RoomSong | null;
  isPublic?: boolean;
}

function SongSection({
  songTitle,
  audioUrl,
  lyrics,
  compact,
}: {
  songTitle: string | null;
  audioUrl: string | null;
  lyrics: string | null;
  compact?: boolean;
}) {
  if (!songTitle && !audioUrl && !lyrics) return null;

  return (
    <div className="overflow-hidden rounded-2xl border border-white/6 bg-white/[0.02]">
      <div className="flex items-center gap-2.5 border-b border-white/5 px-4 py-2">
        <div className="flex h-6 w-6 items-center justify-center rounded-md bg-cyan-500/10">
          <Music size={12} className="text-cyan-400" />
        </div>
        <span className="font-display text-[11px] font-black uppercase tracking-wider text-white/50">
          {songTitle ?? "Song"}
        </span>
        {audioUrl && (
          <div className="ml-auto flex items-center gap-1.5">
            <Headphones size={10} className="text-white/20" />
            <span className="text-[9px] font-bold text-white/15">Listen along</span>
          </div>
        )}
      </div>
      {audioUrl && (
        <div className="border-b border-white/5 px-3 py-2">
          <SongPlayer src={audioUrl} />
        </div>
      )}
      {lyrics && (
        <div className={`overflow-y-auto px-4 py-3 ${compact ? "max-h-[25vh]" : "max-h-[35vh]"}`}>
          <p className={`whitespace-pre-wrap text-center leading-relaxed text-white/40 ${compact ? "text-sm" : "text-base"}`}>
            {lyrics}
          </p>
        </div>
      )}
    </div>
  );
}

export default function GameView({
  room,
  teamId,
  onRecordComplete,
}: {
  room: Room;
  teamId: Id<"teams">;
  onRecordComplete: (playerId: Id<"players">, blob: Blob) => Promise<void>;
}) {
  const audienceCount = useQuery(
    api.audience.getAudienceCount,
    room.isPublic ? { roomId: room._id } : "skip",
  );
  const voteTally = useQuery(
    api.audience.getVoteTally,
    room.isPublic ? { roomId: room._id } : "skip",
  );

  const currentRole = ROLES[room.currentRoleIndex];
  const currentTeam = room.teams[room.currentTeamTurn];
  const isMyTurn = currentTeam?._id === teamId;
  const currentPlayer = currentTeam?.players.find(
    (p) => p.role === currentRole.id,
  );

  const handleRecordingComplete = async (blob: Blob) => {
    if (!currentPlayer) return;
    await onRecordComplete(currentPlayer._id, blob);
  };

  if (room.phase === "results") {
    return (
      <ResultsView
        room={room}
        teamId={teamId}
        voteTally={voteTally}
        audienceCount={audienceCount}
      />
    );
  }

  const myTeam = room.teams.find((t) => t._id === teamId);
  const opponentTeam = room.teams.find((t) => t._id !== teamId);
  const lyrics = room.song?.lyrics ?? null;
  const audioUrl = room.song?.audioUrl ?? null;
  const songTitle = room.song?.title ?? null;
  const myTeamIndex = room.teams.findIndex((t) => t._id === teamId);
  const myColors = TEAM_COLORS[myTeamIndex] ?? TEAM_COLORS[0];
  const opponentIndex = myTeamIndex === 0 ? 1 : 0;
  const opponentColors = TEAM_COLORS[opponentIndex] ?? TEAM_COLORS[1];

  return (
    <div className="flex min-h-0 flex-1 flex-col">
      {/* ═══ MOBILE ═══ */}
      <div className="flex min-h-0 flex-1 flex-col lg:hidden">
        <AnimatePresence mode="wait">
          {isMyTurn && currentPlayer ? (
            <motion.div
              key={`record-${currentRole.id}`}
              className="flex flex-1 flex-col overflow-y-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.25 }}
            >
              {/* ── Song section — TOP ── */}
              <div className="shrink-0 px-1">
                <SongSection songTitle={songTitle} audioUrl={audioUrl} lyrics={lyrics} compact />
              </div>

              {/* ── Your turn + recording — CENTER ── */}
              <div className="flex flex-1 flex-col items-center justify-center py-4">
                {/* Turn banner */}
                <motion.div
                  className={`mb-4 rounded-full ${myColors.bgGradient} px-5 py-1.5 shadow-lg`}
                  initial={{ y: -12, opacity: 0 }}
                  animate={{ y: 0, opacity: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 20 }}
                >
                  <p className="text-center text-[10px] font-black uppercase tracking-[0.25em] text-white/80">
                    Your Turn
                  </p>
                </motion.div>

                {/* Player identity */}
                <motion.div
                  className="mb-1 flex items-center gap-3"
                  initial={{ scale: 0.9, opacity: 0 }}
                  animate={{ scale: 1, opacity: 1 }}
                  transition={{ delay: 0.1 }}
                >
                  <div className={`relative h-16 w-16 overflow-hidden rounded-full ring-[3px] ${myColors.ring} shadow-lg`}>
                    <Image src={currentPlayer.avatarUrl} alt="" fill className="object-cover" unoptimized />
                  </div>
                  <div>
                    <p className="font-display text-xl font-black text-white">{currentPlayer.name}</p>
                    <p className={`flex items-center gap-1.5 text-sm font-bold ${myColors.color}`}>
                      <currentRole.Icon size={14} strokeWidth={2.5} />
                      {currentRole.label}
                    </p>
                  </div>
                </motion.div>

                {/* Giant record button */}
                <RecordingControls
                  player={currentPlayer}
                  teamIndex={myTeamIndex}
                  currentRole={currentRole}
                  onRecordingComplete={handleRecordingComplete}
                />
              </div>
            </motion.div>
          ) : (
            <motion.div
              key={`wait-${currentRole.id}-${currentTeam?._id}`}
              className="flex flex-1 flex-col overflow-y-auto"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
            >
              {/* Song at top for opponent turn too */}
              <div className="shrink-0 px-1">
                <SongSection songTitle={songTitle} audioUrl={audioUrl} lyrics={lyrics} compact />
              </div>

              {/* Opponent recording indicator */}
              <div className="flex flex-1 flex-col items-center justify-center py-6">
                <motion.div
                  className={`${opponentColors.bgGradient} mb-5 inline-block rounded-full px-5 py-1.5 shadow-lg`}
                  initial={{ scale: 0.9 }}
                  animate={{ scale: 1 }}
                >
                  <p className="font-display text-[10px] font-black uppercase tracking-[0.25em] text-white/80">
                    {currentTeam?.name}
                  </p>
                </motion.div>

                {currentTeam?.isConnected === false ? (
                  <div className="py-6">
                    <p className="font-display text-lg font-black text-red-400">Disconnected</p>
                    <p className="mt-1 text-sm text-white/25">Waiting to reconnect...</p>
                  </div>
                ) : (
                  <>
                    {currentPlayer && (
                      <motion.div
                        className={`relative mb-4 h-24 w-24 overflow-hidden rounded-full ring-[3px] ${opponentColors.ring} shadow-lg`}
                        animate={{ scale: [1, 1.04, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Image src={currentPlayer.avatarUrl} alt="" fill className="object-cover" unoptimized />
                        <motion.div
                          className="absolute inset-0 rounded-full border-2 border-red-500/40"
                          animate={{ opacity: [0.3, 0.8, 0.3] }}
                          transition={{ duration: 1.5, repeat: Infinity }}
                        />
                      </motion.div>
                    )}

                    <motion.div
                      className="flex items-center gap-2.5"
                      animate={{ opacity: [0.4, 1, 0.4] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="h-3 w-3 rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]" />
                      <p className="font-display text-lg font-black uppercase tracking-wide text-white">
                        Recording...
                      </p>
                    </motion.div>
                    <p className="mt-2 text-sm font-bold text-white/25">
                      {currentPlayer?.name} · {currentRole.label}
                    </p>

                  </>
                )}
              </div>

              {/* Full-width waveform — subtle animated since we don't have opponent's stream */}
              {currentTeam?.isConnected !== false && (
                <div className="fixed inset-x-0 bottom-[8%] z-40 flex h-[80px] items-end justify-center overflow-hidden">
                  <div className={`absolute inset-0 ${opponentIndex === 0 ? "bg-gradient-to-t from-cyan-500/6 via-transparent to-transparent" : "bg-gradient-to-t from-orange-500/6 via-transparent to-transparent"}`} />
                  <div className="relative flex w-full items-end justify-center gap-[3px] px-2 pb-2">
                    {Array.from({ length: 64 }).map((_, i) => (
                      <motion.div
                        key={i}
                        className={`flex-1 max-w-[5px] rounded-t-full ${opponentColors.barColor} opacity-30`}
                        animate={{ height: [3, 10 + Math.random() * 18, 3] }}
                        transition={{ duration: 0.6 + Math.random() * 0.6, repeat: Infinity, delay: i * 0.03 }}
                      />
                    ))}
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>
      </div>

      {/* ═══ DESKTOP ═══ */}
      <div className="hidden min-h-0 flex-1 gap-6 lg:flex mt-2">
        {/* Left — Song + Lyrics panel */}
        {(lyrics || audioUrl) && (
          <div className="flex min-w-0 flex-1 flex-col overflow-hidden rounded-2xl border border-white/6 bg-white/[0.02]">
            {(songTitle || audioUrl) && (
              <div className="shrink-0 border-b border-white/5 px-6 py-3">
                <div className="flex items-center gap-2.5">
                  <div className="flex h-7 w-7 items-center justify-center rounded-lg bg-cyan-500/10">
                    <Music size={14} className="text-cyan-400" />
                  </div>
                  <span className="font-display text-sm font-black uppercase tracking-wider text-white/60">
                    {songTitle ?? "Song"}
                  </span>
                </div>
                {audioUrl && (
                  <div className="mt-3">
                    <SongPlayer src={audioUrl} />
                  </div>
                )}
              </div>
            )}
            {lyrics && (
              <div className="flex-1 overflow-y-auto px-6 py-5">
                <p className="whitespace-pre-wrap text-lg leading-[1.9] text-white/50">
                  {lyrics}
                </p>
              </div>
            )}
          </div>
        )}

        {/* Right — Teams + Recording */}
        <div className="flex w-[480px] shrink-0 flex-col gap-3">
          {myTeam && (
            <AnimatePresence mode="wait">
              {isMyTurn && currentPlayer ? (
                <motion.div
                  key="my-recording"
                  className={`overflow-hidden rounded-2xl ring-2 ${myColors.ring} ${myColors.glow}`}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                >
                  <div className={`${myColors.bgGradient} px-5 py-3`}>
                    <h3 className="text-center font-display text-base font-black uppercase tracking-wider text-white">
                      {myTeam.name} — Your Turn
                    </h3>
                  </div>
                  <div className={`${myColors.bgTint} px-5 py-4`}>
                    <div className="mb-3 flex items-center justify-center gap-3">
                      <div className={`relative h-12 w-12 overflow-hidden rounded-full ring-2 ${myColors.ring}`}>
                        <Image src={currentPlayer.avatarUrl} alt="" fill className="object-cover" unoptimized />
                      </div>
                      <div>
                        <span className="font-display text-lg font-black text-white">{currentPlayer.name}</span>
                        <p className={`flex items-center gap-1.5 text-xs font-bold ${myColors.color}`}>
                          <currentRole.Icon size={12} strokeWidth={2.5} />
                          {currentRole.label}
                        </p>
                      </div>
                    </div>
                    <RecordingControls
                      player={currentPlayer}
                      teamIndex={myTeamIndex}
                      currentRole={currentRole}
                      onRecordingComplete={handleRecordingComplete}
                    />
                  </div>
                </motion.div>
              ) : (
                <motion.div key="my-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <TeamCard team={myTeam} teamIndex={myTeamIndex} isActive={false} activeRole={currentRole.id} />
                </motion.div>
              )}
            </AnimatePresence>
          )}

          {opponentTeam && (
            <AnimatePresence mode="wait">
              {!isMyTurn ? (
                <motion.div
                  key="opponent-active"
                  className={`overflow-hidden rounded-2xl ring-1 ring-white/8`}
                  initial={{ opacity: 0, scale: 0.96 }}
                  animate={{ opacity: 1, scale: 1 }}
                  transition={{ type: "spring", stiffness: 300, damping: 24 }}
                >
                  <div className={`${opponentColors.bgGradient} px-5 py-3`}>
                    <h3 className="text-center font-display text-base font-black uppercase tracking-wider text-white">{opponentTeam.name}</h3>
                  </div>
                  <div className="flex min-h-[120px] flex-col items-center justify-center bg-white/3 p-5">
                    {currentPlayer && (
                      <motion.div
                        className={`mb-3 h-14 w-14 overflow-hidden rounded-full ring-2 ${opponentColors.ring}`}
                        animate={{ scale: [1, 1.06, 1] }}
                        transition={{ duration: 2, repeat: Infinity }}
                      >
                        <Image src={currentPlayer.avatarUrl} alt="" fill className="object-cover" unoptimized />
                      </motion.div>
                    )}
                    <motion.div
                      className="flex items-center gap-2"
                      animate={{ opacity: [0.5, 1, 0.5] }}
                      transition={{ duration: 2, repeat: Infinity }}
                    >
                      <div className="h-2.5 w-2.5 rounded-full bg-red-500 shadow-[0_0_8px_rgba(239,68,68,0.5)]" />
                      <span className="font-display text-sm font-bold text-white">Recording...</span>
                    </motion.div>
                    <p className="mt-1 text-xs text-white/25">
                      {currentPlayer?.name} · {currentRole.label}
                    </p>
                  </div>
                </motion.div>
              ) : (
                <motion.div key="opponent-card" initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
                  <TeamCard team={opponentTeam} teamIndex={opponentIndex} isActive={false} activeRole={currentRole.id} />
                </motion.div>
              )}
            </AnimatePresence>
          )}
        </div>
      </div>
    </div>
  );
}

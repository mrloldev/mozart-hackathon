"use client";

import { Zap, ArrowRight, Sparkles, Users } from "lucide-react";
import Link from "next/link";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";
import { getRoomSessionForCode } from "@/lib/room-session";
import { ROLES } from "@/constants/game";

type LiveRoom = {
  code: string;
  phase: string;
  isPublic?: boolean;
  createdAt: number;
  currentRoleIndex?: number;
  currentTeamTurn?: number;
  teams?: { name: string; _id: string }[];
};

export default function HomeView({
  songCount = 0,
  liveRooms = [],
  onCreateTeam,
  onJoinRoom,
  onLocalPlay,
  onOpenRules,
}: {
  songCount?: number;
  liveRooms?: LiveRoom[];
  onCreateTeam: () => void;
  onJoinRoom: () => void;
  onLocalPlay: () => void;
  onOpenRules: () => void;
}) {
  const hasSongs = songCount > 0;
  const [sessionHrefs, setSessionHrefs] = useState<Record<string, string>>({});

  useEffect(() => {
    const hrefs: Record<string, string> = {};
    for (const room of liveRooms) {
      const session = getRoomSessionForCode(room.code);
      hrefs[room.code] = session
        ? `/room/${room.code}`
        : room.isPublic
          ? `/watch?code=${room.code}`
          : `/join?code=${room.code}`;
    }
    setSessionHrefs(hrefs);
  }, [liveRooms]);

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-5">
      <div className="w-full max-w-sm lg:max-w-lg">
        {/* Hero — massive game title */}
        <motion.div
          className="mb-10 text-center"
          initial={{ opacity: 0, y: 30, scale: 0.92 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          transition={{ type: "spring", stiffness: 200, damping: 18, delay: 0.05 }}
        >
          <motion.p
            className="mb-3 text-[10px] font-black uppercase tracking-[0.3em] text-cyan-400/70"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.3 }}
          >
            3 vs 3 Music Battle
          </motion.p>
          <h1 className="font-display text-5xl font-black uppercase leading-[0.9] tracking-tight text-white sm:text-6xl">
            Create
            <br />
            <span className="bg-gradient-to-r from-cyan-400 via-cyan-300 to-blue-400 bg-clip-text text-transparent">
              Music
            </span>
          </h1>
          <motion.p
            className="mt-3 text-base font-bold text-white/25"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.4 }}
          >
            Record. Mix. Crush your rivals.
          </motion.p>
        </motion.div>

        {/* Main action buttons */}
        <motion.div
          className="space-y-3"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.15 }}
        >
          {/* Primary: Quick Play */}
          <button
            onClick={onLocalPlay}
            disabled={!hasSongs}
            className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-[1px] transition-all active:scale-[0.97] disabled:opacity-30"
          >
            <div className="relative flex items-center gap-4 rounded-[15px] bg-gradient-to-br from-cyan-500/20 to-blue-600/10 px-5 py-5 backdrop-blur-sm">
              <div className="flex h-14 w-14 shrink-0 items-center justify-center rounded-2xl bg-white/15 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.2)]">
                <Zap size={28} fill="currentColor" />
              </div>
              <div className="flex-1 text-left">
                <p className="font-display text-lg font-black uppercase tracking-wide text-white">
                  Quick Play
                </p>
                <p className="text-sm font-medium text-white/50">
                  {hasSongs ? "Same device · pass & play" : "Add songs in admin first"}
                </p>
              </div>
              <ArrowRight size={20} className="text-white/40 transition-transform group-hover:translate-x-1" />
            </div>
          </button>

          {/* Create + Join side by side */}
          <div className="grid grid-cols-2 gap-3">
            <button
              onClick={onCreateTeam}
              disabled={!hasSongs}
              className="group flex flex-col items-center gap-2.5 rounded-2xl border border-white/10 bg-white/4 px-4 py-5 transition-all hover:border-white/20 hover:bg-white/7 active:scale-[0.97] disabled:opacity-30"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500/20 to-purple-600/10 text-purple-400">
                <Sparkles size={24} />
              </div>
              <div className="text-center">
                <p className="font-display text-sm font-black uppercase tracking-wide text-white">Create</p>
                <p className="mt-0.5 text-[11px] text-white/30">Host a room</p>
              </div>
            </button>

            <button
              onClick={onJoinRoom}
              className="group flex flex-col items-center gap-2.5 rounded-2xl border border-white/10 bg-white/4 px-4 py-5 transition-all hover:border-white/20 hover:bg-white/7 active:scale-[0.97]"
            >
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-orange-600/10 text-orange-400">
                <Users size={24} />
              </div>
              <div className="text-center">
                <p className="font-display text-sm font-black uppercase tracking-wide text-white">Join</p>
                <p className="mt-0.5 text-[11px] text-white/30">Enter a code</p>
              </div>
            </button>
          </div>
        </motion.div>

        {/* Live battles — grid below actions */}
        {liveRooms.length > 0 && (
          <motion.div
            className="mt-6"
            initial={{ opacity: 0, y: 16 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.3 }}
          >
            <div className="mb-3 flex items-center gap-2">
              <div className="flex items-center gap-1.5 rounded-full bg-red-500/15 px-2.5 py-1 shadow-[0_0_8px_rgba(248,113,113,0.15)]">
                <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500 shadow-[0_0_6px_rgba(239,68,68,0.6)]" />
                <span className="text-[9px] font-black uppercase tracking-widest text-red-400">Live</span>
              </div>
              <span className="text-[10px] font-bold text-white/20">
                {liveRooms.length} battle{liveRooms.length > 1 ? "s" : ""} happening now
              </span>
            </div>

            <div className="grid grid-cols-2 gap-2">
              {liveRooms.map((r) => {
                const currentRole = r.currentRoleIndex !== undefined ? ROLES[r.currentRoleIndex] : null;
                const team0 = r.teams?.[0];
                const team1 = r.teams?.[1];
                const isResults = r.phase === "results";

                return (
                  <Link
                    key={r.code}
                    href={sessionHrefs[r.code] ?? (r.isPublic ? `/watch?code=${r.code}` : `/join?code=${r.code}`)}
                    className="group overflow-hidden rounded-2xl border border-white/8 bg-white/3 transition-all hover:border-cyan-400/20 hover:bg-white/5 active:scale-[0.97]"
                  >
                    {/* Mini scoreboard header */}
                    <div className="flex items-center justify-between border-b border-white/5 px-3 py-2">
                      <span className="font-display text-[11px] font-black tracking-widest text-cyan-400">{r.code}</span>
                      <div className="flex items-center gap-1">
                        {!isResults && (
                          <div className="h-1.5 w-1.5 animate-pulse rounded-full bg-red-500 shadow-[0_0_4px_rgba(239,68,68,0.5)]" />
                        )}
                        <span className="text-[9px] font-bold uppercase text-white/25">
                          {isResults ? "Done" : "Playing"}
                        </span>
                      </div>
                    </div>

                    {/* Teams vs display */}
                    <div className="px-3 py-2.5">
                      {team0 && team1 ? (
                        <div className="flex items-center gap-1.5">
                          <span className="flex-1 truncate text-[11px] font-black text-cyan-400/80">{team0.name}</span>
                          <span className="text-[9px] font-bold text-white/15">vs</span>
                          <span className="flex-1 truncate text-right text-[11px] font-black text-orange-400/80">{team1.name}</span>
                        </div>
                      ) : (
                        <p className="text-[11px] font-bold text-white/20">Waiting for teams...</p>
                      )}

                      {/* Current role indicator */}
                      {currentRole && !isResults && (
                        <div className="mt-1.5 flex items-center gap-1.5">
                          <currentRole.Icon size={10} className="text-white/25" />
                          <span className="text-[9px] font-bold text-white/20">
                            {currentRole.label}
                            {r.currentTeamTurn !== undefined && r.teams?.[r.currentTeamTurn] && (
                              <> · {r.teams[r.currentTeamTurn].name}</>
                            )}
                          </span>
                        </div>
                      )}
                    </div>
                  </Link>
                );
              })}
            </div>
          </motion.div>
        )}

        {/* Rules link */}
        <motion.div
          className="mt-8 text-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.5 }}
        >
          <button
            onClick={onOpenRules}
            className="text-xs font-bold uppercase tracking-widest text-white/20 transition-colors hover:text-white/40"
          >
            How to Play
          </button>
        </motion.div>
      </div>
    </div>
  );
}

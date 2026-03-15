"use client";

import { Copy, Share2, Zap } from "lucide-react";
import { QRCodeSVG } from "qrcode.react";
import { useQuery } from "convex/react";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import Image from "next/image";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { Role } from "@/types/game";
import { ROLES, TEAM_COLORS } from "@/constants/game";
import { Button, Badge } from "@/components/ui";
import EditableName from "@/components/editable-name";
import { Pencil } from "lucide-react";

type RoomTeam = {
  _id: Id<"teams">;
  name: string;
  teamIndex?: number;
  isConnected?: boolean;
  players: { _id: Id<"players">; name: string; avatarUrl: string; role: Role; hasRecorded?: boolean }[];
};

type Room = {
  _id?: Id<"rooms">;
  teams: RoomTeam[];
  isPublic?: boolean;
};

export default function WaitingRoomView({
  room,
  roomCode,
  isHost,
  teamId,
  onStartGame,
  onUpdateTeamName,
  onUpdatePlayerName,
}: {
  room: Room;
  roomCode: string;
  isHost: boolean;
  teamId: Id<"teams"> | null;
  onStartGame: () => void;
  onUpdateTeamName: (teamId: Id<"teams">, name: string) => void;
  onUpdatePlayerName: (playerId: Id<"players">, name: string) => void;
}) {
  const [copiedCode, setCopiedCode] = useState(false);
  const [copiedUrl, setCopiedUrl] = useState(false);
  const [copiedAudienceUrl, setCopiedAudienceUrl] = useState(false);
  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}?code=${roomCode}`
      : "";
  const audienceUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/watch?code=${roomCode}`
      : "";

  const audienceCount = useQuery(
    api.audience.getAudienceCount,
    room.isPublic && room._id ? { roomId: room._id } : "skip"
  );

  const copyAudienceUrl = async () => {
    await navigator.clipboard.writeText(audienceUrl);
    setCopiedAudienceUrl(true);
    setTimeout(() => setCopiedAudienceUrl(false), 2000);
  };

  const copyCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopiedUrl(true);
    setTimeout(() => setCopiedUrl(false), 2000);
  };

  const isHostOnly = isHost && teamId === null;
  const myTeam = teamId ? room.teams.find((t) => t._id === teamId) : null;
  const otherTeam = room.teams.find((t) => t._id !== teamId);
  const team1 = room.teams[0];
  const team2 = room.teams[1];
  const isOtherTeamConnected = otherTeam?.isConnected !== false;
  const canStart = room.teams.length === 2 && isHost && isOtherTeamConnected;
  const bothTeamsJoined = room.teams.length === 2;

  const leftTeam = isHostOnly ? team1 : myTeam;
  const rightTeam = isHostOnly ? team2 : otherTeam;

  return (
    <div className="flex flex-1 flex-col">
      {/* VS Split screen — the big moment */}
      <div className="flex flex-1 flex-col items-center justify-center px-4 py-4">
        <div className="w-full max-w-lg lg:max-w-3xl">
          {/* Top: Room code */}
          <motion.div
            className="mb-6 text-center"
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <div className="flex items-center justify-center gap-2">
              {roomCode.split("").map((char, i) => (
                <motion.span
                  key={i}
                  className="font-display inline-flex h-10 w-8 items-center justify-center rounded-lg bg-white/6 text-lg font-black tracking-wider text-cyan-400"
                  initial={{ opacity: 0, rotateX: -90 }}
                  animate={{ opacity: 1, rotateX: 0 }}
                  transition={{ delay: 0.1 + i * 0.05, type: "spring", stiffness: 300 }}
                >
                  {char}
                </motion.span>
              ))}
              <button
                onClick={copyCode}
                className="ml-2 flex h-8 w-8 items-center justify-center rounded-lg bg-white/6 text-white/30 transition-colors hover:bg-white/10 hover:text-white/60 active:scale-95"
              >
                <Copy size={14} strokeWidth={2.5} />
              </button>
            </div>
            <div className="mt-2 flex justify-center gap-2">
              <button onClick={copyUrl} className="text-[10px] font-bold text-white/20 underline decoration-white/10 hover:text-white/40">
                {copiedUrl ? "Copied!" : "Copy join link"}
              </button>
              {room.isPublic && (
                <button onClick={copyAudienceUrl} className="text-[10px] font-bold text-white/20 underline decoration-white/10 hover:text-white/40">
                  {copiedAudienceUrl ? "Copied!" : "Copy watch link"}
                </button>
              )}
            </div>
          </motion.div>

          {/* VS Battle card */}
          <div className="relative">
            {/* Team 1 (left/top) */}
            <motion.div
              className="overflow-hidden rounded-t-3xl"
              initial={{ opacity: 0, x: -30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, type: "spring", stiffness: 200, damping: 20 }}
            >
              {leftTeam ? (
                <TeamPanel
                  team={leftTeam}
                  teamIndex={0}
                  isEditable={!isHostOnly && leftTeam._id === teamId}
                  onTeamNameChange={!isHostOnly ? (name: string) => onUpdateTeamName(leftTeam._id, name) : undefined}
                  onPlayerNameChange={!isHostOnly ? (id: Id<"players">, name: string) => onUpdatePlayerName(id, name) : undefined}
                />
              ) : (
                <EmptyTeamPanel label="Waiting for team..." color="cyan" />
              )}
            </motion.div>

            {/* VS badge — overlapping both panels */}
            <div className="relative z-10 -my-5 flex justify-center">
              <motion.div
                className="flex h-10 w-16 items-center justify-center rounded-full border-2 border-white/15 bg-[#0a0a0e] shadow-[0_0_30px_rgba(0,0,0,0.8)]"
                initial={{ scale: 0, rotate: -20 }}
                animate={{ scale: 1, rotate: 0 }}
                transition={{ delay: 0.4, type: "spring", stiffness: 300, damping: 15 }}
              >
                <span className="font-display text-sm font-black tracking-widest text-white/60">VS</span>
              </motion.div>
            </div>

            {/* Team 2 (right/bottom) */}
            <motion.div
              className="relative overflow-hidden rounded-b-3xl"
              initial={{ opacity: 0, x: 30 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.3, type: "spring", stiffness: 200, damping: 20 }}
            >
              {rightTeam ? (
                <>
                  {rightTeam.isConnected === false && (
                    <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70 backdrop-blur-sm">
                      <div className="text-center">
                        <p className="text-sm font-black text-red-400">Disconnected</p>
                        <p className="text-[10px] text-white/25">Reconnecting...</p>
                      </div>
                    </div>
                  )}
                  <TeamPanel team={rightTeam} teamIndex={1} />
                </>
              ) : (
                <EmptyTeamPanel label="Waiting for opponent..." color="orange" />
              )}
            </motion.div>
          </div>

          {/* QR codes */}
          {isHost && (
            <motion.div
              className="mt-5 flex justify-center gap-4"
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              transition={{ delay: 0.5 }}
            >
              <div className="flex flex-col items-center gap-1.5">
                <div className="rounded-xl bg-white p-2">
                  <QRCodeSVG value={shareUrl} size={72} fgColor="#050507" bgColor="#ffffff" level="M" />
                </div>
                <span className="text-[8px] font-bold uppercase tracking-widest text-white/20">Join</span>
              </div>
              {room.isPublic && (
                <div className="flex flex-col items-center gap-1.5">
                  <div className="rounded-xl bg-white p-2">
                    <QRCodeSVG value={audienceUrl} size={72} fgColor="#050507" bgColor="#ffffff" level="M" />
                  </div>
                  <span className="text-[8px] font-bold uppercase tracking-widest text-white/20">Watch</span>
                  {audienceCount !== undefined && (
                    <span className="text-[9px] font-bold text-cyan-400/50">{audienceCount} watching</span>
                  )}
                </div>
              )}
            </motion.div>
          )}
        </div>
      </div>

      {/* Bottom: Start button or waiting indicator */}
      <div className="shrink-0 px-4 pb-6">
        <AnimatePresence>
          {canStart && (
            <motion.div
              className="mx-auto max-w-sm"
              initial={{ opacity: 0, y: 40 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: 40 }}
              transition={{ type: "spring", stiffness: 300, damping: 20 }}
            >
              <button
                onClick={onStartGame}
                className="group relative w-full overflow-hidden rounded-2xl bg-gradient-to-br from-cyan-500 to-blue-600 p-[1px] active:scale-[0.97]"
              >
                <div className="flex items-center justify-center gap-3 rounded-[15px] bg-gradient-to-br from-cyan-500/20 to-blue-600/10 py-5">
                  <Zap size={28} fill="currentColor" className="text-white" />
                  <span className="font-display text-xl font-black uppercase tracking-wider text-white">
                    Start Battle
                  </span>
                </div>
                <div className="absolute inset-0 animate-game-pulse rounded-2xl" />
              </button>
            </motion.div>
          )}
        </AnimatePresence>

        {!canStart && (
          <motion.div
            className="text-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.6 }}
          >
            {!isHost && bothTeamsJoined ? (
              <p className="text-sm font-bold text-white/25">Waiting for host to start...</p>
            ) : !bothTeamsJoined ? (
              <div className="flex items-center justify-center gap-2">
                <motion.div
                  className="h-1.5 w-1.5 rounded-full bg-white/30"
                  animate={{ opacity: [0.3, 1, 0.3] }}
                  transition={{ duration: 1.5, repeat: Infinity }}
                />
                <p className="text-sm font-bold text-white/25">Share the code to invite your opponent</p>
              </div>
            ) : null}
          </motion.div>
        )}
      </div>
    </div>
  );
}

function TeamPanel({
  team,
  teamIndex,
  isEditable,
  onTeamNameChange,
  onPlayerNameChange,
}: {
  team: RoomTeam;
  teamIndex: number;
  isEditable?: boolean;
  onTeamNameChange?: (name: string) => void;
  onPlayerNameChange?: (playerId: Id<"players">, name: string) => void;
}) {
  const colors = TEAM_COLORS[teamIndex] ?? TEAM_COLORS[0];

  return (
    <div className={`${colors.bgTintStrong} border-y border-white/[0.04]`}>
      {/* Team name */}
      <div className={`${colors.bgGradient} px-5 py-2.5`}>
        {isEditable && onTeamNameChange ? (
          <div className="flex justify-center">
            <EditableName
              value={team.name}
              onChange={onTeamNameChange}
              className="font-display text-center text-lg font-black uppercase tracking-wider text-white"
              suffix={<Pencil size={14} strokeWidth={2.5} className="text-white/50" />}
            />
          </div>
        ) : (
          <h3 className="font-display text-center text-lg font-black uppercase tracking-wider text-white">
            {team.name}
          </h3>
        )}
      </div>

      {/* Player avatars — big, horizontal, game roster style */}
      <div className="flex items-center justify-center gap-3 px-4 py-4">
        {team.players.map((player) => {
          const role = ROLES.find((r) => r.id === player.role);
          return (
            <div key={player._id} className="flex flex-col items-center gap-1.5">
              <div className={`relative h-14 w-14 overflow-hidden rounded-full ring-2 ${colors.ring} sm:h-16 sm:w-16`}>
                <Image src={player.avatarUrl} alt={player.name} fill className="object-cover" unoptimized />
              </div>
              {isEditable && onPlayerNameChange ? (
                <EditableName
                  value={player.name}
                  onChange={(name) => onPlayerNameChange(player._id, name)}
                  className="max-w-[80px] truncate text-center text-[11px] font-bold text-white/70"
                />
              ) : (
                <span className="max-w-[80px] truncate text-[11px] font-bold text-white/70">{player.name}</span>
              )}
              <div className="flex items-center gap-1">
                {role && <role.Icon size={10} strokeWidth={2.5} className={colors.color} />}
                <span className="text-[9px] font-bold text-white/30">{role?.label}</span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function EmptyTeamPanel({ label, color }: { label: string; color: "cyan" | "orange" }) {
  const bg = color === "cyan" ? "bg-cyan-500/[0.03]" : "bg-orange-500/[0.03]";
  const dot = color === "cyan" ? "bg-cyan-500/40" : "bg-orange-500/40";
  return (
    <div className={`flex min-h-[140px] items-center justify-center border-y border-white/[0.04] ${bg}`}>
      <div className="flex flex-col items-center gap-3">
        <motion.div
          className={`h-3 w-3 rounded-full ${dot}`}
          animate={{ scale: [1, 1.3, 1], opacity: [0.4, 0.8, 0.4] }}
          transition={{ duration: 2, repeat: Infinity }}
        />
        <p className="text-sm font-bold text-white/20">{label}</p>
      </div>
    </div>
  );
}

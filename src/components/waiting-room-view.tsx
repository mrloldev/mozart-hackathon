"use client";

import { CaretRight, Copy, ShareNetwork } from "@phosphor-icons/react";
import { QRCodeSVG } from "qrcode.react";
import { useQuery } from "convex/react";
import { useState } from "react";
import { motion } from "framer-motion";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import type { Role } from "@/types/game";
import TeamCard from "./team-card";
import { Button, Badge, Card } from "@/components/ui";

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

  const myTeamIndex = 0;
  const otherTeamIndex = 1;

  return (
    <motion.div 
      className="space-y-8"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <div className="text-center">
        <motion.h2 
          className="font-display text-2xl font-black uppercase tracking-wider text-[var(--foreground)]"
          initial={{ scale: 0.9, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ delay: 0.1 }}
        >
          {bothTeamsJoined ? "Ready to Play" : "Waiting for Opponent"}
        </motion.h2>
        <motion.p 
          className="mt-1 text-[var(--muted-foreground)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.2 }}
        >
          {bothTeamsJoined
            ? isHost
              ? "Start the game when ready"
              : "Waiting for host to start"
            : "Share the code with the other team to join"}
        </motion.p>
      </div>

      {(isHost || !bothTeamsJoined) && (
        <motion.div
          initial={{ opacity: 0, scale: 0.95 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ delay: 0.3 }}
        >
          <Card className="mx-auto max-w-md p-6">
          <p className="mb-3 text-center text-sm font-semibold text-[var(--muted-foreground)]">
            {isHost ? "SHARE – JOIN & WATCH" : "ROOM CODE"}
          </p>
          <div className="flex flex-col items-center gap-4">
            <div className="w-full min-w-0 text-center">
              <p className="text-xs font-semibold text-[var(--muted-foreground)]">CODE</p>
              <div className="mt-1 flex justify-center gap-0.5 overflow-hidden sm:gap-1">
                {roomCode.split("").map((char, i) => (
                  <span
                    key={i}
                    className="font-display inline-block min-w-[1ch] text-3xl font-black tracking-wider text-[var(--accent-primary)] sm:text-4xl md:text-5xl md:tracking-widest"
                  >
                    {char}
                  </span>
                ))}
              </div>
            </div>
            <div className="flex flex-wrap justify-center gap-2">
              <Button
                variant="secondary"
                size="md"
                leftIcon={<Copy size={16} weight="bold" />}
                onClick={copyCode}
              >
                {copiedCode ? "Copied!" : "Copy Code"}
              </Button>
              <Button
                variant="secondary"
                size="md"
                leftIcon={<ShareNetwork size={16} weight="bold" />}
                onClick={copyUrl}
              >
                {copiedUrl ? "Copied!" : "Copy Join URL"}
              </Button>
              {room.isPublic && (
                <Button
                  variant="secondary"
                  size="md"
                  leftIcon={<Copy size={16} weight="bold" />}
                  onClick={copyAudienceUrl}
                >
                  {copiedAudienceUrl ? "Copied!" : "Copy Watch URL"}
                </Button>
              )}
            </div>
            <div className="grid w-full grid-cols-2 gap-4">
              <div className="flex flex-col items-center gap-2">
                <p className="text-xs font-semibold text-[var(--muted-foreground)]">JOIN</p>
                <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-3">
                  <QRCodeSVG value={shareUrl} size={120} fgColor="#070708" bgColor="#ffffff" level="M" />
                </div>
              </div>
              {room.isPublic && (
                <div className="flex flex-col items-center gap-2">
                  <p className="text-xs font-semibold text-[var(--muted-foreground)]">WATCH</p>
                  <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-white p-3">
                    <QRCodeSVG value={audienceUrl} size={120} fgColor="#070708" bgColor="#ffffff" level="M" />
                  </div>
                  {audienceCount !== undefined && (
                    <Badge variant="primary">{audienceCount} watching</Badge>
                  )}
                </div>
              )}
            </div>
            </div>
          </Card>
        </motion.div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {isHostOnly ? (
          <>
            {team1 ? (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                <TeamCard team={team1} teamIndex={0} />
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-[200px] items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--border)]">
                <p className="text-[var(--muted-foreground)]">Waiting for first team...</p>
              </motion.div>
            )}
            {team2 ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="relative">
                {team2.isConnected === false && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[var(--radius-lg)] bg-black/70">
                    <div className="text-center">
                      <p className="text-lg font-bold text-[var(--error)]">Opponent Disconnected</p>
                      <p className="text-sm text-[var(--muted-foreground)]">Waiting for them to reconnect...</p>
                    </div>
                  </div>
                )}
                <TeamCard team={team2} teamIndex={1} />
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-[200px] items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--border)]">
                <p className="text-[var(--muted-foreground)]">Waiting for second team...</p>
              </motion.div>
            )}
          </>
        ) : (
          <>
            {myTeam && (
              <motion.div initial={{ opacity: 0, x: -20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.4 }}>
                <TeamCard
                  team={myTeam}
                  teamIndex={myTeamIndex}
                  isEditable
                  onTeamNameChange={(name) => onUpdateTeamName(myTeam._id, name)}
                  onPlayerNameChange={(playerId, name) =>
                    onUpdatePlayerName(playerId, name)
                  }
                />
              </motion.div>
            )}
            {otherTeam ? (
              <motion.div initial={{ opacity: 0, x: 20 }} animate={{ opacity: 1, x: 0 }} transition={{ delay: 0.5 }} className="relative">
                {otherTeam.isConnected === false && (
                  <div className="absolute inset-0 z-10 flex items-center justify-center rounded-[var(--radius-lg)] bg-black/70">
                    <div className="text-center">
                      <p className="text-lg font-bold text-[var(--error)]">Opponent Disconnected</p>
                      <p className="text-sm text-[var(--muted-foreground)]">Waiting for them to reconnect...</p>
                    </div>
                  </div>
                )}
                <TeamCard team={otherTeam} teamIndex={otherTeamIndex} />
              </motion.div>
            ) : (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex min-h-[200px] items-center justify-center rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--border)]">
                <p className="text-[var(--muted-foreground)]">Waiting for opponent to join...</p>
              </motion.div>
            )}
          </>
        )}
      </div>

      {canStart && (
        <motion.div 
          className="flex justify-center"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.6 }}
        >
          <Button
            size="xl"
            rightIcon={<CaretRight size={24} weight="bold" />}
            onClick={onStartGame}
            className="text-xl"
          >
            START GAME
          </Button>
        </motion.div>
      )}

      {!isHost && room.teams.length === 2 && (
        <motion.div 
          className="text-center text-[var(--muted-foreground)]"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.6 }}
        >
          Waiting for host to start the game...
        </motion.div>
      )}
    </motion.div>
  );
}

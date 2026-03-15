"use client";

import { useQuery } from "convex/react";
import { motion } from "framer-motion";
import { api } from "../../convex/_generated/api";
import { ROLES, TEAM_COLORS } from "@/constants/game";
import type { Id } from "../../convex/_generated/dataModel";
import GameTopBar from "./game-top-bar";
import TeamCard from "./team-card";
import RecordingControls from "./recording-controls";
import ResultsView from "./results-view";

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
  const orderedTeams = myTeam
    ? opponentTeam
      ? [myTeam, opponentTeam]
      : [myTeam]
    : [...room.teams];

  function colorIndexFor(team: RoomTeam): number {
    return team._id === teamId ? 0 : 1;
  }

  const topBar = (
    <GameTopBar
      currentRoleIndex={room.currentRoleIndex}
      audienceCount={room.isPublic ? audienceCount : undefined}
    />
  );

  const lyrics = room.song?.lyrics ?? null;

  const teamsBlock = (
    <div className="grid shrink-0 gap-3 md:grid-cols-1">
      {orderedTeams.map((team) => {
        const cIdx = colorIndexFor(team);
        const isActiveTeam = team._id === currentTeam?._id;
        const colors = TEAM_COLORS[cIdx];

        if (isActiveTeam && isMyTurn && currentPlayer) {
          return (
            <motion.div
              key={`active-${team._id}`}
              className={`overflow-hidden rounded-lg ring-2 ${colors.ring}`}
              layout
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <div className={`${colors.bgColor} px-3 py-1.5`}>
                <h3 className="text-center text-sm font-black text-white">
                  {team.name}
                </h3>
              </div>
              <div className="bg-white/5 px-3 py-2">
                <div className="mb-1 flex items-center justify-center gap-2">
                  <img
                    src={currentPlayer.avatarUrl}
                    alt=""
                    className="h-6 w-6 rounded-full"
                  />
                  <span className="text-sm font-bold text-white">
                    {currentPlayer.name}
                  </span>
                </div>
                <RecordingControls
                  player={currentPlayer}
                  teamIndex={cIdx}
                  currentRole={currentRole}
                  onRecordingComplete={handleRecordingComplete}
                />
              </div>
            </motion.div>
          );
        }

        if (isActiveTeam && !isMyTurn) {
          return (
            <motion.div
              key={`waiting-${team._id}`}
              className={`overflow-hidden rounded-lg ring-2 ${colors.ring}`}
              layout
              initial={{ opacity: 0, scale: 0.97 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ type: "spring", stiffness: 300, damping: 24 }}
            >
              <div className={`${colors.bgColor} px-3 py-1.5`}>
                <h3 className="text-center text-sm font-black text-white">
                  {team.name}
                </h3>
              </div>
              <div className="flex min-h-[80px] flex-col items-center justify-center bg-white/5 p-3">
                {team.isConnected === false ? (
                  <>
                    <p className="text-sm font-bold text-red-400">
                      Disconnected
                    </p>
                    <p className="text-xs text-white/40">
                      Waiting to reconnect...
                    </p>
                  </>
                ) : (
                  <>
                    <p className="text-sm font-bold text-white">
                      Opponent&apos;s Turn
                    </p>
                    <p className="text-xs text-white/40">
                      {currentPlayer?.name} is recording…
                    </p>
                  </>
                )}
              </div>
            </motion.div>
          );
        }

        return (
          <motion.div
            key={`card-${team._id}`}
            layout
            initial={{ opacity: 0, scale: 0.97 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ type: "spring", stiffness: 300, damping: 24 }}
          >
            <TeamCard
              team={team}
              teamIndex={cIdx}
              isActive={false}
              activeRole={currentRole.id}
            />
          </motion.div>
        );
      })}
    </div>
  );

  return (
    <motion.div
      className="flex min-h-0 flex-1 flex-col gap-2"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      {topBar}

      {/* Mobile: stacked */}
      <div className="flex min-h-0 flex-1 flex-col gap-2 md:hidden">
        {lyrics && (
          <motion.div
            className="min-h-0 shrink overflow-y-auto rounded-lg border border-white/8 bg-white/5 p-3"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <p className="whitespace-pre-wrap text-center text-sm leading-relaxed text-white/50">
              {lyrics}
            </p>
          </motion.div>
        )}
        {teamsBlock}
      </div>

      {/* Desktop: side by side — lyrics left, teams right */}
      <div className="hidden min-h-0 flex-1 gap-4 md:flex mt-8">
        {lyrics && (
          <motion.div
            className="flex-1 h-fit overflow-y-auto rounded-lg border border-white/8 bg-white/5 p-4 w-fit"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.15 }}
          >
            <p className="whitespace-pre-wrap text-base leading-relaxed text-white/50 px-0 mx-0 w-fit">
              {lyrics}
            </p>
          </motion.div>
        )}
        <div className="flex w-[420px] shrink-0 flex-col gap-3">
          {teamsBlock}
        </div>
      </div>
    </motion.div>
  );
}

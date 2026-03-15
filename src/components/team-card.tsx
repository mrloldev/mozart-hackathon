"use client";

import { Check, PencilSimple } from "@phosphor-icons/react";
import Image from "next/image";
import { motion } from "framer-motion";
import { ROLES, TEAM_COLORS } from "@/constants/game";
import type { Role } from "@/types/game";
import type { Id } from "@/convex/_generated/dataModel";
import EditableName from "@/components/editable-name";

interface TeamPlayer {
  _id: Id<"players">;
  name: string;
  avatarUrl: string;
  role: Role;
  hasRecorded?: boolean;
}

interface Team {
  _id: Id<"teams">;
  name: string;
  players: TeamPlayer[];
  isConnected?: boolean;
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
      className={`rounded-[var(--radius-lg)] overflow-hidden transition-all ${isActive ? `ring-2 ${colors.ring}` : ""}`}
      layout
    >
      <div className={`${colors.bgColor} px-4 py-2`}>
        {isEditable && onTeamNameChange ? (
          <div className="flex justify-center">
            <EditableName
              value={team.name}
              onChange={onTeamNameChange}
              className="text-center text-lg font-black text-white"
              suffix={<PencilSimple size={16} weight="bold" className="shrink-0 text-white/80" />}
            />
          </div>
        ) : (
          <h3 className="text-center text-lg font-black text-white">{team.name}</h3>
        )}
      </div>

      <div className="bg-[var(--surface)] p-4">
        <div className="flex flex-col gap-2">
          {team.players.map((player) => {
            const role = ROLES.find((r) => r.id === player.role);
            const isCurrentTurn = isActive && activeRole === player.role;

            return (
              <motion.div
                layout
                key={player._id}
                className={`flex items-center gap-3 p-3 transition-all ${
                  isCurrentTurn
                    ? `bg-white/10 ring-1 ${colors.ring}`
                      : player.hasRecorded
                      ? "bg-[var(--success)]/20"
                      : "bg-[var(--surface)]"
                }`}
              >
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
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
                      suffix={<PencilSimple size={14} weight="bold" className="shrink-0 text-white/40" />}
                    />
                  ) : (
                    <p className="truncate font-bold text-white">{player.name}</p>
                  )}
                  <p className="flex items-center gap-1 text-sm text-white/50">
                    {role && <role.Icon size={14} weight="bold" className="text-[var(--accent-primary)]" />}
                    <span className="truncate">{role?.label}</span>
                    {player.hasRecorded && (
                      <motion.div
                        initial={{ scale: 0 }}
                        animate={{ scale: 1 }}
                        transition={{ type: "spring", stiffness: 300, damping: 20 }}
                      >
                        <Check size={14} weight="bold" className="ml-1 text-[var(--success)]" />
                      </motion.div>
                    )}
                  </p>
                </div>
              </motion.div>
            );
          })}
        </div>
      </div>
    </motion.div>
  );
}

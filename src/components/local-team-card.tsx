"use client";

import { Check, PencilSimple } from "@phosphor-icons/react";
import Image from "next/image";
import { ROLES, TEAM_COLORS } from "@/constants/game";
import type { LocalTeam, Role } from "@/types/game";
import EditableName from "@/components/editable-name";

export default function LocalTeamCard({
  team,
  teamIndex,
  isEditable = false,
  activeRole,
  onTeamNameChange,
  onPlayerNameChange,
}: {
  team: LocalTeam;
  teamIndex: number;
  isEditable?: boolean;
  activeRole?: Role;
  onTeamNameChange?: (name: string) => void;
  onPlayerNameChange?: (playerId: string, name: string) => void;
}) {
  const colors = TEAM_COLORS[teamIndex] ?? TEAM_COLORS[0];

  return (
    <div className={`${teamIndex === 0 ? "border-l-4 border-cyan-500" : "border-l-4 border-orange-500"}`}>
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

      <div className="bg-white/5 p-4">
        <div className="flex flex-col gap-2">
          {team.players.map((player) => {
            const role = ROLES.find((r) => r.id === player.role);
            const isCurrentTurn = activeRole === player.role;

            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-3 transition-all ${
                  isCurrentTurn
                    ? "bg-yellow-500/20 ring-1 ring-yellow-400"
                    : player.hasRecorded
                      ? "bg-emerald-500/20"
                      : "bg-white/5"
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
                      onChange={(name) => onPlayerNameChange(player.id, name)}
                      className="font-bold text-white"
                      suffix={<PencilSimple size={14} weight="bold" className="shrink-0 text-white/40" />}
                    />
                  ) : (
                    <p className="truncate font-bold text-white">{player.name}</p>
                  )}
                  <p className="flex items-center gap-1 text-sm text-white/50">
                    {role && <role.Icon size={14} weight="bold" />}
                    <span className="truncate">{role?.label}</span>
                    {player.hasRecorded && (
                      <Check size={14} weight="bold" className="ml-1 text-emerald-400" />
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

"use client";

import { Check, Pencil } from "lucide-react";
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
    <div className="overflow-hidden rounded-2xl ring-1 ring-white/6">
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

      <div className={`${colors.bgTint} p-3`}>
        <div className="flex flex-col gap-2">
          {team.players.map((player) => {
            const role = ROLES.find((r) => r.id === player.role);
            const isCurrentTurn = activeRole === player.role;

            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 rounded-xl p-2.5 transition-all ${
                  isCurrentTurn
                    ? `bg-white/8 ring-1 ${colors.ring}`
                    : player.hasRecorded
                      ? "bg-emerald-500/6"
                      : "bg-white/2"
                }`}
              >
                <div className={`relative h-11 w-11 shrink-0 overflow-hidden rounded-full ring-2 ${
                  isCurrentTurn ? colors.ring : player.hasRecorded ? "ring-emerald-500/40" : "ring-white/6"
                }`}>
                  <Image src={player.avatarUrl} alt={player.name} fill className="object-cover" unoptimized />
                </div>
                <div className="min-w-0 flex-1">
                  {isEditable && onPlayerNameChange ? (
                    <EditableName
                      value={player.name}
                      onChange={(name) => onPlayerNameChange(player.id, name)}
                      className="font-bold text-white"
                      suffix={<Pencil size={12} strokeWidth={2.5} className="shrink-0 text-white/25" />}
                    />
                  ) : (
                    <p className="truncate font-bold text-white">{player.name}</p>
                  )}
                  <p className="flex items-center gap-1.5 text-xs text-white/40">
                    {role && <role.Icon size={12} strokeWidth={2.5} className={colors.color} />}
                    <span className="truncate">{role?.label}</span>
                    {player.hasRecorded && <Check size={12} strokeWidth={2.5} className="text-emerald-400" />}
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

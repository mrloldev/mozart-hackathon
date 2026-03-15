import { Music, Music2, Mic } from "lucide-react";
import { randomAvatar } from "@/lib/avataaars";
import { randomTeamName, randomPlayerName } from "@/lib/names";
import type { Role } from "@/types/game";
import type { LocalTeam } from "@/types/game";

export const ROLES: {
  id: Role;
  label: string;
  Icon: React.ComponentType<{
    size?: number;
    strokeWidth?: number;
    className?: string;
  }>;
  description: string;
}[] = [
  { id: "beat", label: "Beat Maker", Icon: Music, description: "Create the rhythm" },
  { id: "melody", label: "Melody", Icon: Music2, description: "Add the melody" },
  { id: "vocals", label: "Singer", Icon: Mic, description: "Record vocals" },
];

export const TEAM_COLORS = [
  {
    color: "text-cyan-300",
    bgColor: "bg-cyan-600",
    bgGradient: "bg-gradient-to-br from-cyan-500 to-cyan-700",
    ring: "ring-cyan-400/60",
    border: "border-cyan-400/30",
    glow: "shadow-[0_0_24px_rgba(34,211,238,0.25)]",
    glowStrong: "shadow-[0_0_50px_rgba(34,211,238,0.35)]",
    pulseClass: "animate-game-pulse",
    textGlow: "text-glow-cyan",
    bgTint: "bg-cyan-500/[0.06]",
    bgTintStrong: "bg-cyan-500/[0.12]",
    barColor: "bg-cyan-400",
    playedColor: "rgba(34,211,238,0.85)",
  },
  {
    color: "text-orange-300",
    bgColor: "bg-orange-600",
    bgGradient: "bg-gradient-to-br from-orange-500 to-orange-700",
    ring: "ring-orange-400/60",
    border: "border-orange-400/30",
    glow: "shadow-[0_0_24px_rgba(251,146,60,0.25)]",
    glowStrong: "shadow-[0_0_50px_rgba(251,146,60,0.35)]",
    pulseClass: "animate-game-pulse-orange",
    textGlow: "text-glow-orange",
    bgTint: "bg-orange-500/[0.06]",
    bgTintStrong: "bg-orange-500/[0.12]",
    barColor: "bg-orange-400",
    playedColor: "rgba(251,146,60,0.85)",
  },
];

export const MAX_RECORDING_TIME = 15;

export const ROLE_CHALLENGE: Record<Role, string> = {
  beat: "Drop the beat that crushes the competition.",
  melody: "Craft the melody that steals the show.",
  vocals: "Sing the verse that wins the battle.",
};

function shuffleRoles(): Role[] {
  const roles: Role[] = ["beat", "melody", "vocals"];
  for (let i = roles.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [roles[i], roles[j]] = [roles[j], roles[i]];
  }
  return roles;
}

export function createDefaultPlayers(): { name: string; avatarUrl: string; role: Role }[] {
  const seed = Math.random().toString(36).slice(2);
  const roles = shuffleRoles();
  return [
    { name: randomPlayerName(), avatarUrl: randomAvatar(`${seed}-1`), role: roles[0] },
    { name: randomPlayerName(), avatarUrl: randomAvatar(`${seed}-2`), role: roles[1] },
    { name: randomPlayerName(), avatarUrl: randomAvatar(`${seed}-3`), role: roles[2] },
  ];
}

export function createLocalTeams(): LocalTeam[] {
  const roles1 = shuffleRoles();
  const roles2 = shuffleRoles();
  return [
    {
      id: "team1",
      name: randomTeamName(),
      players: [
        { id: "p1", name: randomPlayerName(), avatarUrl: randomAvatar("p1"), role: roles1[0], hasRecorded: false },
        { id: "p2", name: randomPlayerName(), avatarUrl: randomAvatar("p2"), role: roles1[1], hasRecorded: false },
        { id: "p3", name: randomPlayerName(), avatarUrl: randomAvatar("p3"), role: roles1[2], hasRecorded: false },
      ],
    },
    {
      id: "team2",
      name: randomTeamName(),
      players: [
        { id: "p4", name: randomPlayerName(), avatarUrl: randomAvatar("p4"), role: roles2[0], hasRecorded: false },
        { id: "p5", name: randomPlayerName(), avatarUrl: randomAvatar("p5"), role: roles2[1], hasRecorded: false },
        { id: "p6", name: randomPlayerName(), avatarUrl: randomAvatar("p6"), role: roles2[2], hasRecorded: false },
      ],
    },
  ];
}

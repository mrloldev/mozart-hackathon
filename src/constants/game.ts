import { MusicNotes, PianoKeys, Microphone } from "@phosphor-icons/react";
import { randomAvatar } from "@/lib/avataaars";
import { randomTeamName, randomPlayerName, randomUniquePlayerNames, randomUniqueTeamNames } from "@/lib/names";
import type { Role } from "@/types/game";
import type { LocalTeam } from "@/types/game";

export const ROLES: {
  id: Role;
  label: string;
  Icon: React.ComponentType<{
    size?: number;
    weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone";
    className?: string;
  }>;
  description: string;
}[] = [
  { id: "beat", label: "Beat Maker", Icon: MusicNotes, description: "Create the rhythm" },
  { id: "melody", label: "Melody", Icon: PianoKeys, description: "Add the melody" },
  { id: "vocals", label: "Singer", Icon: Microphone, description: "Record vocals" },
];

export const TEAM_COLORS = [
  { color: "text-cyan-400", bgColor: "bg-cyan-600", ring: "ring-cyan-500/60", border: "border-cyan-500/40" },
  { color: "text-orange-400", bgColor: "bg-orange-600", ring: "ring-orange-500/60", border: "border-orange-500/40" },
];

export const MAX_RECORDING_TIME = 30;

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

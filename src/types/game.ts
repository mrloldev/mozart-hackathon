export type Role = "beat" | "melody" | "vocals";

export type AppView =
  | "home"
  | "create-team"
  | "join-team"
  | "waiting-room"
  | "game"
  | "local-game";

export type GameMode = "online" | "local";

export interface LocalPlayer {
  id: string;
  name: string;
  avatarUrl: string;
  role: Role;
  hasRecorded: boolean;
}

export interface LocalTeam {
  id: string;
  name: string;
  players: LocalPlayer[];
}

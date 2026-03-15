"use client";

import { CaretRight } from "@phosphor-icons/react";
import { useState } from "react";
import type { LocalTeam } from "@/types/game";
import LocalTeamCard from "./local-team-card";

export default function LocalGameView({
  teams,
  setTeams,
  onStartBattle,
  onBack,
}: {
  teams: LocalTeam[];
  setTeams: React.Dispatch<React.SetStateAction<LocalTeam[]>>;
  onStartBattle: () => Promise<void>;
  onBack: () => void;
}) {
  const [starting, setStarting] = useState(false);

  const handleUpdateTeamName = (teamId: string, name: string) => {
    setTeams((prev) => prev.map((t) => (t.id === teamId ? { ...t, name } : t)));
  };

  const handleUpdatePlayerName = (playerId: string, name: string) => {
    setTeams((prev) =>
      prev.map((team) => ({
        ...team,
        players: team.players.map((p) => (p.id === playerId ? { ...p, name } : p)),
      }))
    );
  };

  const handleStart = async () => {
    setStarting(true);
    try {
      await onStartBattle();
    } finally {
      setStarting(false);
    }
  };

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-black uppercase tracking-wider text-white">
          Local Battle Setup
        </h2>
        <p className="mt-1 text-white/50">
          Both teams on one screen — pass the phone each turn
        </p>
      </div>

      <div className="grid gap-6 md:grid-cols-2">
        {teams.map((team, index) => (
          <LocalTeamCard
            key={team.id}
            team={team}
            teamIndex={index}
            isEditable
            onTeamNameChange={(name) => handleUpdateTeamName(team.id, name)}
            onPlayerNameChange={(playerId, name) => handleUpdatePlayerName(playerId, name)}
          />
        ))}
      </div>

      <div className="flex flex-col items-center gap-4">
        <button
          onClick={handleStart}
          disabled={starting}
          className="flex items-center gap-3 bg-cyan-500 px-12 py-4 text-xl font-black text-white transition-colors hover:bg-cyan-400 disabled:opacity-60"
        >
          <CaretRight size={24} weight="bold" />
          {starting ? "STARTING…" : "START BATTLE"}
        </button>
        <button
          onClick={onBack}
          className="text-sm font-bold text-white/50 hover:text-white/80"
        >
          Back to Menu
        </button>
      </div>
    </div>
  );
}

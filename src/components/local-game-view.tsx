"use client";

import { Zap } from "lucide-react";
import { useState } from "react";
import { motion } from "framer-motion";
import type { LocalTeam } from "@/types/game";
import LocalTeamCard from "./local-team-card";
import { Button } from "@/components/ui";

export default function LocalGameView({
  teams,
  setTeams,
  onStartBattle,
}: {
  teams: LocalTeam[];
  setTeams: React.Dispatch<React.SetStateAction<LocalTeam[]>>;
  onStartBattle: () => Promise<void>;
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
    <motion.div
      className="mx-auto max-w-lg space-y-6 lg:max-w-3xl"
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
    >
      <div className="text-center">
        <h2 className="font-display text-xl font-black uppercase tracking-wider text-white">
          Local Battle
        </h2>
        <p className="mt-1 text-sm text-white/35">
          Both teams on one screen — pass the phone each turn
        </p>
      </div>

      <div className="space-y-3">
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

      <Button
        size="xl"
        fullWidth
        onClick={handleStart}
        disabled={starting}
        rightIcon={<Zap size={24} fill="currentColor" />}
        className="animate-game-pulse"
      >
        {starting ? "Starting..." : "Start Battle"}
      </Button>
    </motion.div>
  );
}

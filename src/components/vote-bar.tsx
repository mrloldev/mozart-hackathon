"use client";

import { motion } from "framer-motion";
import type { Id } from "../../convex/_generated/dataModel";
import { Button } from "@/components/ui";

export default function VoteBar({
  team0Name,
  team1Name,
  team0Votes,
  team1Votes,
  team0Id,
  team1Id,
  myVote,
  onVote,
}: {
  team0Name: string;
  team1Name: string;
  team0Votes: number;
  team1Votes: number;
  team0Id?: Id<"teams">;
  team1Id?: Id<"teams">;
  myVote?: Id<"teams"> | null;
  onVote?: (teamId: Id<"teams">) => void;
}) {
  const total = team0Votes + team1Votes;
  const p0 = total > 0 ? (team0Votes / total) * 100 : 50;
  const p1 = total > 0 ? (team1Votes / total) * 100 : 50;
  const canVote = team0Id && team1Id && onVote;

  return (
    <div className="rounded-2xl border border-white/[0.08] bg-white/[0.03] p-4">
      {/* Team names */}
      <div className="mb-2 flex justify-between text-sm font-black uppercase tracking-wide">
        <span className="max-w-[40%] truncate text-cyan-400">{team0Name}</span>
        <span className="text-[10px] font-bold text-white/25 self-center">{total} votes</span>
        <span className="max-w-[40%] truncate text-right text-orange-400">{team1Name}</span>
      </div>

      {/* Vote bar */}
      <div className="flex h-5 overflow-hidden rounded-full bg-white/[0.04]">
        <motion.div
          className="h-full bg-gradient-to-r from-cyan-500 to-cyan-400"
          initial={{ width: "50%" }}
          animate={{ width: `${p0}%` }}
          transition={{ duration: 0.8, ease: [.23, 1, .32, 1] }}
        />
        <motion.div
          className="h-full bg-gradient-to-r from-orange-400 to-orange-500"
          initial={{ width: "50%" }}
          animate={{ width: `${p1}%` }}
          transition={{ duration: 0.8, ease: [.23, 1, .32, 1] }}
        />
      </div>

      {/* Vote counts */}
      <div className="mt-1.5 flex justify-between text-xs font-bold tabular-nums text-white/30">
        <span>{team0Votes}</span>
        <span>{team1Votes}</span>
      </div>

      {/* Vote buttons */}
      {canVote && (
        <div className="mt-4 flex gap-3">
          <Button
            variant={myVote === team0Id ? "team0" : "secondary"}
            size="md"
            fullWidth
            onClick={() => onVote!(team0Id!)}
            className={myVote === team0Id ? "ring-2 ring-cyan-400/50" : ""}
          >
            Vote {team0Name}
          </Button>
          <Button
            variant={myVote === team1Id ? "team1" : "secondary"}
            size="md"
            fullWidth
            onClick={() => onVote!(team1Id!)}
            className={myVote === team1Id ? "ring-2 ring-orange-400/50" : ""}
          >
            Vote {team1Name}
          </Button>
        </div>
      )}
    </div>
  );
}

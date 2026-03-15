"use client";

import type { Id } from "../../convex/_generated/dataModel";
import { Card, Button } from "@/components/ui";

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
    <Card className="p-4">
      <div className="mb-2 flex justify-between text-sm font-semibold">
        <span className="max-w-[45%] truncate text-[var(--accent-primary)]">{team0Name}</span>
        <span className="text-[var(--muted-foreground)]">{total} votes</span>
        <span className="max-w-[45%] truncate text-right text-[var(--accent-secondary)]">{team1Name}</span>
      </div>
      <div className="flex h-4 overflow-hidden rounded-full bg-[var(--surface)]">
        <div
          className="h-full bg-[var(--accent-primary)] transition-all duration-500 ease-out"
          style={{ width: `${p0}%` }}
        />
        <div
          className="h-full bg-[var(--accent-secondary)] transition-all duration-500 ease-out"
          style={{ width: `${p1}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between text-xs text-[var(--muted-foreground)]">
        <span>{team0Votes}</span>
        <span>{team1Votes}</span>
      </div>
      {canVote && (
        <div className="mt-4 flex gap-4">
          <Button
            variant={myVote === team0Id ? "team0" : "secondary"}
            size="md"
            fullWidth
            onClick={() => onVote!(team0Id!)}
            className={myVote === team0Id ? "ring-2 ring-[var(--accent-primary)]" : ""}
          >
            Vote {team0Name}
          </Button>
          <Button
            variant={myVote === team1Id ? "team1" : "secondary"}
            size="md"
            fullWidth
            onClick={() => onVote!(team1Id!)}
            className={myVote === team1Id ? "ring-2 ring-[var(--accent-secondary)]" : ""}
          >
            Vote {team1Name}
          </Button>
        </div>
      )}
    </Card>
  );
}

"use client";

import { GameController, Television } from "@phosphor-icons/react";
import { useMutation } from "convex/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { api } from "../../../convex/_generated/api";
import { createDefaultPlayers } from "@/constants/game";
import { randomTeamName } from "@/lib/names";
import { saveRoomSession } from "@/lib/room-session";
import AppShell from "@/components/app-shell";
import CreateTeamView from "@/components/create-team-view";
import { Button, Card } from "@/components/ui";

export default function CreatePage() {
  const router = useRouter();
  const [hostChoice, setHostChoice] = useState<"playing" | "audience" | null>(null);
  const [teamName, setTeamName] = useState(randomTeamName);
  const [players, setPlayers] = useState(createDefaultPlayers);
  const [isPublic, setIsPublic] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  const createRoom = useMutation(api.rooms.createRoom);

  const handleCreateHostOnly = async () => {
    try {
      const result = await createRoom({
        isHostPlaying: false,
        isClassicMode: true,
        isPublic,
      });
      saveRoomSession({
        code: result.code,
        roomId: result.roomId,
        teamId: result.teamId ?? null,
        isHost: true,
      });
      router.push(`/room/${result.code}`);
    } catch (e) {
      setToast(
        (e as Error).message?.includes("Room not found")
          ? "Room not found. Check the code and try again."
          : "Something went wrong. Please try again."
      );
      setTimeout(() => setToast(null), 3000);
    }
  };

  const handleCreateRoom = async () => {
    try {
      const result = await createRoom({
        isHostPlaying: true,
        teamName,
        isClassicMode: true,
        isPublic,
        players: players.map((p) => ({
          name: p.name,
          avatarUrl: p.avatarUrl,
          role: p.role,
        })),
      });
      saveRoomSession({
        code: result.code,
        roomId: result.roomId,
        teamId: result.teamId ?? null,
        isHost: true,
      });
      router.push(`/room/${result.code}`);
    } catch (e) {
      setToast(
        (e as Error).message?.includes("Room not found")
          ? "Room not found. Check the code and try again."
          : "Something went wrong. Please try again."
      );
      setTimeout(() => setToast(null), 3000);
    }
  };

  if (hostChoice === null) {
    return (
      <AppShell>
        <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-8 md:pb-24">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            ← Back
          </Button>
          <div className="mx-auto mt-8 max-w-md space-y-6 text-center">
            <h2 className="font-display text-2xl font-black uppercase tracking-wider text-[var(--foreground)]">
              How will you play?
            </h2>
            <p className="text-[var(--muted-foreground)]">
              Are you playing on this device, or hosting as audience only?
            </p>
            <div className="grid gap-4 sm:grid-cols-2">
              <Card
                className="cursor-pointer p-6 transition-colors hover:border-[var(--accent-primary)] hover:bg-[var(--surface-hover)]"
                onClick={() => setHostChoice("playing")}
              >
                <GameController size={32} weight="fill" className="mx-auto mb-3 text-[var(--accent-primary)]" />
                <h3 className="font-display font-bold uppercase text-[var(--foreground)]">Create & Play</h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">Create room and join as a team</p>
              </Card>
              <Card
                className="cursor-pointer p-6 transition-colors hover:border-[var(--accent-primary)] hover:bg-[var(--surface-hover)]"
                onClick={() => setHostChoice("audience")}
              >
                <Television size={32} weight="fill" className="mx-auto mb-3 text-[var(--accent-primary)]" />
                <h3 className="font-display font-bold uppercase text-[var(--foreground)]">Host Only</h3>
                <p className="mt-1 text-sm text-[var(--muted-foreground)]">Show QR, manage game, watch</p>
              </Card>
            </div>
          </div>
        </main>
      </AppShell>
    );
  }

  if (hostChoice === "audience") {
    return (
      <AppShell>
        <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-8 md:pb-24">
          <Button variant="ghost" size="sm" onClick={() => setHostChoice(null)}>
            ← Back
          </Button>
          <div className="mx-auto mt-8 max-w-md space-y-6">
            <h2 className="font-display text-2xl font-black uppercase tracking-wider text-[var(--foreground)]">
              Create as host
            </h2>
            <p className="text-[var(--muted-foreground)]">
              You&apos;ll show the QR code for others to join. Audience can watch if the game is public.
            </p>
            <label className="flex cursor-pointer items-center gap-3 rounded-[var(--radius-lg)] bg-[var(--surface)] p-4 transition-colors hover:bg-[var(--surface-hover)]">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-5 w-5 accent-[var(--accent-primary)]"
              />
              <span className="text-sm font-semibold text-[var(--muted)]">Public game (audience can watch and vote)</span>
            </label>
            <Button size="xl" onClick={handleCreateHostOnly} fullWidth>
              CREATE ROOM
            </Button>
          </div>
        </main>

        {toast && (
          <div className="fixed bottom-24 left-4 right-4 z-50 animate-modal-enter sm:bottom-8 sm:left-1/2 sm:right-auto sm:w-auto sm:-translate-x-1/2">
            <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-modal)] px-5 py-3 text-sm font-medium text-[var(--foreground)] shadow-xl">
              {toast}
            </div>
          </div>
        )}
      </AppShell>
    );
  }

  return (
    <AppShell>
      <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-8 md:pb-24">
        <Button variant="ghost" size="sm" onClick={() => setHostChoice(null)}>
          ← Back
        </Button>
        <CreateTeamView
          teamName={teamName}
          setTeamName={setTeamName}
          players={players}
          setPlayers={setPlayers}
          isPublic={isPublic}
          setIsPublic={setIsPublic}
          onBack={() => router.push("/")}
          onSubmit={handleCreateRoom}
          submitLabel="CREATE ROOM"
        />
      </main>

      {toast && (
        <div className="fixed bottom-24 left-4 right-4 z-50 animate-modal-enter sm:bottom-8 sm:left-1/2 sm:right-auto sm:w-auto sm:-translate-x-1/2">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-modal)] px-5 py-3 text-sm font-medium text-[var(--foreground)] shadow-xl">
            {toast}
          </div>
        </div>
      )}
    </AppShell>
  );
}

"use client";

import { Gamepad2, Monitor } from "lucide-react";
import { useMutation } from "convex/react";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "framer-motion";
import { api } from "../../../convex/_generated/api";
import { createDefaultPlayers } from "@/constants/game";
import { randomTeamName } from "@/lib/names";
import { saveRoomSession } from "@/lib/room-session";
import AppShell from "@/components/app-shell";
import CreateTeamView from "@/components/create-team-view";
import { Button } from "@/components/ui";

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

  const ToastOverlay = toast ? (
    <div className="fixed bottom-6 left-4 right-4 z-50 animate-modal-enter sm:left-1/2 sm:right-auto sm:w-auto sm:-translate-x-1/2">
      <div className="rounded-2xl border border-white/8 bg-[#111114] px-4 py-3 text-sm font-bold text-white shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
        {toast}
      </div>
    </div>
  ) : null;

  if (hostChoice === null) {
    return (
      <AppShell minimal>
        <main className="flex flex-1 flex-col px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => router.push("/")}>
            ← Back
          </Button>
          <motion.div
            className="mx-auto mt-6 max-w-md space-y-6 text-center"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="font-display text-xl font-black uppercase tracking-wider text-white">
              How will you play?
            </h2>
            <p className="text-sm text-white/35">
              Are you playing on this device, or hosting as audience only?
            </p>
            <div className="grid gap-3 sm:grid-cols-2">
              <button
                onClick={() => setHostChoice("playing")}
                className="rounded-2xl border-2 border-white/8 bg-white/3 p-6 transition-all hover:border-cyan-400/30 hover:bg-cyan-400/5 active:scale-[0.98]"
              >
                <Gamepad2 size={32} className="mx-auto mb-3 text-cyan-400" />
                <h3 className="font-display font-black uppercase text-white">Create & Play</h3>
                <p className="mt-1 text-sm text-white/35">Create room and join as a team</p>
              </button>
              <button
                onClick={() => setHostChoice("audience")}
                className="rounded-2xl border-2 border-white/8 bg-white/3 p-6 transition-all hover:border-cyan-400/30 hover:bg-cyan-400/5 active:scale-[0.98]"
              >
                <Monitor size={32} className="mx-auto mb-3 text-cyan-400" />
                <h3 className="font-display font-black uppercase text-white">Host Only</h3>
                <p className="mt-1 text-sm text-white/35">Show QR, manage game, watch</p>
              </button>
            </div>
          </motion.div>
        </main>
      </AppShell>
    );
  }

  if (hostChoice === "audience") {
    return (
      <AppShell minimal>
        <main className="flex flex-1 flex-col px-4 py-4">
          <Button variant="ghost" size="sm" onClick={() => setHostChoice(null)}>
            ← Back
          </Button>
          <motion.div
            className="mx-auto mt-6 max-w-md space-y-6"
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
          >
            <h2 className="font-display text-xl font-black uppercase tracking-wider text-white">
              Create as host
            </h2>
            <p className="text-sm text-white/35">
              You&apos;ll show the QR code for others to join.
            </p>
            <label className="flex cursor-pointer items-center gap-3 rounded-xl bg-white/4 p-4 transition-colors hover:bg-white/6">
              <input
                type="checkbox"
                checked={isPublic}
                onChange={(e) => setIsPublic(e.target.checked)}
                className="h-5 w-5 accent-cyan-400"
              />
              <span className="text-sm font-bold text-white/50">Public game (audience can watch & vote)</span>
            </label>
            <Button size="xl" onClick={handleCreateHostOnly} fullWidth>
              Create Room
            </Button>
          </motion.div>
        </main>
        {ToastOverlay}
      </AppShell>
    );
  }

  return (
    <AppShell minimal>
      <main className="flex flex-1 flex-col">
        <CreateTeamView
          teamName={teamName}
          setTeamName={setTeamName}
          players={players}
          setPlayers={setPlayers}
          isPublic={isPublic}
          setIsPublic={setIsPublic}
          onBack={() => setHostChoice(null)}
          onSubmit={handleCreateRoom}
          submitLabel="Create Room"
        />
      </main>
      {ToastOverlay}
    </AppShell>
  );
}

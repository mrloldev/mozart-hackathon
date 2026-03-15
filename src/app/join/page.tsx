"use client";

import { useMutation } from "convex/react";
import { useRouter, useSearchParams } from "next/navigation";
import { Suspense, useEffect, useState } from "react";
import { api } from "../../../convex/_generated/api";
import { createDefaultPlayers } from "@/constants/game";
import { randomTeamName } from "@/lib/names";
import AppShell from "@/components/app-shell";
import CreateTeamView from "@/components/create-team-view";
import { saveRoomSession } from "@/lib/room-session";

function JoinPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const codeFromUrl = searchParams.get("code")?.toUpperCase().slice(0, 6) ?? "";

  const [joinCode, setJoinCode] = useState(codeFromUrl);
  const [teamName, setTeamName] = useState(randomTeamName);
  const [players, setPlayers] = useState(createDefaultPlayers);
  const [toast, setToast] = useState<string | null>(null);

  const joinRoom = useMutation(api.rooms.joinRoom);

  useEffect(() => {
    setJoinCode(codeFromUrl);
  }, [codeFromUrl]);

  useEffect(() => {
    if (codeFromUrl.length === 6 && !joinCode) {
      setJoinCode(codeFromUrl);
    }
  }, [codeFromUrl, joinCode]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const getErrorMessage = (error: unknown): string => {
    const raw = (error as Error).message || "Something went wrong";
    if (raw.includes("Room not found")) return "Room not found. Check the code and try again.";
    if (raw.includes("Room is full")) return "This room is full.";
    if (raw.includes("Game already started")) return "This game has already started.";
    return "Something went wrong. Please try again.";
  };

  const handleJoin = async () => {
    if (joinCode.length < 6) return;
    try {
      const result = await joinRoom({
        code: joinCode.toUpperCase(),
        teamName,
        players: players.map((p) => ({ name: p.name, avatarUrl: p.avatarUrl, role: p.role })),
      });
      saveRoomSession({
        code: joinCode.toUpperCase(),
        roomId: result.roomId,
        teamId: result.teamId,
        isHost: false,
      });
      router.push(`/room/${joinCode.toUpperCase()}`);
    } catch (e) {
      showToast(getErrorMessage(e));
    }
  };

  if (codeFromUrl.length > 0 && codeFromUrl.length < 6) {
    router.replace("/");
    return null;
  }

  return (
    <AppShell showFooter>
      <main className="mx-auto max-w-lg px-4 py-6 pb-24 sm:px-6 sm:py-8">
        <CreateTeamView
          teamName={teamName}
          setTeamName={setTeamName}
          players={players}
          setPlayers={setPlayers}
          onBack={() => router.push("/")}
          onSubmit={handleJoin}
          submitLabel="JOIN ROOM"
          joinCode={joinCode}
          hideBackInStep1
        />
      </main>

      {toast && (
        <div className="fixed bottom-20 left-4 right-4 z-50 animate-modal-enter sm:bottom-6 sm:left-1/2 sm:right-auto sm:w-auto sm:-translate-x-1/2">
          <div className="rounded-[var(--radius-lg)] border border-[var(--border)] bg-[var(--surface-modal)] px-4 py-3 text-sm font-medium text-[var(--foreground)] shadow-xl">
            {toast}
          </div>
        </div>
      )}
    </AppShell>
  );
}

export default function JoinPage() {
  return (
    <Suspense fallback={null}>
      <JoinPageContent />
    </Suspense>
  );
}

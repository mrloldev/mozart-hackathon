"use client";

import { useMutation, useQuery } from "convex/react";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { api } from "../../../convex/_generated/api";
import { Id } from "../../../convex/_generated/dataModel";
import { createLocalTeams } from "@/constants/game";
import { useUploadThing } from "@/utils/uploadthing";
import AppShell from "@/components/app-shell";
import LocalGameView from "@/components/local-game-view";
import GameView from "@/components/game-view";
import { mixBeatAndMelodyBlob } from "@/lib/audio-mix";

export default function LocalPage() {
  const router = useRouter();
  const [localTeams, setLocalTeams] = useState(() => createLocalTeams());
  const [localRoomCode, setLocalRoomCode] = useState<string | null>(null);
  const [localRoomId, setLocalRoomId] = useState<Id<"rooms"> | null>(null);
  const [toast, setToast] = useState<string | null>(null);

  const randomSong = useQuery(api.songs.getRandom);
  const localRoom = useQuery(
    api.rooms.getRoom,
    localRoomCode ? { code: localRoomCode } : "skip"
  );

  const createLocalRoomMut = useMutation(api.rooms.createLocalRoom);
  const recordComplete = useMutation(api.rooms.recordComplete);
  const startInstrumentalGeneration = useMutation(api.workflows.startInstrumentalGeneration);
  const { startUpload } = useUploadThing("audioRecording");

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const handleStartBattle = async () => {
    try {
      const t1 = localTeams[0];
      const t2 = localTeams[1];
      const result = await createLocalRoomMut({
        team1Name: t1.name,
        team1Players: t1.players.map((p) => ({
          name: p.name,
          avatarUrl: p.avatarUrl,
          role: p.role,
        })),
        team2Name: t2.name,
        team2Players: t2.players.map((p) => ({
          name: p.name,
          avatarUrl: p.avatarUrl,
          role: p.role,
        })),
        songId: randomSong?._id,
      });
      setLocalRoomCode(result.code);
      setLocalRoomId(result.roomId);
    } catch {
      showToast("Failed to start local battle.");
    }
  };

  const activeTeamId = localRoom?.teams?.[localRoom.currentTeamTurn]?._id;

  if (localRoom && localRoomId && activeTeamId && (localRoom.phase === "playing" || localRoom.phase === "results")) {
    const makeRecordHandler = (
      activeRoomId: Id<"rooms">,
      activeTeamId: Id<"teams">,
      activeRoom: typeof localRoom
    ) =>
      async (playerId: Id<"players">, blob: Blob) => {
        const player = activeRoom?.teams
          .flatMap((t) => t.players)
          .find((p) => p._id === playerId);
        const role = player?.role;
        try {
          if (role === "melody") {
            const myTeam = activeRoom?.teams.find((t) => t._id === activeTeamId);
            const beatUrl = myTeam?.trackUrls?.[0];
            if (!beatUrl) {
              showToast("Beat not found. Record beat first.");
              return;
            }
            const mixedBlob = await mixBeatAndMelodyBlob(beatUrl, blob);
            const file = new File([mixedBlob], `instrumental-${Date.now()}.wav`, {
              type: "audio/wav",
            });
            const uploadResult = await startUpload([file]);
            const fileUrl = uploadResult?.[0]?.ufsUrl;
            if (!fileUrl) throw new Error("Upload failed");
            await recordComplete({ playerId, roomId: activeRoomId, fileUrl });
            startInstrumentalGeneration({
              roomId: activeRoomId,
              teamId: activeTeamId,
              melodyPlayerId: playerId,
              mixedAudioUrl: fileUrl,
            }).catch(() => {});
          } else {
            const file = new File([blob], `recording-${Date.now()}.webm`, {
              type: blob.type || "audio/webm",
            });
            const uploadResult = await startUpload([file]);
            const fileUrl = uploadResult?.[0]?.ufsUrl;
            if (!fileUrl) throw new Error("Upload failed");
            await recordComplete({ playerId, roomId: activeRoomId, fileUrl });
          }
        } catch {
          showToast("Recording upload failed. Try again.");
        }
      };

    return (
      <AppShell minimal>
        <main className="mx-auto flex flex-1 max-w-6xl flex-col overflow-hidden px-4 py-2 sm:px-6 sm:py-3">
          <GameView
            room={localRoom as Parameters<typeof GameView>[0]["room"]}
            teamId={activeTeamId}
            onRecordComplete={makeRecordHandler(localRoomId, activeTeamId, localRoom)}
          />
        </main>

        {toast && (
          <div className="fixed bottom-6 left-4 right-4 z-50 animate-modal-enter sm:left-1/2 sm:right-auto sm:w-auto sm:-translate-x-1/2">
            <div className="rounded-2xl border border-white/8 bg-[#111114] px-4 py-3 text-sm font-bold text-white shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
              {toast}
            </div>
          </div>
        )}
      </AppShell>
    );
  }

  return (
    <AppShell minimal>
      <main className="flex flex-1 flex-col px-4 py-4">
        <LocalGameView
          teams={localTeams}
          setTeams={setLocalTeams}
          onStartBattle={handleStartBattle}
        />
      </main>

      {toast && (
        <div className="fixed bottom-6 left-4 right-4 z-50 animate-modal-enter sm:left-1/2 sm:right-auto sm:w-auto sm:-translate-x-1/2">
          <div className="rounded-2xl border border-white/8 bg-[#111114] px-4 py-3 text-sm font-bold text-white shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            {toast}
          </div>
        </div>
      )}
    </AppShell>
  );
}

"use client";

import { useMutation, useQuery } from "convex/react";
import { useParams, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { QRCodeSVG } from "qrcode.react";
import { motion } from "framer-motion";
import { api } from "../../../../convex/_generated/api";
import { Id } from "../../../../convex/_generated/dataModel";
import AppShell from "@/components/app-shell";
import WaitingRoomView from "@/components/waiting-room-view";
import GameView from "@/components/game-view";
import GameTopBar from "@/components/game-top-bar";
import TeamCard from "@/components/team-card";
import VoteBar from "@/components/vote-bar";
import ResultsView from "@/components/results-view";
import FloatingEmotes from "@/components/floating-emotes";
import { getRoomSessionForCode } from "@/lib/room-session";
import { useUploadThing } from "@/utils/uploadthing";
import { mixBeatAndMelodyBlob } from "@/lib/audio-mix";
import { ROLES, TEAM_COLORS } from "@/constants/game";
import SongPlayer from "@/components/song-player";

function HostQROverlay({ code, bothTeams }: { code: string; bothTeams: boolean }) {
  const [copied, setCopied] = useState(false);
  const watchUrl = typeof window !== "undefined"
    ? `${window.location.origin}/watch?code=${code}`
    : "";
  const joinUrl = typeof window !== "undefined"
    ? `${window.location.origin}?code=${code}`
    : "";

  const copyWatchUrl = async () => {
    await navigator.clipboard.writeText(watchUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (bothTeams) {
    return (
      <div className="fixed right-0 top-14 z-30">
        <div className="flex flex-col items-center gap-2 rounded-bl-xl rounded-tl-xl border border-r-0 border-white/10 bg-black/60 p-5 backdrop-blur-md">
          <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">WATCH</p>
          <div className="rounded-lg bg-white p-3">
            <QRCodeSVG value={watchUrl} size={170} fgColor="#070708" bgColor="#ffffff" level="M" />
          </div>
          <p className="text-xs font-black tracking-widest text-[var(--accent-primary)]">{code}</p>
          <button
            onClick={copyWatchUrl}
            className="mt-1 rounded-md bg-white/10 px-3 py-1.5 text-[10px] font-bold text-white/70 transition-all hover:bg-white/20 active:scale-95"
          >
            {copied ? "Copied!" : "Copy URL"}
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="mx-auto mb-4 flex max-w-lg items-center justify-center gap-6 rounded-xl border border-white/10 bg-black/40 p-4 backdrop-blur-md">
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">JOIN</p>
        <div className="rounded-lg border border-white/10 bg-white p-2">
          <QRCodeSVG value={joinUrl} size={100} fgColor="#070708" bgColor="#ffffff" level="M" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">CODE</p>
        <p className="font-display text-2xl font-black tracking-widest text-[var(--accent-primary)]">{code}</p>
      </div>
      <div className="flex flex-col items-center gap-1.5">
        <p className="text-[9px] font-bold uppercase tracking-widest text-white/40">WATCH</p>
        <div className="rounded-lg border border-white/10 bg-white p-2">
          <QRCodeSVG value={watchUrl} size={100} fgColor="#070708" bgColor="#ffffff" level="M" />
        </div>
      </div>
    </div>
  );
}

function HostSpectatorView({ room, code }: { room: any; code: string }) {
  const currentRole = ROLES[room.currentRoleIndex];
  const currentTeam = room.teams[room.currentTeamTurn];

  const audienceCount = useQuery(
    api.audience.getAudienceCount,
    room.isPublic && room._id ? { roomId: room._id } : "skip"
  );
  const voteTally = useQuery(
    api.audience.getVoteTally,
    room.isPublic && room._id ? { roomId: room._id } : "skip"
  );

  if (room.phase === "results") {
    return <ResultsView room={room} voteTally={voteTally} audienceCount={audienceCount} />;
  }

  const lyrics = room.song?.lyrics ?? null;
  const audioUrl = room.song?.audioUrl ?? null;

  return (
    <motion.div
      className="mx-auto flex max-w-5xl flex-col gap-5"
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.5 }}
    >
      <GameTopBar
        currentRoleIndex={room.currentRoleIndex}
        currentTeamName={currentTeam?.name}
        audienceCount={audienceCount}
      />

      {room.teams.length >= 2 && (
        <div className="grid gap-4 md:grid-cols-2">
          {room.teams.map((team: any, index: number) => (
            <TeamCard
              key={team._id}
              team={team}
              teamIndex={index}
              isActive={team._id === currentTeam?._id}
              activeRole={currentRole.id}
            />
          ))}
        </div>
      )}

      {voteTally && room.teams.length >= 2 && (
        <VoteBar
          team0Name={room.teams[0].name}
          team1Name={room.teams[1].name}
          team0Votes={voteTally[room.teams[0]._id] ?? 0}
          team1Votes={voteTally[room.teams[1]._id] ?? 0}
        />
      )}

      {(lyrics || audioUrl) && (
        <div className="rounded-lg border border-white/8 bg-white/5 p-4">
          {audioUrl && <SongPlayer src={audioUrl} />}
          {lyrics && (
            <p className={`whitespace-pre-wrap text-sm leading-relaxed text-white/60 md:text-base ${audioUrl ? "mt-4" : ""}`}>
              {lyrics}
            </p>
          )}
        </div>
      )}
    </motion.div>
  );
}

export default function RoomPage() {
  const params = useParams();
  const router = useRouter();
  const code = params.code as string;

  const [toast, setToast] = useState<string | null>(null);
  const [session, setSession] = useState<{
    roomId: Id<"rooms">;
    teamId: Id<"teams"> | null;
    isHost: boolean;
  } | null>(null);

  const room = useQuery(api.rooms.getRoom, code ? { code } : "skip");
  const startGame = useMutation(api.rooms.startGame);
  const updateTeamNameMut = useMutation(api.rooms.updateTeamName);
  const updatePlayerNameMut = useMutation(api.rooms.updatePlayerName);
  const heartbeat = useMutation(api.rooms.heartbeat);
  const leaveRoom = useMutation(api.rooms.leaveRoom);
  const recordComplete = useMutation(api.rooms.recordComplete);
  const startInstrumentalGeneration = useMutation(api.workflows.startInstrumentalGeneration);
  const { startUpload } = useUploadThing("audioRecording");

  useEffect(() => {
    const s = getRoomSessionForCode(code);
    if (s) {
      setSession({ roomId: s.roomId as Id<"rooms">, teamId: s.teamId as Id<"teams"> | null, isHost: s.isHost });
    } else if (room === null) {
      router.replace("/");
    } else if (room !== undefined && !s) {
      setSession(null);
      router.replace(`/join?code=${code}`);
    }
  }, [code, room, router]);

  useEffect(() => {
    if (!session?.teamId) return;
    const teamId = session.teamId;
    heartbeat({ teamId });
    const interval = setInterval(() => heartbeat({ teamId }), 5000);
    const handleBeforeUnload = () => leaveRoom({ teamId });
    window.addEventListener("beforeunload", handleBeforeUnload);
    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      leaveRoom({ teamId });
    };
  }, [session?.teamId, heartbeat, leaveRoom]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 3000);
  };

  const getErrorMessage = (error: unknown): string => {
    const raw = (error as Error).message || "Something went wrong";
    if (raw.includes("Room not found")) return "Room not found.";
    if (raw.includes("Room is full")) return "This room is full.";
    if (raw.includes("Game already started")) return "This game has already started.";
    return "Something went wrong. Please try again.";
  };

  const makeRecordHandler = (
    activeRoomId: Id<"rooms">,
    activeTeamId: Id<"teams">,
    activeRoom: typeof room
  ) =>
    async (playerId: Id<"players">, blob: Blob) => {
      const player = activeRoom?.teams.flatMap((t) => t.players).find((p) => p._id === playerId);
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

  if (!code || room === null) return null;
  if (room === undefined || !session) {
    return (
      <AppShell showFooter>
        <main className="mx-auto max-w-lg px-4 py-16 text-center">
          <p className="text-[var(--muted-foreground)]">Loading room...</p>
          <button
            onClick={() => router.push("/")}
            className="mt-4 text-sm font-semibold text-[var(--accent-primary)]"
          >
            Back to home
          </button>
        </main>
      </AppShell>
    );
  }

  const isHostOnly = session.isHost && session.teamId === null;

  if (room.phase === "results" || room.phase === "playing") {
    if (isHostOnly) {
      return (
        <AppShell showFooter>
          <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-8">
            <HostQROverlay code={code} bothTeams={room.teams.length >= 2} />
            <HostSpectatorView room={room} code={code} />
          </main>
          {room._id && (
            <FloatingEmotes
              roomId={room._id}
              team0Id={room.teams[0]?._id}
              team1Id={room.teams[1]?._id}
              direction="down"
            />
          )}
        </AppShell>
      );
    }
    return (
      <AppShell showFooter={false}>
        <main className="mx-auto flex h-[calc(100dvh-3.5rem)] max-w-6xl flex-col overflow-hidden px-4 py-3 sm:px-6 sm:py-4">
          <GameView
            room={room as Parameters<typeof GameView>[0]["room"]}
            teamId={session.teamId!}
            onRecordComplete={makeRecordHandler(
              session.roomId,
              session.teamId!,
              room
            )}
          />
        </main>

        {room._id && (
          <FloatingEmotes
            roomId={room._id}
            team0Id={room.teams[0]?._id}
            team1Id={room.teams[1]?._id}
            direction="down"
          />
        )}

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

  return (
    <AppShell showFooter>
      <main className="mx-auto max-w-6xl px-4 py-6 pb-24 sm:px-6 sm:py-8">
        <WaitingRoomView
          room={room}
          roomCode={code}
          isHost={session.isHost}
          teamId={session.teamId}
          onStartGame={async () => {
            try {
              await startGame({ roomId: session.roomId });
            } catch (e) {
              showToast(getErrorMessage(e));
            }
          }}
          onUpdateTeamName={(id, name) => updateTeamNameMut({ teamId: id, name })}
          onUpdatePlayerName={(id, name) => updatePlayerNameMut({ playerId: id, name })}
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

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
    <div className="mx-auto mb-4 flex max-w-2xl items-center justify-between rounded-xl border border-white/10 bg-black/40 p-6 backdrop-blur-md">
      <div className="flex flex-col items-center gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">JOIN</p>
        <div className="rounded-lg border border-white/10 bg-white p-3">
          <QRCodeSVG value={joinUrl} size={180} fgColor="#070708" bgColor="#ffffff" level="M" />
        </div>
      </div>
      <div className="flex flex-col items-center gap-1">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">CODE</p>
        <p className="font-display text-3xl font-black tracking-widest text-[var(--accent-primary)]">{code}</p>
      </div>
      <div className="flex flex-col items-center gap-2">
        <p className="text-[10px] font-bold uppercase tracking-widest text-white/40">WATCH</p>
        <div className="rounded-lg border border-white/10 bg-white p-3">
          <QRCodeSVG value={watchUrl} size={180} fgColor="#070708" bgColor="#ffffff" level="M" />
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
      className="mx-auto flex max-w-7xl flex-col gap-5"
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
        <div className="rounded-2xl border border-white/[0.06] bg-white/[0.03] p-4">
          {audioUrl && <SongPlayer src={audioUrl} singlePlay={room.singlePlay} />}
          {lyrics && (
            <p className={`whitespace-pre-wrap text-sm leading-relaxed text-white/40 md:text-base ${audioUrl ? "mt-4" : ""}`}>
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
      <AppShell minimal>
        <main className="flex flex-1 items-center justify-center px-4">
          <div className="text-center">
            <div className="mx-auto mb-4 h-8 w-8 animate-spin rounded-full border-2 border-cyan-400 border-t-transparent" />
            <p className="text-sm text-white/30">Loading room...</p>
            <button
              onClick={() => router.push("/")}
              className="mt-4 text-sm font-bold text-cyan-400/60 transition-colors hover:text-cyan-400"
            >
              Back to home
            </button>
          </div>
        </main>
      </AppShell>
    );
  }

  const isHostOnly = session.isHost && session.teamId === null;

  if (room.phase === "results" || room.phase === "playing") {
    const gameHeaderRight = room.phase === "playing" ? (
      <GameTopBar
        currentRoleIndex={room.currentRoleIndex}
        audienceCount={room.isPublic ? undefined : undefined}
      />
    ) : undefined;

    if (isHostOnly) {
      return (
        <AppShell minimal headerRight={gameHeaderRight}>
          <main className="mx-auto max-w-7xl px-4 py-4 pb-24 sm:px-6">
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
      <AppShell minimal headerRight={gameHeaderRight}>
        <main className="mx-auto flex min-w-0 flex-1 max-w-7xl flex-col overflow-hidden px-4 py-2 sm:px-6 sm:py-3">
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
          <div className="fixed bottom-6 left-4 right-4 z-50 animate-modal-enter sm:left-1/2 sm:right-auto sm:w-auto sm:-translate-x-1/2">
            <div className="rounded-2xl border border-white/[0.08] bg-[#111114] px-4 py-3 text-sm font-bold text-white shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
              {toast}
            </div>
          </div>
        )}
      </AppShell>
    );
  }

  return (
    <AppShell minimal>
      <main className="flex flex-1 flex-col">
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
        <div className="fixed bottom-6 left-4 right-4 z-50 animate-modal-enter sm:left-1/2 sm:right-auto sm:w-auto sm:-translate-x-1/2">
          <div className="rounded-2xl border border-white/[0.08] bg-[#111114] px-4 py-3 text-sm font-bold text-white shadow-[0_4px_24px_rgba(0,0,0,0.5)]">
            {toast}
          </div>
        </div>
      )}
    </AppShell>
  );
}

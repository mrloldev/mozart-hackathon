"use client";

import { useMutation, useQuery } from "convex/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { useSearchParams } from "next/navigation";
import Link from "next/link";
import { SpeakerHigh, SpeakerSlash } from "@phosphor-icons/react";
import { api } from "@/convex/_generated/api";
import type { Id } from "@/convex/_generated/dataModel";
import { ROLES, TEAM_COLORS } from "@/constants/game";
import GameTopBar from "@/components/game-top-bar";
import TeamCard from "@/components/team-card";
import FloatingEmotes from "@/components/floating-emotes";
import VoteBar from "@/components/vote-bar";

const SESSION_KEY = "remix-audience-session";

function getOrCreateSessionId(): string {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = crypto.randomUUID?.() ?? `s${Date.now()}-${Math.random().toString(36).slice(2)}`;
    localStorage.setItem(SESSION_KEY, id);
  }
  return id;
}

const REACTIONS = ["fire", "heart", "clap", "skull", "tomato"] as const;
const REACTION_LABELS: Record<(typeof REACTIONS)[number], string> = {
  fire: "🔥",
  heart: "❤️",
  clap: "👏",
  skull: "💀",
  tomato: "🍅",
};

export default function WatchPage() {
  const searchParams = useSearchParams();
  const code = searchParams.get("code")?.toUpperCase() ?? "";
  const [sessionId, setSessionId] = useState("");
  const [optimisticVote, setOptimisticVote] = useState<Id<"teams"> | null>(null);
  const [muted, setMuted] = useState(false);
  const joinedRef = useRef(false);
  const lastPlayedRef = useRef<string | null>(null);

  useEffect(() => {
    setSessionId(getOrCreateSessionId());
  }, []);

  const joinAsAudience = useMutation(api.audience.joinAsAudience);
  const audienceHeartbeat = useMutation(api.audience.audienceHeartbeat);
  const leaveAudience = useMutation(api.audience.leaveAudience);
  const castVote = useMutation(api.audience.castVote);
  const sendEmote = useMutation(api.audience.sendEmote);

  const roomData = useQuery(
    api.audience.getAudienceRoom,
    code && sessionId ? { code } : "skip"
  );
  const myVote = useQuery(
    api.audience.getMyVote,
    roomData?._id && sessionId ? { sessionId, roomId: roomData._id } : "skip"
  );

  useEffect(() => {
    if (!sessionId || !code) return;
    joinAsAudience({ code, sessionId }).then(() => {
      joinedRef.current = true;
    }).catch(() => {});
  }, [code, sessionId, joinAsAudience]);

  useEffect(() => {
    if (!roomData?._id || !sessionId || !joinedRef.current) return;
    audienceHeartbeat({ sessionId, roomId: roomData._id });
    const interval = setInterval(() => {
      audienceHeartbeat({ sessionId, roomId: roomData._id });
    }, 5000);
    return () => clearInterval(interval);
  }, [roomData?._id, sessionId, audienceHeartbeat]);

  useEffect(() => {
    return () => {
      if (roomData?._id && sessionId) {
        leaveAudience({ sessionId, roomId: roomData._id });
      }
    };
  }, [roomData?._id, sessionId, leaveAudience]);

  useEffect(() => {
    if (myVote !== undefined) setOptimisticVote(null);
  }, [myVote]);

  const handleVote = useCallback(
    (teamId: Id<"teams">) => {
      if (!roomData?._id || !sessionId) return;
      setOptimisticVote(teamId);
      castVote({ sessionId, roomId: roomData._id, teamId });
    },
    [roomData?._id, sessionId, castVote]
  );

  const handleEmote = useCallback(
    (type: (typeof REACTIONS)[number], teamId?: Id<"teams">) => {
      if (!roomData?._id) return;
      sendEmote({ sessionId, roomId: roomData._id, type, teamId });
    },
    [roomData?._id, sessionId, sendEmote]
  );

  const audioRef = useRef<HTMLAudioElement | null>(null);
  const playedRecordingsRef = useRef<Set<string>>(new Set());
  const knownUrlsRef = useRef<Map<string, string>>(new Map());

  useEffect(() => {
    if (audioRef.current) audioRef.current.muted = muted;
  }, [muted]);

  useEffect(() => {
    if (!roomData?.teams) return;
    for (const team of roomData.teams) {
      for (const p of team.players) {
        if (!p.hasRecorded || !p.recordingUrl) continue;

        const playerKey = p._id as string;
        const prevUrl = knownUrlsRef.current.get(playerKey);
        const isFirstRecording = prevUrl === undefined;

        knownUrlsRef.current.set(playerKey, p.recordingUrl);

        if (isFirstRecording && !playedRecordingsRef.current.has(playerKey)) {
          playedRecordingsRef.current.add(playerKey);
          const audio = new Audio(p.recordingUrl);
          audio.muted = muted;
          audioRef.current = audio;
          audio.play().catch(() => {});
          audio.onended = () => { audioRef.current = null; };
          return;
        }
      }
    }
  }, [roomData?.teams, muted]);

  if (!code) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold text-white">No room code</h1>
          <p className="mt-2 text-white/60">Add ?code=XXXXXX to the URL</p>
          <Link href="/" className="mt-4 inline-block text-cyan-400 hover:underline">
            Back to home
          </Link>
        </div>
      </div>
    );
  }

  if (!roomData) {
    return (
      <div className="flex min-h-screen items-center justify-center">
        <div className="text-center">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-cyan-500 border-t-transparent" />
          <p className="mt-4 text-white/60">Loading...</p>
        </div>
      </div>
    );
  }

  const { teams, phase, currentRoleIndex, currentTeamTurn, audienceCount, voteTally, song } =
    roomData;
  const team0 = teams[0];
  const team1 = teams[1];
  const effectiveVote = optimisticVote !== null ? optimisticVote : myVote;
  const currentRole = ROLES[currentRoleIndex];
  const currentTeam = teams[currentTeamTurn];

  return (
    <div className="min-h-screen">
      <header className="sticky top-0 z-30 border-b border-white/10 bg-black/60 px-6 py-4 backdrop-blur-md">
        <div className="mx-auto flex max-w-5xl items-center justify-between">
          <Link href="/" className="text-xl font-black tracking-tight">
            <span className="text-cyan-400">ARKANO</span>
            <span className="ml-2 text-sm font-medium text-cyan-400">LIVE</span>
          </Link>
          <div className="flex items-center gap-3">
            <button
              onClick={() => setMuted((m) => !m)}
              className="flex h-8 w-8 items-center justify-center rounded-full bg-white/10 text-white transition-colors hover:bg-white/20"
              aria-label={muted ? "Unmute" : "Mute"}
            >
              {muted ? <SpeakerSlash size={18} weight="bold" /> : <SpeakerHigh size={18} weight="bold" />}
            </button>
            <span className="rounded-full bg-white/10 px-3 py-1 text-sm font-bold text-white">
              {audienceCount} watching
            </span>
            <span className="text-xl font-black tracking-widest text-cyan-400">{code}</span>
          </div>
        </div>
      </header>

      <main className="mx-auto flex max-w-5xl flex-col gap-5 px-4 py-6 pb-32">
        {phase === "waiting" && (
          <div className="py-16 text-center">
            <h1 className="text-2xl font-black text-white">Waiting for the game to start</h1>
          </div>
        )}

        {phase === "playing" && (
          <>
            <GameTopBar
              currentRoleIndex={currentRoleIndex}
              currentTeamName={currentTeam?.name}
              audienceCount={audienceCount}
            />

            {team0 && team1 && (
              <div className="grid gap-4 md:grid-cols-2">
                {teams.map((team: any, i: number) => (
                  <TeamCard
                    key={team._id}
                    team={team}
                    teamIndex={i}
                    isActive={team._id === currentTeam?._id}
                    activeRole={currentRole.id}
                  />
                ))}
              </div>
            )}

            {team0 && team1 && (
              <VoteBar
                team0Name={team0.name}
                team1Name={team1.name}
                team0Votes={voteTally[team0._id] ?? 0}
                team1Votes={voteTally[team1._id] ?? 0}
                team0Id={team0._id}
                team1Id={team1._id}
                myVote={effectiveVote}
                onVote={sessionId ? handleVote : undefined}
              />
            )}

            {song?.lyrics && (
              <div className="rounded-lg border border-white/8 bg-white/5 p-4">
                <p className="whitespace-pre-wrap text-sm leading-relaxed text-white/60 md:text-base">
                  {song.lyrics}
                </p>
              </div>
            )}
          </>
        )}

        {phase === "results" && (
          <>
            <div className="text-center">
              <h1 className="text-2xl font-black text-white">Round complete!</h1>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              {teams.map((team: any, i: number) => (
                <TeamCard
                  key={team._id}
                  team={team}
                  teamIndex={i}
                  isActive={false}
                  activeRole={currentRole.id}
                />
              ))}
            </div>

            {team0 && team1 && (
              <VoteBar
                team0Name={team0.name}
                team1Name={team1.name}
                team0Votes={voteTally[team0._id] ?? 0}
                team1Votes={voteTally[team1._id] ?? 0}
                team0Id={team0._id}
                team1Id={team1._id}
                myVote={effectiveVote}
                onVote={sessionId ? handleVote : undefined}
              />
            )}
          </>
        )}
      </main>

      {roomData._id && (
        <FloatingEmotes
          roomId={roomData._id}
          team0Id={team0?._id}
          team1Id={team1?._id}
        />
      )}

      {phase !== "waiting" && roomData._id && team0 && team1 && (
        <div className="fixed bottom-0 left-0 right-0 z-40 border-t border-white/10 bg-black/70 px-3 py-3 backdrop-blur-md">
          <div className="mx-auto flex max-w-2xl items-stretch gap-3">
            {/* Team 0 reactions */}
            <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-cyan-500/20 bg-cyan-500/5 px-2 py-1.5">
              <span className="mr-auto truncate text-xs font-bold text-cyan-400">{team0.name}</span>
              {REACTIONS.map((type) => (
                <button
                  key={`t0-${type}`}
                  onClick={() => handleEmote(type, team0._id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg transition-all hover:scale-110 hover:bg-white/20 active:scale-90"
                >
                  {REACTION_LABELS[type]}
                </button>
              ))}
            </div>
            {/* Team 1 reactions */}
            <div className="flex flex-1 items-center gap-1.5 rounded-lg border border-orange-500/20 bg-orange-500/5 px-2 py-1.5">
              <span className="mr-auto truncate text-xs font-bold text-orange-400">{team1.name}</span>
              {REACTIONS.map((type) => (
                <button
                  key={`t1-${type}`}
                  onClick={() => handleEmote(type, team1._id)}
                  className="flex h-9 w-9 items-center justify-center rounded-full bg-white/10 text-lg transition-all hover:scale-110 hover:bg-white/20 active:scale-90"
                >
                  {REACTION_LABELS[type]}
                </button>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

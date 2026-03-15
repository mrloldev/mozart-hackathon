"use client";

import {
  CaretRight,
  Check,
  Copy,
  DeviceMobile,
  Microphone,
  MusicNotes,
  PencilSimple,
  PianoKeys,
  Play,
  ShareNetwork,
  Sparkle,
  Stop,
  Trophy,
  Users,
  X,
} from "@phosphor-icons/react";
import { useMutation, useQuery } from "convex/react";
import Image from "next/image";
import { QRCodeSVG } from "qrcode.react";
import { useCallback, useEffect, useRef, useState } from "react";
import { api } from "../../convex/_generated/api";
import { Id } from "../../convex/_generated/dataModel";
import { randomAvatar } from "@/lib/avataaars";

type Role = "beat" | "melody" | "vocals";
type AppView = "home" | "create-team" | "join-team" | "waiting-room" | "game" | "local-game";
type GameMode = "online" | "local";

const ROLES: {
  id: Role;
  label: string;
  Icon: React.ComponentType<{ size?: number; weight?: "thin" | "light" | "regular" | "bold" | "fill" | "duotone"; className?: string }>;
  description: string;
}[] = [
  { id: "beat", label: "Beat Maker", Icon: MusicNotes, description: "Create the rhythm" },
  { id: "melody", label: "Melody", Icon: PianoKeys, description: "Add the melody" },
  { id: "vocals", label: "Singer", Icon: Microphone, description: "Record vocals" },
];

const TEAM_COLORS = [
  { color: "text-cyan-400", bgColor: "bg-cyan-500" },
  { color: "text-orange-400", bgColor: "bg-orange-500" },
];

const ROLE_CHALLENGE: Record<Role, string> = {
  beat: "Drop the beat that crushes the competition.",
  melody: "Craft the melody that steals the show.",
  vocals: "Sing the verse that wins the battle.",
};

function createDefaultPlayers(): { name: string; avatarUrl: string; role: Role }[] {
  const seed = Math.random().toString(36).slice(2);
  return [
    { name: "Player 1", avatarUrl: randomAvatar(`${seed}-1`), role: "beat" },
    { name: "Player 2", avatarUrl: randomAvatar(`${seed}-2`), role: "melody" },
    { name: "Player 3", avatarUrl: randomAvatar(`${seed}-3`), role: "vocals" },
  ];
}

interface LocalPlayer {
  id: string;
  name: string;
  avatarUrl: string;
  role: Role;
  hasRecorded: boolean;
}

interface LocalTeam {
  id: string;
  name: string;
  players: LocalPlayer[];
}

function createLocalTeams(): LocalTeam[] {
  return [
    {
      id: "team1",
      name: "Team Neon",
      players: [
        { id: "p1", name: "Player 1", avatarUrl: randomAvatar("p1"), role: "beat", hasRecorded: false },
        { id: "p2", name: "Player 2", avatarUrl: randomAvatar("p2"), role: "melody", hasRecorded: false },
        { id: "p3", name: "Player 3", avatarUrl: randomAvatar("p3"), role: "vocals", hasRecorded: false },
      ],
    },
    {
      id: "team2",
      name: "Team Blaze",
      players: [
        { id: "p4", name: "Player 4", avatarUrl: randomAvatar("p4"), role: "beat", hasRecorded: false },
        { id: "p5", name: "Player 5", avatarUrl: randomAvatar("p5"), role: "melody", hasRecorded: false },
        { id: "p6", name: "Player 6", avatarUrl: randomAvatar("p6"), role: "vocals", hasRecorded: false },
      ],
    },
  ];
}

export default function Home() {
  const [view, setView] = useState<AppView>("home");
  const [gameMode, setGameMode] = useState<GameMode>("online");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<Id<"rooms"> | null>(null);
  const [teamId, setTeamId] = useState<Id<"teams"> | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [joinModalOpen, setJoinModalOpen] = useState(false);
  const [modeModalOpen, setModeModalOpen] = useState(false);

  const [teamName, setTeamName] = useState("My Team");
  const [players, setPlayers] = useState(createDefaultPlayers);
  const [toast, setToast] = useState<string | null>(null);

  const [localTeams, setLocalTeams] = useState(() => createLocalTeams());
  const [localPhase, setLocalPhase] = useState<"lobby" | "playing" | "results">("lobby");
  const [localRoleIndex, setLocalRoleIndex] = useState(0);
  const [localTeamTurn, setLocalTeamTurn] = useState(0);

  useEffect(() => {
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      const codeFromUrl = params.get("code");
      if (codeFromUrl && codeFromUrl.length === 6) {
        setJoinCode(codeFromUrl.toUpperCase());
        setView("join-team");
      }
    }
  }, []);

  const room = useQuery(
    api.rooms.getRoom,
    roomCode ? { code: roomCode } : "skip"
  );

  const createRoom = useMutation(api.rooms.createRoom);
  const joinRoom = useMutation(api.rooms.joinRoom);
  const startGame = useMutation(api.rooms.startGame);
  const recordComplete = useMutation(api.rooms.recordComplete);
  const updateTeamNameMut = useMutation(api.rooms.updateTeamName);
  const updatePlayerNameMut = useMutation(api.rooms.updatePlayerName);
  const heartbeat = useMutation(api.rooms.heartbeat);
  const leaveRoom = useMutation(api.rooms.leaveRoom);

  useEffect(() => {
    if (room?.phase === "playing" || room?.phase === "results") {
      setView("game");
    }
  }, [room?.phase]);

  useEffect(() => {
    if (!teamId) return;

    heartbeat({ teamId });
    const interval = setInterval(() => {
      heartbeat({ teamId });
    }, 5000);

    const handleBeforeUnload = () => {
      leaveRoom({ teamId });
    };
    window.addEventListener("beforeunload", handleBeforeUnload);

    return () => {
      clearInterval(interval);
      window.removeEventListener("beforeunload", handleBeforeUnload);
      leaveRoom({ teamId });
    };
  }, [teamId, heartbeat, leaveRoom]);

  const handleCreateRoom = async () => {
    const result = await createRoom({
      teamName,
      players: players.map((p) => ({
        name: p.name,
        avatarUrl: p.avatarUrl,
        role: p.role,
      })),
    });
    setRoomCode(result.code);
    setRoomId(result.roomId);
    setTeamId(result.teamId);
    setIsHost(true);
    setView("waiting-room");
  };

  const showToast = (message: string) => {
    setToast(message);
    setTimeout(() => setToast(null), 3000);
  };

  const getErrorMessage = (error: unknown): string => {
    const raw = (error as Error).message || "Something went wrong";
    if (raw.includes("Room not found")) return "Room not found. Check the code and try again.";
    if (raw.includes("Room is full")) return "This room is full. The game already has two teams.";
    if (raw.includes("Game already started")) return "This game has already started.";
    return "Something went wrong. Please try again.";
  };

  const handleJoinRoom = async () => {
    try {
      const result = await joinRoom({
        code: joinCode.toUpperCase(),
        teamName,
        players: players.map((p) => ({
          name: p.name,
          avatarUrl: p.avatarUrl,
          role: p.role,
        })),
      });
      setRoomCode(joinCode.toUpperCase());
      setRoomId(result.roomId);
      setTeamId(result.teamId);
      setIsHost(false);
      setJoinModalOpen(false);
      setView("waiting-room");
    } catch (e) {
      showToast(getErrorMessage(e));
    }
  };

  const handleStartGame = async () => {
    if (!roomId) return;
    try {
      await startGame({ roomId });
    } catch (e) {
      showToast(getErrorMessage(e));
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-gray-900 via-gray-800 to-gray-900 font-sans">
      <Header />

      <main className="mx-auto max-w-6xl px-4 py-8 pb-24">
        {view === "home" && (
          <HomeView
            onCreateTeam={() => {
              setGameMode("online");
              setView("create-team");
            }}
            onJoinRoom={() => setJoinModalOpen(true)}
            onLocalPlay={() => {
              setGameMode("local");
              setLocalTeams(createLocalTeams());
              setLocalPhase("lobby");
              setLocalRoleIndex(0);
              setLocalTeamTurn(0);
              setView("local-game");
            }}
            onOpenRules={() => setRulesModalOpen(true)}
          />
        )}

        {view === "create-team" && (
          <CreateTeamView
            teamName={teamName}
            setTeamName={setTeamName}
            players={players}
            setPlayers={setPlayers}
            onBack={() => setView("home")}
            onSubmit={handleCreateRoom}
            submitLabel="CREATE ROOM"
          />
        )}

        {view === "join-team" && (
          <CreateTeamView
            teamName={teamName}
            setTeamName={setTeamName}
            players={players}
            setPlayers={setPlayers}
            onBack={() => {
              setJoinCode("");
              setView("home");
            }}
            onSubmit={handleJoinRoom}
            submitLabel="JOIN ROOM"
            joinCode={joinCode}
          />
        )}

        {view === "waiting-room" && room && (
          <WaitingRoomView
            room={room}
            roomCode={roomCode!}
            isHost={isHost}
            teamId={teamId!}
            onStartGame={handleStartGame}
            onUpdateTeamName={(id, name) => updateTeamNameMut({ teamId: id, name })}
            onUpdatePlayerName={(id, name) => updatePlayerNameMut({ playerId: id, name })}
          />
        )}

        {view === "game" && room && (
          <GameView
            room={room}
            teamId={teamId!}
            roomId={roomId!}
            onRecordComplete={async (playerId) => {
              await recordComplete({ playerId, roomId: roomId! });
            }}
          />
        )}

        {view === "local-game" && (
          <LocalGameView
            teams={localTeams}
            setTeams={setLocalTeams}
            phase={localPhase}
            setPhase={setLocalPhase}
            currentRoleIndex={localRoleIndex}
            setCurrentRoleIndex={setLocalRoleIndex}
            currentTeamTurn={localTeamTurn}
            setCurrentTeamTurn={setLocalTeamTurn}
            onBack={() => setView("home")}
          />
        )}
      </main>

      {view !== "home" && <Footer />}

      {rulesModalOpen && <RulesModal onClose={() => setRulesModalOpen(false)} />}

      {joinModalOpen && (
        <JoinRoomModal
          code={joinCode}
          setCode={setJoinCode}
          onClose={() => setJoinModalOpen(false)}
          onNext={() => {
            setJoinModalOpen(false);
            setView("join-team");
          }}
        />
      )}

      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 animate-modal-enter">
          <div className="border border-white/10 bg-neutral-900 px-5 py-3 text-sm font-medium text-white shadow-lg">
            {toast}
          </div>
        </div>
      )}
    </div>
  );
}

function Header() {
  return (
    <header className="border-b border-white/10 px-6 py-4">
      <div className="mx-auto flex max-w-5xl items-center justify-between">
        <h1 className="text-xl font-black tracking-tight">
          <span className="text-cyan-400">REMIX</span>
          <span className="text-white">BATTLE</span>
        </h1>

        <div className="flex items-center gap-1 text-white/40">
          <div className="h-1.5 w-1.5 bg-emerald-400 animate-pulse-dot" />
          <span className="text-xs font-medium">Live</span>
        </div>
      </div>
    </header>
  );
}

function Footer() {
  return (
    <footer className="fixed bottom-0 left-0 right-0 border-t border-white/10 bg-black py-3">
      <div className="flex items-center justify-center gap-6 text-xs text-white/40">
        <span className="font-semibold text-white/60">RemixBattle</span>
        <span>·</span>
        <a href="#" className="transition-colors hover:text-white">Terms</a>
        <a href="#" className="transition-colors hover:text-white">Privacy</a>
      </div>
    </footer>
  );
}

function HomeView({
  onCreateTeam,
  onJoinRoom,
  onLocalPlay,
  onOpenRules,
}: {
  onCreateTeam: () => void;
  onJoinRoom: () => void;
  onLocalPlay: () => void;
  onOpenRules: () => void;
}) {
  return (
    <div className="px-6 py-16">
      <div className="mx-auto max-w-md">
        {/* Hero */}
        <div className="mb-10 text-center">
          <p className="mb-3 text-xs font-semibold uppercase tracking-widest text-cyan-400">
            Multiplayer Music Game
          </p>
          <h2 className="text-3xl font-black leading-tight text-white md:text-4xl">
            Create music together.<br />
            <span className="text-white/50">Compete to win.</span>
          </h2>
          <p className="mt-4 text-sm text-white/50">
            Two teams, three players each. Record beats, melody, and vocals. 
            Vote for the best track.
          </p>
        </div>

        {/* Play Options */}
        <div className="space-y-3">
          <button
            onClick={onLocalPlay}
            className="group flex w-full items-center justify-between border border-white/10 bg-white/5 px-5 py-4 transition-all hover:border-cyan-400/50 hover:bg-cyan-400/5"
          >
            <div className="flex items-center gap-4">
              <DeviceMobile size={20} weight="bold" className="text-cyan-400" />
              <div className="text-left">
                <p className="font-semibold text-white">Local Play</p>
                <p className="text-xs text-white/40">Both teams on one device</p>
              </div>
            </div>
            <CaretRight size={16} weight="bold" className="text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-cyan-400" />
          </button>

          <button
            onClick={onCreateTeam}
            className="group flex w-full items-center justify-between border border-white/10 bg-white/5 px-5 py-4 transition-all hover:border-cyan-400/50 hover:bg-cyan-400/5"
          >
            <div className="flex items-center gap-4">
              <Sparkle size={20} weight="bold" className="text-cyan-400" />
              <div className="text-left">
                <p className="font-semibold text-white">Create Room</p>
                <p className="text-xs text-white/40">Host an online game</p>
              </div>
            </div>
            <CaretRight size={16} weight="bold" className="text-white/20 transition-all group-hover:translate-x-0.5 group-hover:text-cyan-400" />
          </button>

        </div>

        <button
          onClick={onOpenRules}
          className="mt-10 w-full py-4 text-center text-base font-semibold text-white/50 transition-colors hover:text-white/80"
        >
          How does it work?
        </button>
      </div>
    </div>
  );
}

function CreateTeamView({
  teamName,
  setTeamName,
  players,
  setPlayers,
  onBack,
  onSubmit,
  submitLabel,
  joinCode,
}: {
  teamName: string;
  setTeamName: (v: string) => void;
  players: { name: string; avatarUrl: string; role: Role }[];
  setPlayers: React.Dispatch<React.SetStateAction<{ name: string; avatarUrl: string; role: Role }[]>>;
  onBack: () => void;
  onSubmit: () => void;
  submitLabel: string;
  joinCode?: string;
}) {
  const updatePlayerName = (index: number, name: string) => {
    setPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, name } : p))
    );
  };

  const regenerateAvatar = (index: number) => {
    const seed = Math.random().toString(36).slice(2);
    setPlayers((prev) =>
      prev.map((p, i) => (i === index ? { ...p, avatarUrl: randomAvatar(seed) } : p))
    );
  };

  return (
    <div className="mx-auto max-w-lg space-y-8">
      <button
        onClick={onBack}
        className="text-sm font-bold text-white/60 hover:text-white"
      >
        ← Back
      </button>

      <div>
        <h2 className="text-2xl font-black uppercase tracking-wider text-white">
          Setup Your Team
        </h2>
        <p className="mt-1 text-white/50">
          Set your team name and player details
        </p>
      </div>

      <div>
        <label className="mb-2 block text-sm font-bold text-white/70">
          Team Name
        </label>
        <input
          type="text"
          value={teamName}
          onChange={(e) => setTeamName(e.target.value)}
          className="w-full bg-white/10 px-4 py-3 text-white placeholder-white/40 outline-none focus:ring-2 focus:ring-cyan-500"
          placeholder="Enter team name"
        />
      </div>

      <div className="space-y-3">
        <label className="block text-sm font-bold text-white/70">
          Players
        </label>
        {players.map((player, index) => {
          const role = ROLES.find((r) => r.id === player.role);
          return (
            <div key={index} className="flex items-center gap-3 bg-white/5 p-3">
              <button
                type="button"
                onClick={() => regenerateAvatar(index)}
                className="relative h-12 w-12 shrink-0 overflow-hidden rounded-full hover:ring-2 hover:ring-cyan-400"
              >
                <Image
                  src={player.avatarUrl}
                  alt={player.name}
                  fill
                  className="object-cover"
                  unoptimized
                />
              </button>
              <div className="flex-1">
                <input
                  type="text"
                  value={player.name}
                  onChange={(e) => updatePlayerName(index, e.target.value)}
                  className="w-full bg-transparent font-bold text-white outline-none focus:bg-white/10"
                  placeholder="Player name"
                />
                <p className="flex items-center gap-1 text-sm text-white/50">
                  {role && <role.Icon size={14} weight="bold" />}
                  <span>{role?.label}</span>
                </p>
              </div>
            </div>
          );
        })}
      </div>

      {joinCode && (
        <div className="bg-white/5 p-4 text-center">
          <p className="text-sm text-white/50">Joining room</p>
          <p className="text-2xl font-black tracking-widest text-cyan-400">{joinCode}</p>
        </div>
      )}

      <button
        onClick={onSubmit}
        className="flex w-full items-center justify-center gap-3 bg-gradient-to-r from-cyan-500 to-teal-500 px-10 py-4 text-lg font-black text-white transition-all hover:from-cyan-400 hover:to-teal-400"
      >
        <CaretRight size={24} weight="bold" />
        {submitLabel}
      </button>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function WaitingRoomView({
  room,
  roomCode,
  isHost,
  teamId,
  onStartGame,
  onUpdateTeamName,
  onUpdatePlayerName,
}: {
  room: any;
  roomCode: string;
  isHost: boolean;
  teamId: Id<"teams">;
  onStartGame: () => void;
  onUpdateTeamName: (teamId: Id<"teams">, name: string) => void;
  onUpdatePlayerName: (playerId: Id<"players">, name: string) => void;
}) {
  const [copied, setCopied] = useState(false);
  const shareUrl = typeof window !== "undefined"
    ? `${window.location.origin}?code=${roomCode}`
    : "";

  const copyCode = async () => {
    await navigator.clipboard.writeText(roomCode);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const copyUrl = async () => {
    await navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const myTeam = room.teams.find((t: any) => t._id === teamId);
  const otherTeam = room.teams.find((t: any) => t._id !== teamId);
  const isOtherTeamConnected = otherTeam?.isConnected !== false;
  const canStart = room.teams.length === 2 && isHost && isOtherTeamConnected;
  const bothTeamsJoined = room.teams.length === 2;

  const myTeamIndex = myTeam?.teamIndex ?? 0;
  const otherTeamIndex = otherTeam?.teamIndex ?? 1;

  return (
    <div className="space-y-8">
      <div className="text-center">
        <h2 className="text-2xl font-black uppercase tracking-wider text-white">
          {bothTeamsJoined ? "Ready to Battle" : "Waiting for Opponent"}
        </h2>
        <p className="mt-1 text-white/50">
          {bothTeamsJoined 
            ? (isHost ? "Start the game when ready" : "Waiting for host to start")
            : "Share the code with the other team to join"}
        </p>
      </div>

      {!bothTeamsJoined && (
        <div className="mx-auto max-w-md bg-white/5 p-6">
          <div className="flex flex-col items-center gap-4">
            <div className="text-center">
              <p className="text-sm font-bold text-white/50">ROOM CODE</p>
              <p className="text-5xl font-black tracking-widest text-cyan-400">
                {roomCode}
              </p>
            </div>

            <div className="flex gap-2">
              <button
                onClick={copyCode}
                className="flex items-center gap-2 bg-white/10 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-white/20"
              >
                <Copy size={16} weight="bold" />
                {copied ? "Copied!" : "Copy Code"}
              </button>
              <button
                onClick={copyUrl}
                className="flex items-center gap-2 bg-white/10 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-white/20"
              >
                <ShareNetwork size={16} weight="bold" />
                Copy URL
              </button>
            </div>

            <div className="bg-white p-3">
              <QRCodeSVG value={shareUrl} size={160} />
            </div>
          </div>
        </div>
      )}

      <div className="grid gap-6 md:grid-cols-2">
        {myTeam && (
          <TeamCard
            team={myTeam}
            teamIndex={myTeamIndex}
            isEditable
            onTeamNameChange={(name) => onUpdateTeamName(myTeam._id, name)}
            onPlayerNameChange={(playerId, name) => onUpdatePlayerName(playerId, name)}
          />
        )}

        {otherTeam ? (
          <div className="relative">
            {otherTeam.isConnected === false && (
              <div className="absolute inset-0 z-10 flex items-center justify-center bg-black/70">
                <div className="text-center">
                  <p className="text-lg font-bold text-red-400">Opponent Disconnected</p>
                  <p className="text-sm text-white/50">Waiting for them to reconnect...</p>
                </div>
              </div>
            )}
            <TeamCard team={otherTeam} teamIndex={otherTeamIndex} />
          </div>
        ) : (
          <div className="flex min-h-[200px] items-center justify-center border-2 border-dashed border-white/20">
            <p className="text-white/50">Waiting for opponent to join...</p>
          </div>
        )}
      </div>

      {canStart && (
        <div className="flex justify-center">
          <button
            onClick={onStartGame}
            className="flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-teal-500 px-12 py-4 text-xl font-black text-white transition-all hover:from-cyan-400 hover:to-teal-400"
          >
            <CaretRight size={24} weight="bold" />
            START BATTLE
          </button>
        </div>
      )}

      {!isHost && room.teams.length === 2 && (
        <div className="text-center text-white/50">
          Waiting for host to start the game...
        </div>
      )}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function TeamCard({
  team,
  teamIndex,
  isEditable = false,
  isActive = false,
  activeRole,
  onTeamNameChange,
  onPlayerNameChange,
}: {
  team: any;
  teamIndex: number;
  isEditable?: boolean;
  isActive?: boolean;
  activeRole?: Role;
  onTeamNameChange?: (name: string) => void;
  onPlayerNameChange?: (playerId: Id<"players">, name: string) => void;
}) {
  const colors = TEAM_COLORS[teamIndex] ?? TEAM_COLORS[0];

  return (
    <div className={`transition-all ${isActive ? "ring-2 ring-yellow-400" : ""}`}>
      <div className={`${colors.bgColor} px-4 py-2`}>
        {isEditable && onTeamNameChange ? (
          <div className="flex justify-center">
            <EditableName
              value={team.name}
              onChange={onTeamNameChange}
              className="text-center text-lg font-black text-white"
              suffix={<PencilSimple size={16} weight="bold" className="shrink-0 text-white/80" />}
            />
          </div>
        ) : (
          <h3 className="text-center text-lg font-black text-white">{team.name}</h3>
        )}
      </div>

      <div className="bg-white/5 p-4">
        <div className="flex flex-col gap-2">
          {team.players.map((player: any) => {
            const role = ROLES.find((r) => r.id === player.role);
            const isCurrentTurn = isActive && activeRole === player.role;

            return (
              <div
                key={player._id}
                className={`flex items-center gap-3 p-3 transition-all ${
                  isCurrentTurn
                    ? "bg-yellow-500/20 ring-1 ring-yellow-400"
                    : player.hasRecorded
                    ? "bg-emerald-500/20"
                    : "bg-white/5"
                }`}
              >
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={player.avatarUrl}
                    alt={player.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  {isEditable && onPlayerNameChange ? (
                    <EditableName
                      value={player.name}
                      onChange={(name) => onPlayerNameChange(player._id, name)}
                      className="font-bold text-white"
                      suffix={<PencilSimple size={14} weight="bold" className="shrink-0 text-white/40" />}
                    />
                  ) : (
                    <p className="truncate font-bold text-white">{player.name}</p>
                  )}
                  <p className="flex items-center gap-1 text-sm text-white/50">
                    {role && <role.Icon size={14} weight="bold" />}
                    <span className="truncate">{role?.label}</span>
                    {player.hasRecorded && (
                      <Check size={14} weight="bold" className="ml-1 text-emerald-400" />
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function GameView({
  room,
  teamId,
  roomId,
  onRecordComplete,
}: {
  room: any;
  teamId: Id<"teams">;
  roomId: Id<"rooms">;
  onRecordComplete: (playerId: Id<"players">) => Promise<void>;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentRole = ROLES[room.currentRoleIndex];
  const currentTeam = room.teams[room.currentTeamTurn];
  const isMyTurn = currentTeam?._id === teamId;
  const currentPlayer = currentTeam?.players.find((p: any) => p.role === currentRole.id);

  const handleStartRecording = () => {
    setIsRecording(true);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev >= 29) {
          if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
          }
          setTimeout(() => handleStopRecording(), 0);
          return 30;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handleStopRecording = useCallback(async () => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setIsRecording(false);
    setRecordingTime(0);

    if (currentPlayer) {
      await onRecordComplete(currentPlayer._id);
    }
  }, [currentPlayer, onRecordComplete]);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  if (room.phase === "results") {
    return <ResultsView room={room} teamId={teamId} />;
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center gap-1">
        {ROLES.map((role, index) => {
          const RoleIcon = role.Icon;
          return (
            <div key={role.id} className="flex items-center">
              <div
                className={`flex h-14 w-14 items-center justify-center transition-all ${
                  index === room.currentRoleIndex
                    ? "scale-110 bg-white text-gray-900"
                    : index < room.currentRoleIndex
                    ? "bg-emerald-500 text-white"
                    : "bg-white/10 text-white/40"
                }`}
              >
                {index < room.currentRoleIndex ? (
                  <Check size={28} weight="bold" />
                ) : (
                  <RoleIcon size={28} weight="bold" />
                )}
              </div>
              {index < ROLES.length - 1 && (
                <div className={`h-0.5 w-6 ${index < room.currentRoleIndex ? "bg-emerald-500" : "bg-white/10"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <div className="mb-2 inline-block bg-white/10 px-4 py-1 text-sm font-bold text-white/70">
          ROUND {room.currentRoleIndex + 1} OF {ROLES.length}
        </div>
        <h2 className="flex items-center justify-center gap-2 text-4xl font-black text-white">
          <currentRole.Icon size={36} weight="bold" />
          {currentRole.label.toUpperCase()}
        </h2>
        <p className="text-white/50">{currentRole.description}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {room.teams.map((team: any, index: number) => {
          const isActiveTeam = team._id === currentTeam?._id;
          const isMyTeam = team._id === teamId;

          if (isActiveTeam && isMyTurn && currentPlayer) {
            return (
              <div key={team._id} className="ring-2 ring-yellow-400">
                <div className={`${TEAM_COLORS[index].bgColor} px-4 py-2`}>
                  <h3 className="text-center text-lg font-black text-white">{team.name}</h3>
                </div>
                <div className="flex min-h-[280px] items-center justify-center bg-white/5 p-6">
                  <RecordingControls
                    player={currentPlayer}
                    teamIndex={index}
                    currentRole={currentRole}
                    isRecording={isRecording}
                    recordingTime={recordingTime}
                    onStartRecording={handleStartRecording}
                    onStopRecording={handleStopRecording}
                  />
                </div>
              </div>
            );
          }

          if (isActiveTeam && !isMyTurn) {
            return (
              <div key={team._id} className="ring-2 ring-yellow-400">
                <div className={`${TEAM_COLORS[index].bgColor} px-4 py-2`}>
                  <h3 className="text-center text-lg font-black text-white">{team.name}</h3>
                </div>
                <div className="flex min-h-[280px] flex-col items-center justify-center bg-white/5 p-6">
                  {team.isConnected === false ? (
                    <>
                      <p className="text-lg font-bold text-red-400">Opponent Disconnected</p>
                      <p className="text-white/50">Waiting for them to reconnect...</p>
                    </>
                  ) : (
                    <>
                      <p className="text-lg font-bold text-white">Opponent&apos;s Turn</p>
                      <p className="text-white/50">Waiting for {currentPlayer?.name} to record...</p>
                    </>
                  )}
                </div>
              </div>
            );
          }

          return (
            <TeamCard
              key={team._id}
              team={team}
              teamIndex={index}
              isActive={false}
              activeRole={currentRole.id}
            />
          );
        })}
      </div>
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function ResultsView({ room, teamId }: { room: any; teamId: Id<"teams"> }) {
  return (
    <div className="space-y-10">
      <div className="text-center">
        <div className="mb-4 flex justify-center">
          <Trophy size={80} weight="fill" className="text-yellow-500" />
        </div>
        <h2 className="text-4xl font-black text-white">BATTLE COMPLETE!</h2>
        <p className="text-white/50">Listen to each team&apos;s creation</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {room.teams.map((team: any, index: number) => {
          const colors = TEAM_COLORS[index] ?? TEAM_COLORS[0];
          return (
            <div key={team._id} className={`border-t-4 ${colors.bgColor} bg-white/5 p-6`}>
              <div className="mb-4 flex items-center justify-between">
                <h3 className={`text-2xl font-black ${colors.color}`}>{team.name}</h3>
                {index === 0 && (
                  <span className="flex items-center gap-1 bg-yellow-500 px-3 py-1 text-sm font-bold text-yellow-900">
                    <Trophy size={14} weight="fill" />
                    WINNER
                  </span>
                )}
              </div>

              <div className="mb-6 flex -space-x-2">
                {team.players.map((player: any) => (
                  <div
                    key={player._id}
                    className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-gray-800"
                  >
                    <Image
                      src={player.avatarUrl}
                      alt={player.name}
                      fill
                      className="object-cover"
                      unoptimized
                    />
                  </div>
                ))}
              </div>

              <button className="flex w-full items-center justify-center gap-2 bg-white/10 py-3 font-bold text-white transition-all hover:bg-white/20">
                <Play size={20} weight="fill" />
                PLAY TRACK
              </button>
            </div>
          );
        })}
      </div>
    </div>
  );
}

function LocalGameView({
  teams,
  setTeams,
  phase,
  setPhase,
  currentRoleIndex,
  setCurrentRoleIndex,
  currentTeamTurn,
  setCurrentTeamTurn,
  onBack,
}: {
  teams: LocalTeam[];
  setTeams: React.Dispatch<React.SetStateAction<LocalTeam[]>>;
  phase: "lobby" | "playing" | "results";
  setPhase: (phase: "lobby" | "playing" | "results") => void;
  currentRoleIndex: number;
  setCurrentRoleIndex: (index: number) => void;
  currentTeamTurn: number;
  setCurrentTeamTurn: (index: number) => void;
  onBack: () => void;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const recordingIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const currentRole = ROLES[currentRoleIndex];
  const currentTeam = teams[currentTeamTurn];
  const currentPlayer = currentTeam?.players.find((p) => p.role === currentRole?.id);

  const handleStartRecording = () => {
    setIsRecording(true);
    recordingIntervalRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev >= 29) {
          if (recordingIntervalRef.current) {
            clearInterval(recordingIntervalRef.current);
            recordingIntervalRef.current = null;
          }
          setTimeout(() => handleStopRecording(), 0);
          return 30;
        }
        return prev + 1;
      });
    }, 1000);
  };

  const handleStopRecording = useCallback(() => {
    if (recordingIntervalRef.current) {
      clearInterval(recordingIntervalRef.current);
      recordingIntervalRef.current = null;
    }
    setIsRecording(false);
    setRecordingTime(0);

    if (currentPlayer) {
      setTeams((prev) =>
        prev.map((team) => ({
          ...team,
          players: team.players.map((p) =>
            p.id === currentPlayer.id ? { ...p, hasRecorded: true } : p
          ),
        }))
      );

      if (currentTeamTurn === 0) {
        setCurrentTeamTurn(1);
      } else {
        if (currentRoleIndex < ROLES.length - 1) {
          setCurrentRoleIndex(currentRoleIndex + 1);
          setCurrentTeamTurn(0);
        } else {
          setPhase("results");
        }
      }
    }
  }, [
    currentPlayer,
    currentRoleIndex,
    currentTeamTurn,
    setCurrentRoleIndex,
    setCurrentTeamTurn,
    setPhase,
    setTeams,
  ]);

  useEffect(() => {
    return () => {
      if (recordingIntervalRef.current) {
        clearInterval(recordingIntervalRef.current);
      }
    };
  }, []);

  const handleUpdateTeamName = (teamId: string, name: string) => {
    setTeams((prev) =>
      prev.map((t) => (t.id === teamId ? { ...t, name } : t))
    );
  };

  const handleUpdatePlayerName = (playerId: string, name: string) => {
    setTeams((prev) =>
      prev.map((team) => ({
        ...team,
        players: team.players.map((p) =>
          p.id === playerId ? { ...p, name } : p
        ),
      }))
    );
  };

  const handleStartGame = () => {
    setPhase("playing");
    setCurrentRoleIndex(0);
    setCurrentTeamTurn(0);
  };

  const handleResetGame = () => {
    setTeams(createLocalTeams());
    setPhase("lobby");
    setCurrentRoleIndex(0);
    setCurrentTeamTurn(0);
  };

  if (phase === "lobby") {
    return (
      <div className="space-y-8">
        <div className="text-center">
          <h2 className="text-2xl font-black uppercase tracking-wider text-white">
            Local Battle Setup
          </h2>
          <p className="mt-1 text-white/50">
            Both teams on one screen - pass the device when it&apos;s the other team&apos;s turn
          </p>
        </div>

        <div className="grid gap-6 md:grid-cols-2">
          {teams.map((team, index) => (
            <LocalTeamCard
              key={team.id}
              team={team}
              teamIndex={index}
              isEditable
              onTeamNameChange={(name) => handleUpdateTeamName(team.id, name)}
              onPlayerNameChange={(playerId, name) =>
                handleUpdatePlayerName(playerId, name)
              }
            />
          ))}
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleStartGame}
            className="flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-teal-500 px-12 py-4 text-xl font-black text-white transition-all hover:from-cyan-400 hover:to-teal-400"
          >
            <CaretRight size={24} weight="bold" />
            START BATTLE
          </button>
          <button
            onClick={onBack}
            className="text-sm font-bold text-white/50 hover:text-white/80"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  if (phase === "results") {
    return (
      <div className="space-y-10">
        <div className="text-center">
          <div className="mb-4 flex justify-center">
            <Trophy size={80} weight="fill" className="text-yellow-500" />
          </div>
          <h2 className="text-4xl font-black text-white">BATTLE COMPLETE!</h2>
          <p className="text-white/50">Listen to each team&apos;s creation</p>
        </div>

        <div className="grid gap-8 md:grid-cols-2">
          {teams.map((team, index) => {
            const colors = TEAM_COLORS[index] ?? TEAM_COLORS[0];
            return (
              <div key={team.id} className={`border-t-4 ${colors.bgColor} bg-white/5 p-6`}>
                <div className="mb-4 flex items-center justify-between">
                  <h3 className={`text-2xl font-black ${colors.color}`}>{team.name}</h3>
                  {index === 0 && (
                    <span className="flex items-center gap-1 bg-yellow-500 px-3 py-1 text-sm font-bold text-yellow-900">
                      <Trophy size={14} weight="fill" />
                      WINNER
                    </span>
                  )}
                </div>

                <div className="mb-6 flex -space-x-2">
                  {team.players.map((player) => (
                    <div
                      key={player.id}
                      className="relative h-12 w-12 overflow-hidden rounded-full border-2 border-gray-800"
                    >
                      <Image
                        src={player.avatarUrl}
                        alt={player.name}
                        fill
                        className="object-cover"
                        unoptimized
                      />
                    </div>
                  ))}
                </div>

                <button className="flex w-full items-center justify-center gap-2 bg-white/10 py-3 font-bold text-white transition-all hover:bg-white/20">
                  <Play size={20} weight="fill" />
                  PLAY TRACK
                </button>
              </div>
            );
          })}
        </div>

        <div className="flex flex-col items-center gap-4">
          <button
            onClick={handleResetGame}
            className="flex items-center gap-3 bg-gradient-to-r from-cyan-500 to-teal-500 px-10 py-4 text-lg font-black text-white transition-all hover:from-cyan-400 hover:to-teal-400"
          >
            <CaretRight size={24} weight="bold" />
            NEW BATTLE
          </button>
          <button
            onClick={onBack}
            className="text-sm font-bold text-white/50 hover:text-white/80"
          >
            Back to Menu
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="flex items-center justify-center gap-1">
        {ROLES.map((role, index) => {
          const RoleIcon = role.Icon;
          return (
            <div key={role.id} className="flex items-center">
              <div
                className={`flex h-14 w-14 items-center justify-center transition-all ${
                  index === currentRoleIndex
                    ? "scale-110 bg-white text-gray-900"
                    : index < currentRoleIndex
                    ? "bg-emerald-500 text-white"
                    : "bg-white/10 text-white/40"
                }`}
              >
                {index < currentRoleIndex ? (
                  <Check size={28} weight="bold" />
                ) : (
                  <RoleIcon size={28} weight="bold" />
                )}
              </div>
              {index < ROLES.length - 1 && (
                <div className={`h-0.5 w-6 ${index < currentRoleIndex ? "bg-emerald-500" : "bg-white/10"}`} />
              )}
            </div>
          );
        })}
      </div>

      <div className="text-center">
        <div className="mb-2 inline-block bg-white/10 px-4 py-1 text-sm font-bold text-white/70">
          ROUND {currentRoleIndex + 1} OF {ROLES.length}
        </div>
        <h2 className="flex items-center justify-center gap-2 text-4xl font-black text-white">
          <currentRole.Icon size={36} weight="bold" />
          {currentRole.label.toUpperCase()}
        </h2>
        <p className="text-white/50">{currentRole.description}</p>
      </div>

      <div className="grid gap-8 md:grid-cols-2">
        {teams.map((team, index) => {
          const isActiveTeam = index === currentTeamTurn;
          const teamPlayer = team.players.find((p) => p.role === currentRole.id);

          if (isActiveTeam && teamPlayer) {
            return (
              <div key={team.id} className="ring-2 ring-yellow-400">
                <div className={`${TEAM_COLORS[index].bgColor} px-4 py-2`}>
                  <h3 className="text-center text-lg font-black text-white">{team.name}</h3>
                </div>
                <div className="flex min-h-[280px] items-center justify-center bg-white/5 p-6">
                  <LocalRecordingControls
                    player={teamPlayer}
                    teamIndex={index}
                    currentRole={currentRole}
                    isRecording={isRecording}
                    recordingTime={recordingTime}
                    onStartRecording={handleStartRecording}
                    onStopRecording={handleStopRecording}
                  />
                </div>
              </div>
            );
          }

          return (
            <LocalTeamCard
              key={team.id}
              team={team}
              teamIndex={index}
              activeRole={currentRole.id}
            />
          );
        })}
      </div>
    </div>
  );
}

function LocalTeamCard({
  team,
  teamIndex,
  isEditable = false,
  activeRole,
  onTeamNameChange,
  onPlayerNameChange,
}: {
  team: LocalTeam;
  teamIndex: number;
  isEditable?: boolean;
  activeRole?: Role;
  onTeamNameChange?: (name: string) => void;
  onPlayerNameChange?: (playerId: string, name: string) => void;
}) {
  const colors = TEAM_COLORS[teamIndex] ?? TEAM_COLORS[0];

  return (
    <div className={`${teamIndex === 0 ? "border-l-4 border-cyan-500" : "border-l-4 border-orange-500"}`}>
      <div className={`${colors.bgColor} px-4 py-2`}>
        {isEditable && onTeamNameChange ? (
          <div className="flex justify-center">
            <EditableName
              value={team.name}
              onChange={onTeamNameChange}
              className="text-center text-lg font-black text-white"
              suffix={<PencilSimple size={16} weight="bold" className="shrink-0 text-white/80" />}
            />
          </div>
        ) : (
          <h3 className="text-center text-lg font-black text-white">{team.name}</h3>
        )}
      </div>

      <div className="bg-white/5 p-4">
        <div className="flex flex-col gap-2">
          {team.players.map((player) => {
            const role = ROLES.find((r) => r.id === player.role);
            const isCurrentTurn = activeRole === player.role;

            return (
              <div
                key={player.id}
                className={`flex items-center gap-3 p-3 transition-all ${
                  isCurrentTurn
                    ? "bg-yellow-500/20 ring-1 ring-yellow-400"
                    : player.hasRecorded
                    ? "bg-emerald-500/20"
                    : "bg-white/5"
                }`}
              >
                <div className="relative h-11 w-11 shrink-0 overflow-hidden rounded-full">
                  <Image
                    src={player.avatarUrl}
                    alt={player.name}
                    fill
                    className="object-cover"
                    unoptimized
                  />
                </div>
                <div className="min-w-0 flex-1">
                  {isEditable && onPlayerNameChange ? (
                    <EditableName
                      value={player.name}
                      onChange={(name) => onPlayerNameChange(player.id, name)}
                      className="font-bold text-white"
                      suffix={<PencilSimple size={14} weight="bold" className="shrink-0 text-white/40" />}
                    />
                  ) : (
                    <p className="truncate font-bold text-white">{player.name}</p>
                  )}
                  <p className="flex items-center gap-1 text-sm text-white/50">
                    {role && <role.Icon size={14} weight="bold" />}
                    <span className="truncate">{role?.label}</span>
                    {player.hasRecorded && (
                      <Check size={14} weight="bold" className="ml-1 text-emerald-400" />
                    )}
                  </p>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function LocalRecordingControls({
  player,
  teamIndex,
  currentRole,
  isRecording,
  recordingTime,
  onStartRecording,
  onStopRecording,
}: {
  player: LocalPlayer;
  teamIndex: number;
  currentRole: (typeof ROLES)[number];
  isRecording: boolean;
  recordingTime: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
}) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-6 py-8">
      <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-white/20">
        <Image
          src={player.avatarUrl}
          alt={player.name}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="text-center">
        <p className={`text-xl font-black ${TEAM_COLORS[teamIndex].color}`}>
          {player.name}&apos;s Turn
        </p>
        <p className="mt-1 text-sm text-white/60">
          {ROLE_CHALLENGE[currentRole.id as Role]}
        </p>
      </div>

      {isRecording ? (
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <RecordingWaveform />
            <span className="text-sm font-bold text-white/80">{30 - recordingTime}s left</span>
          </div>
          <button
            onClick={onStopRecording}
            className="flex items-center gap-2 bg-white/10 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-white/20"
          >
            <Stop size={16} weight="fill" />
            STOP
          </button>
        </div>
      ) : (
        <button
          onClick={onStartRecording}
          className="flex items-center gap-2 bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-400"
        >
          <Microphone size={18} weight="fill" />
          RECORD
        </button>
      )}
    </div>
  );
}

function RecordingWaveform() {
  const bars = 16;
  return (
    <div className="flex h-14 items-end justify-center gap-1">
      {Array.from({ length: bars }).map((_, i) => {
        const delay = (i * 80) % 600;
        const duration = 400 + (i % 3) * 100;
        return (
          <div
            key={i}
            className="w-1.5 rounded-sm bg-red-500 animate-waveform-bar"
            style={{
              height: "100%",
              animationDelay: `${delay}ms`,
              animationDuration: `${duration}ms`,
            }}
          />
        );
      })}
    </div>
  );
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function RecordingControls({
  player,
  teamIndex,
  currentRole,
  isRecording,
  recordingTime,
  onStartRecording,
  onStopRecording,
}: {
  player: any;
  teamIndex: number;
  currentRole: (typeof ROLES)[number];
  isRecording: boolean;
  recordingTime: number;
  onStartRecording: () => void;
  onStopRecording: () => void;
}) {
  return (
    <div className="flex min-h-[200px] flex-col items-center justify-center gap-6 py-8">
      <div className="relative h-24 w-24 overflow-hidden rounded-full border-2 border-white/20">
        <Image
          src={player.avatarUrl}
          alt={player.name}
          fill
          className="object-cover"
          unoptimized
        />
      </div>
      <div className="text-center">
        <p className={`text-xl font-black ${TEAM_COLORS[teamIndex].color}`}>
          {player.name}&apos;s Turn
        </p>
        <p className="mt-1 text-sm text-white/60">
          {ROLE_CHALLENGE[currentRole.id as Role]}
        </p>
      </div>

      {isRecording ? (
        <div className="flex flex-col items-center gap-4">
          <div className="flex flex-col items-center gap-2">
            <RecordingWaveform />
            <span className="text-sm font-bold text-white/80">{30 - recordingTime}s left</span>
          </div>
          <button
            onClick={onStopRecording}
            className="flex items-center gap-2 bg-white/10 px-4 py-2 text-sm font-bold text-white transition-all hover:bg-white/20"
          >
            <Stop size={16} weight="fill" />
            STOP
          </button>
        </div>
      ) : (
        <button
          onClick={onStartRecording}
          className="flex items-center gap-2 bg-red-500 px-5 py-2.5 text-sm font-bold text-white transition-all hover:bg-red-400"
        >
          <Microphone size={18} weight="fill" />
          RECORD
        </button>
      )}
    </div>
  );
}

function EditableName({
  value,
  onChange,
  className,
  placeholder,
  suffix,
}: {
  value: string;
  onChange: (v: string) => void;
  className?: string;
  placeholder?: string;
  suffix?: React.ReactNode;
}) {
  const [editing, setEditing] = useState(false);
  const [draft, setDraft] = useState(value);

  const save = () => {
    const trimmed = draft.trim();
    if (trimmed) onChange(trimmed);
    setDraft(value);
    setEditing(false);
  };

  const startEdit = () => {
    setDraft(value);
    setEditing(true);
  };

  return editing ? (
    <input
      type="text"
      value={draft}
      onChange={(e) => setDraft(e.target.value)}
      onBlur={save}
      onKeyDown={(e) => e.key === "Enter" && save()}
      autoFocus
      className={`w-full bg-white/10 px-1 py-0.5 text-white outline-none focus:ring-1 focus:ring-white/30 ${className ?? ""}`}
      placeholder={placeholder}
    />
  ) : (
    <button
      type="button"
      onClick={startEdit}
      className={`flex items-center gap-1 hover:opacity-90 ${className ?? ""}`}
    >
      <span className="truncate">{value || placeholder}</span>
      {suffix}
    </button>
  );
}

function JoinRoomModal({
  code,
  setCode,
  onClose,
  onNext,
}: {
  code: string;
  setCode: (v: string) => void;
  onClose: () => void;
  onNext: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-modal-backdrop-enter"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm border border-white/10 bg-neutral-900 animate-modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            Join Room
          </h2>
          <button 
            onClick={onClose} 
            className="text-white/40 transition-colors hover:text-white"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="p-5">
          <label className="mb-3 block text-xs font-medium text-white/50">
            Room Code
          </label>
          <input
            type="text"
            value={code}
            onChange={(e) => setCode(e.target.value.toUpperCase())}
            className="mb-5 w-full border border-white/10 bg-white/5 px-4 py-3 text-center text-2xl font-black tracking-[0.25em] text-white placeholder-white/20 outline-none transition-colors focus:border-cyan-400"
            placeholder="ABC123"
            maxLength={6}
          />

          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="flex-1 border border-white/10 py-2.5 text-sm font-semibold text-white/60 transition-all hover:border-white/20 hover:text-white"
            >
              Cancel
            </button>
            <button
              onClick={onNext}
              disabled={code.length < 6}
              className="flex-1 bg-cyan-500 py-2.5 text-sm font-semibold text-white transition-colors hover:bg-cyan-400 disabled:opacity-40"
            >
              Continue
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

function RulesModal({ onClose }: { onClose: () => void }) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/90 p-4 animate-modal-backdrop-enter"
      onClick={onClose}
    >
      <div
        className="max-h-[85vh] w-full max-w-md overflow-hidden border border-white/10 bg-neutral-900 animate-modal-enter"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
          <h2 className="text-sm font-bold uppercase tracking-wider text-white">
            How to Play
          </h2>
          <button 
            onClick={onClose} 
            className="text-white/40 transition-colors hover:text-white"
          >
            <X size={18} weight="bold" />
          </button>
        </div>

        <div className="max-h-[55vh] overflow-y-auto p-5">
          <div className="space-y-5">
            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-cyan-400/30 bg-cyan-400/10 text-cyan-400">
                <span className="text-xs font-bold">1</span>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-bold text-white">Form Teams</h3>
                <p className="text-xs leading-relaxed text-white/50">
                  Two teams of three. Each player picks a role: Beat, Melody, or Vocals.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-cyan-400/30 bg-cyan-400/10 text-cyan-400">
                <span className="text-xs font-bold">2</span>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-bold text-white">Record</h3>
                <p className="text-xs leading-relaxed text-white/50">
                  Teams alternate. Beat makers go first, then melody, then vocals. 30 seconds each.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <div className="flex h-8 w-8 shrink-0 items-center justify-center border border-cyan-400/30 bg-cyan-400/10 text-cyan-400">
                <span className="text-xs font-bold">3</span>
              </div>
              <div>
                <h3 className="mb-1 text-sm font-bold text-white">Vote</h3>
                <p className="text-xs leading-relaxed text-white/50">
                  Listen to both tracks and vote for the winner. Best track wins.
                </p>
              </div>
            </div>
          </div>
        </div>

        <div className="border-t border-white/10 p-4">
          <button
            onClick={onClose}
            className="w-full bg-white py-2.5 text-sm font-semibold text-black transition-colors hover:bg-white/90"
          >
            Got it
          </button>
        </div>
      </div>
    </div>
  );
}

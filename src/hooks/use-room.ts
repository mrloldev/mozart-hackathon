"use client";

import { useMutation, useQuery } from "convex/react";
import { useEffect, useState } from "react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import {
  createDefaultPlayers,
  createLocalTeams,
} from "@/constants/game";
import type { AppView, GameMode, LocalTeam } from "@/types/game";

type SetupPlayer = ReturnType<typeof createDefaultPlayers>[number];
type LocalPhase = "lobby" | "playing" | "results";

export function getErrorMessage(error: unknown): string {
  const raw = (error as Error).message || "Something went wrong";
  if (raw.includes("Room not found")) return "Room not found. Check the code and try again.";
  if (raw.includes("Room is full")) return "This room is full. The game already has two teams.";
  if (raw.includes("Game already started")) return "This game has already started.";
  return "Something went wrong. Please try again.";
}

export function useRoom(showToast: (msg: string) => void) {
  const [view, setView] = useState<AppView>("home");
  const [gameMode, setGameMode] = useState<GameMode>("online");
  const [roomCode, setRoomCode] = useState<string | null>(null);
  const [roomId, setRoomId] = useState<Id<"rooms"> | null>(null);
  const [teamId, setTeamId] = useState<Id<"teams"> | null>(null);
  const [isHost, setIsHost] = useState(false);
  const [joinCode, setJoinCode] = useState("");
  const [teamName, setTeamName] = useState("My Team");
  const [players, setPlayers] = useState<SetupPlayer[]>(createDefaultPlayers);
  const [localTeams, setLocalTeams] = useState<LocalTeam[]>(createLocalTeams);
  const [localPhase, setLocalPhase] = useState<"lobby" | "playing" | "results">("lobby");
  const [localRoleIndex, setLocalRoleIndex] = useState(0);
  const [localTeamTurn, setLocalTeamTurn] = useState(0);

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
    if (typeof window === "undefined") return;
    const params = new URLSearchParams(window.location.search);
    const codeFromUrl = params.get("code");
    if (codeFromUrl?.length === 6) {
      setJoinCode(codeFromUrl.toUpperCase());
      setView("join-team");
    }
  }, []);

  useEffect(() => {
    if (room?.phase === "playing" || room?.phase === "results") {
      setView("game");
    }
  }, [room?.phase]);

  useEffect(() => {
    if (!teamId) return;
    heartbeat({ teamId });
    const interval = setInterval(() => heartbeat({ teamId }), 5000);
    const handleBeforeUnload = () => leaveRoom({ teamId });
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

  const handleLocalPlay = () => {
    setGameMode("local");
    setLocalTeams(createLocalTeams());
    setLocalPhase("lobby");
    setLocalRoleIndex(0);
    setLocalTeamTurn(0);
    setView("local-game");
  };

  return {
    view,
    setView,
    gameMode,
    roomCode,
    roomId,
    teamId,
    isHost,
    joinCode,
    setJoinCode,
    teamName,
    setTeamName,
    players,
    setPlayers,
    room,
    localTeams,
    setLocalTeams,
    localPhase,
    setLocalPhase,
    localRoleIndex,
    setLocalRoleIndex,
    localTeamTurn,
    setCurrentTeamTurn: setLocalTeamTurn,
    handleCreateRoom,
    handleJoinRoom,
    handleStartGame,
    handleLocalPlay,
    updateTeamNameMut,
    updatePlayerNameMut,
    recordComplete,
  };
}

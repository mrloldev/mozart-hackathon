const KEY = "remix_room_session";

export interface RoomSession {
  code: string;
  roomId: string;
  teamId: string | null;
  isHost: boolean;
}

export function saveRoomSession(session: RoomSession): void {
  if (typeof window === "undefined") return;
  sessionStorage.setItem(KEY, JSON.stringify(session));
}

export function getRoomSession(): RoomSession | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(KEY);
    return raw ? (JSON.parse(raw) as RoomSession) : null;
  } catch {
    return null;
  }
}

export function getRoomSessionForCode(code: string): RoomSession | null {
  const s = getRoomSession();
  return s?.code === code ? s : null;
}

export function clearRoomSession(): void {
  if (typeof window === "undefined") return;
  sessionStorage.removeItem(KEY);
}

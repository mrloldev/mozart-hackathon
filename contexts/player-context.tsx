import React, { createContext, useCallback, useContext, useEffect, useReducer } from 'react';

import type { Track } from '@/lib/mock-data';

interface PlayerState {
  currentTrack: Track | null;
  queue: Track[];
  isPlaying: boolean;
  progress: number;
  duration: number;
  isFullPlayerOpen: boolean;
}

type PlayerAction =
  | { type: 'PLAY'; track: Track }
  | { type: 'TOGGLE_PLAY' }
  | { type: 'PAUSE' }
  | { type: 'NEXT' }
  | { type: 'PREV' }
  | { type: 'SEEK'; progress: number }
  | { type: 'SET_QUEUE'; queue: Track[] }
  | { type: 'ADD_TO_QUEUE'; track: Track }
  | { type: 'REMOVE_FROM_QUEUE'; trackId: string }
  | { type: 'OPEN_FULL_PLAYER' }
  | { type: 'CLOSE_FULL_PLAYER' }
  | { type: 'TICK' };

const initialState: PlayerState = {
  currentTrack: null,
  queue: [],
  isPlaying: false,
  progress: 0,
  duration: 0,
  isFullPlayerOpen: false,
};

function playerReducer(state: PlayerState, action: PlayerAction): PlayerState {
  switch (action.type) {
    case 'PLAY':
      return {
        ...state,
        currentTrack: action.track,
        isPlaying: true,
        progress: 0,
        duration: action.track.duration ?? 0,
        isFullPlayerOpen: state.isFullPlayerOpen,
      };
    case 'TOGGLE_PLAY':
      return { ...state, isPlaying: !state.isPlaying };
    case 'PAUSE':
      return { ...state, isPlaying: false };
    case 'NEXT': {
      const nextQueue = state.queue.slice(1);
      const nextTrack = nextQueue[0] ?? null;
      return {
        ...state,
        currentTrack: nextTrack,
        queue: nextQueue,
        isPlaying: nextTrack !== null,
        progress: 0,
        duration: nextTrack?.duration ?? 0,
      };
    }
    case 'PREV':
      if (state.progress > 3) {
        return { ...state, progress: 0 };
      }
      return state;
    case 'SEEK':
      return { ...state, progress: action.progress };
    case 'SET_QUEUE':
      return { ...state, queue: action.queue };
    case 'ADD_TO_QUEUE':
      return { ...state, queue: [...state.queue, action.track] };
    case 'REMOVE_FROM_QUEUE':
      return {
        ...state,
        queue: state.queue.filter((t) => t.id !== action.trackId),
      };
    case 'OPEN_FULL_PLAYER':
      return { ...state, isFullPlayerOpen: true };
    case 'CLOSE_FULL_PLAYER':
      return { ...state, isFullPlayerOpen: false };
    case 'TICK':
      if (!state.isPlaying || !state.currentTrack) return state;
      const newProgress = Math.min(state.progress + 1, state.duration || 999);
      if (newProgress >= (state.duration || 999)) {
        const nextQueue = state.queue.slice(1);
        const nextTrack = nextQueue[0] ?? null;
        return {
          ...state,
          progress: 0,
          currentTrack: nextTrack,
          queue: nextQueue,
          isPlaying: nextTrack !== null,
          duration: nextTrack?.duration ?? 0,
        };
      }
      return { ...state, progress: newProgress };
    default:
      return state;
  }
}

interface PlayerContextValue extends PlayerState {
  play: (track: Track, queue?: Track[]) => void;
  togglePlay: () => void;
  next: () => void;
  prev: () => void;
  removeFromQueue: (trackId: string) => void;
  openFullPlayer: () => void;
  closeFullPlayer: () => void;
  seek: (progress: number) => void;
}

const PlayerContext = createContext<PlayerContextValue | null>(null);

export function PlayerProvider({ children }: { children: React.ReactNode }) {
  const [state, dispatch] = useReducer(playerReducer, initialState);

  const play = useCallback((track: Track, queue?: Track[]) => {
    dispatch({ type: 'PLAY', track });
    if (queue?.length) dispatch({ type: 'SET_QUEUE', queue });
  }, []);

  const togglePlay = useCallback(() => dispatch({ type: 'TOGGLE_PLAY' }), []);
  const next = useCallback(() => dispatch({ type: 'NEXT' }), []);
  const prev = useCallback(() => dispatch({ type: 'PREV' }), []);
  const removeFromQueue = useCallback(
    (trackId: string) => dispatch({ type: 'REMOVE_FROM_QUEUE', trackId }),
    [],
  );
  const openFullPlayer = useCallback(() => dispatch({ type: 'OPEN_FULL_PLAYER' }), []);
  const closeFullPlayer = useCallback(() => dispatch({ type: 'CLOSE_FULL_PLAYER' }), []);
  const seek = useCallback((progress: number) => dispatch({ type: 'SEEK', progress }), []);

  useEffect(() => {
    if (!state.isPlaying || !state.currentTrack) return;
    const id = setInterval(() => dispatch({ type: 'TICK' }), 1000);
    return () => clearInterval(id);
  }, [state.isPlaying, state.currentTrack?.id]);

  return (
    <PlayerContext.Provider
      value={{
        ...state,
        play,
        togglePlay,
        next,
        prev,
        removeFromQueue,
        openFullPlayer,
        closeFullPlayer,
        seek,
      }}>
      {children}
    </PlayerContext.Provider>
  );
}

export function usePlayer() {
  const ctx = useContext(PlayerContext);
  if (!ctx) throw new Error('usePlayer must be used within PlayerProvider');
  return ctx;
}

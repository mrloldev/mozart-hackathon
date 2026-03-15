"use client";

import { Play, Stop } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";

function formatTime(s: number): string {
  const m = Math.floor(s / 60);
  const sec = Math.floor(s % 60);
  return `${m}:${sec.toString().padStart(2, "0")}`;
}

export default function SongPlayer({ src }: { src: string }) {
  const [isPlaying, setIsPlaying] = useState(false);
  const [progress, setProgress] = useState(0);
  const [duration, setDuration] = useState(0);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const rafRef = useRef<number | null>(null);

  const stop = useCallback(() => {
    if (rafRef.current) cancelAnimationFrame(rafRef.current);
    audioRef.current?.pause();
    audioRef.current = null;
    setIsPlaying(false);
    setProgress(0);
    setDuration(0);
  }, []);

  useEffect(() => () => stop(), [stop]);

  const toggle = useCallback(() => {
    if (isPlaying) {
      stop();
      return;
    }
    const audio = new Audio(src);
    audioRef.current = audio;
    audio.onended = stop;
    audio
      .play()
      .then(() => {
        setIsPlaying(true);
        const tick = () => {
          setProgress(audio.currentTime);
          setDuration(audio.duration || 0);
          if (!audio.paused) rafRef.current = requestAnimationFrame(tick);
        };
        rafRef.current = requestAnimationFrame(tick);
      })
      .catch(stop);
  }, [isPlaying, src, stop]);

  const prog = duration > 0 ? (progress / duration) * 100 : 0;

  return (
    <button
      onClick={toggle}
      className="flex w-full items-center gap-3 rounded-lg border border-white/6 bg-white/[0.03] p-3 transition-all hover:bg-white/[0.06] active:scale-[0.98]"
    >
      <div
        className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-full transition-all ${
          isPlaying ? "bg-white/15 text-white" : "bg-[var(--accent-primary)] text-white"
        }`}
      >
        {isPlaying ? (
          <Stop size={16} weight="fill" />
        ) : (
          <Play size={16} weight="fill" />
        )}
      </div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-sm font-bold text-white">Song</span>
          {duration > 0 && (
            <span className="text-[10px] font-medium tabular-nums text-white/30">
              {isPlaying ? formatTime(progress) : formatTime(duration)}
            </span>
          )}
        </div>
        <div className="mt-1.5 h-1 overflow-hidden rounded-full bg-white/10">
          <div
            className="h-full rounded-full bg-[var(--accent-primary)] transition-all duration-300 ease-linear"
            style={{ width: `${prog}%` }}
          />
        </div>
      </div>
    </button>
  );
}

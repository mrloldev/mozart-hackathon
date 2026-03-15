"use client";

import { Play, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion } from "framer-motion";

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
      className="flex w-full items-center gap-3 rounded-xl border border-white/6 bg-white/[0.03] p-2.5 transition-all hover:bg-white/[0.06] active:scale-[0.98]"
    >
      <motion.div
        className={`flex h-8 w-8 shrink-0 items-center justify-center rounded-full transition-all ${
          isPlaying ? "bg-white/15 text-white" : "bg-cyan-500/20 text-cyan-400"
        }`}
        animate={isPlaying ? { scale: [1, 1.08, 1] } : {}}
        transition={isPlaying ? { duration: 1.5, repeat: Infinity } : {}}
      >
        {isPlaying ? (
          <Square size={14} fill="currentColor" />
        ) : (
          <Play size={14} fill="currentColor" />
        )}
      </motion.div>
      <div className="min-w-0 flex-1">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold text-white/50">{isPlaying ? "Playing..." : "Tap to play"}</span>
          {duration > 0 && (
            <span className="text-[10px] font-bold tabular-nums text-white/25">
              {isPlaying ? formatTime(progress) : formatTime(duration)}
            </span>
          )}
        </div>
        <div className="mt-1 h-[3px] overflow-hidden rounded-full bg-white/8">
          <motion.div
            className="h-full rounded-full bg-cyan-400/60"
            animate={{ width: `${prog}%` }}
            transition={{ duration: 0.3, ease: "linear" }}
          />
        </div>
      </div>
    </button>
  );
}

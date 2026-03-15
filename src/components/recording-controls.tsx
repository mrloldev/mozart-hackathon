"use client";

import { Mic, Square } from "lucide-react";
import { useCallback, useEffect, useRef, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { ROLE_CHALLENGE, MAX_RECORDING_TIME, TEAM_COLORS } from "@/constants/game";
import type { Role } from "@/types/game";

interface Player {
  _id: string;
  name: string;
  avatarUrl: string;
  role: Role;
}

function LiveWaveform({ stream, teamIndex }: { stream: MediaStream; teamIndex: number }) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const audioCtxRef = useRef<AudioContext | null>(null);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;

    const ctx = canvas.getContext("2d");
    if (!ctx) return;

    const audioCtx = new AudioContext();
    const source = audioCtx.createMediaStreamSource(stream);
    const analyser = audioCtx.createAnalyser();
    analyser.fftSize = 256;
    analyser.smoothingTimeConstant = 0.7;
    source.connect(analyser);

    audioCtxRef.current = audioCtx;
    analyserRef.current = analyser;

    const bufferLength = analyser.frequencyBinCount;
    const dataArray = new Uint8Array(bufferLength);

    const color = teamIndex === 0 ? [34, 211, 238] : [251, 146, 60];

    const draw = () => {
      rafRef.current = requestAnimationFrame(draw);
      analyser.getByteFrequencyData(dataArray);

      const dpr = window.devicePixelRatio || 1;
      const w = canvas.clientWidth;
      const h = canvas.clientHeight;

      if (canvas.width !== w * dpr || canvas.height !== h * dpr) {
        canvas.width = w * dpr;
        canvas.height = h * dpr;
        ctx.scale(dpr, dpr);
      }

      ctx.clearRect(0, 0, w, h);

      const barCount = 80;
      const gap = 3;
      const barWidth = (w - gap * (barCount - 1)) / barCount;
      const minH = 3;
      const maxH = h * 0.95;

      for (let i = 0; i < barCount; i++) {
        const dataIndex = Math.floor((i / barCount) * bufferLength);
        const val = dataArray[dataIndex] / 255;
        const barH = minH + val * (maxH - minH);
        const x = i * (barWidth + gap);
        const y = h - barH;
        const alpha = 0.3 + val * 0.55;

        ctx.fillStyle = `rgba(${color[0]}, ${color[1]}, ${color[2]}, ${alpha})`;
        ctx.beginPath();
        const r = Math.min(barWidth / 2, 3);
        ctx.roundRect(x, y, barWidth, barH, [r, r, 0, 0]);
        ctx.fill();
      }
    };

    draw();

    return () => {
      cancelAnimationFrame(rafRef.current);
      source.disconnect();
      audioCtx.close();
    };
  }, [stream, teamIndex]);

  return (
    <canvas
      ref={canvasRef}
      className="h-full w-full"
      style={{ display: "block" }}
    />
  );
}

export default function RecordingControls({
  player,
  teamIndex,
  currentRole,
  onRecordingComplete,
}: {
  player: Player;
  teamIndex: number;
  currentRole: (typeof import("@/constants/game").ROLES)[number];
  onRecordingComplete: (blob: Blob) => Promise<void>;
}) {
  const [isRecording, setIsRecording] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const streamRef = useRef<MediaStream | null>(null);
  const recorderRef = useRef<MediaRecorder | null>(null);
  const chunksRef = useRef<Blob[]>([]);
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const colors = TEAM_COLORS[teamIndex] ?? TEAM_COLORS[0];

  const stopRecording = useCallback(async () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    const recorder = recorderRef.current;
    if (!recorder || recorder.state === "inactive") return;

    const blobPromise = new Promise<Blob>((resolve) => {
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: "audio/webm" });
        chunksRef.current = [];
        resolve(blob);
      };
    });

    recorder.stop();
    streamRef.current?.getTracks().forEach((t) => t.stop());
    streamRef.current = null;
    recorderRef.current = null;
    setIsRecording(false);
    setRecordingTime(0);

    const blob = await blobPromise;
    setIsUploading(true);
    try {
      await onRecordingComplete(blob);
    } finally {
      setIsUploading(false);
    }
  }, [onRecordingComplete]);

  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      streamRef.current?.getTracks().forEach((t) => t.stop());
    };
  }, []);

  const handleStart = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true });
      streamRef.current = stream;
      chunksRef.current = [];

      const recorder = new MediaRecorder(stream);
      recorder.ondataavailable = (e) => {
        if (e.data.size > 0) chunksRef.current.push(e.data);
      };
      recorderRef.current = recorder;
      recorder.start(1000);

      setIsRecording(true);
      setRecordingTime(0);
      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          if (prev >= MAX_RECORDING_TIME - 1) {
            stopRecording();
            return MAX_RECORDING_TIME;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Mic access denied:", err);
    }
  };

  const timeLeft = MAX_RECORDING_TIME - recordingTime;
  const progress = recordingTime / MAX_RECORDING_TIME;
  const R = 58;
  const circumference = 2 * Math.PI * R;

  return (
    <div className="flex w-full flex-col items-center gap-5 py-4">
      <p className="text-center text-xs font-bold uppercase tracking-wider text-white/30">
        {ROLE_CHALLENGE[currentRole.id as Role]}
      </p>

      {isUploading ? (
        <div className="flex flex-col items-center gap-4 py-8">
          <div className={`h-16 w-16 animate-spin rounded-full border-4 ${teamIndex === 0 ? "border-cyan-400" : "border-orange-400"} border-t-transparent`} />
          <p className="font-display text-sm font-black uppercase tracking-widest text-white/40">Uploading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-5">
          {/* Record button with timer ring */}
          <div className="relative flex h-[140px] w-[140px] items-center justify-center">
            <svg className="absolute inset-0 -rotate-90" viewBox="0 0 140 140">
              <circle cx="70" cy="70" r={R} fill="none" stroke="rgba(255,255,255,0.03)" strokeWidth="4" />
              {isRecording && (
                <circle
                  cx="70" cy="70" r={R} fill="none"
                  stroke={teamIndex === 0 ? "#22d3ee" : "#fb923c"}
                  strokeWidth="4" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - progress)}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              )}
            </svg>

            <AnimatePresence>
              {!isRecording && (
                <>
                  <motion.div
                    className={`absolute inset-3 rounded-full ${teamIndex === 0 ? "bg-cyan-400/8" : "bg-orange-400/8"}`}
                    animate={{ scale: [1, 1.15, 1], opacity: [0.2, 0.5, 0.2] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut" }}
                  />
                  <motion.div
                    className={`absolute inset-6 rounded-full ${teamIndex === 0 ? "bg-cyan-400/5" : "bg-orange-400/5"}`}
                    animate={{ scale: [1, 1.25, 1], opacity: [0.1, 0.3, 0.1] }}
                    transition={{ duration: 2.5, repeat: Infinity, ease: "easeInOut", delay: 0.3 }}
                  />
                </>
              )}
            </AnimatePresence>

            {isRecording && (
              <motion.div
                className={`absolute inset-2 rounded-full ${teamIndex === 0 ? "bg-cyan-400/10" : "bg-orange-400/10"}`}
                animate={{ opacity: [0.2, 0.4, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity }}
              />
            )}

            <motion.button
              onClick={isRecording ? stopRecording : handleStart}
              className={`relative z-10 flex h-24 w-24 flex-col items-center justify-center gap-1 rounded-full text-white transition-all ${
                isRecording
                  ? "bg-red-500/80 shadow-[0_0_40px_rgba(239,68,68,0.4)] backdrop-blur-sm"
                  : `${colors.bgGradient} ${colors.glowStrong}`
              }`}
              whileTap={{ scale: 0.88 }}
              whileHover={{ scale: 1.05 }}
              transition={{ type: "spring", stiffness: 400, damping: 17 }}
            >
              {isRecording ? (
                <>
                  <Square size={32} fill="currentColor" />
                  <span className="font-display text-[11px] font-black uppercase tracking-widest">{timeLeft}s</span>
                </>
              ) : (
                <Mic size={36} strokeWidth={2} />
              )}
            </motion.button>
          </div>

          {/* Recording time indicator */}
          <AnimatePresence>
            {isRecording && (
              <motion.div
                className="flex items-center gap-2"
                initial={{ opacity: 0, y: 8 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: -8 }}
              >
                <div className="h-2.5 w-2.5 animate-pulse rounded-full bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.6)]" />
                <span className="font-display text-sm font-black tabular-nums text-white/60">{recordingTime}s / {MAX_RECORDING_TIME}s</span>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      )}

      {/* Full-width real waveform — centered vertically in bottom half */}
      <AnimatePresence>
        {isRecording && streamRef.current && (
          <motion.div
            className="pointer-events-none fixed inset-x-0 bottom-[8%] z-40 h-[120px] overflow-hidden"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 30 }}
            transition={{ type: "spring", stiffness: 300, damping: 25 }}
          >
            <div className={`absolute inset-0 ${teamIndex === 0 ? "bg-gradient-to-t from-cyan-500/8 via-transparent to-transparent" : "bg-gradient-to-t from-orange-500/8 via-transparent to-transparent"}`} />
            <div className="relative h-full w-full px-2">
              <LiveWaveform stream={streamRef.current} teamIndex={teamIndex} />
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

"use client";

import { Microphone, Stop } from "@phosphor-icons/react";
import { useCallback, useEffect, useRef, useState } from "react";
import { ROLE_CHALLENGE } from "@/constants/game";
import type { Role } from "@/types/game";

interface Player {
  _id: string;
  name: string;
  avatarUrl: string;
  role: Role;
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
          if (prev >= 29) {
            stopRecording();
            return 30;
          }
          return prev + 1;
        });
      }, 1000);
    } catch (err) {
      console.error("Mic access denied:", err);
    }
  };

  const timeLeft = 30 - recordingTime;
  const circumference = 2 * Math.PI * 30;

  return (
    <div className="flex w-full flex-col items-center gap-3 py-2">
      <p className="text-center text-xs text-white/40">
        {ROLE_CHALLENGE[currentRole.id as Role]}
      </p>

      {isUploading ? (
        <div className="flex flex-col items-center gap-2 py-4">
          <div className="h-10 w-10 animate-spin rounded-full border-2 border-[var(--accent-primary)] border-t-transparent" />
          <p className="text-xs font-semibold text-white/40">Uploading...</p>
        </div>
      ) : (
        <div className="flex flex-col items-center gap-3">
          {/* Single button — toggles between REC and STOP */}
          <div className="relative flex h-[72px] w-[72px] items-center justify-center">
            {isRecording && (
              <svg className="absolute inset-0 -rotate-90" viewBox="0 0 72 72">
                <circle cx="36" cy="36" r="30" fill="none" stroke="rgba(255,255,255,0.06)" strokeWidth="3" />
                <circle
                  cx="36" cy="36" r="30" fill="none"
                  stroke="#06b6d4"
                  strokeWidth="3" strokeLinecap="round"
                  strokeDasharray={circumference}
                  strokeDashoffset={circumference * (1 - recordingTime / 30)}
                  style={{ transition: "stroke-dashoffset 1s linear" }}
                />
              </svg>
            )}
            <button
              onClick={isRecording ? stopRecording : handleStart}
              className={`relative z-10 flex h-14 w-14 flex-col items-center justify-center gap-0.5 rounded-full text-white transition-all active:scale-90 ${
                isRecording
                  ? "bg-white/15 backdrop-blur-sm hover:bg-white/25"
                  : "bg-[var(--accent-primary)] shadow-lg shadow-cyan-500/20 hover:scale-110 hover:shadow-cyan-500/40 animate-arkano-pulse"
              }`}
            >
              {isRecording ? (
                <>
                  <Stop size={22} weight="fill" />
                  <span className="text-[7px] font-black uppercase tracking-widest">{timeLeft}s</span>
                </>
              ) : (
                <>
                  <Microphone size={22} weight="fill" />
                  <span className="text-[7px] font-black uppercase tracking-widest">REC</span>
                </>
              )}
            </button>
          </div>

        </div>
      )}
    </div>
  );
}

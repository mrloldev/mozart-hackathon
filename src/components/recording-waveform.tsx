"use client";

import { useEffect, useRef, useState } from "react";

const BARS = 20;

export default function RecordingWaveform({ stream }: { stream?: MediaStream | null }) {
  const [levels, setLevels] = useState<number[]>(() => Array(BARS).fill(0.15));
  const rafRef = useRef<number | undefined>(undefined);
  const analyserRef = useRef<AnalyserNode | null>(null);
  const ctxRef = useRef<AudioContext | null>(null);

  useEffect(() => {
    if (!stream) return;

    const ctx = new AudioContext();
    const source = ctx.createMediaStreamSource(stream);
    const analyser = ctx.createAnalyser();
    analyser.fftSize = 64;
    analyser.smoothingTimeConstant = 0.75;
    source.connect(analyser);

    ctxRef.current = ctx;
    analyserRef.current = analyser;

    const dataArray = new Uint8Array(analyser.frequencyBinCount);

    const tick = () => {
      if (!analyserRef.current) return;
      analyserRef.current.getByteFrequencyData(dataArray);

      const step = Math.floor(dataArray.length / BARS);
      const newLevels = Array.from({ length: BARS }, (_, i) => {
        const start = i * step;
        let sum = 0;
        for (let j = 0; j < step && start + j < dataArray.length; j++) {
          sum += dataArray[start + j];
        }
        return Math.min(1, (sum / step / 255) * 2.5);
      });
      setLevels(newLevels);
      rafRef.current = requestAnimationFrame(tick);
    };
    rafRef.current = requestAnimationFrame(tick);

    return () => {
      if (rafRef.current) cancelAnimationFrame(rafRef.current);
      source.disconnect();
      ctx.close();
      analyserRef.current = null;
      ctxRef.current = null;
    };
  }, [stream]);

  if (!stream) {
    return (
      <div className="flex h-8 items-center justify-center gap-[2px]">
        {Array.from({ length: BARS }).map((_, i) => (
          <div
            key={i}
            className="w-[3px] rounded-full bg-cyan-500/40 animate-waveform-bar"
            style={{
              height: "100%",
              animationDelay: `${(i * 60) % 500}ms`,
              animationDuration: `${350 + (i % 4) * 80}ms`,
            }}
          />
        ))}
      </div>
    );
  }

  return (
    <div className="flex h-8 items-center justify-center gap-[2px]">
      {levels.map((level, i) => (
        <div
          key={i}
          className="w-[3px] rounded-full bg-cyan-400 transition-all duration-75 ease-out"
          style={{
            height: `${Math.max(12, level * 100)}%`,
            opacity: 0.4 + level * 0.6,
          }}
        />
      ))}
    </div>
  );
}

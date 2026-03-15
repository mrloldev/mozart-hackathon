"use client";

import { useEffect, useState } from "react";

const BARS = 80;

async function decodePeaks(url: string, bars: number): Promise<number[]> {
  const res = await fetch(url);
  const arr = await res.arrayBuffer();
  const ctx = new AudioContext();
  const buf = await ctx.decodeAudioData(arr);
  ctx.close();

  const ch0 = buf.getChannelData(0);
  const totalSamples = Math.min(buf.length, Math.floor(15 * buf.sampleRate));
  const samplesPerBar = Math.floor(totalSamples / bars);
  const peaks: number[] = [];

  for (let i = 0; i < bars; i++) {
    const start = i * samplesPerBar;
    let max = 0;
    for (let j = 0; j < samplesPerBar && start + j < totalSamples; j++) {
      const v = Math.abs(ch0[start + j]);
      if (v > max) max = v;
    }
    peaks.push(max);
  }
  return peaks;
}

export default function StaticWaveform({
  url,
  progress = 0,
  barColor = "rgba(255,255,255,0.35)",
  playedColor = "rgba(6,182,212,0.9)",
  height = 28,
}: {
  url: string;
  progress?: number;
  barColor?: string;
  playedColor?: string;
  height?: number;
}) {
  const [peaks, setPeaks] = useState<number[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setError(null);
    decodePeaks(url, BARS)
      .then((p) => {
        if (!cancelled) setPeaks(p);
      })
      .catch((e) => {
        if (!cancelled) setError(String(e));
      });
    return () => {
      cancelled = true;
    };
  }, [url]);

  if (error || !peaks) {
    return (
      <div
        className="flex items-center justify-center gap-[2px] rounded"
        style={{ height }}
      >
        {Array.from({ length: BARS }).map((_, i) => (
          <div
            key={i}
            className="w-[2px] min-w-[2px] rounded-full bg-white/20"
            style={{ height: "40%" }}
          />
        ))}
      </div>
    );
  }

  const maxPeak = Math.max(...peaks, 0.01);
  const playedIndex = Math.floor(progress * BARS);

  return (
    <div
      className="flex items-end justify-between gap-[1px] rounded overflow-hidden"
      style={{ height }}
    >
      {peaks.map((peak, i) => {
        const h = Math.max(4, (peak / maxPeak) * 100);
        const isPlayed = i < playedIndex;
        return (
          <div
            key={i}
            className="flex-1 min-w-[2px] rounded-sm transition-colors duration-150"
            style={{
              height: `${h}%`,
              backgroundColor: isPlayed ? playedColor : barColor,
            }}
          />
        );
      })}
    </div>
  );
}

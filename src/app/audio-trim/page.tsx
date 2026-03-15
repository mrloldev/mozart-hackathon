"use client";

import { useState, useRef, useCallback, useEffect, useMemo } from "react";
import AppShell from "@/components/app-shell";
import { Button } from "@/components/ui/button";
import { Card, CardBody } from "@/components/ui/card";
import {
  Upload,
  Scissors,
  Play,
  Pause,
  Download,
  AudioWaveform,
  RotateCcw,
  Check,
} from "lucide-react";

type ProcessingState = "idle" | "loading" | "ready" | "trimming" | "done";

export default function AudioTrimPage() {
  const [file, setFile] = useState<File | null>(null);
  const [audioBuffer, setAudioBuffer] = useState<AudioBuffer | null>(null);
  const [trimmedBlob, setTrimmedBlob] = useState<Blob | null>(null);
  const [state, setState] = useState<ProcessingState>("idle");
  const [isPlaying, setIsPlaying] = useState(false);
  const [playingTrimmed, setPlayingTrimmed] = useState(false);
  const [duration, setDuration] = useState(0);
  const [currentTime, setCurrentTime] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [selectionStart, setSelectionStart] = useState(0);
  const [waveformData, setWaveformData] = useState<number[]>([]);

  const audioContextRef = useRef<AudioContext | null>(null);
  const sourceNodeRef = useRef<AudioBufferSourceNode | null>(null);
  const startTimeRef = useRef(0);
  const playbackStartOffsetRef = useRef(0);
  const animationFrameRef = useRef<number | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const waveformRef = useRef<HTMLDivElement>(null);
  const isDraggingRef = useRef(false);

  const [selectionEnd, setSelectionEnd] = useState(15);
  const actualClipDuration = Math.max(0, selectionEnd - selectionStart);

  const getAudioContext = useCallback(() => {
    if (!audioContextRef.current) {
      audioContextRef.current = new AudioContext();
    }
    return audioContextRef.current;
  }, []);

  const stopPlayback = useCallback(() => {
    if (sourceNodeRef.current) {
      try {
        sourceNodeRef.current.stop();
      } catch {}
      sourceNodeRef.current = null;
    }
    if (animationFrameRef.current) {
      cancelAnimationFrame(animationFrameRef.current);
      animationFrameRef.current = null;
    }
    setIsPlaying(false);
    setCurrentTime(0);
  }, []);

  useEffect(() => {
    return () => {
      stopPlayback();
      if (audioContextRef.current) {
        audioContextRef.current.close();
      }
    };
  }, [stopPlayback]);

  const generateWaveform = useCallback((buffer: AudioBuffer) => {
    const rawData = buffer.getChannelData(0);
    const samples = 100;
    const blockSize = Math.floor(rawData.length / samples);
    const filteredData: number[] = [];

    for (let i = 0; i < samples; i++) {
      const blockStart = blockSize * i;
      let sum = 0;
      for (let j = 0; j < blockSize; j++) {
        sum += Math.abs(rawData[blockStart + j]);
      }
      filteredData.push(sum / blockSize);
    }

    const maxVal = Math.max(...filteredData);
    const normalized = filteredData.map((v) => v / maxVal);
    setWaveformData(normalized);
  }, []);

  const handleFileSelect = useCallback(
    async (selectedFile: File) => {
      setError(null);
      stopPlayback();
      setTrimmedBlob(null);
      setState("loading");

      if (!selectedFile.type.startsWith("audio/")) {
        setError("Please select a valid audio file");
        setState("idle");
        return;
      }

      setFile(selectedFile);

      try {
        const arrayBuffer = await selectedFile.arrayBuffer();
        const ctx = getAudioContext();
        const buffer = await ctx.decodeAudioData(arrayBuffer);

        setAudioBuffer(buffer);
        setDuration(buffer.duration);
        const defaultStart = Math.max(0, buffer.duration - 15);
        setSelectionStart(defaultStart);
        setSelectionEnd(buffer.duration);
        generateWaveform(buffer);
        setState("ready");
      } catch (err) {
        console.error("Failed to decode audio:", err);
        setError("Failed to decode audio file. Please try another format.");
        setState("idle");
      }
    },
    [getAudioContext, stopPlayback, generateWaveform]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const droppedFile = e.dataTransfer.files[0];
      if (droppedFile) {
        handleFileSelect(droppedFile);
      }
    },
    [handleFileSelect]
  );

  const handleInputChange = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const selectedFile = e.target.files?.[0];
      if (selectedFile) {
        handleFileSelect(selectedFile);
      }
    },
    [handleFileSelect]
  );

  const playAudioRange = useCallback(
    (buffer: AudioBuffer, startTime: number, endTime: number, isTrimmed: boolean = false) => {
      stopPlayback();

      const ctx = getAudioContext();
      if (ctx.state === "suspended") {
        ctx.resume();
      }

      const source = ctx.createBufferSource();
      source.buffer = buffer;
      source.connect(ctx.destination);

      const playDuration = endTime - startTime;

      source.onended = () => {
        setIsPlaying(false);
        setCurrentTime(0);
        setPlayingTrimmed(false);
      };

      sourceNodeRef.current = source;
      startTimeRef.current = ctx.currentTime;
      playbackStartOffsetRef.current = startTime;
      setPlayingTrimmed(isTrimmed);

      const updateTime = () => {
        if (sourceNodeRef.current) {
          const elapsed = ctx.currentTime - startTimeRef.current;
          setCurrentTime(Math.min(elapsed, playDuration));
          if (elapsed < playDuration) {
            animationFrameRef.current = requestAnimationFrame(updateTime);
          }
        }
      };

      source.start(0, startTime, playDuration);
      setIsPlaying(true);
      updateTime();
    },
    [getAudioContext, stopPlayback]
  );

  const togglePlaySelection = useCallback(() => {
    if (isPlaying && !playingTrimmed) {
      stopPlayback();
    } else if (audioBuffer) {
      playAudioRange(audioBuffer, selectionStart, selectionEnd, false);
    }
  }, [isPlaying, playingTrimmed, audioBuffer, playAudioRange, stopPlayback, selectionStart, selectionEnd]);

  const togglePlayTrimmed = useCallback(async () => {
    if (isPlaying && playingTrimmed) {
      stopPlayback();
    } else if (trimmedBlob) {
      const arrayBuffer = await trimmedBlob.arrayBuffer();
      const ctx = getAudioContext();
      const buffer = await ctx.decodeAudioData(arrayBuffer);
      playAudioRange(buffer, 0, buffer.duration, true);
    }
  }, [isPlaying, playingTrimmed, trimmedBlob, getAudioContext, playAudioRange, stopPlayback]);

  const trimAudio = useCallback(async () => {
    if (!audioBuffer) return;

    setState("trimming");
    stopPlayback();

    try {
      const ctx = getAudioContext();
      const sampleRate = audioBuffer.sampleRate;
      const channels = audioBuffer.numberOfChannels;

      const startSample = Math.floor(selectionStart * sampleRate);
      const endSample = Math.floor(selectionEnd * sampleRate);
      const trimSamples = endSample - startSample;

      const trimmedBuffer = ctx.createBuffer(channels, trimSamples, sampleRate);

      for (let channel = 0; channel < channels; channel++) {
        const sourceData = audioBuffer.getChannelData(channel);
        const targetData = trimmedBuffer.getChannelData(channel);
        for (let i = 0; i < trimSamples; i++) {
          targetData[i] = sourceData[startSample + i];
        }
      }

      const webmBlob = await audioBufferToWebm(trimmedBuffer);
      setTrimmedBlob(webmBlob);
      setState("done");
    } catch (err) {
      console.error("Failed to trim audio:", err);
      setError("Failed to trim audio. Please try again.");
      setState("ready");
    }
  }, [audioBuffer, getAudioContext, stopPlayback, selectionStart, selectionEnd]);

  const downloadTrimmed = useCallback(() => {
    if (!trimmedBlob || !file) return;

    const originalName = file.name.replace(/\.[^/.]+$/, "");
    const url = URL.createObjectURL(trimmedBlob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${originalName}_trimmed.webm`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }, [trimmedBlob, file]);

  const reset = useCallback(() => {
    stopPlayback();
    setFile(null);
    setAudioBuffer(null);
    setTrimmedBlob(null);
    setState("idle");
    setDuration(0);
    setCurrentTime(0);
    setError(null);
    setSelectionStart(0);
    setSelectionEnd(15);
    setWaveformData([]);
    if (fileInputRef.current) {
      fileInputRef.current.value = "";
    }
  }, [stopPlayback]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = Math.floor(seconds % 60);
    const ms = Math.floor((seconds % 1) * 10);
    return `${mins}:${secs.toString().padStart(2, "0")}.${ms}`;
  };

  const handleWaveformInteraction = useCallback(
    (clientX: number) => {
      if (!waveformRef.current || duration === 0) return;

      const rect = waveformRef.current.getBoundingClientRect();
      const x = clientX - rect.left;
      const percentage = Math.max(0, Math.min(1, x / rect.width));
      const clickTime = percentage * duration;

      const currentDuration = selectionEnd - selectionStart;
      const halfDuration = currentDuration / 2;
      const newStart = Math.max(0, Math.min(duration - currentDuration, clickTime - halfDuration));
      const newEnd = Math.min(duration, newStart + currentDuration);
      
      setSelectionStart(newStart);
      setSelectionEnd(newEnd);
      setTrimmedBlob(null);
      if (state === "done") setState("ready");
    },
    [duration, state, selectionStart, selectionEnd]
  );

  const parseTimeInput = (value: string): number | null => {
    const trimmed = value.trim();
    
    if (/^\d+(\.\d+)?$/.test(trimmed)) {
      return parseFloat(trimmed);
    }
    
    const mmss = trimmed.match(/^(\d+):(\d+(?:\.\d+)?)$/);
    if (mmss) {
      return parseInt(mmss[1]) * 60 + parseFloat(mmss[2]);
    }
    
    return null;
  };

  const handleStartChange = (value: string) => {
    const parsed = parseTimeInput(value);
    if (parsed !== null && parsed >= 0 && parsed < selectionEnd && parsed <= duration) {
      setSelectionStart(parsed);
      setTrimmedBlob(null);
      if (state === "done") setState("ready");
    }
  };

  const handleEndChange = (value: string) => {
    const parsed = parseTimeInput(value);
    if (parsed !== null && parsed > selectionStart && parsed <= duration) {
      setSelectionEnd(parsed);
      setTrimmedBlob(null);
      if (state === "done") setState("ready");
    }
  };

  const handleMouseDown = useCallback(
    (e: React.MouseEvent) => {
      isDraggingRef.current = true;
      handleWaveformInteraction(e.clientX);
    },
    [handleWaveformInteraction]
  );

  const handleMouseMove = useCallback(
    (e: React.MouseEvent) => {
      if (isDraggingRef.current) {
        handleWaveformInteraction(e.clientX);
      }
    },
    [handleWaveformInteraction]
  );

  const handleMouseUp = useCallback(() => {
    isDraggingRef.current = false;
  }, []);

  const handleTouchStart = useCallback(
    (e: React.TouchEvent) => {
      isDraggingRef.current = true;
      handleWaveformInteraction(e.touches[0].clientX);
    },
    [handleWaveformInteraction]
  );

  const handleTouchMove = useCallback(
    (e: React.TouchEvent) => {
      if (isDraggingRef.current) {
        handleWaveformInteraction(e.touches[0].clientX);
      }
    },
    [handleWaveformInteraction]
  );

  useEffect(() => {
    const handleGlobalMouseUp = () => {
      isDraggingRef.current = false;
    };
    window.addEventListener("mouseup", handleGlobalMouseUp);
    window.addEventListener("touchend", handleGlobalMouseUp);
    return () => {
      window.removeEventListener("mouseup", handleGlobalMouseUp);
      window.removeEventListener("touchend", handleGlobalMouseUp);
    };
  }, []);

  const selectionLeftPercent = useMemo(
    () => (duration > 0 ? (selectionStart / duration) * 100 : 0),
    [selectionStart, duration]
  );

  const selectionWidthPercent = useMemo(
    () => (duration > 0 ? (actualClipDuration / duration) * 100 : 0),
    [actualClipDuration, duration]
  );

  return (
    <AppShell>
      <main className="mx-auto max-w-2xl px-4 py-8 sm:px-6 sm:py-12">
        <div className="mb-8 text-center">
          <h1 className="font-display text-2xl font-bold tracking-tight sm:text-3xl">
            Audio Trimmer
          </h1>
          <p className="mt-2 text-[var(--muted-foreground)]">
            Upload an audio file and select the segment to extract
          </p>
        </div>

        {error && (
          <div className="mb-6 rounded-[var(--radius-md)] border border-[var(--error)]/30 bg-[var(--error)]/10 px-4 py-3 text-center text-sm text-[var(--error)]">
            {error}
          </div>
        )}

        {state === "idle" && (
          <Card>
            <CardBody>
              <div
                onDrop={handleDrop}
                onDragOver={(e) => e.preventDefault()}
                onClick={() => fileInputRef.current?.click()}
                className="flex cursor-pointer flex-col items-center justify-center gap-4 rounded-[var(--radius-lg)] border-2 border-dashed border-[var(--border)] py-16 transition-all duration-200 hover:border-[var(--accent-primary)] hover:bg-[var(--surface)]"
              >
                <div className="flex h-14 w-14 items-center justify-center rounded-full bg-[var(--accent-primary)]/10">
                  <Upload
                    size={28}
                    strokeWidth={2.5}
                    className="text-[var(--accent-primary)]"
                  />
                </div>
                <div className="text-center">
                  <p className="font-medium">
                    Drop your audio file here or click to browse
                  </p>
                  <p className="mt-1 text-sm text-[var(--muted-foreground)]">
                    Supports MP3, WAV, OGG, M4A, and more
                  </p>
                </div>
              </div>
              <input
                ref={fileInputRef}
                type="file"
                accept="audio/*"
                onChange={handleInputChange}
                className="hidden"
              />
            </CardBody>
          </Card>
        )}

        {state === "loading" && (
          <Card>
            <CardBody className="flex flex-col items-center justify-center py-16">
              <div className="flex gap-1">
                {[0, 1, 2, 3, 4].map((i) => (
                  <div
                    key={i}
                    className="h-8 w-1.5 rounded-full bg-[var(--accent-primary)] animate-waveform-bar"
                    style={{ animationDelay: `${i * 0.1}s` }}
                  />
                ))}
              </div>
              <p className="mt-4 text-[var(--muted-foreground)]">Loading audio...</p>
            </CardBody>
          </Card>
        )}

        {(state === "ready" || state === "trimming" || state === "done") && (
          <div className="space-y-4">
            <Card>
              <CardBody>
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-[var(--radius-md)] bg-[var(--accent-primary)]/10">
                    <AudioWaveform size={20} strokeWidth={2.5} className="text-[var(--accent-primary)]" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{file?.name}</p>
                    <p className="text-sm text-[var(--muted-foreground)]">
                      Duration: {formatTime(duration)}
                    </p>
                  </div>
                </div>

                <div className="mb-2">
                  <p className="mb-3 text-sm text-[var(--muted-foreground)]">
                    Drag the waveform or edit the times below
                  </p>

                  <div
                    ref={waveformRef}
                    onMouseDown={handleMouseDown}
                    onMouseMove={handleMouseMove}
                    onMouseUp={handleMouseUp}
                    onMouseLeave={handleMouseUp}
                    onTouchStart={handleTouchStart}
                    onTouchMove={handleTouchMove}
                    onTouchEnd={handleMouseUp}
                    className="relative h-20 cursor-crosshair select-none overflow-hidden rounded-[var(--radius-md)] bg-[var(--surface)]"
                  >
                    {/* Dimmed areas */}
                    <div
                      className="absolute inset-y-0 left-0 bg-black/50"
                      style={{ width: `${selectionLeftPercent}%` }}
                    />
                    <div
                      className="absolute inset-y-0 right-0 bg-black/50"
                      style={{ width: `${100 - selectionLeftPercent - selectionWidthPercent}%` }}
                    />

                    {/* Selection highlight */}
                    <div
                      className="absolute inset-y-0 border-x-2 border-[var(--accent-primary)] bg-[var(--accent-primary)]/20"
                      style={{
                        left: `${selectionLeftPercent}%`,
                        width: `${selectionWidthPercent}%`,
                      }}
                    >
                      {/* Drag handles */}
                      <div className="absolute -left-1 top-1/2 h-8 w-2 -translate-y-1/2 rounded-full bg-[var(--accent-primary)]" />
                      <div className="absolute -right-1 top-1/2 h-8 w-2 -translate-y-1/2 rounded-full bg-[var(--accent-primary)]" />
                    </div>

                    {/* Waveform visualization */}
                    <div className="absolute inset-0 flex items-center justify-center px-1">
                      <div className="flex h-full w-full items-center gap-px">
                        {waveformData.map((value, i) => {
                          const barPosition = (i / waveformData.length) * 100;
                          const isInSelection =
                            barPosition >= selectionLeftPercent &&
                            barPosition <= selectionLeftPercent + selectionWidthPercent;
                          return (
                            <div
                              key={i}
                              className={`flex-1 rounded-full transition-colors ${
                                isInSelection
                                  ? "bg-[var(--accent-primary)]"
                                  : "bg-[var(--foreground)]/20"
                              }`}
                              style={{
                                height: `${Math.max(10, value * 90)}%`,
                              }}
                            />
                          );
                        })}
                      </div>
                    </div>

                    {/* Playback indicator */}
                    {isPlaying && !playingTrimmed && (
                      <div
                        className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                        style={{
                          left: `${selectionLeftPercent + (currentTime / actualClipDuration) * selectionWidthPercent}%`,
                        }}
                      />
                    )}
                  </div>

                  {/* Time markers */}
                  <div className="mt-2 flex items-center justify-between text-xs text-[var(--muted-foreground)]">
                    <span>0:00</span>
                    <span>{formatTime(duration)}</span>
                  </div>
                </div>

                {/* Selection inputs */}
                <div className="mb-4 flex items-center gap-3">
                  <div className="flex items-center gap-2">
                    <TimeInput
                      value={selectionStart}
                      onChange={handleStartChange}
                      max={duration}
                    />
                    <span className="text-[var(--muted-foreground)]">–</span>
                    <TimeInput
                      value={selectionEnd}
                      onChange={handleEndChange}
                      max={duration}
                    />
                  </div>
                  <span className="text-sm text-[var(--muted-foreground)]">
                    ({actualClipDuration.toFixed(1)}s)
                  </span>
                </div>

                <div className="flex flex-wrap gap-2">
                  <Button
                    variant="secondary"
                    size="sm"
                    onClick={togglePlaySelection}
                    leftIcon={
                      isPlaying && !playingTrimmed ? (
                        <Pause size={18} strokeWidth={2.5} />
                      ) : (
                        <Play size={18} strokeWidth={2.5} />
                      )
                    }
                  >
                    {isPlaying && !playingTrimmed ? "Pause" : "Preview Selection"}
                  </Button>

                  {state !== "done" && (
                    <Button
                      variant="primary"
                      size="sm"
                      onClick={trimAudio}
                      disabled={state === "trimming"}
                      leftIcon={<Scissors size={18} strokeWidth={2.5} />}
                    >
                      {state === "trimming" ? "Trimming..." : "Trim Selection"}
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={reset}
                    leftIcon={<RotateCcw size={18} strokeWidth={2.5} />}
                  >
                    Reset
                  </Button>
                </div>
              </CardBody>
            </Card>

            {state === "done" && trimmedBlob && (
              <Card variant="elevated">
                <CardBody>
                  <div className="mb-4 flex items-center gap-3">
                    <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-full bg-[var(--success)]/10">
                      <Check size={20} strokeWidth={2.5} className="text-[var(--success)]" />
                    </div>
                    <div>
                      <p className="font-medium">Trimmed Successfully</p>
                      <p className="text-sm text-[var(--muted-foreground)]">
                        {actualClipDuration.toFixed(1)} seconds extracted
                      </p>
                    </div>
                  </div>

                  <div className="mb-4 relative h-12 overflow-hidden rounded-[var(--radius-md)] bg-[var(--accent-primary)]/10">
                    <div className="flex h-full w-full items-center justify-center px-2">
                      <div className="flex h-full w-full items-center gap-px">
                        {waveformData
                          .slice(
                            Math.floor((selectionStart / duration) * waveformData.length),
                            Math.ceil((selectionEnd / duration) * waveformData.length)
                          )
                          .map((value, i) => (
                            <div
                              key={i}
                              className="flex-1 rounded-full bg-[var(--accent-primary)]"
                              style={{ height: `${Math.max(15, value * 85)}%` }}
                            />
                          ))}
                      </div>
                    </div>
                    {isPlaying && playingTrimmed && (
                      <div
                        className="absolute inset-y-0 w-0.5 bg-white shadow-[0_0_8px_rgba(255,255,255,0.5)]"
                        style={{
                          left: `${(currentTime / actualClipDuration) * 100}%`,
                        }}
                      />
                    )}
                  </div>

                  <div className="flex flex-wrap gap-2">
                    <Button
                      variant="secondary"
                      size="sm"
                      onClick={togglePlayTrimmed}
                      leftIcon={
                        isPlaying && playingTrimmed ? (
                          <Pause size={18} strokeWidth={2.5} />
                        ) : (
                          <Play size={18} strokeWidth={2.5} />
                        )
                      }
                    >
                      {isPlaying && playingTrimmed ? "Pause" : "Preview Trimmed"}
                    </Button>

                    <Button
                      variant="primary"
                      size="sm"
                      onClick={downloadTrimmed}
                      leftIcon={<Download size={18} strokeWidth={2.5} />}
                    >
                      Download WebM
                    </Button>
                  </div>
                </CardBody>
              </Card>
            )}
          </div>
        )}
      </main>
    </AppShell>
  );
}

function TimeInput({
  value,
  onChange,
  max,
}: {
  value: number;
  onChange: (value: string) => void;
  max: number;
}) {
  const [inputValue, setInputValue] = useState("");
  const [isFocused, setIsFocused] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);

  const formatForDisplay = (seconds: number) => {
    const s = Math.floor(seconds);
    return `${s}s`;
  };

  useEffect(() => {
    if (!isFocused) {
      setInputValue(formatForDisplay(value));
    }
  }, [value, isFocused]);

  const handleFocus = () => {
    setIsFocused(true);
    setInputValue(value.toFixed(1));
    setTimeout(() => inputRef.current?.select(), 0);
  };

  const handleBlur = () => {
    setIsFocused(false);
    onChange(inputValue);
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === "Enter") {
      onChange(inputValue);
      inputRef.current?.blur();
    }
    if (e.key === "Escape") {
      setInputValue(formatForDisplay(value));
      inputRef.current?.blur();
    }
  };

  return (
    <input
      ref={inputRef}
      type="text"
      value={inputValue}
      onChange={(e) => setInputValue(e.target.value)}
      onFocus={handleFocus}
      onBlur={handleBlur}
      onKeyDown={handleKeyDown}
      className="w-16 rounded-[var(--radius-sm)] border border-[var(--border)] bg-[var(--surface)] px-2 py-1.5 text-center text-sm font-medium transition-colors hover:border-[var(--border-hover)] focus:border-[var(--accent-primary)] focus:outline-none"
    />
  );
}

async function audioBufferToWebm(buffer: AudioBuffer): Promise<Blob> {
  const audioContext = new AudioContext();
  const dest = audioContext.createMediaStreamDestination();
  
  const source = audioContext.createBufferSource();
  source.buffer = buffer;
  source.connect(dest);

  const mimeType = MediaRecorder.isTypeSupported("audio/webm;codecs=opus")
    ? "audio/webm;codecs=opus"
    : "audio/webm";

  const mediaRecorder = new MediaRecorder(dest.stream, { mimeType });
  const chunks: Blob[] = [];

  return new Promise((resolve, reject) => {
    mediaRecorder.ondataavailable = (e) => {
      if (e.data.size > 0) {
        chunks.push(e.data);
      }
    };

    mediaRecorder.onstop = () => {
      audioContext.close();
      resolve(new Blob(chunks, { type: "audio/webm" }));
    };

    mediaRecorder.onerror = (e) => {
      audioContext.close();
      reject(e);
    };

    mediaRecorder.start();
    source.start();

    source.onended = () => {
      mediaRecorder.stop();
    };
  });
}

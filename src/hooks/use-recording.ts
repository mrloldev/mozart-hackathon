import { useCallback, useEffect, useRef, useState } from "react";
import { MAX_RECORDING_TIME } from "@/constants/game";

export function useRecording(onStop: () => void) {
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const intervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  const handleStop = useCallback(() => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    setIsRecording(false);
    setRecordingTime(0);
    onStop();
  }, [onStop]);

  const handleStart = useCallback(() => {
    setIsRecording(true);
    intervalRef.current = setInterval(() => {
      setRecordingTime((prev) => {
        if (prev >= MAX_RECORDING_TIME - 1) {
          if (intervalRef.current) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
          }
          setTimeout(() => handleStop(), 0);
          return MAX_RECORDING_TIME;
        }
        return prev + 1;
      });
    }, 1000);
  }, [handleStop]);

  useEffect(() => {
    return () => {
      if (intervalRef.current) clearInterval(intervalRef.current);
    };
  }, []);

  return {
    isRecording,
    recordingTime,
    handleStartRecording: handleStart,
    handleStopRecording: handleStop,
  };
}

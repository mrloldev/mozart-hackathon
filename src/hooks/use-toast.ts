import { useCallback, useState } from "react";

export function useToast(duration = 3000): [string | null, (message: string) => void] {
  const [toast, setToast] = useState<string | null>(null);

  const showToast = useCallback(
    (message: string) => {
      setToast(message);
      setTimeout(() => setToast(null), duration);
    },
    [duration]
  );

  return [toast, showToast];
}

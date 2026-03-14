import { isOnboardingCompleted, setOnboardingCompleted } from "@/lib/onboarding";
import { useEffect, useState } from "react";

export function useOnboarding() {
  const [loading, setLoading] = useState(true);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    isOnboardingCompleted().then((value) => {
      setCompleted(value);
      setLoading(false);
    });
  }, []);

  const completeOnboarding = async () => {
    await setOnboardingCompleted();
    setCompleted(true);
  };

  return { loading, completed, completeOnboarding };
}

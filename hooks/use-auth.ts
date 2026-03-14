import {
  AuthCache,
  clearAuthCache,
  getAuthCache,
  isCacheStale,
  updateAuthCache,
} from "@/lib/auth-cache";
import { supabase } from "@/lib/supabase";
import { Session } from "@supabase/supabase-js";
import { useEffect, useRef, useState } from "react";

async function validateSessionInBackground(session: Session): Promise<boolean> {
  try {
    const { error } = await supabase.auth.getUser();
    if (error) {
      if (__DEV__) console.log("[use-auth] Background validation failed:", error.message);
      await supabase.auth.signOut();
      return false;
    }
    return true;
  } catch (e) {
    if (__DEV__) console.log("[use-auth] Background validation error (likely offline):", e);
    return true;
  }
}

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(true);
  const [cachedAuthData, setCachedAuthData] = useState<AuthCache | null>(null);
  const [isValidating, setIsValidating] = useState(false);
  const hasValidatedRef = useRef(false);

  useEffect(() => {
    let isMounted = true;

    async function initAuth() {
      const [cachedData, { data: sessionData }] = await Promise.all([
        getAuthCache(),
        supabase.auth.getSession(),
      ]);

      if (!isMounted) return;

      if (cachedData) {
        setCachedAuthData(cachedData);
      }

      setSession(sessionData.session);
      setLoading(false);

      if (sessionData.session && !hasValidatedRef.current) {
        hasValidatedRef.current = true;
        setIsValidating(true);

        const shouldRevalidate = !cachedData || isCacheStale(cachedData);

        if (shouldRevalidate) {
          const isValid = await validateSessionInBackground(sessionData.session);
          if (!isMounted) return;

          if (!isValid) {
            setSession(null);
            setCachedAuthData(null);
            await clearAuthCache();
          } else {
            await updateAuthCache({
              lastValidated: Date.now(),
              spotifyConnected: !!sessionData.session.provider_token,
            });
          }
        }

        if (isMounted) {
          setIsValidating(false);
        }
      }
    }

    initAuth();

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(async (event, newSession) => {
      if (!isMounted) return;

      setSession(newSession);
      setLoading(false);

      if (event === "SIGNED_OUT") {
        setCachedAuthData(null);
        hasValidatedRef.current = false;
        await clearAuthCache();
      } else if (event === "SIGNED_IN" && newSession) {
        hasValidatedRef.current = false;
        setCachedAuthData(null);
        await updateAuthCache({
          lastValidated: Date.now(),
          spotifyConnected: !!newSession.provider_token,
        });
      }
    });

    return () => {
      isMounted = false;
      subscription.unsubscribe();
    };
  }, []);

  return {
    session,
    loading,
    isAuthenticated: !!session,
    cachedAuthData,
    isValidating,
    spotifyToken: session?.provider_token ?? null,
    user: session?.user ?? null,
  };
}

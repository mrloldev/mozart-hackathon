import * as AuthSession from "expo-auth-session";
import * as WebBrowser from "expo-web-browser";
import { clearAuthCache } from "./auth-cache";
import { supabase } from "./supabase";

WebBrowser.maybeCompleteAuthSession();

const redirectUri = AuthSession.makeRedirectUri({
  scheme: "remixer",
  path: "auth/callback",
});

export async function signInWithSpotify() {
  try {
    if (__DEV__) {
      console.log("[auth] Redirect URI:", redirectUri);
    }

    const res = await supabase.auth.signInWithOAuth({
      provider: "spotify",
      options: {
        redirectTo: redirectUri,
        scopes:
          "user-read-email user-read-private playlist-read-private playlist-read-collaborative user-library-read",
        skipBrowserRedirect: true,
      },
    });

    const spotifyOAuthUrl = res.data.url;

    if (!spotifyOAuthUrl) {
      throw new Error("No OAuth URL found!");
    }

    if (__DEV__) {
      console.log("[auth] Opening OAuth URL");
    }

    const result = await WebBrowser.openAuthSessionAsync(
      spotifyOAuthUrl,
      redirectUri,
      { showInRecents: true }
    );

    if (__DEV__) {
      console.log("[auth] Browser result type:", result.type);
      if (result.type === "success") {
        console.log("[auth] Callback URL:", result.url);
      }
    }

    if (result.type === "success") {
      const params = extractParamsFromUrl(result.url);

      if (params.access_token && params.refresh_token) {
        const { data, error } = await supabase.auth.setSession({
          access_token: params.access_token,
          refresh_token: params.refresh_token,
        });

        if (error) throw error;

        return data.session;
      } else {
        throw new Error("Spotify sign in failed - missing tokens in callback URL");
      }
    } else if (result.type === "cancel" || result.type === "dismiss") {
      throw new Error("Spotify sign in was cancelled by user");
    } else {
      throw new Error(`Spotify sign in failed with result type: ${result.type}`);
    }
  } catch (error) {
    throw error;
  }
}

export async function signInWithEmail(email: string, password: string) {
  const { data, error } = await supabase.auth.signInWithPassword({
    email,
    password,
  });
  if (error) throw error;
  return data.session;
}

export async function signUpWithEmail(
  email: string,
  password: string,
  fullName?: string
) {
  const { data, error } = await supabase.auth.signUp({
    email,
    password,
    options: fullName ? { data: { full_name: fullName.trim() } } : undefined,
  });
  if (error) throw error;

  if (data.user && fullName?.trim()) {
    await supabase
      .from("profiles")
      .upsert(
        { id: data.user.id, full_name: fullName.trim() },
        { onConflict: "id" }
      );
  }

  return data.session;
}

function extractParamsFromUrl(url: string) {
  const parsedUrl = new URL(url);
  const hash = parsedUrl.hash.substring(1);
  const params = new URLSearchParams(hash);

  return {
    access_token: params.get("access_token"),
    expires_in: parseInt(params.get("expires_in") || "0"),
    refresh_token: params.get("refresh_token"),
    token_type: params.get("token_type"),
    provider_token: params.get("provider_token"),
    code: params.get("code"),
  };
}

export async function signOut() {
  try {
    await clearAuthCache();
    await supabase.auth.signOut();
  } catch (error) {
    throw error;
  }
}

export async function getSpotifyAccessToken(): Promise<string | null> {
  const { data } = await supabase.auth.getSession();
  return data.session?.provider_token ?? null;
}

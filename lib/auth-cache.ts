import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const AUTH_CACHE_KEY = "remixer_auth_cache";

export interface AuthCache {
  lastValidated: number;
  spotifyConnected: boolean;
}

async function getItem(key: string): Promise<string | null> {
  if (Platform.OS === "web") {
    return localStorage.getItem(key);
  }
  return SecureStore.getItemAsync(key);
}

async function setItem(key: string, value: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.setItem(key, value);
    return;
  }
  return SecureStore.setItemAsync(key, value);
}

async function removeItem(key: string): Promise<void> {
  if (Platform.OS === "web") {
    localStorage.removeItem(key);
    return;
  }
  return SecureStore.deleteItemAsync(key);
}

export async function getAuthCache(): Promise<AuthCache | null> {
  try {
    const cached = await getItem(AUTH_CACHE_KEY);
    if (!cached) return null;
    return JSON.parse(cached) as AuthCache;
  } catch {
    return null;
  }
}

async function setAuthCache(data: AuthCache): Promise<void> {
  try {
    await setItem(AUTH_CACHE_KEY, JSON.stringify(data));
  } catch (error) {
    console.error("[auth-cache] Failed to save cache:", error);
  }
}

export async function updateAuthCache(
  updates: Partial<AuthCache>
): Promise<void> {
  try {
    const current = await getAuthCache();
    const updated: AuthCache = {
      lastValidated: updates.lastValidated ?? current?.lastValidated ?? Date.now(),
      spotifyConnected: updates.spotifyConnected ?? current?.spotifyConnected ?? false,
    };
    await setAuthCache(updated);
  } catch (error) {
    console.error("[auth-cache] Failed to update cache:", error);
  }
}

export async function clearAuthCache(): Promise<void> {
  try {
    await removeItem(AUTH_CACHE_KEY);
  } catch (error) {
    console.error("[auth-cache] Failed to clear cache:", error);
  }
}

const CACHE_STALE_THRESHOLD = 24 * 60 * 60 * 1000; // 24 hours

export function isCacheStale(cache: AuthCache): boolean {
  return Date.now() - cache.lastValidated > CACHE_STALE_THRESHOLD;
}

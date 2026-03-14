import * as SecureStore from "expo-secure-store";
import { Platform } from "react-native";

const ONBOARDING_KEY = "remixer_onboarding_completed";
const PLACES_KEY = "remixer_user_places";

export interface Place {
  id: string;
  name: string;
  address: string;
  latitude: number;
  longitude: number;
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

export async function isOnboardingCompleted(): Promise<boolean> {
  const value = await getItem(ONBOARDING_KEY);
  return value === "true";
}

export async function setOnboardingCompleted(): Promise<void> {
  await setItem(ONBOARDING_KEY, "true");
}

export async function getUserPlaces(): Promise<Place[]> {
  const value = await getItem(PLACES_KEY);
  if (!value) return [];
  try {
    return JSON.parse(value) as Place[];
  } catch {
    return [];
  }
}

export async function saveUserPlaces(places: Place[]): Promise<void> {
  await setItem(PLACES_KEY, JSON.stringify(places));
}

export async function addUserPlace(place: Place): Promise<void> {
  const places = await getUserPlaces();
  places.push(place);
  await saveUserPlaces(places);
}

export async function removeUserPlace(placeId: string): Promise<void> {
  const places = await getUserPlaces();
  const filtered = places.filter((p) => p.id !== placeId);
  await saveUserPlaces(filtered);
}

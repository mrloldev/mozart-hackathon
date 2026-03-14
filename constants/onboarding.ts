export const MUSIC_GENRES = [
  { id: "pop", label: "Pop", emoji: "🎤" },
  { id: "hiphop", label: "Hip Hop", emoji: "🎧" },
  { id: "rock", label: "Rock", emoji: "🎸" },
  { id: "electronic", label: "Electronic", emoji: "🎹" },
  { id: "rnb", label: "R&B", emoji: "💜" },
  { id: "jazz", label: "Jazz", emoji: "🎷" },
  { id: "classical", label: "Classical", emoji: "🎻" },
  { id: "reggaeton", label: "Reggaeton", emoji: "🔥" },
  { id: "indie", label: "Indie", emoji: "🌙" },
  { id: "metal", label: "Metal", emoji: "🤘" },
  { id: "country", label: "Country", emoji: "🤠" },
  { id: "latin", label: "Latin", emoji: "💃" },
];

export const LISTENING_MOODS = [
  { id: "energetic", label: "Energetic", emoji: "⚡" },
  { id: "chill", label: "Chill", emoji: "😌" },
  { id: "focus", label: "Focus", emoji: "🎯" },
  { id: "party", label: "Party", emoji: "🎉" },
  { id: "workout", label: "Workout", emoji: "💪" },
  { id: "sleep", label: "Sleep", emoji: "😴" },
  { id: "romantic", label: "Romantic", emoji: "❤️" },
  { id: "sad", label: "Sad", emoji: "😢" },
];

export const DISCOVERY_PREFERENCES = [
  { id: "new_releases", label: "New Releases", description: "Fresh tracks from your favorite artists" },
  { id: "hidden_gems", label: "Hidden Gems", description: "Undiscovered artists and underground tracks" },
  { id: "classics", label: "Classics", description: "Timeless hits and throwbacks" },
  { id: "trending", label: "Trending Now", description: "What's popular right now" },
];

export type OnboardingStep =
  | "welcome"
  | "genres"
  | "moods"
  | "discovery"
  | "location"
  | "places"
  | "complete";

export const ONBOARDING_STEPS: OnboardingStep[] = [
  "welcome",
  "genres",
  "moods",
  "discovery",
  "location",
  "places",
  "complete",
];

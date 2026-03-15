const pick = <T,>(arr: T[]): T => arr[Math.floor(Math.random() * arr.length)];

const TEAM_NAMES = [
  "Neon Pulse",
  "Blaze Crew",
  "Sonic Wave",
  "Midnight Beats",
  "Electric Dreams",
  "Phantom Rhythms",
  "Cosmic Bass",
  "Velvet Voices",
  "Rogue Harmony",
  "Storm Chasers",
  "Golden Era",
  "Lunar Tunes",
  "Fire & Ice",
  "Street Symphony",
  "Neon Knights",
  "Beat Brigade",
  "Melody Mafia",
  "Vocal Vandals",
  "Rhythm Rebels",
  "Sound Soldiers",
];

const PLAYER_NICKNAMES = [
  "Ace",
  "Blaze",
  "Cipher",
  "Delta",
  "Echo",
  "Flash",
  "Ghost",
  "Hex",
  "Ivy",
  "Jade",
  "Kilo",
  "Luna",
  "Nova",
  "Omega",
  "Prism",
  "Quartz",
  "Raven",
  "Storm",
  "Terra",
  "Vex",
  "Wren",
  "Zen",
  "Ash",
  "Bolt",
  "Cobalt",
  "Dune",
  "Ember",
  "Flux",
  "Grove",
  "Haze",
  "Jett",
];

export function randomTeamName(seed?: string): string {
  if (seed) {
    const state = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return TEAM_NAMES[state % TEAM_NAMES.length];
  }
  return pick(TEAM_NAMES);
}

export function randomPlayerName(seed?: string): string {
  if (seed) {
    const state = seed.split("").reduce((a, c) => a + c.charCodeAt(0), 0);
    return PLAYER_NICKNAMES[state % PLAYER_NICKNAMES.length];
  }
  return pick(PLAYER_NICKNAMES);
}

function shuffle<T>(arr: T[]): T[] {
  const out = [...arr];
  for (let i = out.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [out[i], out[j]] = [out[j], out[i]];
  }
  return out;
}

export function randomUniquePlayerNames(count: number): string[] {
  return shuffle([...PLAYER_NICKNAMES]).slice(0, count);
}

export function randomUniqueTeamNames(count: number): string[] {
  return shuffle([...TEAM_NAMES]).slice(0, count);
}

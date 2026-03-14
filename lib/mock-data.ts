export type VibeId = 'gym' | 'cooking' | 'focus' | 'driving';

export const VIBES: { id: VibeId; label: string; icon: string; color: string; description: string }[] = [
  { id: 'gym', label: 'Gym', icon: 'figure.run', color: '#ef4444', description: 'BPM optimized for your workout' },
  { id: 'cooking', label: 'Cooking', icon: 'frying.pan.fill', color: '#f59e0b', description: 'Upbeat and energizing' },
  { id: 'focus', label: 'Focus', icon: 'scope', color: '#06b6d4', description: 'Deep focus and concentration' },
  { id: 'driving', label: 'Driving', icon: 'car.fill', color: '#8b5cf6', description: 'Optimized for road noise' },
];

export type VersionType = 'Gym' | 'Cooking' | 'Focus' | 'Driving' | 'Original';

export interface Track {
  id: string;
  title: string;
  artist: string;
  coverUrl: string;
  version: VersionType;
  vibeId: VibeId;
  versionDescription?: string;
  playCount?: number;
  duration?: number;
  bpm?: number;
}

export const VERSION_COLORS: Record<VersionType, string> = {
  Gym: '#ef4444',
  Cooking: '#f59e0b',
  Focus: '#06b6d4',
  Driving: '#8b5cf6',
  Original: '#71717a',
};

export const VERSION_DESCRIPTIONS: Record<VersionType, string> = {
  Gym: 'BPM optimized, consistent energy for your workout',
  Cooking: 'Upbeat and energizing for the kitchen',
  Focus: 'Deep focus and concentration for work',
  Driving: 'Bass and mids boosted for road noise',
  Original: 'Original recording',
};

const COVERS = [
  'https://coverartarchive.org/release/c400ecc6-74a5-47ba-a96a-0f0cdf454642/26139758068-500.jpg',
  'https://coverartarchive.org/release/2853ab0d-a6d2-4c6d-9b8a-0bd1bb29cc2c/34604222183-500.jpg',
  'https://coverartarchive.org/release/907977c7-debd-40c5-aedf-330fd3e01a32/36362912390-500.jpg',
  'https://coverartarchive.org/release/532c81ff-1867-43f3-ac21-3f1ecfa2db07/26608390428-500.jpg',
  'https://coverartarchive.org/release/cbfcb90c-6a08-40cc-aaa9-0da740ac2aff/36995041720-500.jpg',
  'https://coverartarchive.org/release/d188e150-a64d-4012-97aa-06cfc0037be8/33900298106-500.jpg',
  'https://coverartarchive.org/release/1308acf9-a4af-4f1e-ab8c-341509262809/15618217317-500.jpg',
  'https://coverartarchive.org/release/88788721-78f6-48f5-8ad0-da71bab56a26/26617045038-500.jpg',
  'https://coverartarchive.org/release/d9e61c4a-44d2-4fc3-af80-45ce233692ff/9437402171-500.jpg',
  'https://coverartarchive.org/release/6f33c1c4-9dee-4b0a-9c0e-8e5c5e5e5e5e/1-500.jpg',
];

interface MockSong {
  title: string;
  artist: string;
  coverUrl: string;
  duration: number;
  playCount: number;
  bpm?: number;
}

const MOCK_SONGS: MockSong[] = [
  { title: 'Blinding Lights', artist: 'The Weeknd', coverUrl: COVERS[0], duration: 200, playCount: 1240000, bpm: 128 },
  { title: 'Flowers', artist: 'Miley Cyrus', coverUrl: COVERS[1], duration: 213, playCount: 890000 },
  { title: 'Paint The Town Red', artist: 'Doja Cat', coverUrl: COVERS[2], duration: 221, playCount: 756000 },
  { title: 'Heat Waves', artist: 'Glass Animals', coverUrl: COVERS[3], duration: 239, playCount: 2100000, bpm: 112 },
  { title: 'Levitating', artist: 'Dua Lipa', coverUrl: COVERS[4], duration: 203, playCount: 980000, bpm: 103 },
  { title: 'Anti-Hero', artist: 'Taylor Swift', coverUrl: COVERS[5], duration: 200, playCount: 1560000 },
  { title: 'Shape of You', artist: 'Ed Sheeran', coverUrl: COVERS[6], duration: 234, playCount: 1850000, bpm: 96 },
  { title: 'Bad Guy', artist: 'Billie Eilish', coverUrl: COVERS[7], duration: 194, playCount: 1420000, bpm: 135 },
  { title: 'Shake It Off', artist: 'Taylor Swift', coverUrl: COVERS[8], duration: 219, playCount: 1680000, bpm: 160 },
  { title: 'Watermelon Sugar', artist: 'Harry Styles', coverUrl: COVERS[9], duration: 174, playCount: 1340000, bpm: 95 },
  { title: 'Good 4 U', artist: 'Olivia Rodrigo', coverUrl: COVERS[1], duration: 178, playCount: 1120000, bpm: 166 },
  { title: 'Save Your Tears', artist: 'The Weeknd', coverUrl: COVERS[0], duration: 215, playCount: 980000 },
  { title: 'Peaches', artist: 'Justin Bieber', coverUrl: COVERS[2], duration: 197, playCount: 876000, bpm: 90 },
  { title: 'drivers license', artist: 'Olivia Rodrigo', coverUrl: COVERS[5], duration: 242, playCount: 1450000 },
  { title: 'Uptown Funk', artist: 'Bruno Mars', coverUrl: COVERS[6], duration: 269, playCount: 2100000, bpm: 115 },
  { title: 'Someone Like You', artist: 'Adele', coverUrl: COVERS[3], duration: 285, playCount: 1890000 },
  { title: 'Bohemian Rhapsody', artist: 'Queen', coverUrl: COVERS[7], duration: 354, playCount: 2450000, bpm: 72 },
  { title: 'Rolling in the Deep', artist: 'Adele', coverUrl: COVERS[0], duration: 228, playCount: 1650000 },
  { title: 'Happy', artist: 'Pharrell Williams', coverUrl: COVERS[1], duration: 233, playCount: 1980000, bpm: 160 },
  { title: 'Despacito', artist: 'Luis Fonsi', coverUrl: COVERS[2], duration: 282, playCount: 1780000, bpm: 89 },
  { title: 'Sweet Child O\' Mine', artist: 'Guns N\' Roses', coverUrl: COVERS[8], duration: 356, playCount: 1230000 },
  { title: 'Don\'t Stop Believin\'', artist: 'Journey', coverUrl: COVERS[4], duration: 250, playCount: 1670000 },
  { title: 'Take On Me', artist: 'a-ha', coverUrl: COVERS[5], duration: 225, playCount: 1340000, bpm: 169 },
  { title: 'Believer', artist: 'Imagine Dragons', coverUrl: COVERS[2], duration: 204, playCount: 1560000, bpm: 125 },
  { title: 'Perfect', artist: 'Ed Sheeran', coverUrl: COVERS[6], duration: 263, playCount: 1890000 },
  { title: 'Old Town Road', artist: 'Lil Nas X', coverUrl: COVERS[1], duration: 157, playCount: 2340000, bpm: 136 },
  { title: 'Circles', artist: 'Post Malone', coverUrl: COVERS[0], duration: 215, playCount: 1450000 },
  { title: 'Sunflower', artist: 'Post Malone', coverUrl: COVERS[7], duration: 158, playCount: 1980000 },
  { title: 'Rockstar', artist: 'Post Malone', coverUrl: COVERS[3], duration: 218, playCount: 1120000 },
  { title: 'Starboy', artist: 'The Weeknd', coverUrl: COVERS[0], duration: 230, playCount: 1670000 },
  { title: 'Lose Yourself', artist: 'Eminem', coverUrl: COVERS[8], duration: 326, playCount: 1980000, bpm: 171 },
  { title: 'God\'s Plan', artist: 'Drake', coverUrl: COVERS[4], duration: 198, playCount: 1870000 },
  { title: 'One Dance', artist: 'Drake', coverUrl: COVERS[5], duration: 173, playCount: 1560000 },
  { title: 'Humble', artist: 'Kendrick Lamar', coverUrl: COVERS[2], duration: 177, playCount: 1340000, bpm: 150 },
  { title: 'Don\'t Start Now', artist: 'Dua Lipa', coverUrl: COVERS[4], duration: 183, playCount: 1420000 },
  { title: 'Physical', artist: 'Dua Lipa', coverUrl: COVERS[4], duration: 203, playCount: 987000, bpm: 148 },
  { title: 'Break My Soul', artist: 'Beyoncé', coverUrl: COVERS[2], duration: 240, playCount: 1230000 },
  { title: 'Cuff It', artist: 'Beyoncé', coverUrl: COVERS[1], duration: 220, playCount: 1340000 },
  { title: 'As It Was', artist: 'Harry Styles', coverUrl: COVERS[9], duration: 167, playCount: 1890000 },
  { title: 'Late Night Talking', artist: 'Harry Styles', coverUrl: COVERS[3], duration: 178, playCount: 1120000 },
  { title: 'Cruel Summer', artist: 'Taylor Swift', coverUrl: COVERS[5], duration: 178, playCount: 1760000, bpm: 170 },
  { title: 'Karma', artist: 'Taylor Swift', coverUrl: COVERS[5], duration: 205, playCount: 1450000 },
  { title: 'Lavender Haze', artist: 'Taylor Swift', coverUrl: COVERS[5], duration: 202, playCount: 1230000 },
  { title: 'Say So', artist: 'Doja Cat', coverUrl: COVERS[2], duration: 237, playCount: 1670000, bpm: 111 },
  { title: 'Kiss Me More', artist: 'Doja Cat', coverUrl: COVERS[2], duration: 208, playCount: 1340000 },
  { title: 'Woman', artist: 'Doja Cat', coverUrl: COVERS[2], duration: 172, playCount: 987000 },
  { title: 'Industry Baby', artist: 'Lil Nas X', coverUrl: COVERS[1], duration: 212, playCount: 1560000, bpm: 136 },
  { title: 'Montero', artist: 'Lil Nas X', coverUrl: COVERS[1], duration: 137, playCount: 1340000 },
  { title: 'Stay', artist: 'The Kid LAROI & Justin Bieber', coverUrl: COVERS[2], duration: 141, playCount: 1980000 },
  { title: 'Enemy', artist: 'Imagine Dragons', coverUrl: COVERS[2], duration: 173, playCount: 1760000, bpm: 77 },
  { title: 'Thunder', artist: 'Imagine Dragons', coverUrl: COVERS[3], duration: 187, playCount: 1450000 },
  { title: 'Radioactive', artist: 'Imagine Dragons', coverUrl: COVERS[7], duration: 186, playCount: 1670000 },
  { title: 'Shivers', artist: 'Ed Sheeran', coverUrl: COVERS[6], duration: 207, playCount: 1230000 },
  { title: 'Bad Habits', artist: 'Ed Sheeran', coverUrl: COVERS[6], duration: 231, playCount: 1560000, bpm: 126 },
  { title: 'Happier Than Ever', artist: 'Billie Eilish', coverUrl: COVERS[7], duration: 298, playCount: 1340000 },
  { title: 'Therefore I Am', artist: 'Billie Eilish', coverUrl: COVERS[7], duration: 174, playCount: 1120000 },
  { title: 'Numb', artist: 'Linkin Park', coverUrl: COVERS[8], duration: 185, playCount: 1980000 },
  { title: 'In The End', artist: 'Linkin Park', coverUrl: COVERS[4], duration: 216, playCount: 2230000 },
  { title: 'Stressed Out', artist: 'Twenty One Pilots', coverUrl: COVERS[3], duration: 202, playCount: 1670000 },
  { title: 'Ride', artist: 'Twenty One Pilots', coverUrl: COVERS[5], duration: 218, playCount: 1340000 },
  { title: 'Heathens', artist: 'Twenty One Pilots', coverUrl: COVERS[2], duration: 195, playCount: 1450000 },
  { title: 'Counting Stars', artist: 'OneRepublic', coverUrl: COVERS[1], duration: 257, playCount: 1780000 },
  { title: 'Apologize', artist: 'OneRepublic', coverUrl: COVERS[0], duration: 201, playCount: 1560000 },
  { title: 'Can\'t Feel My Face', artist: 'The Weeknd', coverUrl: COVERS[0], duration: 213, playCount: 1670000 },
  { title: 'The Hills', artist: 'The Weeknd', coverUrl: COVERS[0], duration: 242, playCount: 1450000 },
  { title: 'Roar', artist: 'Katy Perry', coverUrl: COVERS[8], duration: 224, playCount: 1890000 },
  { title: 'Dark Horse', artist: 'Katy Perry', coverUrl: COVERS[7], duration: 215, playCount: 1980000 },
  { title: 'Firework', artist: 'Katy Perry', coverUrl: COVERS[4], duration: 227, playCount: 1760000 },
  { title: 'We Are Young', artist: 'fun.', coverUrl: COVERS[3], duration: 253, playCount: 1670000 },
  { title: 'Some Nights', artist: 'fun.', coverUrl: COVERS[5], duration: 270, playCount: 1340000 },
  { title: 'Locked Out of Heaven', artist: 'Bruno Mars', coverUrl: COVERS[6], duration: 233, playCount: 1560000 },
  { title: 'Just The Way You Are', artist: 'Bruno Mars', coverUrl: COVERS[6], duration: 219, playCount: 1890000 },
  { title: 'Grenade', artist: 'Bruno Mars', coverUrl: COVERS[6], duration: 223, playCount: 1670000 },
  { title: 'Closer', artist: 'The Chainsmokers', coverUrl: COVERS[2], duration: 244, playCount: 1980000 },
  { title: 'Something Just Like This', artist: 'The Chainsmokers', coverUrl: COVERS[1], duration: 247, playCount: 1870000 },
  { title: 'Roses', artist: 'The Chainsmokers', coverUrl: COVERS[0], duration: 222, playCount: 1450000 },
  { title: 'Sugar', artist: 'Maroon 5', coverUrl: COVERS[7], duration: 235, playCount: 1780000 },
  { title: 'Moves Like Jagger', artist: 'Maroon 5', coverUrl: COVERS[8], duration: 201, playCount: 1670000 },
  { title: 'Girls Like You', artist: 'Maroon 5', coverUrl: COVERS[4], duration: 236, playCount: 1980000 },
  { title: 'Shallow', artist: 'Lady Gaga', coverUrl: COVERS[3], duration: 215, playCount: 2230000 },
  { title: 'Bad Romance', artist: 'Lady Gaga', coverUrl: COVERS[5], duration: 294, playCount: 2120000 },
  { title: 'Poker Face', artist: 'Lady Gaga', coverUrl: COVERS[2], duration: 237, playCount: 1980000 },
  { title: 'Dynamite', artist: 'BTS', coverUrl: COVERS[1], duration: 199, playCount: 2340000 },
  { title: 'Butter', artist: 'BTS', coverUrl: COVERS[0], duration: 164, playCount: 1980000 },
  { title: 'Permission to Dance', artist: 'BTS', coverUrl: COVERS[7], duration: 187, playCount: 1450000 },
  { title: 'Cold Heart', artist: 'Elton John & Dua Lipa', coverUrl: COVERS[5], duration: 203, playCount: 1560000 },
  { title: 'Rocket Man', artist: 'Elton John', coverUrl: COVERS[3], duration: 286, playCount: 1780000 },
  { title: 'Tiny Dancer', artist: 'Elton John', coverUrl: COVERS[7], duration: 372, playCount: 1450000 },
  { title: 'Sweetest Pie', artist: 'Megan Thee Stallion & Dua Lipa', coverUrl: COVERS[2], duration: 207, playCount: 1120000 },
  { title: 'WAP', artist: 'Cardi B', coverUrl: COVERS[1], duration: 186, playCount: 1890000 },
  { title: 'Bodak Yellow', artist: 'Cardi B', coverUrl: COVERS[0], duration: 216, playCount: 1670000 },
  { title: 'Umbrella', artist: 'Rihanna', coverUrl: COVERS[8], duration: 276, playCount: 1980000 },
  { title: 'We Found Love', artist: 'Rihanna', coverUrl: COVERS[4], duration: 215, playCount: 1870000 },
  { title: 'Diamonds', artist: 'Rihanna', coverUrl: COVERS[3], duration: 224, playCount: 1670000 },
  { title: 'Love On Top', artist: 'Beyoncé', coverUrl: COVERS[2], duration: 236, playCount: 1560000 },
  { title: 'Single Ladies', artist: 'Beyoncé', coverUrl: COVERS[1], duration: 193, playCount: 2120000 },
  { title: 'Formation', artist: 'Beyoncé', coverUrl: COVERS[7], duration: 215, playCount: 1780000 },
];

const VIBE_IDS: VibeId[] = ['gym', 'cooking', 'focus', 'driving'];
const VERSION_MAP: Record<VibeId, VersionType> = { gym: 'Gym', cooking: 'Cooking', focus: 'Focus', driving: 'Driving' };

export const MOCK_TRACKS: Track[] = MOCK_SONGS.flatMap((song, i) =>
  VIBE_IDS.map((vibeId) => ({
    id: `${i + 1}-${vibeId}`,
    title: song.title,
    artist: song.artist,
    coverUrl: song.coverUrl,
    version: VERSION_MAP[vibeId],
    vibeId,
    versionDescription: VERSION_DESCRIPTIONS[VERSION_MAP[vibeId]],
    playCount: song.playCount,
    duration: song.duration,
    bpm: song.bpm,
  }))
);

export type PlaceId = 'gym' | 'cooking' | 'focus' | 'driving';

export interface Place {
  id: PlaceId;
  label: string;
  icon: string;
  color: string;
  description: string;
}

export interface UserPlace extends Place {
  userPlaceId: string;
  address: string;
  latitude: number;
  longitude: number;
}

export const PLACES: Place[] = VIBES.map((v) => ({
  id: v.id,
  label: v.label,
  icon: v.icon,
  color: v.color,
  description: v.description,
}));

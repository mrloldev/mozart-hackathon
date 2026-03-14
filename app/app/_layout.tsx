import { Stack } from 'expo-router';
import { View } from 'react-native';

import { FullPlayer } from '@/components/full-player';
import { MiniPlayer } from '@/components/mini-player';
import { PlayerProvider, usePlayer } from '@/contexts/player-context';
import { PlacesProvider } from '@/contexts/places-context';

function FullPlayerOverlay() {
  const { isFullPlayerOpen, closeFullPlayer } = usePlayer();
  if (!isFullPlayerOpen) return null;
  return <FullPlayer onClose={closeFullPlayer} />;
}

export default function AppLayout() {
  return (
    <PlayerProvider>
      <PlacesProvider>
        <View className="flex-1">
          <Stack screenOptions={{ headerShown: false }}>
            <Stack.Screen name="(tabs)" />
          </Stack>
          <MiniPlayer />
          <FullPlayerOverlay />
        </View>
      </PlacesProvider>
    </PlayerProvider>
  );
}

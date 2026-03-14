import { Image } from 'expo-image';
import { Pressable, Text, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import { runOnJS } from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';
import { usePlayer } from '@/contexts/player-context';
import { VERSION_COLORS } from '@/lib/mock-data';
import type { VersionType } from '@/lib/mock-data';

import { IconSymbol } from './ui/icon-symbol';

const TAB_BAR_HEIGHT = 49;
const SWIPE_THRESHOLD = 50;

export function MiniPlayer() {
  const insets = useSafeAreaInsets();
  const {
    currentTrack,
    isPlaying,
    progress,
    duration,
    togglePlay,
    openFullPlayer,
    isFullPlayerOpen,
    next,
    prev,
  } = usePlayer();

  const panGesture = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onEnd((e) => {
      if (e.translationX < -SWIPE_THRESHOLD || e.velocityX < -300) {
        runOnJS(next)();
      } else if (e.translationX > SWIPE_THRESHOLD || e.velocityX > 300) {
        runOnJS(prev)();
      }
    });

  const tapGesture = Gesture.Tap().onEnd(() => {
    runOnJS(openFullPlayer)();
  });

  const composed = Gesture.Exclusive(panGesture, tapGesture);

  if (!currentTrack || isFullPlayerOpen) return null;

  const versionColor = VERSION_COLORS[currentTrack.version as VersionType] ?? Brand.primary;
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  const bottomOffset = TAB_BAR_HEIGHT + insets.bottom;

  return (
    <GestureDetector gesture={composed}>
      <View
        className="absolute left-0 right-0 mx-3 overflow-hidden rounded-2xl border border-white/[0.08]"
        style={{
          bottom: bottomOffset,
          zIndex: 1000,
          backgroundColor: 'rgba(24,24,27,0.98)',
        }}
      >
      <View className="flex-row items-center gap-3 px-4 pt-3 pb-2">
        <Image
          source={{ uri: currentTrack.coverUrl }}
          className="h-12 w-12 rounded-lg"
        />
        <View className="flex-1 min-w-0">
          <Text className="text-white font-semibold text-[15px]" numberOfLines={1}>
            {currentTrack.title}
          </Text>
          <View className="flex-row items-center gap-2 mt-1">
            <Text className="text-neutral-500 text-[13px]" numberOfLines={1}>
              {currentTrack.artist}
            </Text>
            <View
              className="rounded-full px-2 py-0.5"
              style={{ backgroundColor: `${versionColor}22` }}
            >
              <Text className="text-[10px] font-semibold tracking-wide" style={{ color: versionColor }}>
                {currentTrack.version}
              </Text>
            </View>
          </View>
        </View>
        <Pressable
          onPress={(e) => {
            e.stopPropagation();
            togglePlay();
          }}
          className="w-12 h-12 rounded-full items-center justify-center active:scale-95"
          style={{ backgroundColor: Brand.primary }}
        >
          <IconSymbol
            name={isPlaying ? 'pause.fill' : 'play.fill'}
            size={20}
            color="#0f0f0f"
          />
        </Pressable>
      </View>
      <View
        className="overflow-hidden bg-white/10"
        style={{
          height: 3,
          borderBottomLeftRadius: 16,
          borderBottomRightRadius: 16,
        }}
      >
        <View
          style={{
            width: `${progressPercent}%`,
            height: '100%',
            backgroundColor: versionColor,
            borderRadius: 999,
          }}
        />
      </View>
      </View>
    </GestureDetector>
  );
}

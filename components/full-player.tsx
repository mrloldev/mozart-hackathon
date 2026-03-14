import { useEffect, useRef } from 'react';
import { Image } from 'expo-image';
import { Pressable, ScrollView, Text, useWindowDimensions, View } from 'react-native';
import { Gesture, GestureDetector } from 'react-native-gesture-handler';
import Animated, {
  FadeOutLeft,
  runOnJS,
  useAnimatedStyle,
  useSharedValue,
  withSpring,
  withTiming,
} from 'react-native-reanimated';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { Brand } from '@/constants/brand';
import { usePlayer } from '@/contexts/player-context';
import { VERSION_COLORS, VERSION_DESCRIPTIONS } from '@/lib/mock-data';
import type { Track, VersionType } from '@/lib/mock-data';

import { IconSymbol } from './ui/icon-symbol';

interface FullPlayerProps {
  onClose: () => void;
}

const DELETE_THRESHOLD = 80;

function SwipeableQueueItem({
  track,
  onRemove,
  versionColor,
}: {
  track: Track;
  onRemove: () => void;
  versionColor: string;
}) {
  const translateX = useSharedValue(0);
  const { width } = useWindowDimensions();

  const pan = Gesture.Pan()
    .activeOffsetX([-20, 20])
    .onUpdate((e) => {
      if (e.translationX < 0) {
        translateX.value = e.translationX;
      }
    })
    .onEnd((e) => {
      if (e.translationX < -DELETE_THRESHOLD || e.velocityX < -400) {
        translateX.value = withTiming(-width, { duration: 200 }, (finished) =>
          finished ? runOnJS(onRemove)() : undefined,
        );
      } else {
        translateX.value = withSpring(0, { damping: 20, stiffness: 300 });
      }
    });

  const rowStyle = useAnimatedStyle(() => ({
    transform: [{ translateX: translateX.value }],
  }));

  return (
    <View className="overflow-hidden">
      <View
        className="absolute right-0 top-0 bottom-0 w-20 items-center justify-center"
        style={{ backgroundColor: '#ef4444' }}
      >
        <IconSymbol name="trash.fill" size={22} color="#fff" />
      </View>
      <GestureDetector gesture={pan}>
        <Animated.View
          exiting={FadeOutLeft.duration(180)}
          style={[
            rowStyle,
            {
              backgroundColor: Brand.surface,
            },
          ]}
          className="flex-row items-center gap-4 py-4 px-1 border-b border-white/5"
        >
          <Image
            source={{ uri: track.coverUrl }}
            className="h-14 w-14 rounded-xl flex-shrink-0"
          />
          <View className="flex-1 min-w-0">
            <Text className="text-white font-medium text-[15px]" numberOfLines={1}>
              {track.title}
            </Text>
            <Text className="text-neutral-500 text-sm mt-0.5" numberOfLines={1}>
              {track.artist} · {track.version}
            </Text>
          </View>
        </Animated.View>
      </GestureDetector>
    </View>
  );
}

export function FullPlayer({ onClose }: FullPlayerProps) {
  const insets = useSafeAreaInsets();
  const { height: screenHeight } = useWindowDimensions();
  const scrollRef = useRef<ScrollView>(null);
  const {
    currentTrack,
    queue,
    isPlaying,
    progress,
    duration,
    togglePlay,
    next,
    prev,
    removeFromQueue,
    closeFullPlayer,
  } = usePlayer();

  const translateY = useSharedValue(screenHeight);

  const animateClose = () => {
    translateY.value = withTiming(
      screenHeight,
      { duration: 220 },
      (finished) => finished && runOnJS(closeFullPlayer)(),
    );
  };

  const gesture = Gesture.Pan()
    .onUpdate((e) => {
      if (e.translationY > 0) translateY.value = e.translationY;
    })
    .onEnd((e) => {
      if (e.translationY > 100 || e.velocityY > 500) {
        translateY.value = withTiming(
          screenHeight,
          { duration: 180 },
          (finished) => finished && runOnJS(closeFullPlayer)(),
        );
      } else {
        translateY.value = withSpring(0, { damping: 24, stiffness: 200 });
      }
    });

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ translateY: translateY.value }],
  }));

  useEffect(() => {
    translateY.value = withSpring(0, { damping: 28, stiffness: 180 });
  }, []);

  const hasScrolledToQueueRef = useRef(false);
  useEffect(() => {
    if (queue.length > 0 && !hasScrolledToQueueRef.current) {
      hasScrolledToQueueRef.current = true;
      const t = setTimeout(() => scrollRef.current?.scrollToEnd({ animated: true }), 320);
      return () => clearTimeout(t);
    }
  }, [queue.length]);

  if (!currentTrack) return null;

  const versionColor = VERSION_COLORS[currentTrack.version as VersionType] ?? Brand.primary;
  const progressPercent = duration > 0 ? (progress / duration) * 100 : 0;
  const versionDesc =
    currentTrack.versionDescription ?? VERSION_DESCRIPTIONS[currentTrack.version as VersionType];

  return (
    <GestureDetector gesture={gesture}>
      <Animated.View
        style={[
          animatedStyle,
          {
            position: 'absolute',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: Brand.surface,
            paddingTop: insets.top,
            paddingBottom: insets.bottom + 100,
          },
        ]}
      >
        <View className="flex-row items-center justify-between px-4 py-3 border-b border-white/[0.06]">
          <Pressable onPress={animateClose} className="p-2 -ml-2 active:opacity-70">
            <IconSymbol name="chevron.down" size={26} color={Brand.text} />
          </Pressable>
          <Text className="text-neutral-400 text-sm font-medium tracking-wide">NOW PLAYING</Text>
          <View className="w-10" />
        </View>

        <ScrollView
          ref={scrollRef}
          className="flex-1"
          contentContainerStyle={{ paddingHorizontal: 20, paddingBottom: 40 }}
          showsVerticalScrollIndicator={false}
        >
          <View className="items-center mt-6">
            <View
              style={{
                shadowColor: versionColor,
                shadowOffset: { width: 0, height: 16 },
                shadowOpacity: 0.35,
                shadowRadius: 28,
                elevation: 16,
              }}
            >
              <Image
                source={{ uri: currentTrack.coverUrl }}
                className="w-[260px] h-[260px] rounded-[28px]"
                style={{ borderWidth: 2, borderColor: `${versionColor}25` }}
              />
            </View>
            <View className="mt-5 items-center">
              <Text className="text-white text-xl font-bold text-center tracking-tight">
                {currentTrack.title}
              </Text>
              <Text className="text-neutral-400 text-[15px] mt-1.5">{currentTrack.artist}</Text>
              <View
                className="rounded-full px-4 py-2 mt-3"
                style={{
                  backgroundColor: `${versionColor}18`,
                  borderWidth: 1,
                  borderColor: `${versionColor}50`,
                }}
              >
                <Text className="font-semibold text-xs tracking-wider" style={{ color: versionColor }}>
                  {currentTrack.version.toUpperCase()}
                </Text>
              </View>
            </View>
          </View>

          <View className="mt-8 px-1">
            <View className="h-[6px] rounded-full bg-white/[0.08] overflow-hidden">
              <View
                className="h-full rounded-full"
                style={{ width: `${progressPercent}%`, backgroundColor: versionColor }}
              />
            </View>
            <View className="flex-row justify-between mt-2.5">
              <Text className="text-neutral-500 text-xs font-medium tabular-nums">
                {Math.floor(progress / 60)}:{(progress % 60).toString().padStart(2, '0')}
              </Text>
              <Text className="text-neutral-500 text-xs font-medium tabular-nums">
                {Math.floor(duration / 60)}:{(duration % 60).toString().padStart(2, '0')}
              </Text>
            </View>
          </View>

          <View className="flex-row items-center justify-center gap-12 mt-9">
            <Pressable onPress={prev} className="p-3 active:opacity-70">
              <IconSymbol name="backward.fill" size={30} color="#a1a1aa" />
            </Pressable>
            <Pressable
              onPress={togglePlay}
              className="w-[72px] h-[72px] rounded-full items-center justify-center active:scale-[0.96]"
              style={{
                backgroundColor: Brand.primary,
                shadowColor: versionColor,
                shadowOffset: { width: 0, height: 4 },
                shadowOpacity: 0.4,
                shadowRadius: 12,
                elevation: 8,
              }}
            >
              <IconSymbol
                name={isPlaying ? 'pause.fill' : 'play.fill'}
                size={34}
                color="#0a0a0a"
              />
            </Pressable>
            <Pressable onPress={next} className="p-3 active:opacity-70">
              <IconSymbol name="forward.fill" size={30} color="#a1a1aa" />
            </Pressable>
          </View>

          <View
            className="mt-8 p-4 rounded-2xl"
            style={{
              backgroundColor: 'rgba(24,24,27,0.6)',
              borderWidth: 1,
              borderColor: 'rgba(255,255,255,0.06)',
            }}
          >
            <Text className="text-neutral-400 text-[13px] leading-[1.5]">{versionDesc}</Text>
          </View>

          {queue.length > 0 && (
            <View
              className="mt-10"
              style={{ minHeight: Math.min(420, screenHeight * 0.55) }}
            >
              <View className="flex-row items-center justify-between mb-4">
                <Text className="text-white font-semibold text-base tracking-tight">Up Next</Text>
                <Text className="text-neutral-500 text-sm">{queue.length} tracks</Text>
              </View>
              <ScrollView
                style={{ maxHeight: Math.min(560, screenHeight * 0.65) }}
                showsVerticalScrollIndicator
                nestedScrollEnabled
              >
                {queue.map((track) => (
                  <SwipeableQueueItem
                    key={track.id}
                    track={track}
                    versionColor={versionColor}
                    onRemove={() => removeFromQueue(track.id)}
                  />
                ))}
              </ScrollView>
            </View>
          )}
        </ScrollView>
      </Animated.View>
    </GestureDetector>
  );
}

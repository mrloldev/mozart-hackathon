import { Image } from 'expo-image';
import { LinearGradient } from 'expo-linear-gradient';
import { useCallback, useState } from 'react';
import {
  KeyboardAvoidingView,
  Modal,
  Platform,
  Pressable,
  ScrollView,
  Text,
  View,
} from 'react-native';
import { useSafeAreaInsets } from 'react-native-safe-area-context';

import { usePlayer } from '@/contexts/player-context';
import { usePlaces } from '@/contexts/places-context';
import { Brand } from '@/constants/brand';
import {
  MOCK_TRACKS,
  VIBES,
  VERSION_COLORS,
  type Track,
  type VersionType,
  type VibeId,
} from '@/lib/mock-data';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { PlacePickerModal } from '@/components/place-picker-modal';

const CREATE_ABOUT_OPTIONS = ['love', 'workout', 'road trip', 'relaxation', 'cooking', 'party', 'focus'];
const STYLE_OPTIONS = ['pop', 'rock', 'lo-fi', 'electronic', 'acoustic', 'R&B', 'indie'];

function InlineSelect({
  prefix,
  value,
  options,
  onSelect,
  modalLabel,
}: {
  prefix: string;
  value: string;
  options: string[];
  onSelect: (v: string) => void;
  modalLabel: string;
}) {
  const [open, setOpen] = useState(false);
  const display = value || 'Select...';
  return (
    <>
      <Pressable
        onPress={() => setOpen(true)}
        className="flex-row items-center gap-2 py-3 px-4 rounded-xl bg-surface-elevated/90 border border-white/[0.08] active:opacity-80"
      >
        <Text className="text-neutral-400 text-[15px] flex-shrink-0">{prefix}</Text>
        <Text className="text-white font-medium text-[15px] flex-1" numberOfLines={1}>
          {display}
        </Text>
        <IconSymbol name="chevron.down" size={16} color="#71717a" />
      </Pressable>
      <Modal visible={open} transparent animationType="fade">
        <Pressable className="flex-1 justify-end bg-black/60" onPress={() => setOpen(false)}>
          <View className="bg-surface-elevated rounded-t-2xl max-h-[50%]" onStartShouldSetResponder={() => true}>
            <View className="p-4 border-b border-white/5">
              <Text className="text-white font-semibold">{modalLabel}</Text>
            </View>
            <ScrollView className="max-h-64">
              {options.map((opt) => (
                <Pressable
                  key={opt}
                  onPress={() => {
                    onSelect(opt);
                    setOpen(false);
                  }}
                  className="px-4 py-3 border-b border-white/5 active:bg-white/5"
                >
                  <Text className="text-white font-medium">{opt}</Text>
                </Pressable>
              ))}
            </ScrollView>
          </View>
        </Pressable>
      </Modal>
    </>
  );
}

function VibeLine({
  vibe,
  onPress,
  isSelected,
}: {
  vibe: (typeof VIBES)[0];
  onPress: () => void;
  isSelected: boolean;
}) {
  return (
    <Pressable
      onPress={onPress}
      className="flex-1 flex-row items-center gap-3 py-3.5 px-4 rounded-2xl active:opacity-90"
      style={{
        backgroundColor: isSelected ? `${vibe.color}18` : 'rgba(24,24,27,0.6)',
        borderWidth: 1,
        borderColor: isSelected ? `${vibe.color}40` : 'rgba(255,255,255,0.08)',
      }}
    >
      <View
        className="w-10 h-10 rounded-xl items-center justify-center"
        style={{ backgroundColor: `${vibe.color}28` }}
      >
        <IconSymbol name={vibe.icon as any} size={20} color={vibe.color} />
      </View>
      <View className="flex-1 min-w-0">
        <Text className="text-white font-semibold text-[15px]">{vibe.label}</Text>
        <Text className="text-neutral-500 text-[12px] mt-0.5" numberOfLines={1}>
          {vibe.description}
        </Text>
      </View>
    </Pressable>
  );
}

function TrackCard({
  track,
  onPress,
}: {
  track: Track;
  onPress: () => void;
}) {
  const color = VERSION_COLORS[track.version as VersionType] ?? Brand.primary;
  return (
    <Pressable onPress={onPress} className="w-40 mr-4 active:opacity-90">
      <View className="relative overflow-hidden rounded-2xl bg-surface-elevated">
        <Image
          source={{ uri: track.coverUrl }}
          className="w-full aspect-square rounded-2xl"
        />
        <View
          className="absolute inset-0 rounded-2xl"
          style={{
            borderWidth: 1,
            borderColor: `${color}20`,
          }}
          pointerEvents="none"
        />
      </View>
      <Text className="text-white font-semibold mt-2.5 text-[15px]" numberOfLines={1}>
        {track.title}
      </Text>
      <Text className="text-neutral-500 text-[13px] mt-0.5" numberOfLines={1}>
        {track.artist}
      </Text>
      <View
        className="rounded-full px-2.5 py-1 mt-2 self-start"
        style={{ backgroundColor: `${color}20`, borderWidth: 1, borderColor: `${color}35` }}
      >
        <Text className="text-[11px] font-semibold" style={{ color }}>
          {track.version}
        </Text>
      </View>
    </Pressable>
  );
}

export default function HomeScreen() {
  const insets = useSafeAreaInsets();
  const { play } = usePlayer();
  const { isContextual, getCurrentPlace, locationEnabled, currentAddress, shortAddress } = usePlaces();
  const [placeModalVisible, setPlaceModalVisible] = useState(false);
  const [selectedVibe, setSelectedVibe] = useState<VibeId | null>(null);
  const [createAbout, setCreateAbout] = useState('');
  const [styleOf, setStyleOf] = useState('');

  const currentPlace = getCurrentPlace();

  const locationDisplay = isContextual && currentPlace
    ? currentPlace.address || currentPlace.label
    : locationEnabled && shortAddress
      ? shortAddress
      : locationEnabled && currentAddress
        ? currentAddress
        : 'Global';

  const handleTrackPress = useCallback(
    (track: Track, rowTracks: Track[]) => {
      const queue = [track, ...rowTracks.filter((t) => t.id !== track.id)];
      play(track, queue);
    },
    [play]
  );

  const handleVibePress = useCallback(
    (vibeId: VibeId) => {
      const tracks = MOCK_TRACKS.filter((t) => t.vibeId === vibeId);
      if (tracks.length === 0) return;
      const [first, ...rest] = tracks;
      play(first, [first, ...rest]);
    },
    [play]
  );
  const popularTracks = [...MOCK_TRACKS].sort((a, b) => (b.playCount ?? 0) - (a.playCount ?? 0));

  return (
    <View className="flex-1">
      <LinearGradient
        colors={[Brand.surface, '#141414', Brand.surface]}
        locations={[0, 0.4, 1]}
        style={{ position: 'absolute', top: 0, left: 0, right: 0, bottom: 0 }}
      />
      <KeyboardAvoidingView
        className="flex-1"
        style={{ backgroundColor: 'transparent' }}
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
        keyboardVerticalOffset={0}
      >
      <View
        style={{
          paddingTop: insets.top + 12,
          backgroundColor: Brand.surface,
        }}
        className="px-4 pb-3"
      >
        <View className="flex-row items-center gap-3">
          <Text className="text-3xl font-black text-white tracking-tight flex-shrink-0">
            Labi
          </Text>
          <Pressable
            onPress={() => setPlaceModalVisible(true)}
            className="flex-1 flex-row items-center gap-2 min-w-0 py-2.5 px-3 rounded-xl bg-surface-elevated/80 border border-white/5 active:opacity-80"
          >
            <IconSymbol
              name="location.fill"
              size={16}
              color={locationEnabled ? Brand.primary : '#71717a'}
            />
            <Text className="text-white text-[13px] font-medium flex-1" numberOfLines={2}>
              {locationDisplay}
            </Text>
            <IconSymbol name="chevron.right" size={14} color="#71717a" />
          </Pressable>
        </View>
      </View>

      <View
        className="mx-4 mb-4 rounded-2xl overflow-hidden"
        style={{
          backgroundColor: 'rgba(24,24,27,0.95)',
          borderWidth: 1,
          borderColor: 'rgba(255,255,255,0.08)',
        }}
      >
        <View className="p-4 gap-3">
          <InlineSelect
            prefix="Create about"
            value={createAbout}
            options={CREATE_ABOUT_OPTIONS}
            onSelect={setCreateAbout}
            modalLabel="Topic"
          />
          <InlineSelect
            prefix="In the style of"
            value={styleOf}
            options={STYLE_OPTIONS}
            onSelect={setStyleOf}
            modalLabel="Style"
          />
        </View>
      </View>

      <ScrollView
        className="flex-1"
        contentContainerStyle={{ paddingBottom: 120 }}
        showsVerticalScrollIndicator={false}
      >
        <View className="px-4 pt-2 mb-3">
          <Text className="text-neutral-400 text-[13px] font-medium uppercase tracking-wider">
            For you
          </Text>
        </View>

        <View className="px-3 gap-2">
          <View className="flex-row gap-2">
            <VibeLine
              vibe={VIBES[0]}
              onPress={() => handleVibePress(VIBES[0].id)}
              isSelected={false}
            />
            <VibeLine
              vibe={VIBES[1]}
              onPress={() => handleVibePress(VIBES[1].id)}
              isSelected={false}
            />
          </View>
          <View className="flex-row gap-2">
            <VibeLine
              vibe={VIBES[2]}
              onPress={() => handleVibePress(VIBES[2].id)}
              isSelected={false}
            />
            <VibeLine
              vibe={VIBES[3]}
              onPress={() => handleVibePress(VIBES[3].id)}
              isSelected={false}
            />
          </View>
        </View>

        <View className="mt-10 px-4">
          <Text className="text-neutral-400 text-[13px] font-medium uppercase tracking-wider mb-4">
            Based on your last listens
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false}>
            {popularTracks.map((track) => (
              <TrackCard
                key={track.id}
                track={track}
                onPress={() => handleTrackPress(track, popularTracks)}
              />
            ))}
          </ScrollView>
        </View>
      </ScrollView>

      <PlacePickerModal
        visible={placeModalVisible}
        onClose={() => setPlaceModalVisible(false)}
      />
      </KeyboardAvoidingView>
    </View>
  );
}

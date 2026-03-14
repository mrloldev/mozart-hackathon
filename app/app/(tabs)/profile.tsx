import { useState } from 'react';
import { Pressable, ScrollView, Text, View } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import { PlacePickerModal } from '@/components/place-picker-modal';
import { usePlaces } from '@/contexts/places-context';
import { Brand } from '@/constants/brand';

export default function ProfileScreen() {
  const { places, currentPlaceId, locationEnabled, getCurrentPlace } = usePlaces();
  const [placeModalVisible, setPlaceModalVisible] = useState(false);
  const currentPlace = getCurrentPlace();

  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-36"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-4 pb-8">
          <Text className="text-3xl font-bold text-white mb-1">Profile</Text>
          <Text className="text-neutral-400 text-base">
            Manage your places and settings
          </Text>
        </View>

        <Pressable
          onPress={() => setPlaceModalVisible(true)}
          className="mx-4 mb-4 p-5 rounded-2xl bg-surface-elevated border border-white/5 active:opacity-90"
        >
          <View className="flex-row items-center justify-between">
            <View className="flex-row items-center gap-4">
              <View className="w-12 h-12 rounded-xl bg-surface-muted items-center justify-center">
                <IconSymbol name="location.fill" size={24} color={Brand.primary} />
              </View>
              <View>
                <Text className="text-white font-semibold text-base">
                  Context & Places
                </Text>
                <Text className="text-neutral-500 text-sm mt-0.5">
                  {places.length === 0
                    ? 'Add places for contextual recommendations'
                    : locationEnabled
                      ? `At ${currentPlace?.label ?? '—'}`
                      : 'Enable location for context'}
                </Text>
              </View>
            </View>
            <IconSymbol name="chevron.right" size={20} color="#71717a" />
          </View>
        </Pressable>

        <View className="px-4 gap-2">
          <Text className="text-neutral-500 text-sm font-medium px-1">Coming soon</Text>
          <View className="p-5 rounded-2xl bg-surface-elevated border border-white/5 opacity-60">
            <Text className="text-white font-medium">Artist Mode</Text>
            <Text className="text-neutral-500 text-sm mt-1">
              Create and upload your own contextual versions
            </Text>
          </View>
          <View className="p-5 rounded-2xl bg-surface-elevated border border-white/5 opacity-60">
            <Text className="text-white font-medium">Stats (Pro)</Text>
            <Text className="text-neutral-500 text-sm mt-1">
              Streams, engagement, demographics
            </Text>
          </View>
        </View>
      </ScrollView>

      <PlacePickerModal
        visible={placeModalVisible}
        onClose={() => setPlaceModalVisible(false)}
      />
    </View>
  );
}

import { View, Text, ScrollView, Pressable } from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';

export default function ExploreScreen() {
  return (
    <View className="flex-1 bg-surface">
      <ScrollView
        className="flex-1"
        contentContainerClassName="pb-12"
        showsVerticalScrollIndicator={false}
      >
        <View className="px-6 pt-4 pb-8">
          <Text className="text-3xl font-bold text-white mb-1">Discover</Text>
          <Text className="text-neutral-400 text-base">
            Find tracks to remix
          </Text>
        </View>

        <View className="px-6 gap-4">
          {[
            { label: 'Trending Remixes', subtitle: 'What others are mixing' },
            { label: 'Your Library', subtitle: 'Tracks you can remix' },
            { label: 'Curated Picks', subtitle: 'Handpicked for you' },
          ].map(({ label, subtitle }, i) => (
            <Pressable
              key={label}
              className="bg-surface-elevated rounded-2xl p-5 border border-white/5 active:opacity-90"
            >
              <View className="flex-row items-center gap-4">
                <View className="w-14 h-14 rounded-xl bg-surface-muted items-center justify-center">
                  <IconSymbol
                    name="paperplane.fill"
                    size={24}
                    color="#71717a"
                  />
                </View>
                <View className="flex-1">
                  <Text className="text-white font-semibold text-base">
                    {label}
                  </Text>
                  <Text className="text-neutral-500 text-sm mt-0.5">
                    {subtitle}
                  </Text>
                </View>
              </View>
            </Pressable>
          ))}
        </View>
      </ScrollView>
    </View>
  );
}

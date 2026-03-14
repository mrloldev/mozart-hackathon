import { GlassButton } from "@/components/ui/glass-button";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  useSharedValue,
  withRepeat,
  withSequence,
  withTiming,
} from "react-native-reanimated";
import { useEffect } from "react";

interface CompleteStepProps {
  onFinish: () => void;
}

export function CompleteStep({ onFinish }: CompleteStepProps) {
  const scale = useSharedValue(1);
  const rotate = useSharedValue(0);

  useEffect(() => {
    scale.value = withRepeat(
      withSequence(
        withTiming(1.1, { duration: 1000 }),
        withTiming(1, { duration: 1000 })
      ),
      -1,
      true
    );
    rotate.value = withRepeat(
      withSequence(
        withTiming(-5, { duration: 1500 }),
        withTiming(5, { duration: 1500 })
      ),
      -1,
      true
    );
  }, []);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }, { rotate: `${rotate.value}deg` }],
  }));

  return (
    <View style={styles.container}>
      <Animated.View style={[styles.iconContainer, animatedStyle]}>
        <LinearGradient
          colors={["rgba(29, 185, 84, 0.5)", "rgba(29, 185, 84, 0.1)"]}
          style={styles.iconGlow}
        />
        <Text style={styles.icon}>🎉</Text>
      </Animated.View>

      <Text style={styles.title}>You're All Set!</Text>
      <Text style={styles.subtitle}>
        We've personalized Remixer just for you. Time to discover your new favorite tracks.
      </Text>

      <View style={styles.stats}>
        <View style={styles.statItem}>
          <Text style={styles.statEmoji}>🎵</Text>
          <Text style={styles.statLabel}>Personalized playlists ready</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statEmoji}>🎧</Text>
          <Text style={styles.statLabel}>Music discovery enabled</Text>
        </View>
        <View style={styles.statItem}>
          <Text style={styles.statEmoji}>✨</Text>
          <Text style={styles.statLabel}>AI remixes unlocked</Text>
        </View>
      </View>

      <View style={styles.footer}>
        <GlassButton onPress={onFinish}>Start Exploring</GlassButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
    justifyContent: "center",
  },
  iconContainer: {
    alignItems: "center",
    marginBottom: 32,
  },
  iconGlow: {
    position: "absolute",
    width: 160,
    height: 160,
    borderRadius: 80,
  },
  icon: {
    fontSize: 80,
  },
  title: {
    fontSize: 32,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 12,
  },
  subtitle: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.6)",
    textAlign: "center",
    lineHeight: 24,
    marginBottom: 40,
  },
  stats: {
    gap: 16,
    marginBottom: 40,
  },
  statItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    gap: 12,
  },
  statEmoji: {
    fontSize: 24,
  },
  statLabel: {
    fontSize: 16,
    color: "rgba(255, 255, 255, 0.7)",
  },
  footer: {
    marginTop: "auto",
    paddingBottom: 20,
  },
});

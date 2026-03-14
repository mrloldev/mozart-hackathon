import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import { Pressable, StyleSheet, View, ViewStyle } from "react-native";

interface GlassCardProps {
  children: ReactNode;
  style?: ViewStyle;
  onPress?: () => void;
  selected?: boolean;
}

export function GlassCard({
  children,
  style,
  onPress,
  selected = false,
}: GlassCardProps) {
  const content = (
    <View style={[styles.container, selected && styles.selected, style]}>
      <View style={[StyleSheet.absoluteFill, styles.background]} />
      <LinearGradient
        colors={[
          selected ? "rgba(29, 185, 84, 0.3)" : "rgba(255, 255, 255, 0.08)",
          selected ? "rgba(29, 185, 84, 0.1)" : "rgba(255, 255, 255, 0.02)",
        ]}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={StyleSheet.absoluteFill}
      />
      <View style={styles.content}>{children}</View>
      <LinearGradient
        colors={["rgba(255, 255, 255, 0.1)", "transparent"]}
        start={{ x: 0, y: 0 }}
        end={{ x: 0, y: 1 }}
        style={styles.shine}
      />
    </View>
  );

  if (onPress) {
    return (
      <Pressable onPress={onPress} style={({ pressed }) => [pressed && styles.pressed]}>
        {content}
      </Pressable>
    );
  }

  return content;
}

const styles = StyleSheet.create({
  container: {
    borderRadius: 20,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  selected: {
    borderColor: "rgba(29, 185, 84, 0.5)",
  },
  background: {
    backgroundColor: "rgba(30, 30, 40, 0.85)",
  },
  content: {
    padding: 16,
  },
  shine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "30%",
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.8,
    transform: [{ scale: 0.98 }],
  },
});

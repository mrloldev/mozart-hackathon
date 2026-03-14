import { LinearGradient } from "expo-linear-gradient";
import { ReactNode } from "react";
import {
  ActivityIndicator,
  Pressable,
  StyleSheet,
  Text,
  View,
  ViewStyle,
} from "react-native";

interface GlassButtonProps {
  children: ReactNode;
  onPress: () => void;
  style?: ViewStyle;
  variant?: "primary" | "secondary" | "ghost";
  loading?: boolean;
  disabled?: boolean;
}

export function GlassButton({
  children,
  onPress,
  style,
  variant = "primary",
  loading = false,
  disabled = false,
}: GlassButtonProps) {
  const isPrimary = variant === "primary";
  const isGhost = variant === "ghost";

  return (
    <Pressable
      onPress={onPress}
      disabled={disabled || loading}
      style={({ pressed }) => [
        styles.container,
        isGhost && styles.ghost,
        (disabled || loading) && styles.disabled,
        pressed && styles.pressed,
        style,
      ]}
    >
      {!isGhost && (
        <>
          <View style={[StyleSheet.absoluteFill, styles.background]} />
          <LinearGradient
            colors={
              isPrimary
                ? ["rgba(29, 185, 84, 0.9)", "rgba(29, 185, 84, 0.7)"]
                : ["rgba(255, 255, 255, 0.15)", "rgba(255, 255, 255, 0.05)"]
            }
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
            style={StyleSheet.absoluteFill}
          />
          <LinearGradient
            colors={["rgba(255, 255, 255, 0.2)", "transparent"]}
            start={{ x: 0, y: 0 }}
            end={{ x: 0, y: 1 }}
            style={styles.shine}
          />
        </>
      )}
      {loading ? (
        <ActivityIndicator color="#fff" />
      ) : (
        <Text style={[styles.text, isGhost && styles.ghostText]}>{children}</Text>
      )}
    </Pressable>
  );
}

const styles = StyleSheet.create({
  container: {
    height: 56,
    borderRadius: 28,
    justifyContent: "center",
    alignItems: "center",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: "rgba(255, 255, 255, 0.1)",
  },
  ghost: {
    borderWidth: 0,
    backgroundColor: "transparent",
  },
  background: {
    backgroundColor: "rgba(30, 30, 40, 0.9)",
  },
  shine: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: "50%",
    opacity: 0.3,
  },
  text: {
    color: "#fff",
    fontSize: 17,
    fontWeight: "600",
  },
  ghostText: {
    opacity: 0.6,
  },
  disabled: {
    opacity: 0.5,
  },
  pressed: {
    opacity: 0.9,
    transform: [{ scale: 0.98 }],
  },
});

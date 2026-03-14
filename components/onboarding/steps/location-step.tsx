import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";
import { LinearGradient } from "expo-linear-gradient";
import { useState } from "react";
import { StyleSheet, Text, View } from "react-native";

let Location: typeof import("expo-location") | null = null;
try {
  Location = require("expo-location");
} catch {}

interface LocationStepProps {
  onContinue: (granted: boolean) => void;
  onBack: () => void;
}

export function LocationStep({ onContinue, onBack }: LocationStepProps) {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const requestLocation = async () => {
    if (!Location) {
      onContinue(false);
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const { status: foregroundStatus } =
        await Location.requestForegroundPermissionsAsync();

      if (foregroundStatus !== "granted") {
        setError("Location permission denied");
        onContinue(false);
        return;
      }

      const { status: backgroundStatus } =
        await Location.requestBackgroundPermissionsAsync();

      onContinue(backgroundStatus === "granted");
    } catch {
      setError("Failed to request location");
      onContinue(false);
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.iconContainer}>
        <LinearGradient
          colors={["rgba(59, 130, 246, 0.4)", "rgba(147, 51, 234, 0.2)"]}
          style={styles.iconGlow}
        />
        <Text style={styles.icon}>📍</Text>
      </View>

      <Text style={styles.title}>Enable Location</Text>
      <Text style={styles.subtitle}>
        Let us know where you listen to create location-based playlists and recommendations.
      </Text>

      <View style={styles.benefits}>
        <GlassCard style={styles.benefitCard}>
          <View style={styles.benefitRow}>
            <Text style={styles.benefitEmoji}>🏠</Text>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Home Vibes</Text>
              <Text style={styles.benefitDesc}>Relaxing playlists when you're at home</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.benefitCard}>
          <View style={styles.benefitRow}>
            <Text style={styles.benefitEmoji}>💼</Text>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Work Mode</Text>
              <Text style={styles.benefitDesc}>Focus music for productivity</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.benefitCard}>
          <View style={styles.benefitRow}>
            <Text style={styles.benefitEmoji}>🎉</Text>
            <View style={styles.benefitText}>
              <Text style={styles.benefitTitle}>Going Out</Text>
              <Text style={styles.benefitDesc}>Party tracks for your favorite spots</Text>
            </View>
          </View>
        </GlassCard>
      </View>

      {error && <Text style={styles.error}>{error}</Text>}

      <View style={styles.footer}>
        <GlassButton onPress={requestLocation} loading={loading}>
          Allow Location
        </GlassButton>
        <GlassButton variant="ghost" onPress={() => onContinue(false)}>
          Maybe Later
        </GlassButton>
        <GlassButton variant="ghost" onPress={onBack}>
          Back
        </GlassButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  iconContainer: {
    alignItems: "center",
    marginTop: 32,
    marginBottom: 24,
  },
  iconGlow: {
    position: "absolute",
    width: 120,
    height: 120,
    borderRadius: 60,
  },
  icon: {
    fontSize: 64,
  },
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    lineHeight: 22,
    marginBottom: 24,
  },
  benefits: {
    gap: 12,
  },
  benefitCard: {
    padding: 0,
  },
  benefitRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 14,
  },
  benefitEmoji: {
    fontSize: 28,
  },
  benefitText: {
    flex: 1,
  },
  benefitTitle: {
    fontSize: 15,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  benefitDesc: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.5)",
  },
  error: {
    color: "#ff6b6b",
    textAlign: "center",
    marginTop: 12,
  },
  footer: {
    marginTop: "auto",
    gap: 8,
    paddingBottom: 20,
  },
});

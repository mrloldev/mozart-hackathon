import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, Text, View } from "react-native";

interface WelcomeStepProps {
  onContinue: () => void;
}

export function WelcomeStep({ onContinue }: WelcomeStepProps) {
  return (
    <View style={styles.container}>
      <View style={styles.logoContainer}>
        <LinearGradient
          colors={["rgba(29, 185, 84, 0.3)", "rgba(29, 185, 84, 0.1)"]}
          style={styles.logoGlow}
        />
        <Text style={styles.logoEmoji}>🎵</Text>
      </View>

      <Text style={styles.title}>Welcome to Remixer</Text>
      <Text style={styles.subtitle}>
        Your personal music companion that learns your taste and discovers new sounds for you.
      </Text>

      <View style={styles.features}>
        <GlassCard style={styles.featureCard}>
          <View style={styles.featureRow}>
            <Text style={styles.featureEmoji}>🎧</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Smart Discovery</Text>
              <Text style={styles.featureDesc}>Find music based on your mood and location</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.featureCard}>
          <View style={styles.featureRow}>
            <Text style={styles.featureEmoji}>📍</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>Location Vibes</Text>
              <Text style={styles.featureDesc}>Get recommendations for your favorite spots</Text>
            </View>
          </View>
        </GlassCard>

        <GlassCard style={styles.featureCard}>
          <View style={styles.featureRow}>
            <Text style={styles.featureEmoji}>✨</Text>
            <View style={styles.featureText}>
              <Text style={styles.featureTitle}>AI Remixes</Text>
              <Text style={styles.featureDesc}>Create unique versions of your favorite tracks</Text>
            </View>
          </View>
        </GlassCard>
      </View>

      <View style={styles.footer}>
        <GlassButton onPress={onContinue}>Get Started</GlassButton>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 24,
  },
  logoContainer: {
    alignItems: "center",
    marginTop: 40,
    marginBottom: 24,
  },
  logoGlow: {
    position: "absolute",
    width: 140,
    height: 140,
    borderRadius: 70,
  },
  logoEmoji: {
    fontSize: 72,
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
    marginBottom: 32,
  },
  features: {
    gap: 12,
  },
  featureCard: {
    padding: 0,
  },
  featureRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 16,
  },
  featureEmoji: {
    fontSize: 32,
  },
  featureText: {
    flex: 1,
  },
  featureTitle: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  featureDesc: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.5)",
  },
  footer: {
    marginTop: "auto",
    paddingBottom: 20,
  },
});

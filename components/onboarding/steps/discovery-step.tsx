import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";
import { DISCOVERY_PREFERENCES } from "@/constants/onboarding";
import { StyleSheet, Text, View } from "react-native";

interface DiscoveryStepProps {
  selected: string[];
  onToggle: (id: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function DiscoveryStep({ selected, onToggle, onContinue, onBack }: DiscoveryStepProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>How do you discover?</Text>
      <Text style={styles.subtitle}>Tell us what kind of music you want to find</Text>

      <View style={styles.list}>
        {DISCOVERY_PREFERENCES.map((pref) => (
          <GlassCard
            key={pref.id}
            selected={selected.includes(pref.id)}
            onPress={() => onToggle(pref.id)}
            style={styles.prefCard}
          >
            <View style={styles.prefContent}>
              <View style={styles.prefHeader}>
                <Text style={styles.prefTitle}>{pref.label}</Text>
                {selected.includes(pref.id) && (
                  <Text style={styles.checkmark}>✓</Text>
                )}
              </View>
              <Text style={styles.prefDesc}>{pref.description}</Text>
            </View>
          </GlassCard>
        ))}
      </View>

      <View style={styles.footer}>
        <GlassButton
          onPress={onContinue}
          disabled={selected.length === 0}
        >
          Continue
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
  title: {
    fontSize: 28,
    fontWeight: "700",
    color: "#fff",
    textAlign: "center",
    marginTop: 20,
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.5)",
    textAlign: "center",
    marginBottom: 24,
  },
  list: {
    gap: 12,
  },
  prefCard: {
    padding: 0,
  },
  prefContent: {
    gap: 4,
  },
  prefHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  prefTitle: {
    fontSize: 17,
    fontWeight: "600",
    color: "#fff",
  },
  checkmark: {
    fontSize: 18,
    color: "#1DB954",
    fontWeight: "700",
  },
  prefDesc: {
    fontSize: 14,
    color: "rgba(255, 255, 255, 0.5)",
  },
  footer: {
    marginTop: "auto",
    gap: 8,
    paddingBottom: 20,
  },
});

import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";
import { LISTENING_MOODS } from "@/constants/onboarding";
import { StyleSheet, Text, View } from "react-native";

interface MoodsStepProps {
  selected: string[];
  onToggle: (id: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function MoodsStep({ selected, onToggle, onContinue, onBack }: MoodsStepProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>When do you listen?</Text>
      <Text style={styles.subtitle}>Pick your go-to moods for music</Text>

      <View style={styles.grid}>
        {LISTENING_MOODS.map((mood) => (
          <GlassCard
            key={mood.id}
            selected={selected.includes(mood.id)}
            onPress={() => onToggle(mood.id)}
            style={styles.moodCard}
          >
            <Text style={styles.moodEmoji}>{mood.emoji}</Text>
            <Text style={styles.moodLabel}>{mood.label}</Text>
          </GlassCard>
        ))}
      </View>

      <View style={styles.footer}>
        <GlassButton
          onPress={onContinue}
          disabled={selected.length < 2}
        >
          Continue ({selected.length}/2)
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
  grid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    justifyContent: "center",
  },
  moodCard: {
    width: "45%",
    alignItems: "center",
    paddingVertical: 24,
  },
  moodEmoji: {
    fontSize: 36,
    marginBottom: 8,
  },
  moodLabel: {
    fontSize: 15,
    fontWeight: "500",
    color: "#fff",
    textAlign: "center",
  },
  footer: {
    marginTop: "auto",
    gap: 8,
    paddingBottom: 20,
  },
});

import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";
import { MUSIC_GENRES } from "@/constants/onboarding";
import { StyleSheet, Text, View } from "react-native";

interface GenresStepProps {
  selected: string[];
  onToggle: (id: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function GenresStep({ selected, onToggle, onContinue, onBack }: GenresStepProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>What do you listen to?</Text>
      <Text style={styles.subtitle}>Select your favorite genres (pick at least 3)</Text>

      <View style={styles.grid}>
        {MUSIC_GENRES.map((genre) => (
          <GlassCard
            key={genre.id}
            selected={selected.includes(genre.id)}
            onPress={() => onToggle(genre.id)}
            style={styles.genreCard}
          >
            <Text style={styles.genreEmoji}>{genre.emoji}</Text>
            <Text style={styles.genreLabel}>{genre.label}</Text>
          </GlassCard>
        ))}
      </View>

      <View style={styles.footer}>
        <GlassButton
          onPress={onContinue}
          disabled={selected.length < 3}
        >
          Continue ({selected.length}/3)
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
  genreCard: {
    width: "30%",
    minWidth: 100,
    alignItems: "center",
    paddingVertical: 20,
  },
  genreEmoji: {
    fontSize: 28,
    marginBottom: 8,
  },
  genreLabel: {
    fontSize: 13,
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

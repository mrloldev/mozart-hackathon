import { OnboardingStep, ONBOARDING_STEPS } from "@/constants/onboarding";
import { LinearGradient } from "expo-linear-gradient";
import { StyleSheet, View } from "react-native";
import Animated, {
  useAnimatedStyle,
  withSpring,
} from "react-native-reanimated";

interface ProgressDotsProps {
  currentStep: OnboardingStep;
}

export function ProgressDots({ currentStep }: ProgressDotsProps) {
  const currentIndex = ONBOARDING_STEPS.indexOf(currentStep);
  const visibleSteps = ONBOARDING_STEPS.filter((s) => s !== "welcome" && s !== "complete");

  if (currentStep === "welcome" || currentStep === "complete") {
    return null;
  }

  const adjustedIndex = visibleSteps.indexOf(currentStep);

  return (
    <View style={styles.container}>
      {visibleSteps.map((step, index) => (
        <Dot key={step} isActive={index <= adjustedIndex} isCurrent={step === currentStep} />
      ))}
    </View>
  );
}

function Dot({ isActive, isCurrent }: { isActive: boolean; isCurrent: boolean }) {
  const animatedStyle = useAnimatedStyle(() => ({
    width: withSpring(isCurrent ? 24 : 8, { damping: 15, stiffness: 150 }),
    opacity: withSpring(isActive ? 1 : 0.3, { damping: 15 }),
  }));

  return (
    <Animated.View style={[styles.dot, animatedStyle]}>
      {isActive && (
        <LinearGradient
          colors={["#1DB954", "#1ed760"]}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 0 }}
          style={StyleSheet.absoluteFill}
        />
      )}
    </Animated.View>
  );
}

const styles = StyleSheet.create({
  container: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
    paddingVertical: 16,
  },
  dot: {
    height: 8,
    borderRadius: 4,
    backgroundColor: "rgba(255, 255, 255, 0.2)",
    overflow: "hidden",
  },
});

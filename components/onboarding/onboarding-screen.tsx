import { ProgressDots } from "@/components/onboarding/progress-dots";
import { CompleteStep } from "@/components/onboarding/steps/complete-step";
import { DiscoveryStep } from "@/components/onboarding/steps/discovery-step";
import { GenresStep } from "@/components/onboarding/steps/genres-step";
import { LocationStep } from "@/components/onboarding/steps/location-step";
import { MoodsStep } from "@/components/onboarding/steps/moods-step";
import { PlacesStep } from "@/components/onboarding/steps/places-step";
import { WelcomeStep } from "@/components/onboarding/steps/welcome-step";
import { OnboardingStep } from "@/constants/onboarding";
import { Place, saveUserPlaces, setOnboardingCompleted } from "@/lib/onboarding";
import { LinearGradient } from "expo-linear-gradient";
import { router } from "expo-router";
import { useCallback, useState } from "react";
import { StyleSheet, View } from "react-native";
import Animated, { FadeIn, FadeOut } from "react-native-reanimated";
import { useSafeAreaInsets } from "react-native-safe-area-context";

export function OnboardingScreen() {
  const insets = useSafeAreaInsets();
  const [currentStep, setCurrentStep] = useState<OnboardingStep>("welcome");
  const [selectedGenres, setSelectedGenres] = useState<string[]>([]);
  const [selectedMoods, setSelectedMoods] = useState<string[]>([]);
  const [selectedDiscovery, setSelectedDiscovery] = useState<string[]>([]);
  const [places, setPlaces] = useState<Place[]>([]);

  const toggleSelection = useCallback(
    (list: string[], setList: (v: string[]) => void, id: string) => {
      setList(list.includes(id) ? list.filter((i) => i !== id) : [...list, id]);
    },
    []
  );

  const handleFinish = async () => {
    if (places.length > 0) {
      await saveUserPlaces(places);
    }
    await setOnboardingCompleted();
    router.replace("/(tabs)");
  };

  const goTo = (step: OnboardingStep) => setCurrentStep(step);

  return (
    <View style={styles.container}>
      <LinearGradient
        colors={["#0a0a12", "#0f1018", "#0a0a12"]}
        style={StyleSheet.absoluteFill}
      />
      <LinearGradient
        colors={["rgba(29, 185, 84, 0.08)", "transparent"]}
        start={{ x: 0.5, y: 0 }}
        end={{ x: 0.5, y: 0.5 }}
        style={styles.topGlow}
      />

      <View style={[styles.content, { paddingTop: insets.top }]}>
        <ProgressDots currentStep={currentStep} />

        <View style={styles.stepContainer}>
          {currentStep === "welcome" && (
            <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)} style={styles.stepWrapper}>
              <WelcomeStep onContinue={() => goTo("genres")} />
            </Animated.View>
          )}

          {currentStep === "genres" && (
            <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)} style={styles.stepWrapper}>
              <GenresStep
                selected={selectedGenres}
                onToggle={(id) => toggleSelection(selectedGenres, setSelectedGenres, id)}
                onContinue={() => goTo("moods")}
                onBack={() => goTo("welcome")}
              />
            </Animated.View>
          )}

          {currentStep === "moods" && (
            <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)} style={styles.stepWrapper}>
              <MoodsStep
                selected={selectedMoods}
                onToggle={(id) => toggleSelection(selectedMoods, setSelectedMoods, id)}
                onContinue={() => goTo("discovery")}
                onBack={() => goTo("genres")}
              />
            </Animated.View>
          )}

          {currentStep === "discovery" && (
            <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)} style={styles.stepWrapper}>
              <DiscoveryStep
                selected={selectedDiscovery}
                onToggle={(id) => toggleSelection(selectedDiscovery, setSelectedDiscovery, id)}
                onContinue={() => goTo("location")}
                onBack={() => goTo("moods")}
              />
            </Animated.View>
          )}

          {currentStep === "location" && (
            <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)} style={styles.stepWrapper}>
              <LocationStep
                onContinue={() => goTo("places")}
                onBack={() => goTo("discovery")}
              />
            </Animated.View>
          )}

          {currentStep === "places" && (
            <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)} style={styles.stepWrapper}>
              <PlacesStep
                places={places}
                onAddPlace={(p) => setPlaces([...places, p])}
                onRemovePlace={(id) => setPlaces(places.filter((p) => p.id !== id))}
                onContinue={() => goTo("complete")}
                onBack={() => goTo("location")}
              />
            </Animated.View>
          )}

          {currentStep === "complete" && (
            <Animated.View entering={FadeIn.duration(400)} exiting={FadeOut.duration(200)} style={styles.stepWrapper}>
              <CompleteStep onFinish={handleFinish} />
            </Animated.View>
          )}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#0a0a12",
  },
  topGlow: {
    position: "absolute",
    top: 0,
    left: 0,
    right: 0,
    height: 300,
  },
  content: {
    flex: 1,
  },
  stepContainer: {
    flex: 1,
  },
  stepWrapper: {
    flex: 1,
  },
});

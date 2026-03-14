import { OnboardingScreen } from "@/components/onboarding/onboarding-screen";
import { useOnboarding } from "@/hooks/use-onboarding";
import { Redirect } from "expo-router";
import { ActivityIndicator, View } from "react-native";

export default function Index() {
  const { loading, completed } = useOnboarding();

  if (loading) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#000" }}>
        <ActivityIndicator size="large" color="#1DB954" />
      </View>
    );
  }

  if (!completed) {
    return <OnboardingScreen />;
  }

  return <Redirect href="/(tabs)" />;
}

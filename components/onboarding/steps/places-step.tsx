import { GlassButton } from "@/components/ui/glass-button";
import { GlassCard } from "@/components/ui/glass-card";
import { Place } from "@/lib/onboarding";
import { useRef, useState } from "react";
import {
  Keyboard,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  View,
} from "react-native";
import { GooglePlacesAutocomplete } from "react-native-google-places-autocomplete";

const GOOGLE_PLACES_API_KEY = process.env.EXPO_PUBLIC_GOOGLE_PLACES_API_KEY ?? "";

interface PlacesStepProps {
  places: Place[];
  onAddPlace: (place: Place) => void;
  onRemovePlace: (id: string) => void;
  onContinue: () => void;
  onBack: () => void;
}

export function PlacesStep({
  places,
  onAddPlace,
  onRemovePlace,
  onContinue,
  onBack,
}: PlacesStepProps) {
  const autocompleteRef = useRef<any>(null);
  const [isFocused, setIsFocused] = useState(false);

  const handlePlaceSelect = (data: any, details: any) => {
    if (!details) return;

    const newPlace: Place = {
      id: Date.now().toString(),
      name: data.structured_formatting?.main_text || data.description,
      address: details.formatted_address || data.description,
      latitude: details.geometry?.location?.lat ?? 0,
      longitude: details.geometry?.location?.lng ?? 0,
    };

    onAddPlace(newPlace);
    autocompleteRef.current?.clear();
    Keyboard.dismiss();
  };

  if (!GOOGLE_PLACES_API_KEY) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Add Your Places</Text>
        <Text style={styles.subtitle}>
          Google Places API key not configured. You can set this up later.
        </Text>
        <View style={styles.footer}>
          <GlassButton onPress={onContinue}>Continue</GlassButton>
          <GlassButton variant="ghost" onPress={onBack}>
            Back
          </GlassButton>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Add Your Places</Text>
      <Text style={styles.subtitle}>
        Search for your favorite spots - home, work, gym, or hangouts.
      </Text>

      <View style={[styles.searchContainer, isFocused && styles.searchFocused]}>
        <GooglePlacesAutocomplete
          ref={autocompleteRef}
          placeholder="Search for a place..."
          onPress={handlePlaceSelect}
          fetchDetails={true}
          query={{
            key: GOOGLE_PLACES_API_KEY,
            language: "en",
          }}
          textInputProps={{
            placeholderTextColor: "rgba(255, 255, 255, 0.4)",
            onFocus: () => setIsFocused(true),
            onBlur: () => setIsFocused(false),
          }}
          styles={{
            container: { flex: 0 },
            textInputContainer: { backgroundColor: "transparent" },
            textInput: {
              height: 52,
              borderRadius: 16,
              paddingHorizontal: 18,
              fontSize: 16,
              backgroundColor: "rgba(255, 255, 255, 0.08)",
              color: "#fff",
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.1)",
            },
            listView: {
              backgroundColor: "rgba(30, 30, 40, 0.95)",
              borderRadius: 16,
              marginTop: 8,
              borderWidth: 1,
              borderColor: "rgba(255, 255, 255, 0.1)",
            },
            row: {
              backgroundColor: "transparent",
              paddingVertical: 14,
              paddingHorizontal: 16,
            },
            description: { color: "#fff", fontSize: 14 },
            separator: { backgroundColor: "rgba(255, 255, 255, 0.1)" },
            poweredContainer: { display: "none" },
          }}
          enablePoweredByContainer={false}
        />
      </View>

      {places.length > 0 ? (
        <ScrollView style={styles.placesList} showsVerticalScrollIndicator={false}>
          {places.map((place) => (
            <GlassCard key={place.id} style={styles.placeCard}>
              <View style={styles.placeRow}>
                <View style={styles.placeInfo}>
                  <Text style={styles.placeName}>{place.name}</Text>
                  <Text style={styles.placeAddress} numberOfLines={1}>
                    {place.address}
                  </Text>
                </View>
                <Pressable style={styles.removeButton} onPress={() => onRemovePlace(place.id)}>
                  <Text style={styles.removeText}>×</Text>
                </Pressable>
              </View>
            </GlassCard>
          ))}
        </ScrollView>
      ) : (
        <View style={styles.emptyState}>
          <Text style={styles.emptyEmoji}>🗺️</Text>
          <Text style={styles.emptyText}>
            Search and add places to get location-based recommendations
          </Text>
        </View>
      )}

      <View style={styles.footer}>
        <GlassButton onPress={onContinue}>
          {places.length > 0 ? `Continue with ${places.length} place${places.length > 1 ? "s" : ""}` : "Skip for now"}
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
    marginBottom: 20,
  },
  searchContainer: {
    zIndex: 10,
    marginBottom: 16,
  },
  searchFocused: {
    zIndex: 100,
  },
  placesList: {
    flex: 1,
    marginBottom: 12,
  },
  placeCard: {
    marginBottom: 10,
    padding: 0,
  },
  placeRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  placeInfo: {
    flex: 1,
  },
  placeName: {
    fontSize: 16,
    fontWeight: "600",
    color: "#fff",
    marginBottom: 2,
  },
  placeAddress: {
    fontSize: 13,
    color: "rgba(255, 255, 255, 0.5)",
  },
  removeButton: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: "rgba(255, 100, 100, 0.2)",
    justifyContent: "center",
    alignItems: "center",
  },
  removeText: {
    color: "#ff6b6b",
    fontSize: 20,
    fontWeight: "600",
  },
  emptyState: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    paddingHorizontal: 24,
  },
  emptyEmoji: {
    fontSize: 56,
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 15,
    color: "rgba(255, 255, 255, 0.4)",
    textAlign: "center",
    lineHeight: 22,
  },
  footer: {
    gap: 8,
    paddingBottom: 20,
  },
});

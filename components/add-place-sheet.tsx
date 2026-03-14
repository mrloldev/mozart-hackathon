import * as Location from 'expo-location';
import MapView, { Marker } from 'react-native-maps';
import { useState, useEffect } from 'react';
import {
  ActivityIndicator,
  Modal,
  Pressable,
  Text,
  View,
} from 'react-native';

import { IconSymbol } from '@/components/ui/icon-symbol';
import type { Place } from '@/lib/mock-data';

function formatAddress(addr: Location.LocationGeocodedAddress | null): string {
  if (!addr) return '';
  const parts = [addr.street, addr.city, addr.subregion, addr.region].filter(
    Boolean
  );
  return parts.join(', ') || addr.name || 'Current location';
}

interface AddPlaceSheetProps {
  visible: boolean;
  place: Place;
  onClose: () => void;
  onConfirm: (address: string, lat: number, lng: number) => void;
}

export function AddPlaceSheet({
  visible,
  place,
  onClose,
  onConfirm,
}: AddPlaceSheetProps) {
  const [loading, setLoading] = useState(true);
  const [address, setAddress] = useState('');
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!visible) return;
    setLoading(true);
    setError(null);
    Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced })
      .then((loc) => {
        const { latitude, longitude } = loc.coords;
        setCoords({ lat: latitude, lng: longitude });
        return Location.reverseGeocodeAsync({ latitude, longitude });
      })
      .then(([geo]) => setAddress(formatAddress(geo)))
      .catch(() => setError('Could not get location'))
      .finally(() => setLoading(false));
  }, [visible]);

  const updateLocation = async (latitude: number, longitude: number) => {
    setCoords({ lat: latitude, lng: longitude });
    try {
      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
      setAddress(formatAddress(geo));
    } catch {
      setAddress('');
    }
  };

  const handleMapPress = (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    updateLocation(latitude, longitude);
  };

  const handleMarkerDragEnd = (e: { nativeEvent: { coordinate: { latitude: number; longitude: number } } }) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    updateLocation(latitude, longitude);
  };

  const handleConfirm = () => {
    if (coords && address) {
      onConfirm(address, coords.lat, coords.lng);
      onClose();
    }
  };

  if (!place) return null;

  return (
    <Modal
      visible={visible}
      animationType="slide"
      presentationStyle="pageSheet"
    >
      <View className="flex-1 bg-surface">
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-white/5">
          <Text className="text-white text-xl font-bold">Add {place.label}</Text>
          <Pressable onPress={onClose} className="p-2 active:opacity-70">
            <IconSymbol name="xmark" size={24} color="#fff" />
          </Pressable>
        </View>

        <View className="flex-1 p-4 gap-4">
          {loading ? (
            <View className="flex-1 items-center justify-center">
              <ActivityIndicator size="large" color="#1DB954" />
              <Text className="text-neutral-500 mt-3">Getting your location…</Text>
            </View>
          ) : error ? (
            <View className="flex-1 items-center justify-center">
              <IconSymbol name="location.fill" size={48} color="#71717a" />
              <Text className="text-white font-medium mt-3">{error}</Text>
              <Text className="text-neutral-500 text-sm mt-1 text-center px-6">
                Enable location in Settings and try again.
              </Text>
            </View>
          ) : (
            <>
              <View
                className="p-4 rounded-2xl flex-row items-center gap-3"
                style={{ backgroundColor: `${place.color}15` }}
              >
                <View
                  className="w-12 h-12 rounded-xl items-center justify-center"
                  style={{ backgroundColor: `${place.color}30` }}
                >
                  <IconSymbol
                    name={place.icon as never}
                    size={24}
                    color={place.color}
                  />
                </View>
                <View className="flex-1 min-w-0">
                  <Text className="text-white font-semibold">{place.label}</Text>
                  <Text className="text-neutral-400 text-sm mt-0.5" numberOfLines={2}>
                    {address}
                  </Text>
                </View>
              </View>

              {coords && (
                <View className="flex-1 min-h-[260px] rounded-2xl overflow-hidden border border-white/10">
                  <Text className="text-neutral-500 text-[13px] mb-2">
                    Tap the map or drag the marker to select location
                  </Text>
                  <MapView
                    style={{ flex: 1, width: '100%', height: 240 }}
                    initialRegion={{
                      latitude: coords.lat,
                      longitude: coords.lng,
                      latitudeDelta: 0.01,
                      longitudeDelta: 0.01,
                    }}
                    scrollEnabled
                    zoomEnabled
                    onPress={handleMapPress}
                  >
                    <Marker
                      coordinate={{
                        latitude: coords.lat,
                        longitude: coords.lng,
                      }}
                      draggable
                      onDragEnd={handleMarkerDragEnd}
                    />
                  </MapView>
                </View>
              )}

              <Pressable
                onPress={handleConfirm}
                disabled={!coords || !address}
                className="py-4 rounded-2xl bg-brand-primary items-center justify-center active:opacity-90 disabled:opacity-50"
              >
                <Text className="text-white font-semibold text-[17px]">
                  Add {place.label}
                </Text>
              </Pressable>
            </>
          )}
        </View>
      </View>
    </Modal>
  );
}

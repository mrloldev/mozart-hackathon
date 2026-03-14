import { useState } from 'react';
import { Linking, Modal, Pressable, ScrollView, Switch, Text, View } from 'react-native';

import { ALL_PLACES, usePlaces } from '@/contexts/places-context';
import type { Place, PlaceId } from '@/lib/mock-data';

import { AddPlaceSheet } from './add-place-sheet';
import { IconSymbol } from './ui/icon-symbol';

interface PlacePickerModalProps {
  visible: boolean;
  onClose: () => void;
}

export function PlacePickerModal({ visible, onClose }: PlacePickerModalProps) {
  const {
    places,
    currentPlaceId,
    locationEnabled,
    locationPermission,
    currentAddress,
    shortAddress,
    coords,
    isContextual,
    addPlace,
    removePlace,
    setCurrentPlace,
    requestLocationPermission,
  } = usePlaces();
  const [expanded, setExpanded] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [placeToAdd, setPlaceToAdd] = useState<Place | null>(null);
  const [setAsPlaceExpanded, setSetAsPlaceExpanded] = useState(false);

  const showSetAsPlace =
    locationEnabled &&
    !isContextual &&
    (shortAddress || currentAddress) &&
    coords !== null;

  const hasPlace = (id: PlaceId) => places.some((p) => p.id === id);

  const handleLocationToggle = async () => {
    if (locationEnabled) return;
    setRequesting(true);
    await requestLocationPermission();
    setRequesting(false);
  };

  return (
    <Modal visible={visible} animationType="slide" presentationStyle="pageSheet">
      <View className="flex-1 bg-surface">
        <View className="flex-row items-center justify-between px-4 py-4 border-b border-white/5">
          <Text className="text-white text-xl font-bold">Context</Text>
          <Pressable onPress={onClose} className="p-2 active:opacity-70">
            <IconSymbol name="xmark" size={24} color="#fff" />
          </Pressable>
        </View>

        <View className="p-4 gap-6">
          <View className="flex-row items-center justify-between">
            <View>
              <Text className="text-white font-medium">Location</Text>
              <Text className="text-neutral-500 text-sm mt-0.5">
                {locationPermission === 'denied'
                  ? 'Permission denied. Enable in Settings.'
                  : locationEnabled
                    ? 'Contextual recommendations enabled'
                    : 'Tap to enable contextual recommendations'}
              </Text>
            </View>
            {locationPermission === 'denied' ? (
              <Pressable
                onPress={() => Linking.openSettings()}
                className="px-4 py-2 rounded-full bg-amber-500/20 active:opacity-80"
              >
                <Text className="text-amber-400 font-medium text-sm">Open Settings</Text>
              </Pressable>
            ) : (
              <Switch
                value={locationEnabled}
                onValueChange={handleLocationToggle}
                disabled={requesting}
                trackColor={{ false: '#27272a', true: '#1DB954' }}
                thumbColor="#fff"
              />
            )}
          </View>

          <View>
            <Text className="text-white font-medium mb-3">Your Places</Text>
            {places.length === 0 ? (
              <Text className="text-neutral-500">
                Add places to get contextual recommendations
              </Text>
            ) : (
              places.map((place) => (
                <View
                  key={place.userPlaceId}
                  className="flex-row items-center justify-between py-3 border-b border-white/5"
                >
                  <View className="flex-row items-center gap-3">
                    <View className="w-10 h-10 rounded-full bg-surface-muted items-center justify-center">
                      <IconSymbol name={place.icon as any} size={20} color="#71717a" />
                    </View>
                    <View>
                      <Text className="text-white font-medium">{place.label}</Text>
                      <Text className="text-neutral-500 text-sm">
                        {place.address || place.description}
                      </Text>
                    </View>
                  </View>
                  <View className="flex-row items-center gap-2">
                    <Pressable
                      onPress={() => setCurrentPlace(currentPlaceId === place.userPlaceId ? null : place.userPlaceId)}
                      className={`px-3 py-1.5 rounded-full ${
                        currentPlaceId === place.userPlaceId ? 'bg-green-500/20' : 'bg-white/10'
                      }`}
                    >
                      <Text
                        className={`text-sm font-medium ${
                          currentPlaceId === place.userPlaceId ? 'text-green-400' : 'text-neutral-400'
                        }`}
                      >
                        {currentPlaceId === place.userPlaceId ? 'Current' : 'Select'}
                      </Text>
                    </Pressable>
                    <Pressable onPress={() => removePlace(place.userPlaceId)} className="p-2 active:opacity-70">
                      <IconSymbol name="trash" size={20} color="#ef4444" />
                    </Pressable>
                  </View>
                </View>
              ))
            )}
          </View>

          <View>
            <Pressable
              onPress={() => setExpanded(!expanded)}
              className="flex-row items-center justify-between py-3"
            >
              <Text className="text-white font-medium">Add a place</Text>
              <IconSymbol
                name={expanded ? 'chevron.up' : 'chevron.down'}
                size={20}
                color="#71717a"
              />
            </Pressable>
            {expanded && (
              <View className="gap-2 mt-2">
                {ALL_PLACES.filter((p) => !hasPlace(p.id)).map((place: Place) => (
                  <Pressable
                    key={place.id}
                    onPress={() => setPlaceToAdd(place)}
                    className="flex-row items-center gap-3 p-3 rounded-xl bg-surface-elevated border border-white/5 active:opacity-80"
                  >
                    <View className="w-10 h-10 rounded-full items-center justify-center" style={{ backgroundColor: `${place.color}25` }}>
                      <IconSymbol name={place.icon as any} size={20} color={place.color} />
                    </View>
                    <View className="flex-1">
                      <Text className="text-white font-medium">{place.label}</Text>
                      <Text className="text-neutral-500 text-sm">{place.description}</Text>
                    </View>
                    <IconSymbol name="plus.circle" size={24} color="#1DB954" />
                  </Pressable>
                ))}
              </View>
            )}
          </View>
        </View>
      </View>

      {placeToAdd && (
        <AddPlaceSheet
          visible
          place={placeToAdd}
          onClose={() => setPlaceToAdd(null)}
          onConfirm={(address, lat, lng) => {
            addPlace(placeToAdd, address, lat, lng);
            setPlaceToAdd(null);
          }}
        />
      )}
    </Modal>
  );
}

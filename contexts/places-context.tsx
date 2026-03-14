import React, { createContext, useCallback, useContext, useState } from 'react';

import { useLocation } from '@/hooks/use-location';
import { PLACES, type Place, type PlaceId, type UserPlace } from '@/lib/mock-data';

interface PlacesState {
  places: UserPlace[];
  currentPlaceId: string | null;
  locationEnabled: boolean;
  currentAddress: string;
  shortAddress: string;
  coords: { lat: number; lng: number } | null;
  locationPermission: 'undetermined' | 'granted' | 'denied';
  isContextual: boolean;
  canSetAsPlace: boolean;
}

interface PlacesContextValue extends PlacesState {
  addPlace: (place: Place, address: string, lat: number, lng: number) => void;
  removePlace: (userPlaceId: string) => void;
  setCurrentPlace: (userPlaceId: string | null) => void;
  requestLocationPermission: () => Promise<boolean>;
  getCurrentPlace: () => UserPlace | null;
}

const PlacesContext = createContext<PlacesContextValue | null>(null);

export function PlacesProvider({ children }: { children: React.ReactNode }) {
  const { status: locationPermission, requestPermission, address: currentAddress, shortAddress, coords } = useLocation();
  const [places, setPlaces] = useState<UserPlace[]>([]);
  const [currentPlaceId, setCurrentPlaceId] = useState<string | null>(null);

  const locationEnabled = locationPermission === 'granted';
  const isContextual = places.length > 0 && locationEnabled && currentPlaceId !== null;

  const addPlace = useCallback((place: Place, address: string, lat: number, lng: number) => {
    const userPlaceId = `${place.id}-${Date.now()}`;
    const userPlace: UserPlace = {
      ...place,
      userPlaceId,
      address,
      latitude: lat,
      longitude: lng,
    };
    setPlaces((prev) => [...prev, userPlace]);
    setCurrentPlaceId(userPlaceId);
  }, []);

  const removePlace = useCallback((userPlaceId: string) => {
    setPlaces((prev) => prev.filter((p) => p.userPlaceId !== userPlaceId));
    setCurrentPlaceId((prev) => (prev === userPlaceId ? null : prev));
  }, []);

  const setCurrentPlace = useCallback((userPlaceId: string | null) => {
    setCurrentPlaceId(userPlaceId);
  }, []);

  const getCurrentPlace = useCallback(() => {
    if (!currentPlaceId) return null;
    return places.find((p) => p.userPlaceId === currentPlaceId) ?? null;
  }, [currentPlaceId, places]);

  return (
    <PlacesContext.Provider
      value={{
        places,
        currentPlaceId,
        locationEnabled,
        currentAddress,
        shortAddress,
        coords,
        locationPermission,
        isContextual,
        addPlace,
        removePlace,
        setCurrentPlace,
        requestLocationPermission: requestPermission,
        getCurrentPlace,
      }}>
      {children}
    </PlacesContext.Provider>
  );
}

export function usePlaces() {
  const ctx = useContext(PlacesContext);
  if (!ctx) throw new Error('usePlaces must be used within PlacesProvider');
  return ctx;
}

export const ALL_PLACES = PLACES;

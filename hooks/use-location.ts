import * as Location from 'expo-location';
import { useCallback, useEffect, useState } from 'react';

export type LocationPermissionStatus = 'undetermined' | 'granted' | 'denied';

function formatAddress(
  addr: Location.LocationGeocodedAddress | null
): { full: string; short: string } {
  if (!addr) return { full: '', short: '' };
  const parts = [
    addr.street,
    addr.city,
    addr.subregion,
    addr.region,
  ].filter(Boolean);
  const full = parts.join(', ') || addr.name || 'Current location';
  const short =
    [addr.street, addr.city].filter(Boolean).slice(0, 2).join(', ') ||
    addr.city ||
    addr.region ||
    full;
  return { full, short };
}

export function useLocation() {
  const [status, setStatus] = useState<LocationPermissionStatus>('undetermined');
  const [isLoading, setIsLoading] = useState(true);
  const [address, setAddress] = useState<{ full: string; short: string }>({ full: '', short: '' });
  const [coords, setCoords] = useState<{ lat: number; lng: number } | null>(null);

  const fetchAddress = useCallback(async () => {
    try {
      const loc = await Location.getCurrentPositionAsync({
        accuracy: Location.Accuracy.Balanced,
      });
      const { latitude, longitude } = loc.coords;
      setCoords({ lat: latitude, lng: longitude });
      const [geo] = await Location.reverseGeocodeAsync({ latitude, longitude });
      setAddress(formatAddress(geo));
    } catch {
      setAddress({ full: '', short: '' });
    }
  }, [status]);

  const checkPermission = useCallback(async () => {
    try {
      const { status: permissionStatus } = await Location.getForegroundPermissionsAsync();
      const newStatus: LocationPermissionStatus =
        permissionStatus === 'granted' ? 'granted' : permissionStatus === 'denied' ? 'denied' : 'undetermined';
      setStatus(newStatus);
      if (newStatus === 'granted') {
        await fetchAddress();
      } else {
        setAddress({ full: '', short: '' });
      }
    } catch {
      setStatus('denied');
      setAddress({ full: '', short: '' });
    } finally {
      setIsLoading(false);
    }
  }, [fetchAddress]);

  useEffect(() => {
    checkPermission();
  }, [checkPermission]);

  const requestPermission = useCallback(async (): Promise<boolean> => {
    setIsLoading(true);
    try {
      const { status: permissionStatus } = await Location.requestForegroundPermissionsAsync();
      const newStatus: LocationPermissionStatus =
        permissionStatus === 'granted' ? 'granted' : permissionStatus === 'denied' ? 'denied' : 'undetermined';
      setStatus(newStatus);
      if (newStatus === 'granted') {
        await fetchAddress();
      }
      return newStatus === 'granted';
    } catch {
      setStatus('denied');
      return false;
    } finally {
      setIsLoading(false);
    }
  }, [fetchAddress]);

  return {
    status,
    isLoading,
    address: address.full,
    shortAddress: address.short,
    coords,
    requestPermission,
    checkPermission,
    fetchAddress,
  };
}

'use client';

import { useState, useEffect, useCallback, useRef } from 'react';
import { openSkyAPI, Aircraft, FlightAlert, AIRCRAFT_MODELS } from '@/lib/opensky-api';
import { hexDBAPI } from '@/lib/hexdb-api';
import { toast } from 'sonner';

interface TrackedAircraft extends Aircraft {
  matchedModel?: string;
  distance?: number;
  isNew?: boolean;
  registration?: string;
  aircraftType?: string;
  photoUrl?: string;
  thumbnailUrl?: string;
}

interface UseFlightTrackerOptions {
  updateInterval?: number; // in seconds
  enabled?: boolean;
}

export function useFlightTracker(
  alert: FlightAlert | null,
  options: UseFlightTrackerOptions = {}
) {
  const { updateInterval = 30, enabled = true } = options;
  
  const [aircraft, setAircraft] = useState<TrackedAircraft[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [lastUpdate, setLastUpdate] = useState<Date | null>(null);
  
  const previousAircraftRef = useRef<Set<string>>(new Set());
  const alertedAircraftRef = useRef<Set<string>>(new Set());

  const fetchAircraft = useCallback(async () => {
    if (!alert || !alert.active || !enabled) return;

    setIsLoading(true);
    setError(null);

    try {
      const nearbyAircraft = await openSkyAPI.getAircraftInRadius(
        alert.latitude,
        alert.longitude,
        alert.radius
      );

      // Get aircraft type information from HexDB for all aircraft
      const icao24List = nearbyAircraft.map(a => a.icao24);
      const aircraftInfoMap = await hexDBAPI.getMultipleAircraftInfo(icao24List);

      const currentAircraftSet = new Set<string>();
      const trackedAircraft: TrackedAircraft[] = nearbyAircraft.map(plane => {
        if (!plane.latitude || !plane.longitude) return plane;
        
        currentAircraftSet.add(plane.icao24);
        
        const distance = openSkyAPI.calculateDistance(
          alert.latitude,
          alert.longitude,
          plane.latitude,
          plane.longitude
        );

        // Get aircraft info from HexDB
        const hexDBInfo = aircraftInfoMap.get(plane.icao24);
        const matchedModel = hexDBInfo ? hexDBAPI.mapTypeToModel(hexDBInfo.ICAOTypeCode) : null;
        const isNew = !previousAircraftRef.current.has(plane.icao24);

        // Check if this matches our selected models
        const isMatchingModel = matchedModel && alert.aircraftModels.includes(matchedModel);

        // Check if this is a new aircraft matching our criteria
        if (isMatchingModel && isNew && !alertedAircraftRef.current.has(plane.icao24)) {
          alertedAircraftRef.current.add(plane.icao24);
          
          // Trigger notification
          toast.success(`Alert: ${AIRCRAFT_MODELS[matchedModel].name} detected!`, {
            description: `
              Flight ${plane.callsign || 'Unknown'} (${hexDBInfo?.Registration || plane.icao24})
              Type: ${hexDBInfo?.Type || 'Unknown'}
              Distance: ${distance.toFixed(1)}km
              Altitude: ${plane.baro_altitude ? `${Math.round(plane.baro_altitude)}m` : 'Unknown'}
            `,
            duration: 10000,
          });

          // Also trigger browser notification if permission granted
          if ('Notification' in window && Notification.permission === 'granted') {
            new Notification(`Aircraft Alert: ${AIRCRAFT_MODELS[matchedModel].name}`, {
              body: `Flight ${plane.callsign || plane.icao24} is ${distance.toFixed(1)}km away`,
              icon: '/airplane-icon.png',
            });
          }
        }

        // Get photo URLs
        const photoData = hexDBAPI.getAircraftPhoto(plane.icao24);

        return {
          ...plane,
          matchedModel: isMatchingModel ? matchedModel : undefined,
          distance,
          isNew,
          registration: hexDBInfo?.Registration,
          aircraftType: hexDBInfo?.Type || hexDBInfo?.ICAOTypeCode,
          photoUrl: photoData.fullImageUrl,
          thumbnailUrl: photoData.thumbnailUrl,
        };
      });

      // Clean up alerted aircraft that are no longer in range
      alertedAircraftRef.current.forEach(icao24 => {
        if (!currentAircraftSet.has(icao24)) {
          alertedAircraftRef.current.delete(icao24);
        }
      });

      previousAircraftRef.current = currentAircraftSet;
      setAircraft(trackedAircraft);
      setLastUpdate(new Date());
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to fetch aircraft data');
      console.error('Error fetching aircraft:', err);
    } finally {
      setIsLoading(false);
    }
  }, [alert, enabled]);

  // Initial fetch and interval setup
  useEffect(() => {
    if (!alert || !alert.active || !enabled) {
      setAircraft([]);
      return;
    }

    // Initial fetch
    fetchAircraft();

    // Set up interval
    const interval = setInterval(fetchAircraft, updateInterval * 1000);

    return () => {
      clearInterval(interval);
    };
  }, [alert, updateInterval, enabled, fetchAircraft]);

  // Request notification permission
  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }
  }, []);

  return {
    aircraft,
    isLoading,
    error,
    lastUpdate,
    refresh: fetchAircraft,
  };
}
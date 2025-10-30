'use client';

import { useState, useEffect } from 'react';
import dynamic from 'next/dynamic';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';

const MapComponent = dynamic(
  () => import('./map-component'),
  { ssr: false, loading: () => <div className="h-[400px] bg-gray-100 animate-pulse rounded-lg" /> }
);

interface CoordinatePickerProps {
  onCoordinateSelect: (lat: number, lon: number, radius: number) => void;
  initialLat?: number;
  initialLon?: number;
  initialRadius?: number;
}

export function CoordinatePicker({ 
  onCoordinateSelect, 
  initialLat = 59.3293,
  initialLon = 18.0686,
  initialRadius = 50 
}: CoordinatePickerProps) {
  const [latitude, setLatitude] = useState<string>(initialLat.toString());
  const [longitude, setLongitude] = useState<string>(initialLon.toString());
  const [radius, setRadius] = useState<string>(initialRadius.toString());
  const [useCurrentLocation, setUseCurrentLocation] = useState(false);

  const handleGetCurrentLocation = () => {
    if ('geolocation' in navigator) {
      navigator.geolocation.getCurrentPosition(
        (position) => {
          setLatitude(position.coords.latitude.toString());
          setLongitude(position.coords.longitude.toString());
          setUseCurrentLocation(true);
        },
        (error) => {
          console.error('Error getting location:', error);
        }
      );
    }
  };

  const handleSubmit = () => {
    const lat = parseFloat(latitude);
    const lon = parseFloat(longitude);
    const rad = parseFloat(radius);

    if (!isNaN(lat) && !isNaN(lon) && !isNaN(rad)) {
      onCoordinateSelect(lat, lon, rad);
    }
  };

  const handleMapClick = (lat: number, lon: number) => {
    setLatitude(lat.toFixed(4));
    setLongitude(lon.toFixed(4));
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Alert Location</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <Label htmlFor="latitude">Latitude</Label>
            <Input
              id="latitude"
              type="number"
              step="0.0001"
              value={latitude}
              onChange={(e) => setLatitude(e.target.value)}
              placeholder="59.3293"
            />
          </div>
          <div>
            <Label htmlFor="longitude">Longitude</Label>
            <Input
              id="longitude"
              type="number"
              step="0.0001"
              value={longitude}
              onChange={(e) => setLongitude(e.target.value)}
              placeholder="18.0686"
            />
          </div>
        </div>
        
        <div>
          <Label htmlFor="radius">Alert Radius (km)</Label>
          <Input
            id="radius"
            type="number"
            step="1"
            min="1"
            max="200"
            value={radius}
            onChange={(e) => setRadius(e.target.value)}
            placeholder="50"
          />
        </div>

        <div className="flex gap-2">
          <Button
            type="button"
            variant="outline"
            onClick={handleGetCurrentLocation}
          >
            Use Current Location
          </Button>
          <Button onClick={handleSubmit}>
            Set Alert Area
          </Button>
        </div>

        <div className="h-[400px] w-full rounded-lg overflow-hidden">
          <MapComponent
            center={[parseFloat(latitude) || initialLat, parseFloat(longitude) || initialLon]}
            radius={parseFloat(radius) || initialRadius}
            onMapClick={handleMapClick}
          />
        </div>
      </CardContent>
    </Card>
  );
}
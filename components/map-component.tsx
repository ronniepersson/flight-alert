'use client';

import { useEffect } from 'react';
import L from 'leaflet';
import { MapContainer, TileLayer, Circle, Marker, useMap, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';

// Fix for default markers in Next.js
delete (L.Icon.Default.prototype as any)._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png',
});

interface MapComponentProps {
  center: [number, number];
  radius: number;
  onMapClick?: (lat: number, lon: number) => void;
  aircraft?: Array<{
    icao24: string;
    latitude?: number;
    longitude?: number;
    callsign?: string;
    altitude?: number;
  }>;
}

function MapEvents({ onMapClick }: { onMapClick?: (lat: number, lon: number) => void }) {
  useMapEvents({
    click(e) {
      if (onMapClick) {
        onMapClick(e.latlng.lat, e.latlng.lng);
      }
    },
  });
  return null;
}

function MapUpdater({ center, radius }: { center: [number, number]; radius: number }) {
  const map = useMap();
  
  useEffect(() => {
    map.setView(center);
    // Adjust zoom based on radius
    const zoom = radius > 100 ? 8 : radius > 50 ? 9 : radius > 20 ? 10 : 11;
    map.setZoom(zoom);
  }, [center, radius, map]);
  
  return null;
}

export default function MapComponent({ center, radius, onMapClick, aircraft = [] }: MapComponentProps) {
  // Create custom airplane icon
  const planeIcon = L.divIcon({
    html: '<div style="transform: rotate(45deg);">✈️</div>',
    className: 'custom-plane-icon',
    iconSize: [24, 24],
    iconAnchor: [12, 12],
  });

  return (
    <MapContainer
      center={center}
      zoom={10}
      style={{ height: '100%', width: '100%' }}
      className="z-0"
    >
      <TileLayer
        attribution='&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
        url="https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png"
      />
      
      <MapUpdater center={center} radius={radius} />
      <MapEvents onMapClick={onMapClick} />
      
      {/* Alert center marker */}
      <Marker position={center} />
      
      {/* Alert radius circle */}
      <Circle
        center={center}
        radius={radius * 1000} // Convert km to meters
        pathOptions={{
          color: 'blue',
          fillColor: 'blue',
          fillOpacity: 0.1,
        }}
      />
      
      {/* Aircraft markers */}
      {aircraft
        .filter((plane) => plane.latitude && plane.longitude)
        .map((plane) => (
          <Marker
            key={plane.icao24}
            position={[plane.latitude!, plane.longitude!]}
            icon={planeIcon}
          >
          </Marker>
        ))}
    </MapContainer>
  );
}
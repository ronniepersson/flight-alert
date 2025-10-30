'use client';

import { useState } from 'react';
import { Toaster } from '@/components/ui/sonner';
import { CoordinatePicker } from '@/components/coordinate-picker';
import { AircraftSelector } from '@/components/aircraft-selector';
import { AlertStatus } from '@/components/alert-status';
import { AircraftList } from '@/components/aircraft-list';
import { useFlightTracker } from '@/hooks/use-flight-tracker';
import { FlightAlert } from '@/lib/opensky-api';
import dynamic from 'next/dynamic';

const MapComponent = dynamic(
  () => import('@/components/map-component'),
  { ssr: false, loading: () => <div className="h-full bg-gray-100 animate-pulse rounded-lg" /> }
);

export default function Home() {
  const [alert, setAlert] = useState<FlightAlert | null>(null);
  const [showSetup, setShowSetup] = useState(true);

  const { aircraft, isLoading, error, lastUpdate, refresh } = useFlightTracker(alert, {
    updateInterval: 30,
    enabled: alert?.active || false,
  });

  const handleCoordinateSelect = (lat: number, lon: number, radius: number) => {
    setAlert(prev => ({
      id: prev?.id || `alert-${Date.now()}`,
      latitude: lat,
      longitude: lon,
      radius: radius,
      aircraftModels: prev?.aircraftModels || [],
      active: false,
    }));
  };

  const handleAircraftSelection = (selectedModels: string[]) => {
    setAlert(prev => {
      if (!prev) return null;
      return {
        ...prev,
        aircraftModels: selectedModels,
      };
    });
  };

  const toggleAlert = () => {
    setAlert(prev => {
      if (!prev) return null;
      return {
        ...prev,
        active: !prev.active,
      };
    });
    if (!alert?.active) {
      setShowSetup(false);
    }
  };

  return (
    <main className="min-h-screen bg-background">
      <Toaster position="top-right" />
      
      <div className="container mx-auto p-4 space-y-6">
        <header className="text-center py-6">
          <h1 className="text-4xl font-bold mb-2">Flight Alert System</h1>
          <p className="text-muted-foreground">
            Get notified when specific aircraft models enter your area
          </p>
        </header>

        {showSetup ? (
          <div className="grid gap-6 md:grid-cols-2">
            <CoordinatePicker onCoordinateSelect={handleCoordinateSelect} />
            <AircraftSelector 
              onSelectionChange={handleAircraftSelection}
              initialSelection={alert?.aircraftModels}
            />
            
            <div className="md:col-span-2">
              <AlertStatus
                alert={alert}
                aircraftCount={aircraft.length}
                lastUpdate={lastUpdate}
                isLoading={isLoading}
                error={error}
                onToggleAlert={toggleAlert}
                onRefresh={refresh}
              />
            </div>
          </div>
        ) : (
          <div className="space-y-6">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold">Live Monitoring</h2>
              <button
                onClick={() => setShowSetup(true)}
                className="text-primary hover:underline"
              >
                Edit Alert Settings
              </button>
            </div>

            <div className="grid gap-6 lg:grid-cols-3">
              <div className="lg:col-span-2 space-y-6">
                <div className="h-[500px] rounded-lg overflow-hidden border">
                  {alert && (
                    <MapComponent
                      center={[alert.latitude, alert.longitude]}
                      radius={alert.radius}
                      aircraft={aircraft.filter(a => a.latitude && a.longitude)}
                    />
                  )}
                </div>
                
                <AlertStatus
                  alert={alert}
                  aircraftCount={aircraft.length}
                  lastUpdate={lastUpdate}
                  isLoading={isLoading}
                  error={error}
                  onToggleAlert={toggleAlert}
                  onRefresh={refresh}
                />
              </div>

              <div className="lg:col-span-1">
                <AircraftList 
                  aircraft={aircraft}
                  isLoading={isLoading}
                />
              </div>
            </div>
          </div>
        )}
      </div>
    </main>
  );
}
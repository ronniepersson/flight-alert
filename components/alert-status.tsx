'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { FlightAlert } from '@/lib/opensky-api';

interface AlertStatusProps {
  alert: FlightAlert | null;
  aircraftCount: number;
  lastUpdate: Date | null;
  isLoading: boolean;
  error: string | null;
  onToggleAlert: () => void;
  onRefresh: () => void;
}

export function AlertStatus({
  alert,
  aircraftCount,
  lastUpdate,
  isLoading,
  error,
  onToggleAlert,
  onRefresh,
}: AlertStatusProps) {
  if (!alert) {
    return (
      <Card>
        <CardHeader>
          <CardTitle>Alert Status</CardTitle>
        </CardHeader>
        <CardContent>
          <Alert>
            <AlertDescription>
              No alert configured. Please set up your location and aircraft preferences.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between">
        <CardTitle>Alert Status</CardTitle>
        <Badge variant={alert.active ? 'default' : 'secondary'}>
          {alert.active ? 'Active' : 'Inactive'}
        </Badge>
      </CardHeader>
      <CardContent className="space-y-4">
        {error && (
          <Alert variant="destructive">
            <AlertDescription>{error}</AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div>
            <span className="text-muted-foreground">Location:</span>
            <p className="font-medium">
              {alert.latitude.toFixed(4)}, {alert.longitude.toFixed(4)}
            </p>
          </div>
          <div>
            <span className="text-muted-foreground">Radius:</span>
            <p className="font-medium">{alert.radius} km</p>
          </div>
          <div>
            <span className="text-muted-foreground">Aircraft in area:</span>
            <p className="font-medium">{aircraftCount}</p>
          </div>
          <div>
            <span className="text-muted-foreground">Monitoring models:</span>
            <p className="font-medium">{alert.aircraftModels.length} selected</p>
          </div>
        </div>

        {lastUpdate && (
          <div className="text-xs text-muted-foreground">
            Last updated: {lastUpdate.toLocaleTimeString()}
          </div>
        )}

        <div className="flex gap-2">
          <Button
            onClick={onToggleAlert}
            variant={alert.active ? 'destructive' : 'default'}
            className="flex-1"
          >
            {alert.active ? 'Stop Monitoring' : 'Start Monitoring'}
          </Button>
          <Button
            onClick={onRefresh}
            variant="outline"
            disabled={!alert.active || isLoading}
          >
            {isLoading ? 'Refreshing...' : 'Refresh Now'}
          </Button>
        </div>
      </CardContent>
    </Card>
  );
}
'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Alert, AlertDescription } from '@/components/ui/alert';
import { AIRCRAFT_MODELS } from '@/lib/opensky-api';
import { AircraftPhoto } from './aircraft-photo';

interface AircraftListProps {
  aircraft: Array<{
    icao24: string;
    callsign?: string;
    latitude?: number;
    longitude?: number;
    baro_altitude?: number;
    velocity?: number;
    origin_country: string;
    on_ground: boolean;
    matchedModel?: string;
    distance?: number;
    isNew?: boolean;
    registration?: string;
    aircraftType?: string;
    photoUrl?: string;
    thumbnailUrl?: string;
  }>;
  isLoading: boolean;
}

export function AircraftList({ aircraft, isLoading }: AircraftListProps) {
  const matchedAircraft = aircraft.filter(a => a.matchedModel);
  const otherAircraft = aircraft.filter(a => !a.matchedModel);

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle>
          Aircraft in Area ({aircraft.length})
        </CardTitle>
      </CardHeader>
      <CardContent>
        {isLoading && aircraft.length === 0 ? (
          <div className="text-center text-muted-foreground py-8">
            Loading aircraft data...
          </div>
        ) : aircraft.length === 0 ? (
          <Alert>
            <AlertDescription>
              No aircraft currently in the monitored area.
            </AlertDescription>
          </Alert>
        ) : (
          <div className="space-y-4">
            {matchedAircraft.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-primary">
                  Matched Aircraft ({matchedAircraft.length})
                </h3>
                <div className="space-y-2">
                  {matchedAircraft.map(plane => (
                    <div
                      key={plane.icao24}
                      className="p-3 rounded-lg border bg-primary/5 border-primary/20"
                    >
                      <div className="flex items-start gap-3">
                        <AircraftPhoto
                          thumbnailUrl={plane.thumbnailUrl}
                          fullImageUrl={plane.photoUrl}
                          aircraftType={plane.aircraftType}
                          registration={plane.registration}
                          size="medium"
                        />
                        <div className="flex-1 space-y-1">
                          <div className="flex items-center gap-2">
                            <span className="font-medium">
                              {plane.callsign || 'Unknown Flight'}
                            </span>
                            {plane.isNew && (
                              <Badge variant="default" className="text-xs">
                                NEW
                              </Badge>
                            )}
                            {plane.matchedModel && (
                              <Badge variant="secondary" className="text-xs">
                                {AIRCRAFT_MODELS[plane.matchedModel]?.name}
                              </Badge>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground space-x-3">
                            <span>ICAO: {plane.icao24}</span>
                            {plane.registration && (
                              <span>Reg: {plane.registration}</span>
                            )}
                            {plane.aircraftType && (
                              <span>Type: {plane.aircraftType}</span>
                            )}
                            {plane.distance && (
                              <span>Distance: {plane.distance.toFixed(1)}km</span>
                            )}
                          </div>
                          <div className="text-xs text-muted-foreground space-x-3">
                            {plane.baro_altitude && (
                              <span>Alt: {Math.round(plane.baro_altitude)}m</span>
                            )}
                            {plane.velocity && (
                              <span>Speed: {Math.round(plane.velocity * 3.6)}km/h</span>
                            )}
                            <span>{plane.on_ground ? 'On Ground' : 'In Flight'}</span>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {otherAircraft.length > 0 && (
              <div className="space-y-2">
                <h3 className="text-sm font-semibold text-muted-foreground">
                  Other Aircraft ({otherAircraft.length})
                </h3>
                <div className="space-y-1 max-h-[300px] overflow-y-auto">
                  {otherAircraft.map(plane => (
                    <div
                      key={plane.icao24}
                      className="p-2 rounded border text-xs"
                    >
                      <div className="flex items-center gap-2">
                        <AircraftPhoto
                          thumbnailUrl={plane.thumbnailUrl}
                          fullImageUrl={plane.photoUrl}
                          aircraftType={plane.aircraftType}
                          registration={plane.registration}
                          size="small"
                        />
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <span className="font-medium">
                                {plane.callsign || plane.icao24}
                              </span>
                              {(plane.registration || plane.aircraftType) && (
                                <span className="text-muted-foreground ml-2">
                                  {plane.registration && `(${plane.registration})`}
                                  {plane.aircraftType && ` ${plane.aircraftType}`}
                                </span>
                              )}
                            </div>
                            <div className="flex items-center gap-2 text-muted-foreground">
                              {plane.distance && (
                                <span>{plane.distance.toFixed(1)}km</span>
                              )}
                              {plane.baro_altitude && (
                                <span>{Math.round(plane.baro_altitude)}m</span>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
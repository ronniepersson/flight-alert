'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { AIRCRAFT_MODELS } from '@/lib/opensky-api';

interface AircraftSelectorProps {
  onSelectionChange: (selectedModels: string[]) => void;
  initialSelection?: string[];
}

export function AircraftSelector({ 
  onSelectionChange, 
  initialSelection = [] 
}: AircraftSelectorProps) {
  const [selectedModels, setSelectedModels] = useState<string[]>(initialSelection);
  const [searchTerm, setSearchTerm] = useState('');

  const toggleModel = (modelKey: string) => {
    setSelectedModels(prev => {
      const newSelection = prev.includes(modelKey)
        ? prev.filter(m => m !== modelKey)
        : [...prev, modelKey];
      onSelectionChange(newSelection);
      return newSelection;
    });
  };

  const selectAll = () => {
    const allModels = Object.keys(AIRCRAFT_MODELS);
    setSelectedModels(allModels);
    onSelectionChange(allModels);
  };

  const clearAll = () => {
    setSelectedModels([]);
    onSelectionChange([]);
  };

  const filteredModels = Object.entries(AIRCRAFT_MODELS).filter(([key, model]) =>
    model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
    key.toLowerCase().includes(searchTerm.toLowerCase())
  );

  // Group aircraft by manufacturer/type for better organization
  const groupedModels = filteredModels.reduce((acc, [key, model]) => {
    let category = 'Other';
    
    if (key.startsWith('B7') || key.startsWith('B4') || key.startsWith('B6')) {
      category = 'Boeing Commercial';
    } else if (key.startsWith('A3') || key.startsWith('A2')) {
      category = 'Airbus';
    } else if (key.startsWith('E1') || key.startsWith('E2') || key.startsWith('E9')) {
      category = 'Embraer';
    } else if (key.startsWith('CRJ') || key.startsWith('DH8')) {
      category = 'Bombardier';
    } else if (key.startsWith('AT')) {
      category = 'ATR';
    } else if (key.startsWith('C') && (key.includes('25') || key.includes('51') || key.includes('55') || key.includes('68') || key.includes('75'))) {
      category = 'Business Jets';
    } else if (key.startsWith('GLF') || key.startsWith('LJ') || key.startsWith('H25')) {
      category = 'Business Jets';
    } else if (key.startsWith('C1') || key.startsWith('PA') || key.startsWith('BE')) {
      category = 'General Aviation';
    } else if (key.startsWith('AN') || key.startsWith('IL')) {
      category = 'Cargo/Transport';
    } else if (key.startsWith('KC') || key.startsWith('C1') || key.startsWith('C2') || key.startsWith('C5') || key === 'A400M' || key === 'A330MRTT') {
      category = 'Military Transport';
    } else if (key.startsWith('V22') || key.startsWith('MV22') || key.startsWith('CV22') || key.startsWith('P3') || key.startsWith('P8') || key.startsWith('E2') || key.startsWith('E3') || key.startsWith('RC') || key.startsWith('U2')) {
      category = 'Military Special Ops';
    } else if (key.startsWith('F1') || key.startsWith('F3') || key.startsWith('A10') || key.startsWith('AV8')) {
      category = 'Military Combat';
    } else if (key.startsWith('T3') || key.startsWith('T4') || key.startsWith('T6')) {
      category = 'Military Training';
    } else if (key.startsWith('UH') || key.startsWith('CH') || key.startsWith('AH') || key.startsWith('SH')) {
      category = 'Military Helicopters';
    } else if (key.startsWith('AS') || key.startsWith('EC') || key.startsWith('B0') || key.startsWith('B4') || key.startsWith('R')) {
      category = 'Civil Helicopters';
    } else if (key.startsWith('F') || key.startsWith('DC') || key.startsWith('MD') || key.startsWith('L')) {
      category = 'Classic Aircraft';
    }
    
    if (!acc[category]) acc[category] = [];
    acc[category].push([key, model]);
    return acc;
  }, {} as Record<string, typeof filteredModels>);

  return (
    <Card>
      <CardHeader>
        <CardTitle>Select Aircraft Models</CardTitle>
        <p className="text-sm text-muted-foreground mt-2">
          Aircraft types are detected using HexDB.io database. Select models to receive alerts when they enter your area.
        </p>
      </CardHeader>
      <CardContent className="space-y-4">
        <div>
          <Label htmlFor="search">Search Aircraft</Label>
          <Input
            id="search"
            type="text"
            placeholder="Search by model name..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="mb-2"
          />
        </div>

        <div className="flex gap-2 mb-4">
          <Button 
            onClick={selectAll} 
            size="sm" 
            variant="outline"
          >
            Select All
          </Button>
          <Button 
            onClick={clearAll} 
            size="sm" 
            variant="outline"
          >
            Clear All
          </Button>
        </div>

        <div className="space-y-2">
          {selectedModels.length > 0 && (
            <div className="mb-4">
              <Label className="text-sm text-muted-foreground mb-2 block">
                Selected Models ({selectedModels.length})
              </Label>
              <div className="flex flex-wrap gap-2">
                {selectedModels.map(modelKey => (
                  <Badge 
                    key={modelKey} 
                    variant="default"
                    className="cursor-pointer"
                    onClick={() => toggleModel(modelKey)}
                  >
                    {AIRCRAFT_MODELS[modelKey]?.name || modelKey} ✕
                  </Badge>
                ))}
              </div>
            </div>
          )}

          <Label className="text-sm text-muted-foreground">Available Models</Label>
          <div className="max-h-[400px] overflow-y-auto p-2 border rounded-lg space-y-4">
            {Object.entries(groupedModels).map(([category, models]) => (
              <div key={category}>
                <h4 className="font-medium text-sm text-primary mb-2 border-b pb-1">
                  {category} ({models.length})
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
                  {models.map(([modelKey, model]) => (
                    <div
                      key={modelKey}
                      className={`
                        flex items-center justify-between p-2 rounded-lg border cursor-pointer
                        transition-colors hover:bg-accent
                        ${selectedModels.includes(modelKey) 
                          ? 'bg-primary/10 border-primary' 
                          : 'bg-background border-border'
                        }
                      `}
                      onClick={() => toggleModel(modelKey)}
                    >
                      <div className="flex flex-col min-w-0 flex-1">
                        <span className="font-medium text-sm">{modelKey}</span>
                        <span className="text-xs text-muted-foreground truncate">{model.name}</span>
                      </div>
                      <div className="ml-2 flex-shrink-0">
                        {selectedModels.includes(modelKey) && (
                          <svg 
                            className="w-4 h-4 text-primary" 
                            fill="currentColor" 
                            viewBox="0 0 20 20"
                          >
                            <path 
                              fillRule="evenodd" 
                              d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" 
                              clipRule="evenodd"
                            />
                          </svg>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>

        {Object.keys(groupedModels).length === 0 && (
          <p className="text-center text-muted-foreground py-4">
            No aircraft models found matching "{searchTerm}"
          </p>
        )}
      </CardContent>
    </Card>
  );
}
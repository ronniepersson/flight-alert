import axios from 'axios';

const OPENSKY_API_BASE = 'https://opensky-network.org/api';

export interface Aircraft {
  icao24: string;
  callsign?: string;
  origin_country: string;
  time_position?: number;
  last_contact: number;
  longitude?: number;
  latitude?: number;
  baro_altitude?: number;
  on_ground: boolean;
  velocity?: number;
  true_track?: number;
  vertical_rate?: number;
  sensors?: number[];
  geo_altitude?: number;
  squawk?: string;
  spi: boolean;
  position_source: number;
  category?: number;
}

export interface StateVector {
  time: number;
  states: any[][];
}

export interface BoundingBox {
  latMin: number;
  latMax: number;
  lonMin: number;
  lonMax: number;
}

export interface FlightAlert {
  id: string;
  latitude: number;
  longitude: number;
  radius: number; // in kilometers
  aircraftModels: string[]; // ICAO type designators
  active: boolean;
}

class OpenSkyAPI {
  private apiBase: string;

  constructor() {
    this.apiBase = OPENSKY_API_BASE;
  }

  private parseAircraft(state: any[]): Aircraft {
    return {
      icao24: state[0],
      callsign: state[1]?.trim() || undefined,
      origin_country: state[2],
      time_position: state[3] || undefined,
      last_contact: state[4],
      longitude: state[5] || undefined,
      latitude: state[6] || undefined,
      baro_altitude: state[7] || undefined,
      on_ground: state[8],
      velocity: state[9] || undefined,
      true_track: state[10] || undefined,
      vertical_rate: state[11] || undefined,
      sensors: state[12] || undefined,
      geo_altitude: state[13] || undefined,
      squawk: state[14] || undefined,
      spi: state[15],
      position_source: state[16],
      category: state[17] || undefined,
    };
  }

  async getStatesInArea(boundingBox: BoundingBox): Promise<Aircraft[]> {
    try {
      const response = await axios.get(`${this.apiBase}/states/all`, {
        params: {
          lamin: boundingBox.latMin,
          lamax: boundingBox.latMax,
          lomin: boundingBox.lonMin,
          lomax: boundingBox.lonMax,
        },
      });

      if (!response.data?.states) {
        return [];
      }

      return response.data.states.map((state: any[]) => this.parseAircraft(state));
    } catch (error) {
      console.error('Error fetching states from OpenSky:', error);
      return [];
    }
  }

  async getAircraftByICAO24(icao24: string): Promise<Aircraft | null> {
    try {
      const response = await axios.get(`${this.apiBase}/states/all`, {
        params: {
          icao24: icao24.toLowerCase(),
        },
      });

      if (!response.data?.states || response.data.states.length === 0) {
        return null;
      }

      return this.parseAircraft(response.data.states[0]);
    } catch (error) {
      console.error('Error fetching aircraft by ICAO24:', error);
      return null;
    }
  }

  calculateBoundingBox(lat: number, lon: number, radiusKm: number): BoundingBox {
    // Approximate degrees per kilometer
    const latPerKm = 1 / 111.32;
    const lonPerKm = 1 / (111.32 * Math.cos(lat * Math.PI / 180));

    const latDelta = radiusKm * latPerKm;
    const lonDelta = radiusKm * lonPerKm;

    return {
      latMin: lat - latDelta,
      latMax: lat + latDelta,
      lonMin: lon - lonDelta,
      lonMax: lon + lonDelta,
    };
  }

  calculateDistance(lat1: number, lon1: number, lat2: number, lon2: number): number {
    const R = 6371; // Earth's radius in kilometers
    const dLat = (lat2 - lat1) * Math.PI / 180;
    const dLon = (lon2 - lon1) * Math.PI / 180;
    const a = 
      Math.sin(dLat / 2) * Math.sin(dLat / 2) +
      Math.cos(lat1 * Math.PI / 180) * Math.cos(lat2 * Math.PI / 180) *
      Math.sin(dLon / 2) * Math.sin(dLon / 2);
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
  }

  async getAircraftInRadius(lat: number, lon: number, radiusKm: number): Promise<Aircraft[]> {
    const boundingBox = this.calculateBoundingBox(lat, lon, radiusKm);
    const aircraft = await this.getStatesInArea(boundingBox);

    // Filter to only include aircraft within the actual radius
    return aircraft.filter(plane => {
      if (!plane.latitude || !plane.longitude) return false;
      const distance = this.calculateDistance(lat, lon, plane.latitude, plane.longitude);
      return distance <= radiusKm;
    });
  }
}

// Comprehensive aircraft model database
export const AIRCRAFT_MODELS: Record<string, { name: string; icao24Prefixes: string[] }> = {
  // Boeing Commercial Aircraft
  'B707': { name: 'Boeing 707', icao24Prefixes: ['B703', 'B707', 'B720'] },
  'B717': { name: 'Boeing 717', icao24Prefixes: ['B712', 'B717'] },
  'B727': { name: 'Boeing 727', icao24Prefixes: ['B721', 'B722', 'B727'] },
  'B737': { name: 'Boeing 737', icao24Prefixes: ['B731', 'B732', 'B733', 'B734', 'B735', 'B736', 'B737', 'B738', 'B739', 'B37M', 'B38M', 'B39M', 'B3XM'] },
  'B747': { name: 'Boeing 747', icao24Prefixes: ['B741', 'B742', 'B743', 'B744', 'B748', 'B74S', 'B74R', 'BLCF'] },
  'B757': { name: 'Boeing 757', icao24Prefixes: ['B752', 'B753'] },
  'B767': { name: 'Boeing 767', icao24Prefixes: ['B762', 'B763', 'B764'] },
  'B777': { name: 'Boeing 777', icao24Prefixes: ['B772', 'B773', 'B77L', 'B77W', 'B779', 'B77X'] },
  'B787': { name: 'Boeing 787 Dreamliner', icao24Prefixes: ['B788', 'B789', 'B78X'] },
  
  // Airbus Commercial Aircraft
  'A220': { name: 'Airbus A220', icao24Prefixes: ['BCS1', 'BCS3', 'A221', 'A223'] },
  'A300': { name: 'Airbus A300', icao24Prefixes: ['A30B', 'A306', 'A3ST'] },
  'A310': { name: 'Airbus A310', icao24Prefixes: ['A310', 'A306'] },
  'A318': { name: 'Airbus A318', icao24Prefixes: ['A318'] },
  'A319': { name: 'Airbus A319', icao24Prefixes: ['A319', 'A19N'] },
  'A320': { name: 'Airbus A320', icao24Prefixes: ['A320', 'A20N'] },
  'A321': { name: 'Airbus A321', icao24Prefixes: ['A321', 'A21N'] },
  'A330': { name: 'Airbus A330', icao24Prefixes: ['A332', 'A333', 'A338', 'A339'] },
  'A340': { name: 'Airbus A340', icao24Prefixes: ['A342', 'A343', 'A345', 'A346'] },
  'A350': { name: 'Airbus A350', icao24Prefixes: ['A359', 'A35K'] },
  'A380': { name: 'Airbus A380', icao24Prefixes: ['A388'] },
  'A400M': { name: 'Airbus A400M Atlas', icao24Prefixes: ['A400'] },
  
  // Embraer Aircraft
  'E120': { name: 'Embraer EMB-120 Brasilia', icao24Prefixes: ['E120'] },
  'E135': { name: 'Embraer ERJ-135', icao24Prefixes: ['E135'] },
  'E145': { name: 'Embraer ERJ-145', icao24Prefixes: ['E145'] },
  'E170': { name: 'Embraer E-Jet E170', icao24Prefixes: ['E170'] },
  'E175': { name: 'Embraer E-Jet E175', icao24Prefixes: ['E175'] },
  'E190': { name: 'Embraer E-Jet E190', icao24Prefixes: ['E190'] },
  'E195': { name: 'Embraer E-Jet E195', icao24Prefixes: ['E195'] },
  'E290': { name: 'Embraer E190-E2', icao24Prefixes: ['E290'] },
  'E295': { name: 'Embraer E195-E2', icao24Prefixes: ['E295'] },
  
  // Bombardier Aircraft
  'CRJ1': { name: 'Bombardier CRJ100', icao24Prefixes: ['CRJ1'] },
  'CRJ2': { name: 'Bombardier CRJ200', icao24Prefixes: ['CRJ2'] },
  'CRJ7': { name: 'Bombardier CRJ700', icao24Prefixes: ['CRJ7'] },
  'CRJ9': { name: 'Bombardier CRJ900', icao24Prefixes: ['CRJ9'] },
  'CRJX': { name: 'Bombardier CRJ1000', icao24Prefixes: ['CRJX'] },
  'DH8A': { name: 'Bombardier Dash 8-100', icao24Prefixes: ['DH8A'] },
  'DH8B': { name: 'Bombardier Dash 8-200', icao24Prefixes: ['DH8B'] },
  'DH8C': { name: 'Bombardier Dash 8-300', icao24Prefixes: ['DH8C'] },
  'DH8D': { name: 'Bombardier Dash 8-400', icao24Prefixes: ['DH8D'] },
  
  // ATR Aircraft
  'AT42': { name: 'ATR 42', icao24Prefixes: ['AT42'] },
  'AT43': { name: 'ATR 42-300', icao24Prefixes: ['AT43'] },
  'AT44': { name: 'ATR 42-400', icao24Prefixes: ['AT44'] },
  'AT45': { name: 'ATR 42-500', icao24Prefixes: ['AT45'] },
  'AT46': { name: 'ATR 42-600', icao24Prefixes: ['AT46'] },
  'AT72': { name: 'ATR 72', icao24Prefixes: ['AT72'] },
  'AT73': { name: 'ATR 72-500', icao24Prefixes: ['AT73'] },
  'AT75': { name: 'ATR 72-600', icao24Prefixes: ['AT75'] },
  
  // Fokker Aircraft
  'F27': { name: 'Fokker 27', icao24Prefixes: ['F27'] },
  'F28': { name: 'Fokker 28', icao24Prefixes: ['F28'] },
  'F50': { name: 'Fokker 50', icao24Prefixes: ['F50'] },
  'F70': { name: 'Fokker 70', icao24Prefixes: ['F70'] },
  'F100': { name: 'Fokker 100', icao24Prefixes: ['F100'] },
  
  // Douglas Aircraft
  'DC3': { name: 'Douglas DC-3', icao24Prefixes: ['DC3'] },
  'DC6': { name: 'Douglas DC-6', icao24Prefixes: ['DC6'] },
  'DC8': { name: 'Douglas DC-8', icao24Prefixes: ['DC81', 'DC82', 'DC83', 'DC86', 'DC87'] },
  'DC9': { name: 'Douglas DC-9', icao24Prefixes: ['DC91', 'DC92', 'DC93', 'DC94', 'DC95'] },
  'MD11': { name: 'McDonnell Douglas MD-11', icao24Prefixes: ['MD11'] },
  'MD80': { name: 'McDonnell Douglas MD-80', icao24Prefixes: ['MD81', 'MD82', 'MD83', 'MD87', 'MD88'] },
  'MD90': { name: 'McDonnell Douglas MD-90', icao24Prefixes: ['MD90'] },
  
  // Lockheed Aircraft
  'L188': { name: 'Lockheed Electra', icao24Prefixes: ['L188'] },
  'L1011': { name: 'Lockheed L-1011 TriStar', icao24Prefixes: ['L101'] },
  'C130': { name: 'Lockheed C-130 Hercules', icao24Prefixes: ['C130', 'L382'] },
  
  // Business Jets
  'C25A': { name: 'Cessna Citation CJ2', icao24Prefixes: ['C25A'] },
  'C25B': { name: 'Cessna Citation CJ3', icao24Prefixes: ['C25B'] },
  'C25C': { name: 'Cessna Citation CJ4', icao24Prefixes: ['C25C'] },
  'C510': { name: 'Cessna Citation Mustang', icao24Prefixes: ['C510'] },
  'C525': { name: 'Cessna Citation CJ1', icao24Prefixes: ['C525'] },
  'C550': { name: 'Cessna Citation II', icao24Prefixes: ['C550'] },
  'C560': { name: 'Cessna Citation V', icao24Prefixes: ['C560'] },
  'C680': { name: 'Cessna Citation Sovereign', icao24Prefixes: ['C680'] },
  'C750': { name: 'Cessna Citation X', icao24Prefixes: ['C750'] },
  'GLF4': { name: 'Gulfstream IV', icao24Prefixes: ['GLF4'] },
  'GLF5': { name: 'Gulfstream V', icao24Prefixes: ['GLF5'] },
  'GLF6': { name: 'Gulfstream G650', icao24Prefixes: ['GLF6'] },
  'H25B': { name: 'Hawker 800', icao24Prefixes: ['H25B'] },
  'LJ35': { name: 'Learjet 35', icao24Prefixes: ['LJ35'] },
  'LJ45': { name: 'Learjet 45', icao24Prefixes: ['LJ45'] },
  'LJ60': { name: 'Learjet 60', icao24Prefixes: ['LJ60'] },
  
  // General Aviation
  'C172': { name: 'Cessna 172', icao24Prefixes: ['C172'] },
  'C182': { name: 'Cessna 182', icao24Prefixes: ['C182'] },
  'C206': { name: 'Cessna 206', icao24Prefixes: ['C206'] },
  'C208': { name: 'Cessna 208 Caravan', icao24Prefixes: ['C208'] },
  'PA28': { name: 'Piper Cherokee', icao24Prefixes: ['PA28'] },
  'PA31': { name: 'Piper Navajo', icao24Prefixes: ['PA31'] },
  'PA46': { name: 'Piper Malibu', icao24Prefixes: ['PA46'] },
  'BE20': { name: 'Beechcraft King Air', icao24Prefixes: ['BE20'] },
  'BE36': { name: 'Beechcraft Bonanza', icao24Prefixes: ['BE36'] },
  'BE58': { name: 'Beechcraft Baron', icao24Prefixes: ['BE58'] },
  
  // Cargo Aircraft
  'AN12': { name: 'Antonov An-12', icao24Prefixes: ['AN12'] },
  'AN22': { name: 'Antonov An-22', icao24Prefixes: ['AN22'] },
  'AN24': { name: 'Antonov An-24', icao24Prefixes: ['AN24'] },
  'AN26': { name: 'Antonov An-26', icao24Prefixes: ['AN26'] },
  'AN28': { name: 'Antonov An-28', icao24Prefixes: ['AN28'] },
  'AN32': { name: 'Antonov An-32', icao24Prefixes: ['AN32'] },
  'AN124': { name: 'Antonov An-124', icao24Prefixes: ['A124'] },
  'AN225': { name: 'Antonov An-225 Mriya', icao24Prefixes: ['A225'] },
  'IL76': { name: 'Ilyushin Il-76', icao24Prefixes: ['IL76'] },
  
  // Military Aircraft
  'KC135': { name: 'Boeing KC-135 Stratotanker', icao24Prefixes: ['KC135', 'B752'] },
  'C17': { name: 'Boeing C-17 Globemaster III', icao24Prefixes: ['C17'] },
  'C5': { name: 'Lockheed C-5 Galaxy', icao24Prefixes: ['C5'] },
  'KC10': { name: 'McDonnell Douglas KC-10 Extender', icao24Prefixes: ['KC10', 'DC10'] },
  'KC46': { name: 'Boeing KC-46 Pegasus', icao24Prefixes: ['KC46'] },
  'A330MRTT': { name: 'Airbus A330 MRTT', icao24Prefixes: ['A333'] },
  
  // Transport Aircraft
  'C130J': { name: 'Lockheed C-130J Super Hercules', icao24Prefixes: ['C130', 'L382'] },
  'C295': { name: 'Airbus C295', icao24Prefixes: ['C295'] },
  'CN235': { name: 'CASA CN-235', icao24Prefixes: ['CN35'] },
  'C212': { name: 'CASA C-212 Aviocar', icao24Prefixes: ['C212'] },
  
  // Special Operations Aircraft
  'V22': { name: 'Bell Boeing V-22 Osprey', icao24Prefixes: ['V22'] },
  'C27J': { name: 'Alenia C-27J Spartan', icao24Prefixes: ['C27J'] },
  'MV22': { name: 'MV-22 Osprey (Marines)', icao24Prefixes: ['MV22'] },
  'CV22': { name: 'CV-22 Osprey (Air Force)', icao24Prefixes: ['CV22'] },
  
  // Surveillance & Reconnaissance
  'P3': { name: 'Lockheed P-3 Orion', icao24Prefixes: ['P3'] },
  'P8': { name: 'Boeing P-8 Poseidon', icao24Prefixes: ['P8'] },
  'E3': { name: 'Boeing E-3 Sentry AWACS', icao24Prefixes: ['E3'] },
  'E2': { name: 'Northrop Grumman E-2 Hawkeye', icao24Prefixes: ['E2'] },
  'RC135': { name: 'Boeing RC-135 Rivet Joint', icao24Prefixes: ['RC35'] },
  'U2': { name: 'Lockheed U-2 Dragon Lady', icao24Prefixes: ['U2'] },
  
  // Fighters & Attack Aircraft (when visible on civilian radar)
  'F16': { name: 'General Dynamics F-16 Fighting Falcon', icao24Prefixes: ['F16'] },
  'F15': { name: 'McDonnell Douglas F-15 Eagle', icao24Prefixes: ['F15'] },
  'F18': { name: 'McDonnell Douglas F/A-18 Hornet', icao24Prefixes: ['F18'] },
  'F35': { name: 'Lockheed Martin F-35 Lightning II', icao24Prefixes: ['F35'] },
  'A10': { name: 'Fairchild Republic A-10 Thunderbolt II', icao24Prefixes: ['A10'] },
  'AV8B': { name: 'McDonnell Douglas AV-8B Harrier II', icao24Prefixes: ['AV8B'] },
  
  // Training Aircraft
  'T6': { name: 'Beechcraft T-6 Texan II', icao24Prefixes: ['T6'] },
  'T38': { name: 'Northrop T-38 Talon', icao24Prefixes: ['T38'] },
  'T45': { name: 'McDonnell Douglas T-45 Goshawk', icao24Prefixes: ['T45'] },
  
  // Military Helicopters
  'UH60': { name: 'Sikorsky UH-60 Black Hawk', icao24Prefixes: ['UH60', 'H60'] },
  'CH47': { name: 'Boeing CH-47 Chinook', icao24Prefixes: ['CH47'] },
  'AH64': { name: 'Boeing AH-64 Apache', icao24Prefixes: ['AH64'] },
  'UH1': { name: 'Bell UH-1 Iroquois (Huey)', icao24Prefixes: ['UH1'] },
  'CH53': { name: 'Sikorsky CH-53 Sea Stallion', icao24Prefixes: ['CH53'] },
  'SH60': { name: 'Sikorsky SH-60 Seahawk', icao24Prefixes: ['SH60'] },
  
  // Helicopters
  'AS50': { name: 'Airbus H125 (AS350)', icao24Prefixes: ['AS50'] },
  'AS55': { name: 'Airbus H155 (AS365)', icao24Prefixes: ['AS55'] },
  'EC30': { name: 'Airbus H130', icao24Prefixes: ['EC30'] },
  'EC35': { name: 'Airbus H135', icao24Prefixes: ['EC35'] },
  'EC45': { name: 'Airbus H145', icao24Prefixes: ['EC45'] },
  'B06': { name: 'Bell 206', icao24Prefixes: ['B06'] },
  'B407': { name: 'Bell 407', icao24Prefixes: ['B407'] },
  'B429': { name: 'Bell 429', icao24Prefixes: ['B429'] },
  'R22': { name: 'Robinson R22', icao24Prefixes: ['R22'] },
  'R44': { name: 'Robinson R44', icao24Prefixes: ['R44'] },
  'R66': { name: 'Robinson R66', icao24Prefixes: ['R66'] },
};

export const openSkyAPI = new OpenSkyAPI();
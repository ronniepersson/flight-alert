import axios from 'axios';

const HEXDB_API_BASE = 'https://hexdb.io/api/v1';

export interface HexDBResponse {
  ICAOTypeCode?: string;
  Manufacturer?: string;
  ModeS?: string;
  OperatorFlagCode?: string;
  RegisteredOwners?: string;
  Registration?: string;
  Type?: string;
}

export interface AircraftPhoto {
  fullImageUrl: string;
  thumbnailUrl: string;
}

// Cache to avoid repeated lookups for the same aircraft
const aircraftCache = new Map<string, HexDBResponse | null>();

class HexDBAPI {
  private apiBase: string;

  constructor() {
    this.apiBase = HEXDB_API_BASE;
  }

  async getAircraftInfo(icao24: string): Promise<HexDBResponse | null> {
    // Check cache first
    if (aircraftCache.has(icao24)) {
      return aircraftCache.get(icao24) || null;
    }

    try {
      const response = await axios.get(`${this.apiBase}/aircraft/${icao24}`, {
        timeout: 5000, // 5 second timeout
      });
      
      if (response.status === 200 && response.data) {
        aircraftCache.set(icao24, response.data);
        return response.data;
      }
      
      // Cache null for not found
      aircraftCache.set(icao24, null);
      return null;
    } catch (error) {
      // If 404 or error, cache as not found
      aircraftCache.set(icao24, null);
      return null;
    }
  }

  // Get multiple aircraft info in parallel with rate limiting
  async getMultipleAircraftInfo(icao24List: string[]): Promise<Map<string, HexDBResponse | null>> {
    const results = new Map<string, HexDBResponse | null>();
    
    // Process in batches to avoid overwhelming the API
    const batchSize = 10;
    for (let i = 0; i < icao24List.length; i += batchSize) {
      const batch = icao24List.slice(i, i + batchSize);
      const promises = batch.map(icao24 => 
        this.getAircraftInfo(icao24).then(info => ({ icao24, info }))
      );
      
      const batchResults = await Promise.all(promises);
      batchResults.forEach(({ icao24, info }) => {
        results.set(icao24, info);
      });
      
      // Small delay between batches to be respectful to the API
      if (i + batchSize < icao24List.length) {
        await new Promise(resolve => setTimeout(resolve, 100));
      }
    }
    
    return results;
  }

  // Get aircraft photo URLs
  getAircraftPhoto(icao24: string): AircraftPhoto {
    return {
      fullImageUrl: `https://hexdb.io/hex-image?hex=${icao24}`,
      thumbnailUrl: `https://hexdb.io/hex-image-thumb?hex=${icao24}`,
    };
  }

  // Check if photo exists for aircraft (returns promise that resolves to boolean)
  async checkPhotoExists(icao24: string): Promise<boolean> {
    try {
      const response = await axios.head(`https://hexdb.io/hex-image-thumb?hex=${icao24}`, {
        timeout: 3000,
      });
      return response.status === 200;
    } catch (error) {
      return false;
    }
  }

  // Clear cache if needed (e.g., for testing or memory management)
  clearCache() {
    aircraftCache.clear();
  }

  // Map ICAO type codes to our comprehensive model categories
  mapTypeToModel(typeCode: string | undefined): string | null {
    if (!typeCode) return null;
    
    // Map ICAO type codes to our model categories
    const typeMap: Record<string, string> = {
      // Boeing Commercial Aircraft
      'B703': 'B707', 'B707': 'B707', 'B720': 'B707',
      'B712': 'B717', 'B717': 'B717',
      'B721': 'B727', 'B722': 'B727', 'B727': 'B727',
      'B731': 'B737', 'B732': 'B737', 'B733': 'B737', 'B734': 'B737', 'B735': 'B737', 
      'B736': 'B737', 'B737': 'B737', 'B738': 'B737', 'B739': 'B737', 'B37M': 'B737', 
      'B38M': 'B737', 'B39M': 'B737', 'B3XM': 'B737',
      'B741': 'B747', 'B742': 'B747', 'B743': 'B747', 'B744': 'B747', 'B748': 'B747', 
      'B74S': 'B747', 'B74R': 'B747', 'BLCF': 'B747',
      'B752': 'B757', 'B753': 'B757',
      'B762': 'B767', 'B763': 'B767', 'B764': 'B767',
      'B772': 'B777', 'B773': 'B777', 'B77L': 'B777', 'B77W': 'B777', 'B779': 'B777', 'B77X': 'B777',
      'B788': 'B787', 'B789': 'B787', 'B78X': 'B787',
      
      // Airbus Commercial Aircraft
      'BCS1': 'A220', 'BCS3': 'A220', 'A221': 'A220', 'A223': 'A220',
      'A30B': 'A300', 'A306': 'A300', 'A3ST': 'A300',
      'A310': 'A310',
      'A318': 'A318',
      'A319': 'A319', 'A19N': 'A319',
      'A320': 'A320', 'A20N': 'A320',
      'A321': 'A321', 'A21N': 'A321',
      'A332': 'A330', 'A333': 'A330', 'A338': 'A330', 'A339': 'A330',
      'A342': 'A340', 'A343': 'A340', 'A345': 'A340', 'A346': 'A340',
      'A359': 'A350', 'A35K': 'A350',
      'A388': 'A380',
      'A400': 'A400M',
      
      // Embraer Aircraft
      'E120': 'E120',
      'E135': 'E135',
      'E145': 'E145',
      'E170': 'E170',
      'E175': 'E175',
      'E190': 'E190',
      'E195': 'E195',
      'E290': 'E290',
      'E295': 'E295',
      
      // Bombardier Aircraft
      'CRJ1': 'CRJ1', 'CRJ2': 'CRJ2', 'CRJ7': 'CRJ7', 'CRJ9': 'CRJ9', 'CRJX': 'CRJX',
      'DH8A': 'DH8A', 'DH8B': 'DH8B', 'DH8C': 'DH8C', 'DH8D': 'DH8D',
      
      // ATR Aircraft
      'AT42': 'AT42', 'AT43': 'AT43', 'AT44': 'AT44', 'AT45': 'AT45', 'AT46': 'AT46',
      'AT72': 'AT72', 'AT73': 'AT73', 'AT75': 'AT75',
      
      // Fokker Aircraft
      'F27': 'F27', 'F28': 'F28', 'F50': 'F50', 'F70': 'F70', 'F100': 'F100',
      
      // Douglas Aircraft
      'DC3': 'DC3', 'DC6': 'DC6',
      'DC81': 'DC8', 'DC82': 'DC8', 'DC83': 'DC8', 'DC86': 'DC8', 'DC87': 'DC8',
      'DC91': 'DC9', 'DC92': 'DC9', 'DC93': 'DC9', 'DC94': 'DC9', 'DC95': 'DC9',
      'MD11': 'MD11',
      'MD81': 'MD80', 'MD82': 'MD80', 'MD83': 'MD80', 'MD87': 'MD80', 'MD88': 'MD80',
      'MD90': 'MD90',
      
      // Lockheed Aircraft
      'L188': 'L188',
      'L101': 'L1011',
      'C130': 'C130', 'L382': 'C130',
      
      // Business Jets
      'C25A': 'C25A', 'C25B': 'C25B', 'C25C': 'C25C',
      'C510': 'C510', 'C525': 'C525', 'C550': 'C550', 'C560': 'C560', 'C680': 'C680', 'C750': 'C750',
      'GLF4': 'GLF4', 'GLF5': 'GLF5', 'GLF6': 'GLF6',
      'H25B': 'H25B',
      'LJ35': 'LJ35', 'LJ45': 'LJ45', 'LJ60': 'LJ60',
      
      // General Aviation
      'C172': 'C172', 'C182': 'C182', 'C206': 'C206', 'C208': 'C208',
      'PA28': 'PA28', 'PA31': 'PA31', 'PA46': 'PA46',
      'BE20': 'BE20', 'BE36': 'BE36', 'BE58': 'BE58',
      
      // Cargo Aircraft
      'AN12': 'AN12', 'AN22': 'AN22', 'AN24': 'AN24', 'AN26': 'AN26', 'AN28': 'AN28', 'AN32': 'AN32',
      'A124': 'AN124', 'A225': 'AN225',
      'IL76': 'IL76',
      
      // Military Aircraft
      'KC135': 'KC135', 'C17': 'C17', 'C5': 'C5', 'KC10': 'KC10', 'KC46': 'KC46',
      'C295': 'C295', 'CN35': 'CN235', 'C212': 'C212',
      
      // Special Operations Aircraft
      'V22': 'V22', 'MV22': 'MV22', 'CV22': 'CV22', 'C27J': 'C27J',
      
      // Surveillance & Reconnaissance
      'P3': 'P3', 'P8': 'P8', 'E3': 'E3', 'E2': 'E2', 'RC35': 'RC135', 'U2': 'U2',
      
      // Fighters & Attack Aircraft
      'F16': 'F16', 'F15': 'F15', 'F18': 'F18', 'F35': 'F35', 'A10': 'A10', 'AV8B': 'AV8B',
      
      // Training Aircraft
      'T6': 'T6', 'T38': 'T38', 'T45': 'T45',
      
      // Military Helicopters
      'UH60': 'UH60', 'H60': 'UH60', 'CH47': 'CH47', 'AH64': 'AH64', 'UH1': 'UH1', 'CH53': 'CH53', 'SH60': 'SH60',
      
      // Helicopters
      'AS50': 'AS50', 'AS55': 'AS55',
      'EC30': 'EC30', 'EC35': 'EC35', 'EC45': 'EC45',
      'B06': 'B06', 'B407': 'B407', 'B429': 'B429',
      'R22': 'R22', 'R44': 'R44', 'R66': 'R66',
    };
    
    return typeMap[typeCode] || null;
  }
}

export const hexDBAPI = new HexDBAPI();
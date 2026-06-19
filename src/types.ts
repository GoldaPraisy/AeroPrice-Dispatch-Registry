export interface PriceHistoryPoint {
  time: string; // HH:MM:SS or Date
  price: number;
  demandFactor: number;
  seatsRemaining: number;
}

export interface Flight {
  id: string;
  flightNo: string;
  airline: string;
  origin: string;
  destination: string;
  originCity: string;
  destinationCity: string;
  basePrice: number;
  currentPrice: number;
  totalSeats: number;
  seatsRemaining: number;
  departureDays: number; // Days remaining to departure (e.g. 1 to 30)
  searchVolume: number; // Current active search queries (0 - 100 indicator)
  trend: 'up' | 'down' | 'stable';
  lastPriceFlash: 'up' | 'down' | null;
  history: PriceHistoryPoint[];
  departureTime: string; // Formatted departure time
  status: 'On Time' | 'Delayed' | 'Boarding' | 'Scheduled';
}

export interface PriceFreeze {
  id: string;
  flightId: string;
  flightNo: string;
  origin: string;
  destination: string;
  frozenPrice: number;
  expiresAt: number; // timestamp in ms
  frozenAt: number;  // timestamp in ms
  durationSec: number;
  status: 'active' | 'purchased' | 'expired';
}

export interface EngineStats {
  totalUpdates: number;
  averagePremiumPct: number;
  activeFrozenCapital: number;
  peakPriceTriggered: number;
}

export interface GlobalSimControl {
  isHolidayPeak: boolean;
  baseDemandSetting: 'low' | 'standard' | 'surge' | 'extreme'; // 0.8, 1.0, 1.3, 1.6
  searchActivitySpike: 'quiescent' | 'normal' | 'frenzied'; // multiplier to live random searches
  disruptionFactor: 'none' | 'weather_alert' | 'route_congestion' | 'fuel_surcharge';
  updateFrequencySec: number;
}

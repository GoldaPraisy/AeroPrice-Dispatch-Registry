import { Flight, PriceHistoryPoint } from '../types';

// Helper to generate realistic historical data points for the last 12-24 hours
function generateHistoricalPoints(
  basePrice: number,
  volatility: number,
  pointsCount: number = 15
): PriceHistoryPoint[] {
  const points: PriceHistoryPoint[] = [];
  let currentVal = basePrice;
  const now = new Date();

  for (let i = pointsCount; i >= 1; i--) {
    const pointTime = new Date(now.getTime() - i * 15 * 60 * 1000); // 15 mins steps
    const randomFactor = 1 + (Math.random() - 0.48) * volatility;
    
    // some demand factors to mock
    const demand = Math.floor(20 + Math.random() * 60);
    const seatsRemaining = Math.floor(10 + Math.random() * 150);

    currentVal = Math.round(currentVal * randomFactor * 10) / 10;
    
    // clamp price to reasonable ranges
    if (currentVal < basePrice * 0.7) currentVal = Math.round(basePrice * 0.7);
    if (currentVal > basePrice * 1.9) currentVal = Math.round(basePrice * 1.9);

    points.push({
      time: pointTime.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' }),
      price: currentVal,
      demandFactor: Math.round(100 * (currentVal / basePrice)) / 100,
      seatsRemaining,
    });
  }
  return points;
}

export const INITIAL_FLIGHTS: Flight[] = [
  {
    id: 'f-101',
    flightNo: 'TX-401',
    airline: 'Vanguard Express',
    origin: 'JFK',
    originCity: 'New York',
    destination: 'LHR',
    destinationCity: 'London',
    basePrice: 580,
    currentPrice: 620,
    totalSeats: 180,
    seatsRemaining: 42,
    departureDays: 6,
    searchVolume: 45,
    trend: 'up',
    lastPriceFlash: null,
    history: [],
    departureTime: '22:15',
    status: 'On Time'
  },
  {
    id: 'f-102',
    flightNo: 'TX-118',
    airline: 'AeroLine Global',
    origin: 'CDG',
    originCity: 'Paris',
    destination: 'DXB',
    destinationCity: 'Dubai',
    basePrice: 850,
    currentPrice: 850,
    totalSeats: 320,
    seatsRemaining: 154,
    departureDays: 14,
    searchVolume: 20,
    trend: 'stable',
    lastPriceFlash: null,
    history: [],
    departureTime: '14:40',
    status: 'Scheduled'
  },
  {
    id: 'f-103',
    flightNo: 'TX-808',
    airline: 'Pacific Dispatch',
    origin: 'HND',
    originCity: 'Tokyo',
    destination: 'LAX',
    destinationCity: 'Los Angeles',
    basePrice: 1100,
    currentPrice: 1320,
    totalSeats: 250,
    seatsRemaining: 12,
    departureDays: 2,
    searchVolume: 85,
    trend: 'up',
    lastPriceFlash: null,
    history: [],
    departureTime: '08:15',
    status: 'Boarding'
  },
  {
    id: 'f-104',
    flightNo: 'TX-331',
    airline: 'Borealis Air',
    origin: 'FRA',
    originCity: 'Frankfurt',
    destination: 'JFK',
    destinationCity: 'New York',
    basePrice: 650,
    currentPrice: 590,
    totalSeats: 220,
    seatsRemaining: 198,
    departureDays: 28,
    searchVolume: 12,
    trend: 'down',
    lastPriceFlash: null,
    history: [],
    departureTime: '11:00',
    status: 'On Time'
  },
  {
    id: 'f-105',
    flightNo: 'TX-092',
    airline: 'AeroLine Global',
    origin: 'SIN',
    originCity: 'Singapore',
    destination: 'SYD',
    destinationCity: 'Sydney',
    basePrice: 720,
    currentPrice: 790,
    totalSeats: 160,
    seatsRemaining: 31,
    departureDays: 5,
    searchVolume: 58,
    trend: 'up',
    lastPriceFlash: null,
    history: [],
    departureTime: '19:35',
    status: 'On Time'
  },
  {
    id: 'f-106',
    flightNo: 'TX-669',
    airline: 'Pacific Dispatch',
    origin: 'SYD',
    originCity: 'Sydney',
    destination: 'DFW',
    destinationCity: 'Dallas',
    basePrice: 1450,
    currentPrice: 1410,
    totalSeats: 350,
    seatsRemaining: 240,
    departureDays: 21,
    searchVolume: 18,
    trend: 'down',
    lastPriceFlash: null,
    history: [],
    departureTime: '13:05',
    status: 'Delayed'
  },
  {
    id: 'f-107',
    flightNo: 'TX-452',
    airline: 'Vanguard Express',
    origin: 'MIA',
    originCity: 'Miami',
    destination: 'EZE',
    destinationCity: 'Buenos Aires',
    basePrice: 910,
    currentPrice: 1040,
    totalSeats: 180,
    seatsRemaining: 78,
    departureDays: 9,
    searchVolume: 64,
    trend: 'up',
    lastPriceFlash: null,
    history: [],
    departureTime: '06:00',
    status: 'Scheduled'
  }
].map(flight => {
  // Populate realistic starting histories
  const basePrice = flight.basePrice;
  const history = generateHistoricalPoints(basePrice, 0.08, 16);
  // Guarantee the last point equals current price
  history[history.length - 1].price = flight.currentPrice;
  history[history.length - 1].seatsRemaining = flight.seatsRemaining;
  return {
    ...flight,
    trend: flight.trend as 'up' | 'down' | 'stable',
    status: flight.status as 'On Time' | 'Delayed' | 'Boarding' | 'Scheduled',
    history
  };
});

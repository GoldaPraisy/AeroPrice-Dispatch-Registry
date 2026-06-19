import { Flight, GlobalSimControl } from '../types';

export interface PricingBreakdown {
  basePrice: number;
  finalPrice: number;
  holidayModifier: number;      // dollar adjustment
  demandModifier: number;       // dollar adjustment
  seatsModifier: number;        // dollar adjustment
  timeModifier: number;         // dollar adjustment
  searchModifier: number;       // dollar adjustment
  disruptionModifier: number;   // dollar adjustment
  
  holidayPct: number;
  demandPct: number;
  seatsPct: number;
  timePct: number;
  searchPct: number;
  disruptionPct: number;
}

export function computeDetailedPrice(flight: Flight, sim: GlobalSimControl): PricingBreakdown {
  const base = flight.basePrice;

  // 1. Holiday Multiplier (e.g. +20% for peak travel or holidays)
  const holidayPct = sim.isHolidayPeak ? 0.20 : 0.0;

  // 2. Base Demand Level Multiplier
  let demandPct = 0;
  switch (sim.baseDemandSetting) {
    case 'low':
      demandPct = -0.10;
      break;
    case 'standard':
      demandPct = 0.0;
      break;
    case 'surge':
      demandPct = 0.25;
      break;
    case 'extreme':
      demandPct = 0.50;
      break;
  }

  // 3. Seats Remaining multiplier (Inventory level pricing)
  const fillPct = (flight.totalSeats - flight.seatsRemaining) / flight.totalSeats;
  let seatsPct = 0;
  if (fillPct >= 0.90) {
    seatsPct = 0.35; // Very few premium seats left
  } else if (fillPct >= 0.75) {
    seatsPct = 0.18;
  } else if (fillPct >= 0.50) {
    seatsPct = 0.08;
  } else if (fillPct <= 0.20) {
    seatsPct = -0.08; // High vacant inventory discount
  }

  // 4. Days to departure multiplier (Advance purchase pricing)
  let timePct = 0;
  if (flight.departureDays <= 2) {
    timePct = 0.45; // Last-minute surge
  } else if (flight.departureDays <= 5) {
    timePct = 0.25;
  } else if (flight.departureDays <= 10) {
    timePct = 0.10;
  } else if (flight.departureDays >= 25) {
    timePct = -0.15; // Early bird discount
  }

  // 5. Search volume activity multiplier (Dynamic demand spikes)
  let searchPct = 0;
  if (flight.searchVolume >= 80) {
    searchPct = 0.12;
  } else if (flight.searchVolume >= 50) {
    searchPct = 0.05;
  }

  // 6. Asymmetric disruption factors
  let disruptionPct = 0;
  switch (sim.disruptionFactor) {
    case 'weather_alert':
      // Weather alert increases ticket price due to cancellation insurance and routing capacity
      disruptionPct = 0.15;
      break;
    case 'route_congestion':
      disruptionPct = 0.08;
      break;
    case 'fuel_surcharge':
      disruptionPct = 0.22;
      break;
    case 'none':
    default:
      disruptionPct = 0;
      break;
  }

  // Combine percentage multipliers
  // Note: Standard industrial dynamic engines run additive modifiers or multiplicative.
  // We will run additive percentages on top of base to guarantee transparency and predictability,
  // making it extremely clear for the customer ledger report.
  const totalMultiplier = 1 + holidayPct + demandPct + seatsPct + timePct + searchPct + disruptionPct;
  const finalPrice = Math.max(Math.round(base * totalMultiplier), 40); // Never let price drop below $40

  return {
    basePrice: base,
    finalPrice,
    holidayModifier: Math.round(base * holidayPct),
    demandModifier: Math.round(base * demandPct),
    seatsModifier: Math.round(base * seatsPct),
    timeModifier: Math.round(base * timePct),
    searchModifier: Math.round(base * searchPct),
    disruptionModifier: Math.round(base * disruptionPct),
    holidayPct,
    demandPct,
    seatsPct,
    timePct,
    searchPct,
    disruptionPct
  };
}

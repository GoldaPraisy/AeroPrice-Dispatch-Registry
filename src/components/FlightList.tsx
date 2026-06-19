import React, { useState } from 'react';
import { Search, PlaneTakeoff, Info, ArrowUpRight, ArrowDownRight, Minus, AlertTriangle } from 'lucide-react';
import { Flight, GlobalSimControl } from '../types';
import { computeDetailedPrice } from '../utils/pricingEngine';

interface FlightListProps {
  flights: Flight[];
  selectedFlightId: string;
  onSelectFlight: (flightId: string) => void;
  sim: GlobalSimControl;
  frozenFlightIds: { [flightId: string]: boolean };
}

export default function FlightList({
  flights,
  selectedFlightId,
  onSelectFlight,
  sim,
  frozenFlightIds
}: FlightListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [originFilter, setOriginFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');

  // Find unique cities & statuses for filtering
  const origins = ['All', ...Array.from(new Set(flights.map(f => f.origin)))];
  const statuses = ['All', 'On Time', 'Delayed', 'Boarding', 'Scheduled'];

  const filteredFlights = flights.filter(f => {
    const query = searchTerm.toLowerCase();
    const matchesSearch = 
      f.flightNo.toLowerCase().includes(query) ||
      f.originCity.toLowerCase().includes(query) ||
      f.destinationCity.toLowerCase().includes(query) ||
      f.origin.toLowerCase().includes(query) ||
      f.destination.toLowerCase().includes(query);

    const matchesOrigin = originFilter === 'All' || f.origin === originFilter;
    const matchesStatus = statusFilter === 'All' || f.status === statusFilter;

    return matchesSearch && matchesOrigin && matchesStatus;
  });

  return (
    <div className="flex flex-col bg-base-dark rounded-lg border border-gridline overflow-hidden h-full">
      {/* Title & Filter bar */}
      <div className="p-4 border-b border-gridline bg-[#161616] flex flex-col gap-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlaneTakeoff className="w-4 h-4 text-vermilion" />
            <h2 className="font-serif text-lg font-medium text-bone-white">
              Flight Registry <span className="text-xs font-sans text-gray-500">({filteredFlights.length} found)</span>
            </h2>
          </div>
          {sim.isHolidayPeak && (
            <span className="text-[10px] bg-vermilion/20 text-vermilion font-mono px-2 py-0.5 rounded border border-vermilion/40 animate-pulse flex items-center gap-1">
              <AlertTriangle className="w-3 h-3" /> Peak Holiday Season +20% Active
            </span>
          )}
        </div>

        {/* Search */}
        <div className="relative">
          <Search className="w-4 h-4 absolute left-3 top-2.5 text-gray-500" />
          <input
            id="flight-search-input"
            type="text"
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            placeholder="Search routing (e.g. JFK, Dubai, New York...)"
            className="w-full pl-9 pr-4 py-2 bg-canvas border border-gridline rounded text-xs text-bone-white placeholder-gray-600 focus:outline-none focus:border-vermilion transition-colors font-sans"
          />
        </div>

        {/* Filters Quick Row */}
        <div className="flex gap-2 text-[11px]">
          <div className="flex-1 flex flex-col">
            <label className="text-gray-500 font-sans mb-1 uppercase tracking-tight">Origin Hub</label>
            <select
              value={originFilter}
              onChange={(e) => setOriginFilter(e.target.value)}
              className="bg-canvas border border-gridline rounded px-2 py-1 text-bone-white focus:outline-none focus:border-vermilion text-[11px]"
            >
              {origins.map(origin => (
                <option key={origin} value={origin}>{origin}</option>
              ))}
            </select>
          </div>

          <div className="flex-1 flex flex-col">
            <label className="text-gray-500 font-sans mb-1 uppercase tracking-tight">Dispatch Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
              className="bg-canvas border border-gridline rounded px-2 py-1 text-bone-white focus:outline-none focus:border-vermilion text-[11px]"
            >
              {statuses.map(st => (
                <option key={st} value={st}>{st}</option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Flight Ledger Cards Container */}
      <div className="flex-1 overflow-y-auto divide-y divide-gridline">
        {filteredFlights.length === 0 ? (
          <div className="p-8 text-center text-gray-500 flex flex-col items-center gap-2">
            <Info className="w-6 h-6 text-gray-600" />
            <p className="font-sans text-xs">No active flights correspond to the selected filters.</p>
          </div>
        ) : (
          filteredFlights.map((flight) => {
            const isSelected = flight.id === selectedFlightId;
            const detailed = computeDetailedPrice(flight, sim);
            
            // Calculate actual deviation from base price
            const premiumPct = Math.round(((detailed.finalPrice - flight.basePrice) / flight.basePrice) * 100);
            const isSurge = detailed.finalPrice > flight.basePrice;
            const isDiscount = detailed.finalPrice < flight.basePrice;
            const isFrozen = frozenFlightIds[flight.id];

            // Seat indicators
            const fillRatio = (flight.totalSeats - flight.seatsRemaining) / flight.totalSeats;
            let seatColorClass = 'text-green-400 bg-green-500/10 border-green-500/20';
            if (flight.seatsRemaining <= 15) {
              seatColorClass = 'text-red-400 bg-red-500/10 border-red-500/20';
            } else if (flight.seatsRemaining <= 40) {
              seatColorClass = 'text-amber-400 bg-amber-500/10 border-amber-500/20';
            }

            // Flash effect for live pricing triggers
            let pulseClass = '';
            if (flight.lastPriceFlash === 'up') {
              pulseClass = 'flash-price-up';
            } else if (flight.lastPriceFlash === 'down') {
              pulseClass = 'flash-price-down';
            }

            return (
              <div
                key={flight.id}
                onClick={() => onSelectFlight(flight.id)}
                className={`p-4 transition-all duration-200 cursor-pointer relative select-none ${pulseClass} ${
                  isSelected 
                    ? 'bg-[#1E1E1E] border-l-2 border-vermilion' 
                    : 'bg-transparent hover:bg-zinc-900 border-l-2 border-transparent'
                }`}
              >
                {/* Top Line: Flight No, Trend status indicators */}
                <div className="flex items-center justify-between mb-2">
                  <div className="flex items-center gap-2">
                    <span className="font-mono text-xs font-semibold px-2 py-0.5 bg-canvas border border-gridline rounded text-bone-white">
                      {flight.flightNo}
                    </span>
                    <span className="font-sans text-[10px] text-gray-500">
                      {flight.airline}
                    </span>
                  </div>

                  {/* Pricing Trend Arrow */}
                  <div className="flex items-center gap-1.5">
                    {isFrozen && (
                      <span className="text-[9px] bg-cyan-500/10 text-cyan-400 border border-cyan-500/20 px-1.5 py-0.5 rounded font-sans font-medium uppercase animate-pulse">
                        🛡️ Froz
                      </span>
                    )}
                    
                    {flight.trend === 'up' && (
                      <span className="text-vermilion text-[10px] font-mono flex items-center bg-vermilion/10 px-1 py-0.5 rounded border border-vermilion/20" title="Dynamic Pricing upward demand trend">
                        <ArrowUpRight className="w-3 h-3 justify-center shrink-0" />
                        <span>UPWARD</span>
                      </span>
                    )}
                    {flight.trend === 'down' && (
                      <span className="text-emerald-500 text-[10px] font-mono flex items-center bg-emerald-500/10 px-1 py-0.5 rounded border border-emerald-500/20" title="Yield discount downward demand trend">
                        <ArrowDownRight className="w-3 h-3 justify-center shrink-0" />
                        <span>DOWNWARD</span>
                      </span>
                    )}
                    {flight.trend === 'stable' && (
                      <span className="text-gray-400 text-[10px] font-mono flex items-center bg-gray-400/5 px-1 py-0.5 rounded border border-gray-400/10">
                        <Minus className="w-3 h-3 justify-center shrink-0" />
                        <span>STABLE</span>
                      </span>
                    )}
                  </div>
                </div>

                {/* Hub routing: Display serif with elegant playfair look */}
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <span className="font-serif text-xl font-bold tracking-tight text-bone-white">{flight.origin}</span>
                    <span className="text-vermilion/55 font-mono text-xs">🡒</span>
                    <span className="font-serif text-xl font-bold tracking-tight text-bone-white">{flight.destination}</span>
                  </div>

                  {/* Live Dynamic Price Display */}
                  <div className="text-right">
                    <p className="font-sans text-[10px] text-gray-500 line-through">Base ${flight.basePrice}</p>
                    <p className="font-mono text-base font-bold text-bone-white text-md">
                      ${detailed.finalPrice}
                    </p>
                  </div>
                </div>

                {/* Status line: Cities, departure, seats */}
                <div className="flex items-center justify-between text-[11px] text-gray-400">
                  <div className="flex flex-col">
                    <span className="text-gray-400 font-sans text-xs truncate max-w-[130px]">
                      {flight.originCity} to {flight.destinationCity}
                    </span>
                    <span className="font-mono text-[10px] text-gray-500 mt-0.5">
                      Dep: {flight.departureTime} ({flight.departureDays}d left)
                    </span>
                  </div>

                  {/* Seats status */}
                  <div className="flex flex-col items-end gap-1">
                    <span className={`px-1.5 py-0.5 rounded text-[10px] font-mono border ${seatColorClass}`}>
                      {flight.seatsRemaining} / {flight.totalSeats} seats
                    </span>
                    
                    {/* Deviation Badge */}
                    {isSurge && (
                      <span className="text-[10px] text-vermilion font-mono font-medium">
                        (+{premiumPct}% Dynamic Risk)
                      </span>
                    )}
                    {isDiscount && (
                      <span className="text-[10px] text-emerald-500 font-mono font-medium">
                        ({premiumPct}% Yield Discount)
                      </span>
                    )}
                    {premiumPct === 0 && (
                      <span className="text-[10px] text-gray-500 font-mono">
                        (At Par)
                      </span>
                    )}
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}

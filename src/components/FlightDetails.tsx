import React, { useState, useEffect } from 'react';
import { 
  ShieldCheck, 
  TrendingUp, 
  TrendingDown, 
  Clock, 
  HelpCircle, 
  Percent, 
  Lock, 
  CheckCircle,
  AlertCircle
} from 'lucide-react';
import { Flight, GlobalSimControl } from '../types';
import { computeDetailedPrice } from '../utils/pricingEngine';
import {
  AreaChart,
  Area,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from 'recharts';

interface FlightDetailsProps {
  flight: Flight | undefined;
  sim: GlobalSimControl;
  onFreezePrice: (flightId: string, price: number) => void;
  activeFrozenPrice: number | null;
  freezeExpiresAt: number | null;
  onBookFlight: (flightId: string, bookingPrice: number, isFromFrozen: boolean) => void;
}

export default function FlightDetails({
  flight,
  sim,
  onFreezePrice,
  activeFrozenPrice,
  freezeExpiresAt,
  onBookFlight
}: FlightDetailsProps) {
  const [secondsLeft, setSecondsLeft] = useState<number | null>(null);
  const [showExplanation, setShowExplanation] = useState(false);

  // Flight freeze countdown calculator
  useEffect(() => {
    if (!freezeExpiresAt) {
      setSecondsLeft(null);
      return;
    }

    const interval = setInterval(() => {
      const diff = Math.max(0, Math.round((freezeExpiresAt - Date.now()) / 1000));
      setSecondsLeft(diff);
      if (diff === 0) {
        clearInterval(interval);
      }
    }, 1000);

    return () => clearInterval(interval);
  }, [freezeExpiresAt]);

  if (!flight) {
    return (
      <div className="bg-base-dark rounded-lg border border-gridline flex items-center justify-center h-full p-8 text-center text-gray-500">
        <div className="flex flex-col items-center gap-2 max-w-sm">
          <HelpCircle className="w-10 h-10 text-gray-700 stroke-1" />
          <p className="font-serif text-lg text-bone-white">No Selected Route</p>
          <p className="font-sans text-xs">Select a flight from the left registry to run real-time pricing analysis, view historic charts, and perform rate freeze locks.</p>
        </div>
      </div>
    );
  }

  const detailed = computeDetailedPrice(flight, sim);
  const isCurrentlyFrozen = activeFrozenPrice !== null && secondsLeft !== null && secondsLeft > 0;

  // Render pricing details row helper
  const ModifierRow = ({ 
    label, 
    value, 
    percent, 
    desc 
  }: { 
    label: string; 
    value: number; 
    percent: number; 
    desc: string;
  }) => {
    const isPositive = value > 0;
    const isNegative = value < 0;
    
    return (
      <div className="flex flex-col sm:flex-row sm:items-center justify-between py-2 border-b border-gridline/60 last:border-b-0 text-xs">
        <div className="flex flex-col gap-0.5 max-w-[240px]">
          <span className="font-sans font-medium text-bone-white flex items-center gap-1.5">
            {label}
            {percent !== 0 && (
              <span className={`text-[10px] font-mono px-1 rounded ${
                isPositive ? 'bg-vermilion/10 text-vermilion' : 'bg-green-500/10 text-green-400'
              }`}>
                {isPositive ? `+${(percent * 100).toFixed(0)}%` : `${(percent * 100).toFixed(0)}%`}
              </span>
            )}
          </span>
          <span className="text-[10px] text-gray-500 font-sans">{desc}</span>
        </div>
        <div className="font-mono text-xs text-right mt-1 sm:mt-0 font-medium">
          {isPositive && <span className="text-vermilion">+${value}</span>}
          {isNegative && <span className="text-green-400">-${Math.abs(value)}</span>}
          {!isPositive && !isNegative && <span className="text-gray-400">$0 (Par)</span>}
        </div>
      </div>
    );
  };

  return (
    <div className="bg-base-dark rounded-lg border border-gridline p-6 flex flex-col gap-6 h-full overflow-y-auto">
      
      {/* Route and Header Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-gridline pb-4">
        <div>
          <p className="font-mono text-xs text-vermilion font-bold tracking-widest uppercase">
            {flight.airline} &bull; Route Dispatch {flight.flightNo}
          </p>
          <h2 className="font-serif text-3xl font-bold tracking-tight text-bone-white mt-1">
            {flight.originCity} ({flight.origin}) <span className="text-vermilion font-sans text-xl font-normal">🡒</span> {flight.destinationCity} ({flight.destination})
          </h2>
          <div className="flex items-center gap-3 mt-2 text-xs text-gray-400 font-sans">
            <span>Departure Status: <span className="text-bone-white font-mono">{flight.status}</span></span>
            <span>&bull;</span>
            <span>Advance Horizon: <span className="text-bone-white font-mono">{flight.departureDays} days</span></span>
          </div>
        </div>

        {/* Current Dynamic Valuation Panel */}
        <div className="bg-[#151515] px-4 py-3 rounded border border-gridline flex flex-col justify-center text-right min-w-[140px]">
          <span className="font-sans text-[10px] text-gray-500 uppercase tracking-widest">Calculated Rate</span>
          <span className="font-mono text-2xl font-bold text-bone-white mt-1">
            ${isCurrentlyFrozen ? activeFrozenPrice : detailed.finalPrice}
          </span>
          {isCurrentlyFrozen ? (
            <span className="text-[10px] text-cyan-400 font-mono animate-pulse mt-0.5">
              [RATE FROZEN &bull; LOCKED]
            </span>
          ) : (
            <span className="text-[10px] text-gray-500 font-mono mt-0.5">
              Base Price: ${flight.basePrice}
            </span>
          )}
        </div>
      </div>

      {/* Grid: Price History on Top, Pricing Audit Table & Freeze on the Bottom */}
      <div className="grid grid-cols-1 xl:grid-cols-12 gap-6 items-stretch">
        
        {/* Dynamic Price History Graph (8 column span on desktop) */}
        <div className="xl:col-span-7 flex flex-col bg-canvas border border-gridline rounded p-4 h-[320px] sm:h-[350px]">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-vermilion" />
              <h3 className="font-serif text-sm font-medium text-bone-white">Dynamic Pricing History Ledgers</h3>
            </div>
            <span className="font-mono text-[10px] text-gray-500 uppercase">
              15-Tick Interval Timeline Log
            </span>
          </div>

          <div className="flex-1 w-full min-h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <AreaChart
                data={flight.history}
                margin={{ top: 5, right: 10, left: -20, bottom: 5 }}
              >
                <defs>
                  <linearGradient id="colorPrice" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#FF4D00" stopOpacity={0.25} />
                    <stop offset="95%" stopColor="#FF4D00" stopOpacity={0.0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="#252525" vertical={false} />
                <XAxis 
                  dataKey="time" 
                  stroke="#555" 
                  fontSize={10} 
                  fontFamily="JetBrains Mono" 
                  tickLine={false}
                />
                <YAxis 
                  stroke="#555" 
                  fontSize={10} 
                  fontFamily="JetBrains Mono" 
                  tickLine={false}
                  domain={['auto', 'auto']}
                  tickFormatter={(v) => `$${v}`}
                />
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#121212',
                    border: '1px solid #FF4D00',
                    borderRadius: '4px',
                    fontFamily: 'JetBrains Mono',
                    fontSize: '11px',
                    color: '#F5F5F0'
                  }}
                  itemStyle={{ color: '#FF4D00' }}
                  labelStyle={{ color: '#aaa', marginBottom: '4px' }}
                />
                <Area 
                  type="monotone" 
                  dataKey="price" 
                  stroke="#FF4D00" 
                  strokeWidth={2}
                  fillOpacity={1} 
                  fill="url(#colorPrice)" 
                  activeDot={{ r: 6, stroke: '#FF4D00', strokeWidth: 1, fill: '#FF4D00' }}
                  name="Dispatch Cost"
                />
              </AreaChart>
            </ResponsiveContainer>
          </div>
          
          <div className="mt-2 text-[10px] font-sans text-gray-500 flex justify-between">
            <span>&bull; Peak Value: ${Math.max(...flight.history.map(h => h.price))}</span>
            <span>&bull; Opening Value: ${flight.history[0]?.price || flight.basePrice}</span>
            <span>&bull; Real-time Yield Deviation Rate Running active</span>
          </div>
        </div>

        {/* PRICE FREEZE INTERACTION (5 column span on desktop) */}
        <div className="xl:col-span-5 flex flex-col gap-4">
          
          {/* Price Freeze Box & Actions */}
          <div className={`p-5 rounded border ${
            isCurrentlyFrozen 
              ? 'bg-cyan-950/20 border-cyan-500/30' 
              : 'bg-[#151515] border-gridline'
          } flex flex-col justify-between h-full`}>
            
            <div className="flex flex-col gap-3">
              <div className="flex items-center justify-between">
                <span className="font-serif text-sm font-medium text-bone-white flex items-center gap-2">
                  <Lock className={`w-4 h-4 ${isCurrentlyFrozen ? 'text-cyan-400' : 'text-vermilion'}`} />
                  Price Freeze Engine
                </span>
                
                {isCurrentlyFrozen && (
                  <span className="font-mono text-xs bg-cyan-500/20 text-cyan-400 px-2 py-0.5 rounded border border-cyan-500/40 animate-pulse">
                    Locked In
                  </span>
                )}
              </div>

              <p className="text-[11px] font-sans text-gray-400 leading-relaxed">
                A dynamic algorithm adjusts ticket values. You can freeze the baseline price 
                to lock in <strong className="text-bone-white">${detailed.finalPrice}</strong>. This shields your reservation 
                from ticket surges for <strong>60 seconds</strong>.
              </p>

              {/* Status Alert while Frozen */}
              {isCurrentlyFrozen ? (
                <div className="bg-cyan-500/10 border border-cyan-500/30 rounded p-3 text-cyan-400 flex flex-col gap-1">
                  <div className="flex items-center justify-between text-xs font-semibold">
                    <span>LOCKED PRICE AGREEMENT</span>
                    <span className="font-mono text-cyan-300 text-sm">
                      ${activeFrozenPrice}
                    </span>
                  </div>
                  <div className="flex items-center justify-between font-mono text-[11px] text-cyan-400/85 mt-1">
                    <span className="flex items-center gap-1">
                      <Clock className="w-3.5 h-3.5 animate-spin" /> EXPIRES IN:
                    </span>
                    <span className="font-bold text-xs">{secondsLeft} SECONDS</span>
                  </div>
                  {detailed.finalPrice > activeFrozenPrice ? (
                    <p className="text-[10px] text-emerald-400 font-sans mt-1">
                      ✔ Protection active: saving ${detailed.finalPrice - activeFrozenPrice} compared to current market valuation (${detailed.finalPrice})!
                    </p>
                  ) : detailed.finalPrice < activeFrozenPrice ? (
                    <p className="text-[10px] text-amber-400 font-sans mt-1">
                      🛈 Current market pricing dropped to ${detailed.finalPrice}. It is smarter to book at the live rate.
                    </p>
                  ) : (
                    <p className="text-[10px] text-gray-400 font-sans mt-1">
                      The market price is currently identical to your frozen rate.
                    </p>
                  )}
                </div>
              ) : (
                <div className="bg-canvas border border-gridline p-3 rounded flex items-center justify-between">
                  <div className="flex flex-col">
                    <span className="text-[10px] text-gray-500 uppercase tracking-tight">Protect Rate Lock For</span>
                    <span className="font-mono text-xs text-bone-white">60-second horizon</span>
                  </div>
                  <button
                    onClick={() => onFreezePrice(flight.id, detailed.finalPrice)}
                    className="font-sans text-[11px] font-medium border border-vermilion text-vermilion hover:bg-vermilion hover:text-white px-3 py-1.5 rounded transition-all flex items-center gap-1"
                  >
                    Lock ${detailed.finalPrice} Now
                  </button>
                </div>
              )}
            </div>

            {/* Purchase Desk */}
            <div className="mt-4 pt-4 border-t border-gridline">
              <div className="flex flex-col gap-2">
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>Selected Fare Type</span>
                  <span className="font-mono text-bone-white">Flexible Dispatch Cabin</span>
                </div>
                <div className="flex justify-between items-center text-xs text-gray-400">
                  <span>Subtotal Cost</span>
                  <span className="font-mono text-bone-white">
                    ${isCurrentlyFrozen ? activeFrozenPrice : detailed.finalPrice}
                  </span>
                </div>
                
                <div className="flex items-center gap-2 mt-2">
                  {/* Standard Booking Button */}
                  <button
                    onClick={() => onBookFlight(flight.id, detailed.finalPrice, false)}
                    className="flex-1 bg-zinc-800 hover:bg-zinc-700 font-sans font-medium text-xs text-bone-white py-2 px-3 rounded text-center transition-colors shadow border border-gridline/50"
                  >
                    Live Book (${detailed.finalPrice})
                  </button>

                  {/* Frozen Booking Button */}
                  {isCurrentlyFrozen && (
                    <button
                      onClick={() => onBookFlight(flight.id, activeFrozenPrice, true)}
                      className="flex-1 bg-vermilion hover:bg-vermilion/95 text-white font-sans font-bold text-xs py-2 px-3 rounded text-center transition-all flex items-center justify-center gap-1"
                    >
                      Use Freeze Price (${activeFrozenPrice})
                    </button>
                  )}
                </div>
              </div>
            </div>

          </div>
        </div>

      </div>

      {/* Pricing Audit Ledger (Mathematical Transparency breakdown) */}
      <div className="border border-gridline p-4 rounded bg-[#131313] mt-2">
        <div className="flex items-center justify-between mb-3 border-b border-gridline pb-2">
          <div className="flex items-center gap-1.5">
            <Percent className="w-4 h-4 text-vermilion" />
            <h3 className="font-serif text-sm font-medium text-bone-white">Dynamic Pricing Core Audit Ledger</h3>
          </div>
          <button
            onClick={() => setShowExplanation(!showExplanation)}
            className="text-[10px] text-vermilion hover:underline tracking-tight uppercase"
          >
            {showExplanation ? 'Hide Guide' : 'Show Guide'}
          </button>
        </div>

        {/* Dynamic Pricing Explanation Box to satisfy "transparent and predictable to users" */}
        {showExplanation && (
          <div className="bg-canvas border border-vermilion/20 text-xs text-gray-400 p-3 rounded mb-4 leading-relaxed font-sans flex flex-col gap-2">
            <p>
              The <strong>Dynamic Pricing Audit Ledger</strong> utilizes live factors to compute precise real-time ticket valuations:
            </p>
            <ul className="list-disc pl-5 space-y-1 text-gray-400">
              <li><strong className="text-bone-white">Holiday Modifier:</strong> Standard travel rushes automatically amplify ticket costs by +20% during Peak travel times.</li>
              <li><strong className="text-bone-white">Demand Modifier:</strong> Real-time travel demand filters range from Low Discount (-10%) up to Surge/Extreme Premium (+50%).</li>
              <li><strong className="text-bone-white">Inventory Fill Rates:</strong> If more than 75% or 90% of available seats are booked, ticket values automatically lift to offset capacity risks.</li>
              <li><strong className="text-bone-white">Advanced Purchase Multipliers:</strong> Flights expiring within 5 to 2 days scale sharply due to urgent corporate reservation volumes.</li>
              <li><strong className="text-bone-white">Operational Disruption:</strong> Macro disturbances like route congestion or flight delays factor dynamically into ticketing expenses.</li>
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-1">
          <ModifierRow 
            label="Original Core Ticket Base Rate" 
            value={flight.basePrice} 
            percent={0} 
            desc="The static catalog pricing set prior to dynamic algorithm scaling."
          />
          <ModifierRow 
            label="Peak season / Holidays premium" 
            value={detailed.holidayModifier} 
            percent={detailed.holidayPct} 
            desc="Regulatory holiday modifier based on calendars & peak intervals."
          />
          <ModifierRow 
            label="Live Demand Scaling Modifier" 
            value={detailed.demandModifier} 
            percent={detailed.demandPct} 
            desc="Dynamic query load generated by consumer search traffic."
          />
          <ModifierRow 
            label="Inventory Scarcity Premium" 
            value={detailed.seatsModifier} 
            percent={detailed.seatsPct} 
            desc="Ticketing load dictated by available physical seating capacity."
          />
          <ModifierRow 
            label="Departure Proximity Factor" 
            value={detailed.timeModifier} 
            percent={detailed.timePct} 
            desc="Horizon multiplier governed by time left before flight dispatch."
          />
          <ModifierRow 
            label="Live Real-time Search Tickers" 
            value={detailed.searchModifier} 
            percent={detailed.searchPct} 
            desc="Real-time localized customer seat querying spikes."
          />
          <ModifierRow 
            label="Operational Disruption Factor" 
            value={detailed.disruptionModifier} 
            percent={detailed.disruptionPct} 
            desc="Route operations load including winter meteorology, airport queues, or energy costs."
          />

          <div className="flex items-center justify-between mt-3 pt-3 border-t border-gridline font-semibold text-xs">
            <span className="font-sans text-bone-white">Dynamically Recalculated Ticket Price:</span>
            <span className="font-mono text-sm text-vermilion">
              ${detailed.finalPrice}
            </span>
          </div>
        </div>
      </div>

    </div>
  );
}

import React, { useState, useEffect } from 'react';
import { Lock, FileText, CheckCircle2, Trash2, ArrowUpRight, Clock, AlertTriangle, Coins } from 'lucide-react';
import { PriceFreeze, Flight, GlobalSimControl } from '../types';
import { computeDetailedPrice } from '../utils/pricingEngine';

interface LedgerSummaryProps {
  frozenList: PriceFreeze[];
  onUnfreeze: (id: string) => void;
  onBookFlight: (flightId: string, bookingPrice: number, isFromFrozen: boolean) => void;
  flights: Flight[];
  sim: GlobalSimControl;
  bookingHistory: {
    id: string;
    flightNo: string;
    origin: string;
    destination: string;
    pricePaid: number;
    savedAmount: number;
    purchaseTime: string;
    method: 'Frozen Rate' | 'Standard Rate';
  }[];
}

export default function LedgerSummary({
  frozenList,
  onUnfreeze,
  onBookFlight,
  flights,
  sim,
  bookingHistory
}: LedgerSummaryProps) {
  const [activeTab, setActiveTab] = useState<'freezes' | 'bookings'>('freezes');
  const [nowTime, setNowTime] = useState<number>(Date.now());

  // Periodically refresh the nowTime for countdown rendering
  useEffect(() => {
    const timer = setInterval(() => {
      setNowTime(Date.now());
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  return (
    <div className="bg-base-dark rounded-lg border border-gridline overflow-hidden select-none">
      
      {/* Tabs */}
      <div className="flex bg-[#141414] border-b border-gridline">
        <button
          onClick={() => setActiveTab('freezes')}
          className={`flex-1 py-3 px-4 font-serif text-sm font-semibold border-b-2 flex items-center justify-center gap-2 transition-all ${
            activeTab === 'freezes'
              ? 'border-vermilion text-bone-white bg-canvas/30'
              : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-zinc-900/40'
          }`}
        >
          <Lock className="w-4 h-4 text-vermilion/85" />
          ACTIVE RATE LOCKS
          <span className="font-mono text-xs bg-vermilion/20 text-vermilion px-1.5 py-0.5 rounded ml-1">
            {frozenList.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('bookings')}
          className={`flex-1 py-3 px-4 font-serif text-sm font-semibold border-b-2 flex items-center justify-center gap-2 transition-all ${
            activeTab === 'bookings'
              ? 'border-vermilion text-bone-white bg-canvas/30'
              : 'border-transparent text-gray-500 hover:text-gray-300 hover:bg-zinc-900/40'
          }`}
        >
          <FileText className="w-4 h-4 text-gray-400" />
          DISPATCH TICKET DECK
          <span className="font-mono text-xs bg-zinc-800 text-bone-white px-1.5 py-0.5 rounded ml-1">
            {bookingHistory.length}
          </span>
        </button>
      </div>

      {/* Tab Panel Contents */}
      <div className="p-4 max-h-[380px] overflow-y-auto">
        
        {/* FREEZES VIEW */}
        {activeTab === 'freezes' && (
          <div className="flex flex-col gap-3">
            {frozenList.length === 0 ? (
              <div className="text-center py-8 text-gray-500 flex flex-col items-center gap-2">
                <Clock className="w-8 h-8 text-gray-700" />
                <p className="font-serif text-sm text-bone-white">No Active Locked Rates</p>
                <p className="font-sans text-[11px] max-w-xs">
                  Unlock dynamic security. Browse the routing list and press &quot;Lock Rate Now&quot; to arrest fluctuating market prices.
                </p>
              </div>
            ) : (
              frozenList.map(freeze => {
                const flight = flights.find(f => f.id === freeze.flightId);
                const currentMarketPrice = flight ? computeDetailedPrice(flight, sim).finalPrice : freeze.frozenPrice;
                const priceDelta = currentMarketPrice - freeze.frozenPrice;
                const isUnderMarket = priceDelta > 0;
                
                const timeLeftSec = Math.max(0, Math.round((freeze.expiresAt - nowTime) / 1000));
                const isExpired = timeLeftSec <= 0;

                if (isExpired) {
                  // Wait for expiration filter in parent state, render expired indicators
                  return null;
                }

                return (
                  <div 
                    key={freeze.id} 
                    className="p-3 bg-canvas border border-gridline rounded flex flex-col gap-2.5 relative hover:border-vermilion/55 transition-colors"
                  >
                    {/* Expiration bar */}
                    <div className="absolute top-0 left-0 h-[2px] bg-cyan-400 transition-all duration-1000" style={{ width: `${(timeLeftSec / freeze.durationSec) * 100}%` }} />

                    {/* Route Info */}
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-vermilion">
                          {freeze.flightNo}
                        </span>
                        <span className="text-[11px] font-sans text-gray-400">
                          {freeze.origin} &bull; {freeze.destination}
                        </span>
                      </div>

                      <div className="flex items-center gap-1.5 font-mono text-[10px] text-cyan-400">
                        <Clock className="w-3 h-3 animate-spin" />
                        <span>{timeLeftSec}s remaining</span>
                      </div>
                    </div>

                    {/* Pricing Comparison */}
                    <div className="flex items-center justify-between bg-base-dark p-2 rounded border border-gridline/50">
                      <div>
                        <p className="text-[9px] text-gray-500 uppercase">Frozen Rate</p>
                        <p className="font-mono text-sm font-bold text-bone-white">${freeze.frozenPrice}</p>
                      </div>

                      <div>
                        <p className="text-[9px] text-gray-400 uppercase text-right">Market Price</p>
                        <p className="font-mono text-xs font-semibold text-gray-400 text-right">${currentMarketPrice}</p>
                      </div>

                      <div className="text-right">
                        <p className="text-[9px] text-gray-500 uppercase">Protection margin</p>
                        {isUnderMarket ? (
                          <span className="text-emerald-400 font-mono text-[11px] font-bold">
                            ✔ Saved ${priceDelta}
                          </span>
                        ) : priceDelta < 0 ? (
                          <span className="text-amber-400 font-mono text-[10px]">
                            Live is ${Math.abs(priceDelta)} lower
                          </span>
                        ) : (
                          <span className="text-gray-500 font-mono text-[11px]">
                            Equal
                          </span>
                        )}
                      </div>
                    </div>

                    {/* Actions Inside Card */}
                    <div className="flex justify-between items-center bg-[#181818] px-2 py-1.5 rounded text-[11px]">
                      <button
                        onClick={() => onUnfreeze(freeze.id)}
                        className="text-gray-500 hover:text-red-400 flex items-center gap-1"
                        title="Cancel rate lock"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Release Lock</span>
                      </button>

                      <button
                        onClick={() => onBookFlight(freeze.flightId, freeze.frozenPrice, true)}
                        className="bg-vermilion text-white hover:bg-vermilion/90 font-bold px-3 py-1 rounded transition-colors flex items-center gap-1"
                      >
                        <span>Confirm Booking @ ${freeze.frozenPrice}</span>
                      </button>
                    </div>

                  </div>
                );
              })
            )}
          </div>
        )}

        {/* BOOKINGS VIEW */}
        {activeTab === 'bookings' && (
          <div className="flex flex-col gap-3">
            {bookingHistory.length === 0 ? (
              <div className="text-center py-8 text-gray-500 flex flex-col items-center gap-2">
                <FileText className="w-8 h-8 text-gray-700" />
                <p className="font-serif text-sm text-bone-white">Ledger Record Empty</p>
                <p className="font-sans text-[11px] max-w-xs">
                  Place standard live bookings or exercise active price freeze locks to populate the ledger database.
                </p>
              </div>
            ) : (
              <div className="flex flex-col gap-2">
                {/* Total savings counter */}
                <div className="p-3 bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs rounded mb-1 flex items-center justify-between">
                  <div className="flex items-center gap-1.5">
                    <Coins className="w-4 h-4 text-emerald-400 shrink-0" />
                    <span>Accumulated Ledger Rate Savings</span>
                  </div>
                  <strong className="font-mono text-sm">
                    ${bookingHistory.reduce((sum, item) => sum + item.savedAmount, 0)} Saved
                  </strong>
                </div>

                {bookingHistory.map(booking => (
                  <div 
                    key={booking.id} 
                    className="p-3 bg-canvas border border-gridline rounded flex flex-col gap-1.5"
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-xs font-bold text-bone-white">
                          {booking.flightNo}
                        </span>
                        <span className="font-sans text-xs text-gray-400">
                          {booking.origin} 🡒 {booking.destination}
                        </span>
                      </div>
                      <span className="text-[10px] text-gray-500 font-mono">
                        {booking.purchaseTime}
                      </span>
                    </div>

                    <div className="flex items-center justify-between text-xs pt-1.5 border-t border-gridline/30">
                      <div className="flex items-center gap-1.5">
                        <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400 shrink-0" />
                        <span className="font-sans text-gray-400">Fare Charged:</span>
                        <strong className="font-mono text-bone-white">${booking.pricePaid}</strong>
                      </div>

                      <div className="text-right">
                        {booking.savedAmount > 0 ? (
                          <span className="text-[10px] bg-emerald-500/15 text-emerald-400 px-2 py-0.5 rounded font-mono font-medium inline-flex items-center gap-0.5">
                            <ArrowUpRight className="w-3 h-3 justify-center text-emerald-400" />
                            Guaranteed Saved ${booking.savedAmount}!
                          </span>
                        ) : (
                          <span className="text-[10px] bg-zinc-800 text-gray-400 px-2 py-0.5 rounded font-sans inline-block">
                            Live Standard Rate
                          </span>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

      </div>

    </div>
  );
}

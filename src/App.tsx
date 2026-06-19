import React, { useState, useEffect, useRef } from 'react';
import { 
  Menu, 
  Plane, 
  Info, 
  Coins, 
  CheckCircle2, 
  X, 
  Printer, 
  Compass, 
  FileLock, 
  Radio, 
  ShieldAlert,
  SlidersHorizontal,
  BookmarkCheck,
  Award
} from 'lucide-react';
import { Flight, GlobalSimControl, PriceFreeze } from './types';
import { INITIAL_FLIGHTS } from './data/flights';
import { computeDetailedPrice } from './utils/pricingEngine';
import Header from './components/Header';
import FlightList from './components/FlightList';
import FlightDetails from './components/FlightDetails';
import SimulatorControls from './components/SimulatorControls';
import LedgerSummary from './components/LedgerSummary';

// Local storage keys
const STORAGE_PREFIX = 'aeroprice_dispatcher_';
const FLIGHTS_KEY = `${STORAGE_PREFIX}flights`;
const SIM_KEY = `${STORAGE_PREFIX}sim_control`;
const FREEZES_KEY = `${STORAGE_PREFIX}price_freezes`;
const BOOKINGS_KEY = `${STORAGE_PREFIX}bookings`;

export default function App() {
  const [flights, setFlights] = useState<Flight[]>(INITIAL_FLIGHTS);
  const [selectedFlightId, setSelectedFlightId] = useState<string>(INITIAL_FLIGHTS[0]?.id || '');
  const [sim, setSim] = useState<GlobalSimControl>({
    isHolidayPeak: false,
    baseDemandSetting: 'standard',
    searchActivitySpike: 'normal',
    disruptionFactor: 'none',
    updateFrequencySec: 5
  });
  const [isRunning, setIsRunning] = useState<boolean>(true);
  const [frozenList, setFrozenList] = useState<PriceFreeze[]>([]);
  
  // Custom list of finished bookings
  const [bookingHistory, setBookingHistory] = useState<{
    id: string;
    flightNo: string;
    origin: string;
    destination: string;
    pricePaid: number;
    savedAmount: number;
    purchaseTime: string;
    method: 'Frozen Rate' | 'Standard Rate';
  }[]>([]);

  // Detailed modal state for displaying boarding passes
  const [activeBoardingPass, setActiveBoardingPass] = useState<{
    ticketId: string;
    flightNo: string;
    airline: string;
    origin: string;
    destination: string;
    originCity: string;
    destinationCity: string;
    pricepaid: number;
    savings: number;
    method: string;
    boardingTime: string;
  } | null>(null);

  // Load from local storage on mount
  useEffect(() => {
    try {
      const storedFlightsList = localStorage.getItem(FLIGHTS_KEY);
      if (storedFlightsList) {
        setFlights(JSON.parse(storedFlightsList));
      }
      
      const storedSim = localStorage.getItem(SIM_KEY);
      if (storedSim) {
        setSim(JSON.parse(storedSim));
      }

      const storedFreezes = localStorage.getItem(FREEZES_KEY);
      if (storedFreezes) {
        setFrozenList(JSON.parse(storedFreezes));
      }

      const storedBookings = localStorage.getItem(BOOKINGS_KEY);
      if (storedBookings) {
        setBookingHistory(JSON.parse(storedBookings));
      }
    } catch (e) {
      console.warn('Could not read cache:', e);
    }
  }, []);

  // Save to local storage when state mutates
  useEffect(() => {
    try {
      localStorage.setItem(FLIGHTS_KEY, JSON.stringify(flights));
    } catch(e) {}
  }, [flights]);

  useEffect(() => {
    try {
      localStorage.setItem(SIM_KEY, JSON.stringify(sim));
    } catch(e) {}
  }, [sim]);

  useEffect(() => {
    try {
      localStorage.setItem(FREEZES_KEY, JSON.stringify(frozenList));
    } catch(e) {}
  }, [frozenList]);

  useEffect(() => {
    try {
      localStorage.setItem(BOOKINGS_KEY, JSON.stringify(bookingHistory));
    } catch(e) {}
  }, [bookingHistory]);

  // Clean stale/expired locks periodically (runs every second)
  useEffect(() => {
    const clock = setInterval(() => {
      const now = Date.now();
      setFrozenList(prev => {
        const activeOnly = prev.filter(item => item.expiresAt > now && item.status === 'active');
        if (activeOnly.length !== prev.length) {
          return activeOnly;
        }
        return prev;
      });
    }, 1000);
    return () => clearInterval(clock);
  }, []);

  // MASTER REALTIME PRICING TICK GENERATOR
  useEffect(() => {
    if (!isRunning) return;

    const repreciferTimer = setInterval(() => {
      triggerEvaluationTick();
    }, sim.updateFrequencySec * 1000);

    return () => clearInterval(repreciferTimer);
  }, [isRunning, sim.updateFrequencySec, sim.baseDemandSetting, sim.isHolidayPeak, sim.disruptionFactor]);

  const triggerEvaluationTick = () => {
    setFlights(prevFlights => {
      return prevFlights.map(flight => {
        // 1. Simulate minor dynamic organic variables (stochastic traffic)
        let searchVolumeChange = Math.floor(Math.random() * 11) - 5; // -5 to +5
        const newSearchVolume = Math.min(100, Math.max(5, flight.searchVolume + searchVolumeChange));

        // Let's sometimes randomly decrement remaining seats (organic sales simulating a real plane booking up!)
        let seatsRemaining = flight.seatsRemaining;
        if (Math.random() > 0.85 && seatsRemaining > 4) {
          seatsRemaining -= 1;
        }

        // 2. Compute dynamic pricing evaluation using master formula
        const simulatedFlightWithNewVolume = { 
          ...flight, 
          searchVolume: newSearchVolume,
          seatsRemaining
        };
        const calculation = computeDetailedPrice(simulatedFlightWithNewVolume, sim);
        
        // Determine trends
        let trend: 'up' | 'down' | 'stable' = 'stable';
        let flash: 'up' | 'down' | null = null;
        
        if (calculation.finalPrice > flight.currentPrice) {
          trend = 'up';
          flash = 'up';
        } else if (calculation.finalPrice < flight.currentPrice) {
          trend = 'down';
          flash = 'down';
        } else {
          trend = flight.trend; // preserve
        }

        // Add history point (Max 20 history points for performance rendering)
        const now = new Date();
        const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

        const updatedHistory = [...flight.history, {
          time: timeStr,
          price: calculation.finalPrice,
          demandFactor: Math.round(100 * (calculation.finalPrice / flight.basePrice)) / 100,
          seatsRemaining
        }].slice(-20); // Keep last 20 coordinates

        // Setup flash trigger to fade out safely
        const updatedFlight: Flight = {
          ...flight,
          searchVolume: newSearchVolume,
          seatsRemaining,
          currentPrice: calculation.finalPrice,
          trend,
          lastPriceFlash: flash,
          history: updatedHistory
        };

        return updatedFlight;
      });
    });

    // Clear flash states after 1.2s to restore baseline terminal coloring
    setTimeout(() => {
      setFlights(currentFlights => {
        return currentFlights.map(f => ({ ...f, lastPriceFlash: null }));
      });
    }, 1200);
  };

  // MANUAL TICK TRIGGER FROM USER
  const handleManualRefresh = () => {
    triggerEvaluationTick();
  };

  // TRIGGER RANDOM SIMULATED SEARCH SPIKE ON SELECTED FLIGHT
  const handleTriggerRandomSearch = () => {
    setFlights(prev => {
      return prev.map(f => {
        if (f.id === selectedFlightId) {
          // Boost search volume sharply by 40 points
          const newVolume = Math.min(100, f.searchVolume + 40);
          
          const mockFlight = { ...f, searchVolume: newVolume };
          const computed = computeDetailedPrice(mockFlight, sim);
          
          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          return {
            ...f,
            searchVolume: newVolume,
            trend: 'up',
            lastPriceFlash: 'up',
            currentPrice: computed.finalPrice,
            history: [...f.history, {
              time: timeStr,
              price: computed.finalPrice,
              demandFactor: Math.round(100 * (computed.finalPrice / f.basePrice)) / 100,
              seatsRemaining: f.seatsRemaining
            }].slice(-20)
          };
        }
        return f;
      });
    });

    // Clear flash states after 1.2s
    setTimeout(() => {
      setFlights(currentFlights => {
        return currentFlights.map(f => ({ ...f, lastPriceFlash: null }));
      });
    }, 1200);
  };

  // SIMULATE SEAT BOOKING TRANSACTION (REDUCES INDIVIDUAL CAPACITY)
  const handleSimulateSeatBooking = () => {
    setFlights(prev => {
      return prev.map(f => {
        if (f.id === selectedFlightId) {
          if (f.seatsRemaining <= 1) return f; // fully booked
          
          const newRemaining = f.seatsRemaining - Math.floor(Math.random() * 4 + 1); // deduct 1-4 seats
          const mockFlight = { ...f, seatsRemaining: newRemaining };
          const computed = computeDetailedPrice(mockFlight, sim);

          const now = new Date();
          const timeStr = now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit', second: '2-digit' });

          return {
            ...f,
            seatsRemaining: newRemaining,
            trend: 'up',
            lastPriceFlash: 'up',
            currentPrice: computed.finalPrice,
            history: [...f.history, {
              time: timeStr,
              price: computed.finalPrice,
              demandFactor: Math.round(100 * (computed.finalPrice / f.basePrice)) / 100,
              seatsRemaining: newRemaining
            }].slice(-20)
          };
        }
        return f;
      });
    });

    setTimeout(() => {
      setFlights(currentFlights => {
        return currentFlights.map(f => ({ ...f, lastPriceFlash: null }));
      });
    }, 1200);
  };

  // FREEZE PRICE INTERACTION
  const handleFreezePrice = (flightId: string, lockedPrice: number) => {
    const flight = flights.find(f => f.id === flightId);
    if (!flight) return;

    // Check if flight has already an active price freeze
    const exists = frozenList.some(item => item.flightId === flightId && item.status === 'active');
    if (exists) return;

    const newFreeze: PriceFreeze = {
      id: `lock-${Date.now()}-${Math.floor(Math.random() * 1000)}`,
      flightId,
      flightNo: flight.flightNo,
      origin: flight.origin,
      destination: flight.destination,
      frozenPrice: lockedPrice,
      durationSec: 60,
      frozenAt: Date.now(),
      expiresAt: Date.now() + 60000, // 60 seconds dynamic buffer
      status: 'active'
    };

    setFrozenList(prev => [newFreeze, ...prev]);
  };

  // CANCEL/RELEASE FREEZE LOCK
  const handleUnfreeze = (id: string) => {
    setFrozenList(prev => prev.filter(x => x.id !== id));
  };

  // BOOK FLIGHT FLOW & MODAL BOARDING RECEIPT TRIGGER
  const handleBookFlight = (flightId: string, bookingPrice: number, isFromFrozen: boolean) => {
    const flight = flights.find(f => f.id === flightId);
    if (!flight) return;

    if (flight.seatsRemaining <= 0) {
      alert(`Dispatch Error: Cabin capacity exhausted for Routing ${flight.flightNo}`);
      return;
    }

    // Deduct seat inventory
    setFlights(prev => {
      return prev.map(f => {
        if (f.id === flightId) {
          return {
            ...f,
            seatsRemaining: Math.max(0, f.seatsRemaining - 1)
          };
        }
        return f;
      });
    });

    // Calculate actual live market price to compute cash savings
    const liveMarketValue = computeDetailedPrice(flight, sim).finalPrice;
    const finalSavings = isFromFrozen ? Math.max(0, liveMarketValue - bookingPrice) : 0;

    const newBooking = {
      id: `ticket-${Date.now()}-${Math.floor(Math.random() * 10000)}`,
      flightNo: flight.flightNo,
      origin: flight.origin,
      destination: flight.destination,
      pricePaid: bookingPrice,
      savedAmount: finalSavings,
      purchaseTime: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      method: isFromFrozen ? ('Frozen Rate' as const) : ('Standard Rate' as const)
    };

    // Prepend to history log
    setBookingHistory(prev => [newBooking, ...prev]);

    // Build elegant avionic Boarding Pass payload
    const boardingTime = new Date(Date.now() + 4 * 3600000).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    setActiveBoardingPass({
      ticketId: newBooking.id.toUpperCase(),
      flightNo: flight.flightNo,
      airline: flight.airline,
      origin: flight.origin,
      destination: flight.destination,
      originCity: flight.originCity,
      destinationCity: flight.destinationCity,
      pricepaid: bookingPrice,
      savings: finalSavings,
      method: isFromFrozen ? 'FROZEN LOCK SAVED PASS' : 'LIVE CONSOLE BOOKING',
      boardingTime
    });

    // Remove any active freezes for this flight id
    setFrozenList(prev => prev.filter(x => x.flightId !== flightId));
  };

  // Statistics summaries
  const selectedFlight = flights.find(f => f.id === selectedFlightId);
  const frozenMap = frozenList.reduce((acc, f) => {
    acc[f.flightId] = true;
    return acc;
  }, {} as { [flightId: string]: boolean });

  const activeFreezeForSelected = frozenList.find(x => x.flightId === selectedFlightId && x.status === 'active');
  const activeFrozenPrice = activeFreezeForSelected ? activeFreezeForSelected.frozenPrice : null;
  const freezeExpiresAt = activeFreezeForSelected ? activeFreezeForSelected.expiresAt : null;

  // Calculate dynamic premium percentages
  const avgPremium = (() => {
    let sumDiffPct = 0;
    flights.forEach(f => {
      const live = computeDetailedPrice(f, sim).finalPrice;
      const pct = ((live - f.basePrice) / f.basePrice) * 100;
      sumDiffPct += pct;
    });
    return sumDiffPct / flights.length;
  })();

  const handlePrintBoardingPass = () => {
    window.print();
  };

  return (
    <div className="min-h-screen bg-canvas text-bone-white font-sans selection:bg-vermilion selection:text-white flex flex-col justify-between">
      
      {/* Top Banner Header */}
      <Header 
        sim={sim} 
        setSim={setSim}
        isRunning={isRunning}
        setIsRunning={(flag) => setIsRunning(flag)}
        triggerManualRefresh={handleManualRefresh}
        avgDynamicPremium={avgPremium}
        totalActiveFreezes={frozenList.length}
      />

      {/* Main Terminal Workspace Layout */}
      <main className="flex-1 p-4 md:p-6 grid grid-cols-1 lg:grid-cols-12 gap-6 max-w-7xl w-full mx-auto align-top">
        
        {/* Left Side: Search Filter & Interactive Flights Ledger - 4 column span on desktop */}
        <section className="lg:col-span-4 h-[650px] lg:h-[800px] flex flex-col">
          <FlightList 
            flights={flights}
            selectedFlightId={selectedFlightId}
            onSelectFlight={(id) => setSelectedFlightId(id)}
            sim={sim}
            frozenFlightIds={frozenMap}
          />
        </section>

        {/* Right Side: Primary evaluation analysis, graphs (8 column span) */}
        <section className="lg:col-span-8 flex flex-col gap-6">
          
          {/* Top Panel: Detailed flight audits & real-time pricing analysis charts */}
          <div className="flex-1">
            <FlightDetails 
              flight={selectedFlight}
              sim={sim}
              onFreezePrice={handleFreezePrice}
              activeFrozenPrice={activeFrozenPrice}
              freezeExpiresAt={freezeExpiresAt}
              onBookFlight={handleBookFlight}
            />
          </div>

          {/* Bottom Grid: Simulator Controls & Dynamic Booking Reciept Ledgers */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            
            {/* Simulation modulation knobs */}
            <SimulatorControls 
              sim={sim}
              setSim={setSim}
              onTriggerRandomSearch={handleTriggerRandomSearch}
              onSimulateSeatBooking={handleSimulateSeatBooking}
            />

            {/* Active locks and purchased histories logs */}
            <LedgerSummary 
              frozenList={frozenList}
              onUnfreeze={handleUnfreeze}
              onBookFlight={handleBookFlight}
              flights={flights}
              sim={sim}
              bookingHistory={bookingHistory}
            />

          </div>

        </section>

      </main>

      {/* FOOTER */}
      <footer className="border-t border-gridline bg-[#0E0E0E] py-4 px-6 text-center text-xs text-gray-500 font-sans">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>&bull; Dynamic Flight Yield Pricing Engine Panel. Powered by real-time stochastic inventory calculations.</p>
          <div className="flex items-center gap-4 text-gray-600 font-mono text-[10px]">
            <span>ENGINE: AMADEUS-SIM-V4</span>
            <span>SYSTEM CORRELATION: ON-LINE</span>
          </div>
        </div>
      </footer>

      {/* MAJESTIC CUSTOM BOARDING PASS MODAL */}
      {activeBoardingPass && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4 backdrop-blur-sm transition-all animate-fade-in">
          <div className="bg-[#121212] border border-vermilion rounded-lg max-w-lg w-full overflow-hidden shadow-2xl relative">
            
            {/* Modal Exit Button */}
            <button
              onClick={() => setActiveBoardingPass(null)}
              className="absolute top-4 right-4 text-gray-500 hover:text-white transition-colors p-1 bg-black/25 rounded"
            >
              <X className="w-4 h-4" />
            </button>

            {/* Header branding */}
            <div className="bg-gradient-to-r from-vermilion/10 to-[#181818] p-5 border-b border-gridline flex items-center gap-2.5">
              <Compass className="w-5 h-5 text-vermilion" />
              <div>
                <h3 className="font-serif text-lg font-bold text-bone-white">Boarding Dispatch Document</h3>
                <p className="text-[10px] font-mono text-gray-500 uppercase tracking-widest">
                  AeroPrice Civil Aviation Registry
                </p>
              </div>
            </div>

            {/* Actual Boarding Ticket Content Styling */}
            <div className="p-6 flex flex-col gap-5 bg-gradient-to-b from-[#141414] to-canvas">
              
              {/* Ticket ID barcode section */}
              <div className="flex items-center justify-between border-b border-dashed border-gridline pb-4">
                <div>
                  <span className="text-[9px] text-gray-500 uppercase font-mono">Registry Serial</span>
                  <p className="font-mono text-xs text-bone-white font-semibold">
                    {activeBoardingPass.ticketId}
                  </p>
                </div>
                <div className="text-right">
                  <span className="text-[9px] text-gray-500 uppercase font-mono text-right block">Authorized Guarantee Code</span>
                  <span className="font-mono text-[9px] bg-emerald-500/10 text-emerald-400 px-2 py-0.5 rounded border border-emerald-500/20 font-bold uppercase">
                    SUCCESS_PAR_OK
                  </span>
                </div>
              </div>

              {/* Boarding route codes */}
              <div className="flex justify-between items-center py-2">
                <div className="text-left">
                  <span className="font-mono text-xs text-gray-500 uppercase">Origin</span>
                  <h4 className="font-serif text-3xl font-bold text-bone-white leading-none mt-1">
                    {activeBoardingPass.origin}
                  </h4>
                  <span className="text-[11px] font-sans text-gray-400 mt-1 block">
                    {activeBoardingPass.originCity}
                  </span>
                </div>

                {/* Animated direction icon */}
                <div className="flex flex-col items-center gap-1 opacity-70">
                  <Plane className="w-4 h-4 text-vermilion transform rotate-90" />
                  <span className="font-mono text-[9px] text-gray-600 uppercase">Non-Stop</span>
                </div>

                <div className="text-right">
                  <span className="font-mono text-xs text-gray-500 uppercase">Destination</span>
                  <h4 className="font-serif text-3xl font-bold text-bone-white leading-none mt-1">
                    {activeBoardingPass.destination}
                  </h4>
                  <span className="text-[11px] font-sans text-gray-400 mt-1 block">
                    {activeBoardingPass.destinationCity}
                  </span>
                </div>
              </div>

              {/* Detail parameters ledger info */}
              <div className="grid grid-cols-3 gap-4 bg-base-dark p-3 rounded border border-gridline/60 text-xs text-center">
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase mb-1">Flight ID</span>
                  <strong className="font-mono text-bone-white text-xs">{activeBoardingPass.flightNo}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase mb-1">Boarding Hour</span>
                  <strong className="font-mono text-bone-white text-xs">{activeBoardingPass.boardingTime}</strong>
                </div>
                <div>
                  <span className="text-[10px] text-gray-500 block uppercase mb-1">Gate Assigned</span>
                  <strong className="font-mono text-vermilion text-xs">C-18</strong>
                </div>
              </div>

              {/* Fare Audit summary list */}
              <div className="pt-2 flex flex-col gap-1.5 text-xs">
                <div className="flex justify-between text-gray-400">
                  <span>Fare Method:</span>
                  <span className="font-mono font-medium text-bone-white text-[11px] uppercase">
                    {activeBoardingPass.method}
                  </span>
                </div>
                <div className="flex justify-between text-gray-400">
                  <span>Fare Charged:</span>
                  <strong className="font-mono text-bone-white text-xs">
                    ${activeBoardingPass.pricepaid} USD
                  </strong>
                </div>

                {activeBoardingPass.savings > 0 && (
                  <div className="flex justify-between text-emerald-400">
                    <span>Arrested Rate Savings Amount:</span>
                    <strong className="font-mono text-emerald-400 font-bold text-xs bg-emerald-500/10 px-2 py-0.5 rounded">
                      Saved ${activeBoardingPass.savings} USD
                    </strong>
                  </div>
                )}
              </div>

              {/* Barcode representation */}
              <div className="mt-4 pt-4 border-t border-gridline text-center flex flex-col items-center justify-center gap-1.5 opacity-60">
                <div className="flex gap-0.5 h-8 bg-bone-white/80 p-1 rounded max-w-xs w-full justify-center">
                  {/* Procedurally styled barcode bars */}
                  {[...Array(35)].map((_, idx) => {
                    const widthPct = Math.random() > 0.5 ? 'w-1.5' : 'w-0.5';
                    return <div key={idx} className={`bg-black h-full ${widthPct}`} />;
                  })}
                </div>
                <span className="font-mono text-[9px] text-gray-500 tracking-widest text-[9px] uppercase">
                  *TX-9988-BARCODE-VERIFIED-DISPATCH*
                </span>
              </div>

            </div>

            {/* Print action footer row */}
            <div className="bg-[#151515] p-4 border-t border-gridline flex items-center justify-between gap-3 text-xs">
              <p className="text-gray-500 font-sans">
                ✔ Boarding document synchronized securely with the Ledger database.
              </p>
              <div className="flex gap-2">
                <button
                  onClick={handlePrintBoardingPass}
                  className="bg-zinc-800 hover:bg-zinc-700 hover:text-white px-3 py-1.5 rounded transition-colors text-bone-white border border-gridline font-sans font-medium flex items-center gap-1"
                >
                  <Printer className="w-3.5 h-3.5 shrink-0" />
                  <span>Print Ticket</span>
                </button>
                <button
                  onClick={() => setActiveBoardingPass(null)}
                  className="bg-vermilion text-white hover:bg-vermilion/90 font-bold px-4 py-1.5 rounded transition-colors font-sans"
                >
                  Acknowledge
                </button>
              </div>
            </div>

          </div>
        </div>
      )}

    </div>
  );
}

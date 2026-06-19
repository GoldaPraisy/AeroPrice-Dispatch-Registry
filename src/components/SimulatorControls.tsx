import React from 'react';
import { Sliders, Zap, Sun, CloudLightning, ShieldAlert, Sparkles, TrendingUp } from 'lucide-react';
import { GlobalSimControl } from '../types';

interface SimulatorControlsProps {
  sim: GlobalSimControl;
  setSim: React.Dispatch<React.SetStateAction<GlobalSimControl>>;
  onTriggerRandomSearch: () => void;
  onSimulateSeatBooking: () => void;
}

export default function SimulatorControls({
  sim,
  setSim,
  onTriggerRandomSearch,
  onSimulateSeatBooking
}: SimulatorControlsProps) {

  const handleHolidayToggle = () => {
    setSim(prev => ({ ...prev, isHolidayPeak: !prev.isHolidayPeak }));
  };

  const handleDemandChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSim(prev => ({ 
      ...prev, 
      baseDemandSetting: e.target.value as GlobalSimControl['baseDemandSetting'] 
    }));
  };

  const handleDisruptionChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSim(prev => ({ 
      ...prev, 
      disruptionFactor: e.target.value as GlobalSimControl['disruptionFactor'] 
    }));
  };

  const handleFreqChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    setSim(prev => ({
      ...prev,
      updateFrequencySec: parseInt(e.target.value)
    }));
  };

  return (
    <div className="bg-base-dark rounded-lg border border-gridline p-4 flex flex-col gap-4 select-none">
      
      {/* Title */}
      <div className="flex items-center gap-2 border-b border-gridline pb-2">
        <Sliders className="w-4 h-4 text-vermilion" />
        <h3 className="font-serif text-sm font-medium text-bone-white">Dispatch Control Cabinet</h3>
      </div>

      {/* Holiday Toggle Switches */}
      <div className="flex items-center justify-between p-2 bg-canvas rounded border border-gridline">
        <div className="flex flex-col">
          <span className="font-sans text-xs text-bone-white font-medium flex items-center gap-1">
            Holiday / Peak Period
          </span>
          <span className="text-[10px] text-gray-500 font-sans">Applies flat +20% cost modifier</span>
        </div>
        <button
          onClick={handleHolidayToggle}
          className={`relative inline-flex h-5 w-10 shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 ease-in-out focus:outline-none ${
            sim.isHolidayPeak ? 'bg-vermilion' : 'bg-zinc-800'
          }`}
        >
          <span
            className={`pointer-events-none inline-block h-4 w-4 transform rounded-full bg-white shadow ring-0 transition duration-200 ease-in-out ${
              sim.isHolidayPeak ? 'translate-x-5' : 'translate-x-0'
            }`}
          />
        </button>
      </div>

      {/* Select base demand multiplier */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-gray-500 font-sans uppercase">Global Consumer Base Demand</label>
        <select
          value={sim.baseDemandSetting}
          onChange={handleDemandChange}
          className="w-full bg-canvas border border-gridline rounded px-3 py-1.5 text-xs text-bone-white focus:outline-none focus:border-vermilion font-sans"
        >
          <option value="low">Low Consumer Demand (-10% Pricing Discount)</option>
          <option value="standard">Standard Baseline Demand (No modification)</option>
          <option value="surge">Surge Search Traffic (+25% Price Elevation)</option>
          <option value="extreme">Extreme Capacity Strain (+50% Pricing Spike)</option>
        </select>
      </div>

      {/* Select Environmental Disruption */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-gray-500 font-sans uppercase">System Disruption Modifier</label>
        <select
          value={sim.disruptionFactor}
          onChange={handleDisruptionChange}
          className="w-full bg-canvas border border-gridline rounded px-3 py-1.5 text-xs text-bone-white focus:outline-none focus:border-vermilion font-sans"
        >
          <option value="none">Standard Weather &amp; Operations (No modifier)</option>
          <option value="weather_alert">Severe Winter blizzard alerts (+15% surcharge)</option>
          <option value="route_congestion">Airway &amp; Hub Terminal Queue Congestion (+8% surcharge)</option>
          <option value="fuel_surcharge">High Energy Fuel Index Surcharges (+22% surcharge)</option>
        </select>
      </div>

      {/* Tick updates frequencies */}
      <div className="flex flex-col gap-1.5">
        <label className="text-[11px] text-gray-500 font-sans uppercase">Auto Dynamic Tick Cycle</label>
        <select
          value={sim.updateFrequencySec}
          onChange={handleFreqChange}
          className="w-full bg-canvas border border-gridline rounded px-3 py-1.5 text-xs text-bone-white focus:outline-none focus:border-vermilion font-sans"
        >
          <option value={2}>Rapid (Every 2 seconds)</option>
          <option value={5}>Standard (Every 5 seconds)</option>
          <option value={10}>Staggered (Every 10 seconds)</option>
          <option value={30}>Sparse (Every 30 seconds)</option>
        </select>
      </div>

      {/* Manual Instant Triggers */}
      <div className="pt-3 border-t border-gridline flex flex-col gap-2">
        <span className="text-[10px] text-gray-500 font-sans uppercase">Simulation Sledgehammer Actions</span>
        
        <div className="grid grid-cols-2 gap-2">
          {/* Spike searches */}
          <button
            onClick={onTriggerRandomSearch}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-[#20100a] hover:bg-[#2c150c] text-[11px] text-vermilion rounded border border-vermilion/30 transition-all font-sans font-medium"
            title="Spikes searches on a random flight by 35 points"
          >
            <Zap className="w-3.5 h-3.5 fill-current shrink-0" />
            <span>Spike Queries</span>
          </button>

          {/* Book seat */}
          <button
            onClick={onSimulateSeatBooking}
            className="flex items-center justify-center gap-1 px-3 py-2 bg-zinc-950 hover:bg-zinc-900 text-[11px] text-bone-white rounded border border-gridline transition-all font-sans font-medium"
            title="Sells a physical seat ticket on the selected flight"
          >
            <Sparkles className="w-3.5 h-3.5 text-vermilion shrink-0 animate-pulse" />
            <span>Sell Ticket Seat</span>
          </button>
        </div>
      </div>

      <div className="mt-1 p-2 bg-canvas/40 border border-gridline rounded text-[10px] text-gray-400 font-sans leading-relaxed">
        <strong>Tip:</strong> Surcharges update across <strong>all routes simultaneously</strong>. Clicking "Sell Ticket Seat" lowers inventory, raising prices dynamically as standard yield curves calculate.
      </div>

    </div>
  );
}

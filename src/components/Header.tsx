import React, { useEffect, useState } from 'react';
import { Play, Pause, RefreshCw, Radio, ShieldAlert } from 'lucide-react';
import { GlobalSimControl } from '../types';

interface HeaderProps {
  sim: GlobalSimControl;
  setSim: React.Dispatch<React.SetStateAction<GlobalSimControl>>;
  isRunning: boolean;
  setIsRunning: (run: boolean) => void;
  triggerManualRefresh: () => void;
  avgDynamicPremium: number;
  totalActiveFreezes: number;
}

export default function Header({
  sim,
  setSim,
  isRunning,
  setIsRunning,
  triggerManualRefresh,
  avgDynamicPremium,
  totalActiveFreezes
}: HeaderProps) {
  const [utcTime, setUtcTime] = useState<string>('');
  const [liveLog, setLiveLog] = useState<string>('SYSTEM DISPATCH ONLINE: LISTENING FOR TRAFFIC...');

  // Live clock in JetBrains Mono matching standard flight terminals
  useEffect(() => {
    const updateTime = () => {
      const now = new Date();
      // Emulate premium tactical avionic clock with timezone and seconds
      setUtcTime(now.toLocaleString('en-US', {
        hour12: false,
        timeZoneName: 'short',
        hour: '2-digit',
        minute: '2-digit',
        second: '2-digit'
      }));
    };
    updateTime();
    const timer = setInterval(updateTime, 1000);
    return () => clearInterval(timer);
  }, []);

  // Set up random search activity log streams to animate the avionic terminal feel
  useEffect(() => {
    if (!isRunning) return;

    const botNames = ['BOT-AERO-08', 'BOT-SKY-44', 'SABRE-API-09', 'AMADEUS-TX', 'VANGUARD-BOT', 'ROUTING-DECK', 'KIWI-AGENT-23'];
    const actions = [
      'requested fare valuation',
      'queried seat availability',
      'triggered bulk capacity audit',
      'checked high-holiday premium forecast',
      'initiated routing fare optimization'
    ];
    const routes = ['JFK-LHR', 'CDG-DXB', 'HND-LAX', 'FRA-JFK', 'SIN-SYD', 'SYD-DFW'];

    const interval = setInterval(() => {
      const bot = botNames[Math.floor(Math.random() * botNames.length)];
      const action = actions[Math.floor(Math.random() * actions.length)];
      const route = routes[Math.floor(Math.random() * routes.length)];
      const delta = (Math.random() * 2 + 0.5).toFixed(1);
      
      setLiveLog(`[${bot}] ${action} for route ${route}. Demand Delta: +${delta}%`);
    }, 4500);

    return () => clearInterval(interval);
  }, [isRunning]);

  return (
    <header className="border-b border-gridline bg-base-dark py-4 px-6 flex flex-col md:flex-row items-stretch md:items-center justify-between gap-4 select-none">
      {/* Brand Title: Playfair Display paired with Inter Subtitles */}
      <div className="flex flex-col">
        <div className="flex items-center gap-2">
          <Radio className="w-5 h-5 text-vermilion animate-pulse" />
          <h1 className="font-serif text-2xl font-bold tracking-tight text-bone-white">
            AeroPrice <span className="italic font-normal text-vermilion/90">Dispatch Registry</span>
          </h1>
        </div>
        <p className="font-sans text-xs text-gray-500 uppercase tracking-widest mt-1">
          Tactical Aviation Dynamic Pricing &amp; Price Freeze Engine
        </p>
      </div>

      {/* Live Server Telemetry Log */}
      <div className="hidden lg:flex flex-1 max-w-sm xl:max-w-md mx-4 items-center gap-2 px-3 py-1.5 bg-canvas rounded border border-gridline">
        <span className="font-mono text-[10px] text-vermilion font-bold uppercase shrink-0">Live Log:</span>
        <div className="font-mono text-[11px] text-gray-400 truncate tracking-wide scroll-smooth transition-all duration-300">
          {liveLog}
        </div>
      </div>

      {/* Right Section containing Clock state counters and Simulation controls */}
      <div className="flex flex-wrap items-center gap-4">
        {/* Statistics Widgets */}
        <div className="flex items-center gap-3 bg-[#111111] p-1 rounded border border-gridline">
          <div className="px-2.5 py-1 text-center border-r border-gridline">
            <p className="font-sans text-[9px] text-gray-500 uppercase">Avg Premium</p>
            <p className="font-mono text-sm text-bone-white font-bold">
              {avgDynamicPremium >= 0 ? `+${avgDynamicPremium.toFixed(1)}%` : `${avgDynamicPremium.toFixed(1)}%`}
            </p>
          </div>
          <div className="px-2.5 py-1 text-center">
            <p className="font-sans text-[9px] text-gray-500 uppercase">Frozen Fares</p>
            <p className="font-mono text-sm text-vermilion font-bold">
              {totalActiveFreezes} active
            </p>
          </div>
        </div>

        {/* Live System Time */}
        <div className="hidden sm:flex flex-col items-end px-3 py-1 bg-canvas border border-gridline rounded">
          <span className="font-sans text-[9px] text-gray-500 uppercase">GTC Standard Dispatch Time</span>
          <span className="font-mono text-xs text-bone-white font-medium tabular-nums">{utcTime || '09:04:23 UTC'}</span>
        </div>

        {/* Control Button Actions */}
        <div className="flex items-center gap-2">
          <button
            onClick={() => setIsRunning(!isRunning)}
            className={`flex items-center gap-2 px-3 py-2 rounded text-xs tracking-wider uppercase font-sans font-medium transition-colors ${
              isRunning 
                ? 'bg-vermilion text-white hover:bg-vermilion/90' 
                : 'bg-zinc-800 text-bone-white hover:bg-zinc-700'
            }`}
            title={isRunning ? 'Pause Dynamic Pricing Realtime Engine' : 'Resume Engines'}
          >
            {isRunning ? (
              <>
                <Pause className="w-3.5 h-3.5 fill-current" />
                <span>Live Feed</span>
              </>
            ) : (
              <>
                <Play className="w-3.5 h-3.5 fill-current" />
                <span>Paused</span>
              </>
            )}
          </button>

          <button
            onClick={triggerManualRefresh}
            className="p-2 bg-zinc-900 border border-gridline rounded text-gray-400 hover:text-white hover:border-vermilion transition-all"
            title="Force Global Route Repricing Tick"
          >
            <RefreshCw className="w-4 h-4" />
          </button>
        </div>
      </div>
    </header>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ChevronDown } from 'lucide-react';
import { useIntel } from './IntelligenceProvider';

export function Header({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (id: string) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const intel = useIntel();

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const alerts = intel?.tickerAlerts || [
    "🚨 SYSTEM: Initializing threat network...",
    "⚠ SYNC: Menghubungkan ke node intelijen lokal"
  ];

  const menuItems = [
    { id: 'dashboard', label: 'Intel' },
    { id: 'radar', label: 'Radar' },
    { id: 'scanner', label: 'Scan' },
    { id: 'data', label: 'Shield' },
    { id: 'community', label: 'Threat Feed' },
  ];

  return (
    <header className={`sticky top-0 z-50 w-full flex flex-col transition-all duration-300 ${scrolled ? 'bg-[#0a0e13]/80 backdrop-blur-xl border-b border-neutral-800 shadow-[0_4px_30px_rgba(0,0,0,0.5)]' : 'bg-transparent'}`}>
      {/* Layer 1: Live Threat Ticker */}
      <div className={`w-full overflow-hidden flex items-center border-b border-neutral-800/50 bg-[#0A0E13]/60 transition-all duration-300 ${scrolled ? 'h-8 opacity-80' : 'h-10 opacity-100'}`}>
        <div className="flex items-center gap-2 shrink-0 px-4 md:px-6 z-20 border-r border-neutral-800/80 h-full bg-[#05070A]/50 glass">
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse shadow-[0_0_8px_rgba(182,255,59,0.8)]" />
          <span className="text-[9px] md:text-[10px] font-mono text-emerald-400 font-bold tracking-widest hidden sm:inline-block">LIVE THREAT FEED</span>
          <span className="text-[9px] md:text-[10px] font-mono text-emerald-400 font-bold tracking-widest sm:hidden">LIVE</span>
        </div>
        
        <div className="flex-1 overflow-hidden relative flex opacity-90">
          <motion.div 
            animate={{ x: [0, -2000] }} 
            transition={{ repeat: Infinity, duration: 40, ease: "linear" }}
            className="flex items-center gap-12 whitespace-nowrap pl-6"
          >
            {alerts.map((alert: string, i: number) => (
              <span key={`alert-1-${i}`} className="text-xs font-mono text-neutral-300 tracking-wide">{alert}</span>
            ))}
            {/* Duplicate for seamless loop */}
            {alerts.map((alert: string, i: number) => (
              <span key={`alert-2-${i}`} className="text-xs font-mono text-neutral-300 tracking-wide">{alert}</span>
            ))}
             {alerts.map((alert: string, i: number) => (
              <span key={`alert-3-${i}`} className="text-xs font-mono text-neutral-300 tracking-wide">{alert}</span>
            ))}
          </motion.div>
          {/* Gradient masks for smooth fade */}
          <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-[#0A0E13] to-transparent pointer-events-none" />
          <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-[#0A0E13] to-transparent pointer-events-none" />
        </div>

        <div className="items-center gap-2 shrink-0 px-4 md:px-6 z-20 border-l border-neutral-800/80 h-full bg-[#05070A]/50 hidden sm:flex">
          <span className="text-[9px] font-mono text-neutral-500 tracking-widest">THREAT NETWORK ONLINE</span>
          <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-[pulse_2s_ease-in-out_infinite]" />
        </div>
      </div>

      {/* Layer 2: Main Header Navbar */}
      <div className={`w-full px-4 md:px-6 lg:px-8 flex items-center justify-between transition-all duration-300 ${scrolled ? 'h-14' : 'h-16'}`}>
        
        {/* Left: Branding */}
        <div className="flex items-center gap-3 shrink-0">
          <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center relative overflow-hidden group hover:border-emerald-400 transition-colors cursor-pointer">
            <div className="absolute inset-0 bg-emerald-500/5 group-hover:bg-emerald-500/20 transition-colors" />
            <Shield className="w-4 h-4 text-emerald-400 relative z-10" />
          </div>
          <div className="flex flex-col">
            <div className="flex items-center gap-1.5">
              <span className="font-display font-medium text-lg tracking-tight text-white leading-none">VERIX</span>
              <span className="w-1 h-1 rounded-full bg-emerald-400" />
            </div>
            <span className="text-[9px] font-mono text-neutral-500 tracking-widest leading-none mt-1 hidden md:block">VERIFIKASI RISIKO DIGITAL</span>
          </div>
        </div>

        {/* Center: Navigation */}
        <nav className="hidden lg:flex items-center gap-1 absolute left-1/2 -translate-x-1/2 bg-neutral-900/30 border border-neutral-800/50 backdrop-blur-md rounded-full px-2 py-1.5">
          {menuItems.map(item => {
            const isActive = activeTab === item.id;
            return (
              <button
                key={item.id}
                onClick={() => setActiveTab(item.id)}
                className={`relative px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 ${
                  isActive ? 'text-white' : 'text-neutral-400 hover:text-neutral-200 hover:bg-neutral-800/50'
                }`}
              >
                {isActive && (
                  <motion.div
                    layoutId="headerActiveTab"
                    className="absolute inset-0 bg-neutral-800 rounded-full border border-neutral-700/50 shadow-[0_2px_10px_rgba(0,0,0,0.2)]"
                    initial={{ opacity: 0 }}
                    animate={{ opacity: 1 }}
                    transition={{ type: "spring", stiffness: 300, damping: 30 }}
                  />
                )}
                <span className="relative z-10 font-mono tracking-wide">{item.label}</span>
                {isActive && (
                   <motion.div 
                     layoutId="headerActiveTabGlow"
                     className="absolute bottom-0 left-1/2 -translate-x-1/2 w-4 h-0.5 bg-emerald-400 rounded-full shadow-[0_0_8px_rgba(16,185,129,0.8)] z-10" 
                   />
                )}
              </button>
            );
          })}
        </nav>

        {/* Right: CTA Area */}
        <div className="flex items-center gap-4 shrink-0">
          <div className="hidden sm:flex items-center gap-2 border-r border-neutral-800 pr-4 mr-1">
            <div className="w-6 h-6 rounded-md bg-neutral-800 flex items-center justify-center text-[9px] font-mono text-neutral-400 border border-neutral-700">ID</div>
            <span className="text-sm font-medium text-neutral-400">Guest User #8492</span>
          </div>
          <button 
            onClick={() => setActiveTab('scanner')} 
            className="group relative px-4 py-2 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-lg text-sm font-medium text-emerald-400 transition-all duration-300 flex items-center gap-2 overflow-hidden"
          >
            <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
            <span className="relative z-10">Mulai Analisis</span>
          </button>
        </div>

      </div>
    </header>
  );
}

'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Shield, ChevronDown, Menu, X, Sparkles } from 'lucide-react';
import { useIntel } from './IntelligenceProvider';
import { useAuth } from './FirebaseProvider';
import { useAICredits } from '@/hooks/use-ai-credits';
import { CreditTopUpModal } from './CreditTopUpModal';

export function Header({ activeTab, setActiveTab }: { activeTab: string, setActiveTab: (id: string) => void }) {
  const [scrolled, setScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const intel = useIntel();
  const { user, login } = useAuth();
  const { credits, isCreditLoading, topUpCredits } = useAICredits();

  const menuItems = [
    { id: 'dashboard', label: 'Dashboard', sub: 'System Overview' },
    { id: 'threatpulse', label: 'VERIX Pulse', sub: 'Live threat intelligence' },
    { id: 'scanner', label: 'Scanner', sub: 'AI Threat Analysis' },
    { id: 'settings', label: 'Settings', sub: 'Preferences & Data' },
  ];

  useEffect(() => {
    const handleScroll = () => setScrolled(window.scrollY > 20);
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const alerts = intel?.tickerAlerts || [
    "🚨 SYSTEM: Initializing threat intelligence network...",
    "⚠ SYNC: Connecting to local intelligence nodes"
  ];

  return (
    <>
      <header className={`sticky top-0 z-50 w-full flex flex-col transition-all duration-300 ${scrolled ? 'bg-neutral-950/80 backdrop-blur-xl border-b border-neutral-800 shadow-[0_4px_30px_rgba(0,0,0,0.5)]' : 'bg-transparent'}`}>
        {/* Layer 1: Live Threat Ticker */}
        <div className={`w-full overflow-hidden flex items-center border-b border-neutral-800/50 bg-neutral-950/60 transition-all duration-300 ${scrolled ? 'h-8 opacity-80' : 'h-10 opacity-100'}`}>
          <div className="flex items-center gap-2 shrink-0 px-4 md:px-6 z-20 border-r border-neutral-800/80 h-full bg-neutral-900/50 glass">
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
            <div className="absolute left-0 top-0 bottom-0 w-8 bg-gradient-to-r from-neutral-950 to-transparent pointer-events-none" />
            <div className="absolute right-0 top-0 bottom-0 w-8 bg-gradient-to-l from-neutral-950 to-transparent pointer-events-none" />
          </div>

          <div className="items-center gap-2 shrink-0 px-4 md:px-6 z-20 border-l border-neutral-800/80 h-full bg-neutral-900/50 hidden sm:flex">
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
              <span className="text-[9px] font-mono text-neutral-500 tracking-widest leading-none mt-1 hidden md:block">DIGITAL RISK VERIFICATION</span>
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
                  {/* Tooltip on Hover */}
                  <div className="absolute top-full left-1/2 -translate-x-1/2 mt-3 w-max opacity-0 invisible group-hover:opacity-100 group-hover:visible transition-all duration-200 z-50 pointer-events-none">
                    <div className="bg-[#111111] border border-neutral-800 text-neutral-400 text-[11px] px-3 py-1.5 rounded-md shadow-xl font-mono">
                      {item.sub}
                    </div>
                  </div>
                </button>
              );
            })}
          </nav>

          {/* Right: CTA Area */}
          <div className="flex items-center gap-4 shrink-0">
            {/* Credits indicator */}
            <div className="hidden lg:flex items-center gap-2">
              <div className="flex items-center gap-2 px-3 py-1.5 bg-emerald-500/10 border border-emerald-500/20 rounded-full shadow-[0_0_10px_rgba(16,185,129,0.1)]">
                 <Sparkles className="w-3.5 h-3.5 text-emerald-400" />
                 <span className="text-[11px] font-mono text-emerald-300 font-medium tracking-wide">
                   {isCreditLoading ? '... ' : credits}{' '}
                   <span className="text-emerald-500/70 hidden xl:inline">AI Credits</span>
                 </span>
                  <button 
                    onClick={() => setShowTopUpModal(true)} 
                    title="Top Up AI Credits" 
                    className="ml-1 px-1.5 py-0.5 bg-emerald-400 hover:bg-emerald-300 text-neutral-950 text-[9px] font-bold font-mono rounded transition-all active:scale-95 flex items-center justify-center cursor-pointer"
                  >
                    + TOP UP
                  </button>
              </div>
            </div>

            {/* Auth Area */}
            {user ? (
              <div className="hidden lg:flex items-center gap-3 bg-neutral-900 border border-neutral-800 rounded-xl px-4 py-2 hover:border-neutral-700 transition-colors">
                <div className="w-7 h-7 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-mono font-bold select-none shrink-0">
                  {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                </div>
                <div className="flex flex-col text-left">
                  <span className="text-xs font-semibold text-white leading-tight truncate max-w-[120px]">
                    {user.displayName || user.email?.split('@')[0]}
                  </span>
                  <span className="text-[9px] font-mono text-neutral-500 leading-none mt-0.5">
                    Premium User
                  </span>
                </div>
              </div>
            ) : (
              <button 
                onClick={() => login()} 
                className="group relative px-4 py-2 bg-white hover:bg-neutral-200 border border-transparent rounded-lg text-sm font-medium text-neutral-950 transition-all duration-300 hidden lg:flex items-center gap-2 overflow-hidden cursor-pointer"
              >
                <span className="relative z-10">Login</span>
              </button>
            )}

            {/* Mobile Hamburger */}
            <button
              onClick={() => setIsMobileMenuOpen(true)}
              className="w-10 h-10 rounded-lg bg-neutral-900/50 border border-neutral-800 flex items-center justify-center text-neutral-400 hover:text-white lg:hidden"
            >
              <Menu className="w-5 h-5" />
            </button>
          </div>
        </div>
      </header>

      {/* Layer 3: Mobile Sidebar Navigation */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 z-[60] bg-neutral-950/80 backdrop-blur-sm lg:hidden"
            />
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: "spring", damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 bottom-0 w-[280px] z-[70] bg-neutral-950 border-l border-neutral-800 shadow-2xl flex flex-col lg:hidden"
            >
              <div className="p-5 border-b border-neutral-800/50 flex items-center justify-between bg-neutral-900/30">
                 <div className="flex items-center gap-2">
                   <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/30 flex items-center justify-center relative overflow-hidden group">
                     <Shield className="w-4 h-4 text-emerald-400 relative z-10" />
                   </div>
                   <span className="font-display font-medium text-white tracking-tight">MENU</span>
                 </div>
                 <button
                   onClick={() => setIsMobileMenuOpen(false)}
                   className="w-8 h-8 flex items-center justify-center rounded-md bg-neutral-900/50 border border-neutral-800 text-neutral-400 hover:text-white transition-colors"
                 >
                   <X className="w-4 h-4" />
                 </button>
              </div>
              
              <div className="p-4 flex-1 overflow-y-auto flex flex-col gap-1.5 mt-2">
                {menuItems.map(item => {
                  const isActive = activeTab === item.id;
                  return (
                    <button
                      key={item.id}
                      onClick={() => { setActiveTab(item.id); setIsMobileMenuOpen(false); }}
                      className={`relative px-4 py-3.5 rounded-xl text-left transition-all duration-300 flex flex-col gap-0.5 group ${
                        isActive ? 'bg-emerald-500/10 border-emerald-500/30 border' : 'hover:bg-neutral-800/50 border border-transparent'
                      }`}
                    >
                      <span className={`font-mono tracking-wide relative z-10 text-sm font-medium ${isActive ? 'text-white' : 'text-neutral-300'}`}>{item.label}</span>
                      <span className="text-[10px] text-neutral-500 font-mono">{item.sub}</span>
                      {isActive && (
                        <div className="absolute left-0 top-1/2 -translate-y-1/2 w-1 h-1/2 bg-emerald-400 rounded-r-md shadow-[0_0_10px_rgba(16,185,129,0.8)]" />
                      )}
                    </button>
                  );
                })}
              </div>
              
              <div className="p-5 border-t border-neutral-800/50 bg-neutral-900/30 mb-safe flex flex-col gap-4">
                 {user && (
                   <div className="flex items-center gap-3">
                     <div className="w-8 h-8 rounded-full bg-emerald-500/20 text-emerald-400 border border-emerald-500/30 flex items-center justify-center text-xs font-mono font-bold select-none shrink-0">
                       {(user.displayName || user.email || 'U').charAt(0).toUpperCase()}
                     </div>
                     <div className="flex flex-col flex-1 overflow-hidden">
                       <span className="text-sm font-medium text-neutral-300 truncate">
                         {user.displayName || user.email?.split('@')[0]}
                       </span>
                       <span className="text-[10px] font-mono text-emerald-400 flex items-center gap-1.5">
                         <Sparkles className="w-3 h-3" /> {isCreditLoading ? '... ' : credits} AI Credits
                          <button 
                            onClick={() => setShowTopUpModal(true)} 
                            className="ml-1 px-1 py-0.5 bg-emerald-400 hover:bg-emerald-300 text-neutral-950 text-[8px] font-bold font-mono rounded cursor-pointer"
                          >
                            + TOP UP
                          </button>
                        </span>
                      </div>
                    </div>
                  )}
                  {!user && (
                    <div className="flex items-center justify-between">
                      <span className="text-[10px] font-mono text-neutral-500 tracking-wider">GUEST ACCESS</span>
                      <div className="flex items-center gap-1.5 px-2.5 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full">
                        <Sparkles className="w-3 h-3 text-emerald-400" />
                        <span className="text-[10px] font-mono text-emerald-300">
                          {isCreditLoading ? '... ' : credits} AI Credits
                        </span>
                        <button 
                          onClick={() => setShowTopUpModal(true)} 
                          className="ml-1 px-1 py-0.5 bg-emerald-400 hover:bg-emerald-300 text-neutral-950 text-[8px] font-bold font-mono rounded cursor-pointer"
                        >
                          + TOP UP
                        </button>
                     </div>
                   </div>
                 )}
                 {user ? (
                    <button 
                     onClick={() => {
                       setActiveTab('scanner');
                       setIsMobileMenuOpen(false);
                     }}
                     className="w-full relative px-4 py-3 bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 rounded-xl text-sm font-medium text-emerald-400 transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden shadow-[0_0_15px_rgba(16,185,129,0.1)]"
                   >
                     <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-transparent via-emerald-400/10 to-transparent -translate-x-full hover:animate-[shimmer_1.5s_infinite]" />
                     <span className="relative z-10 font-bold tracking-wide">Run Analysis</span>
                   </button>
                 ) : (
                    <button 
                     onClick={() => {
                       login();
                       setIsMobileMenuOpen(false);
                     }}
                     className="w-full relative px-4 py-3 bg-white hover:bg-neutral-200 border border-transparent rounded-xl text-sm font-medium text-neutral-950 transition-all duration-300 flex items-center justify-center gap-2 overflow-hidden"
                   >
                     <span className="relative z-10 font-bold tracking-wide">Login</span>
                   </button>
                 )}
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
      <CreditTopUpModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        user={user as Record<string, unknown> | null}
        topUpCredits={topUpCredits}
        credits={credits}
        onLogin={login}
      />
    </>
  );
}

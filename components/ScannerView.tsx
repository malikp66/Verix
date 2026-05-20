'use client';

import { motion } from 'motion/react';
import { ShieldAlert, Zap, UploadCloud, Search, CheckCircle2, AlertTriangle, Fingerprint, Crosshair, ArrowRight, Activity, Radar, Lock, ScanSearch } from 'lucide-react';
import { useState } from 'react';
import { LightRays } from './ui/light-rays';

export function ScannerView() {
  const [inputVal, setInputVal] = useState('');
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'results'>('idle');

  const handleScan = (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim()) return;
    setScanState('scanning');
    setTimeout(() => {
      setScanState('results');
    }, 2500);
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <div className="absolute inset-0 -z-10 opacity-70 pointer-events-none">
        <LightRays color="rgba(16, 185, 129, 0.15)" />
      </div>

      <div className="max-w-5xl mx-auto pt-24 pb-12 px-6">
        {scanState === 'idle' && (
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex flex-col items-center justify-center text-center mt-12"
          >
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-2xl mb-8 relative">
              <Crosshair className="w-8 h-8 text-emerald-400" />
              <div className="absolute inset-0 rounded-2xl border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]" />
            </div>
            
            <h1 className="text-5xl font-display font-medium text-white mb-4 tracking-tight">VERIX Intelligence Scanner</h1>
            <p className="text-lg text-neutral-400 mb-12 max-w-2xl">
              Paste URL, rekening bank, chat WhatsApp, atau upload file (Screenshot/APK). AI VERIX akan mendeteksi indikasi penipuan, phishing, dan manipulasi psikologis secara real-time.
            </p>

            <form onSubmit={handleScan} className="w-full max-w-3xl relative">
              <div className="relative group">
                 <div className="absolute inset-0 rounded-2xl bg-gradient-to-r from-emerald-500/20 to-cyan-500/20 blur-xl opacity-0 group-focus-within:opacity-100 transition-opacity duration-500" />
                 <div className="relative flex items-center bg-neutral-900 border border-neutral-800 rounded-2xl shadow-xl overflow-hidden focus-within:border-emerald-500/50 transition-colors">
                   <div className="pl-6 shrink-0 text-neutral-500">
                     <Search className="w-6 h-6" />
                   </div>
                   <input
                     type="text"
                     value={inputVal}
                     onChange={(e) => setInputVal(e.target.value)}
                     placeholder="Paste URL, text, or account number here..."
                     className="w-full bg-transparent text-white px-6 py-6 font-mono text-lg focus:outline-none placeholder:text-neutral-600"
                   />
                   <div className="pr-4 shrink-0 flex items-center gap-2">
                     <button type="button" className="p-3 text-neutral-400 hover:text-white bg-neutral-800 rounded-xl transition-colors">
                       <UploadCloud className="w-5 h-5" />
                     </button>
                     <button type="submit" className="bg-emerald-500 text-neutral-950 px-6 py-3 font-medium rounded-xl hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)]">
                       Analyze
                     </button>
                   </div>
                 </div>
              </div>
            </form>

            <div className="flex items-center gap-6 mt-12 text-sm text-neutral-500">
               <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500/70" /> URL Scan API</span>
               <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500/70" /> Deepfake Detection Engine</span>
               <span className="flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-500/70" /> Fraud Database Checked</span>
            </div>
          </motion.div>
        )}

        {scanState === 'scanning' && (
          <div className="flex flex-col items-center justify-center mt-32 text-center">
            <div className="w-24 h-24 relative mb-6">
              <svg className="w-full h-full animate-spin text-emerald-500" viewBox="0 0 100 100">
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="60 190" strokeLinecap="round" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center text-emerald-400">
                 <ScanSearch className="w-8 h-8 animate-pulse" />
              </div>
            </div>
            <h3 className="text-2xl font-mono text-emerald-400 mb-2">INTELLIGENCE SCAN ACTIVE</h3>
            <p className="text-neutral-500 font-mono text-sm max-w-sm">Cross-referencing global threat databases & running NLP psychological manipulation checks...</p>
          </div>
        )}

        {scanState === 'results' && (
           <motion.div 
             initial={{ opacity: 0, scale: 0.98 }}
             animate={{ opacity: 1, scale: 1 }}
             className="w-full max-w-4xl mx-auto"
           >
             <button onClick={() => { setScanState('idle'); setInputVal(''); }} className="text-sm font-medium text-neutral-500 hover:text-white mb-6 flex items-center gap-2 transition-colors">
               ← New Scan
             </button>
             
             <div className="flex items-start justify-between border-b border-neutral-800 pb-8 mb-8">
               <div>
                  <div className="flex items-center gap-3 mb-2">
                    <span className="bg-red-500/10 text-red-500 border border-red-500/20 px-3 py-1 rounded-full text-xs font-mono font-bold tracking-wider">HIGH THREAT DETECTED</span>
                    <span className="font-mono text-neutral-500 text-sm flex items-center gap-1"><Zap className="w-3 h-3" /> CONFIDENCE: 92%</span>
                  </div>
                  <h2 className="text-3xl font-display text-white mt-4">{inputVal || "https://bCA-festivaL-promo.com"}</h2>
               </div>
               <div className="text-right flex flex-col items-end">
                  <div className="w-16 h-16 rounded-xl bg-red-500/10 border border-red-500/30 flex items-center justify-center mb-2 shadow-[0_0_30px_rgba(239,68,68,0.2)]">
                     <AlertTriangle className="w-8 h-8 text-red-500" />
                  </div>
                  <span className="font-mono text-red-500 text-sm bg-red-500/10 px-2 py-0.5 rounded">Phishing Payload</span>
               </div>
             </div>

             <div className="grid md:grid-cols-2 gap-6">
                <div className="bg-neutral-900/50 border border-neutral-800 rounded-2xl p-6">
                   <h3 className="text-sm font-mono text-neutral-400 mb-6 flex items-center gap-2"><Activity className="w-4 h-4" /> ANALYSIS BREAKDOWN</h3>
                   
                   <div className="space-y-6">
                      <div className="relative pl-6 border-l-2 border-red-500/30">
                        <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-red-500 shadow-[0_0_10px_rgba(239,68,68,0.8)]" />
                        <h4 className="text-white font-medium mb-1">Lookalike Domain Setup</h4>
                        <p className="text-sm text-neutral-400">Domain is structured to mimic &apos;bca.co.id&apos; using typo-squatting techniques. Registered 2 days ago.</p>
                      </div>
                      <div className="relative pl-6 border-l-2 border-amber-500/30">
                        <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-amber-500" />
                        <h4 className="text-white font-medium mb-1">Suspicious Redirection</h4>
                        <p className="text-sm text-neutral-400">Contains hidden scripts to route traffic through 3 intermediary domains to bypass basic scanning.</p>
                      </div>
                      <div className="relative pl-6 border-l-2 border-red-500/30">
                        <div className="absolute left-[-5px] top-1 w-2 h-2 rounded-full bg-red-500" />
                        <h4 className="text-white font-medium mb-1">Credential Harvesting Input</h4>
                        <p className="text-sm text-neutral-400">Detects injected login forms designed to capture OTP and banking credentials directly.</p>
                      </div>
                   </div>
                </div>

                <div className="space-y-6">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 relative overflow-hidden">
                    <div className="absolute top-0 right-0 p-4 opacity-5">
                       <Fingerprint className="w-48 h-48" />
                    </div>
                    <h3 className="text-sm font-mono text-neutral-400 mb-4 flex items-center gap-2"><Lock className="w-4 h-4" /> ACTIONABLE RECOMMENDATION</h3>
                    <p className="text-red-500 font-medium text-lg leading-relaxed relative z-10 mb-4">
                      DO NOT interact with this link. DO NOT submit any credentials or OTP codes.
                    </p>
                    <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 z-10 relative">
                       <p className="text-sm text-neutral-400 font-mono mb-2 border-b border-neutral-800 pb-2">MITRE ATT&CK TACTICS</p>
                       <ul className="text-xs text-neutral-500 space-y-1 font-mono">
                         <li>TA0001 - Initial Access (Phishing)</li>
                         <li>TA0006 - Credential Access</li>
                       </ul>
                    </div>
                  </div>
                  
                  <div className="bg-gradient-to-br from-emerald-950 to-neutral-900 border border-emerald-900/50 rounded-2xl p-6 flex flex-col justify-between">
                     <p className="text-sm text-emerald-400/80 font-mono mb-1">AI INSIGHT</p>
                     <p className="text-emerald-100/90 leading-relaxed text-sm">
                       This is part of an ongoing campaign targeting Indonesian banking customers via WhatsApp. Similar domains have been flagged by the community 14 times in the past 24 hours.
                     </p>
                  </div>
                </div>
             </div>

           </motion.div>
        )}
      </div>
    </div>
  );
}

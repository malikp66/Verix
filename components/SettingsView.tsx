'use client';

import { useState } from 'react';
import { Shield, Cpu, Database, ChevronRight, Check } from 'lucide-react';

export function SettingsView() {
  const [securityMode, setSecurityMode] = useState<'conservative' | 'balanced' | 'aggressive'>('balanced');
  const [aiExplain, setAiExplain] = useState(true);
  const [aiModel, setAiModel] = useState(true);

  return (
    <div className="flex-1 w-full flex flex-col bg-[#0A0A0A] text-white overflow-y-auto">
      <div className="px-8 pt-12 pb-8 max-w-3xl mx-auto w-full">
        <div className="mb-12">
          <h1 className="text-4xl md:text-5xl font-display font-medium tracking-tight text-white mb-4">
            Preferences
          </h1>
          <p className="text-neutral-400 text-lg">
            Control how VERIX analyzes threats and manages your data.
          </p>
        </div>

        <div className="flex flex-col gap-12">
          
          {/* Security Mode */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center gap-3 text-white">
              <Shield className="w-5 h-5 text-emerald-400" />
              <h2 className="text-xl font-display font-medium">Security Mode</h2>
            </div>
            
            <div className="flex flex-col bg-[#111111] border border-neutral-800 rounded-2xl overflow-hidden">
              <button 
                onClick={() => setSecurityMode('conservative')}
                className="flex items-center justify-between p-5 hover:bg-[#151515] transition-colors border-b border-neutral-800"
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="font-medium text-white">Conservative</span>
                  <span className="text-sm text-neutral-400">Only flags known, verified threats. Zero false positives.</span>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${securityMode === 'conservative' ? 'border-emerald-500 bg-emerald-500/20' : 'border-neutral-600'}`}>
                  {securityMode === 'conservative' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                </div>
              </button>
              
              <button 
                onClick={() => setSecurityMode('balanced')}
                className="flex items-center justify-between p-5 hover:bg-[#151515] transition-colors border-b border-neutral-800 bg-[#151515]/50"
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="font-medium text-white flex items-center gap-2">Balanced <span className="px-2 py-0.5 rounded text-[10px] bg-white/10 font-mono">RECOMMENDED</span></span>
                  <span className="text-sm text-neutral-400">Uses AI heuristics alongside deterministic rules.</span>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${securityMode === 'balanced' ? 'border-emerald-500 bg-emerald-500/20' : 'border-neutral-600'}`}>
                  {securityMode === 'balanced' && <div className="w-2.5 h-2.5 rounded-full bg-emerald-500" />}
                </div>
              </button>
              
              <button 
                onClick={() => setSecurityMode('aggressive')}
                className="flex items-center justify-between p-5 hover:bg-[#151515] transition-colors"
              >
                <div className="flex flex-col items-start gap-1">
                  <span className="font-medium text-white">Aggressive</span>
                  <span className="text-sm text-neutral-400">Flags any suspicious pattern. May cause false positives.</span>
                </div>
                <div className={`w-5 h-5 rounded-full border flex items-center justify-center transition-colors ${securityMode === 'aggressive' ? 'border-rose-500 bg-rose-500/20' : 'border-neutral-600'}`}>
                  {securityMode === 'aggressive' && <div className="w-2.5 h-2.5 rounded-full bg-rose-500" />}
                </div>
              </button>
            </div>
          </section>

          {/* AI Settings */}
          <section className="flex flex-col gap-6">
            <div className="flex items-center gap-3 text-white">
              <Cpu className="w-5 h-5 text-cyan-400" />
              <h2 className="text-xl font-display font-medium">AI Intelligence</h2>
            </div>
            
            <div className="flex flex-col bg-[#111111] border border-neutral-800 rounded-2xl overflow-hidden">
              <div className="flex items-center justify-between p-5 border-b border-neutral-800">
                <div className="flex flex-col items-start gap-1">
                  <span className="font-medium text-white">Show AI Explanation</span>
                  <span className="text-sm text-neutral-400">Generate human-readable insights for scanned threats.</span>
                </div>
                <button 
                  onClick={() => setAiExplain(!aiExplain)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${aiExplain ? 'bg-cyan-500' : 'bg-neutral-700'}`}
                >
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${aiExplain ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>

              <div className="flex items-center justify-between p-5">
                <div className="flex flex-col items-start gap-1">
                  <span className="font-medium text-white">Show Model Info</span>
                  <span className="text-sm text-neutral-400">Display which LLM model generated the response.</span>
                </div>
                <button 
                  onClick={() => setAiModel(!aiModel)}
                  className={`w-11 h-6 rounded-full transition-colors relative ${aiModel ? 'bg-cyan-500' : 'bg-neutral-700'}`}
                >
                  <div className={`absolute top-1 left-1 bg-white w-4 h-4 rounded-full transition-transform shadow-sm ${aiModel ? 'translate-x-5' : 'translate-x-0'}`} />
                </button>
              </div>
            </div>
          </section>

          {/* Data */}
          <section className="flex flex-col gap-6 mb-20">
            <div className="flex items-center gap-3 text-white">
              <Database className="w-5 h-5 text-neutral-300" />
              <h2 className="text-xl font-display font-medium">Data Management</h2>
            </div>
            
            <div className="flex flex-col bg-[#111111] border border-neutral-800 rounded-2xl overflow-hidden">
              <button className="flex items-center justify-between p-5 hover:bg-[#151515] transition-colors border-b border-neutral-800 group">
                <div className="flex flex-col items-start gap-1">
                  <span className="font-medium text-white">Export Scan History</span>
                  <span className="text-sm text-neutral-400">Download all your reports as a CSV file.</span>
                </div>
                <ChevronRight className="w-5 h-5 text-neutral-600 group-hover:text-white transition-colors" />
              </button>
              
              <button className="flex items-center justify-between p-5 hover:bg-rose-500/5 transition-colors group">
                <div className="flex flex-col items-start gap-1">
                  <span className="font-medium text-rose-500">Clear All Data</span>
                  <span className="text-sm text-rose-500/60">Permanently delete your scan history.</span>
                </div>
                <ChevronRight className="w-5 h-5 text-rose-500/50 group-hover:text-rose-500 transition-colors" />
              </button>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}

'use client';

import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, Zap, UploadCloud, Search, CheckCircle2, 
  AlertTriangle, Crosshair, ArrowRight, Activity, Radar, 
  Lock, ScanSearch, Terminal, Database, Brain, Network 
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { LightRays } from './ui/light-rays';

type ScanResult = {
  severity_score: number;
  risk_level: string;
  manipulation_tactics: string[];
  red_flags: string[];
  behavioral_analysis: string;
  recommended_actions: string[];
  similar_pattern: string;
};

const SCAN_STEPS = [
  "Initializing VERIX Threat Engine...",
  "Extracting visual & text artifacts (OCR)...",
  "Targeting psychological manipulation vectors...",
  "Cross-referencing global threat databases...",
  "Running behavioral intent inference...",
  "Synthesizing Explainable AI profile..."
];

export function ScannerView() {
  const [inputVal, setInputVal] = useState('');
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'results' | 'error'>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cinematic text cycling
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (scanState === 'scanning') {
      interval = setInterval(() => {
        setScanStepIndex((prev) => (prev < SCAN_STEPS.length - 1 ? prev + 1 : prev));
      }, 800);
    }
    return () => clearInterval(interval);
  }, [scanState]);

  const convertFileToBase64 = (file: File): Promise<string> => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(reader.result as string);
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      const base64 = await convertFileToBase64(file);
      setSelectedImage(base64);
      setScanState('idle'); // Ensure we remain idle so user can click Analyze
    }
  };

  const handleScan = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputVal.trim() && !selectedImage) return;
    
    setScanStepIndex(0);
    setScanState('scanning');
    setErrorMessage('');
    
    try {
      const payload: any = { text: inputVal };
      if (selectedImage) {
         // Format base64 for Gemini (needs inlineData)
         const base64Data = selectedImage.split(',')[1];
         const mimeType = selectedImage.substring(selectedImage.indexOf(":")+1, selectedImage.indexOf(";"));
         payload.image = {
           inlineData: {
             data: base64Data,
             mimeType: mimeType
           }
         };
      }

      const res = await fetch('/api/analyze', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(payload)
      });
      
      const data = await res.json();
      if (!res.ok) throw new Error(data.error || 'Failed to analyze');
      
      setScanResult(data);
      // add a small cinematic delay at the end
      setTimeout(() => {
          setScanState('results');
      }, 500);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error running VERIX engine.');
      setScanState('error');
    }
  };

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-200">
      <div className="absolute inset-0 -z-10 opacity-70 pointer-events-none">
        <LightRays color="rgba(16, 185, 129, 0.15)" />
      </div>

      <div className="max-w-6xl mx-auto pt-24 pb-12 px-6">
        <AnimatePresence mode="wait">
        
        {scanState === 'idle' && (
          <motion.div 
            key="idle"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            className="flex flex-col items-center justify-center text-center mt-6"
          >
            <div className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-2xl mb-8 relative">
              <Crosshair className="w-8 h-8 text-emerald-400" />
              <div className="absolute inset-0 rounded-2xl border border-emerald-500/20 shadow-[0_0_30px_rgba(16,185,129,0.2)]" />
            </div>
            
            <h1 className="text-5xl md:text-6xl font-display font-medium text-white mb-4 tracking-tight leading-tight">
              Ancaman Digital <br className="hidden md:block"/>Kini Terlihat Meyakinkan.
            </h1>
            <p className="text-lg text-neutral-400 mb-10 max-w-2xl">
              VERIX adalah sistem intelijen yang membedah narasi penipuan. Paste text, peringatan SMS, link, atau upload screenshot WhatsApp untuk mengungkap taktik manipulasinya.
            </p>

            <form onSubmit={handleScan} className="w-full max-w-3xl relative">
              <div className="relative group rounded-2xl bg-neutral-900/80 border border-neutral-800 backdrop-blur-md shadow-2xl overflow-hidden focus-within:border-emerald-500/50 transition-colors">
                 
                 {/* Image preview area if selected */}
                 {selectedImage && (
                    <div className="w-full p-4 border-b border-neutral-800 relative bg-neutral-950/50">
                        <button 
                          type="button" 
                          onClick={() => setSelectedImage(null)}
                          className="absolute top-6 right-6 bg-neutral-900 border border-neutral-700 w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white"
                        >
                          ✕
                        </button>
                        <p className="text-xs font-mono text-emerald-400 mb-2">ATTACHED ARTIFACT</p>
                        <div className="h-32 w-full overflow-hidden rounded-lg flex items-center justify-center">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={selectedImage} alt="Scam artifact" className="max-h-full object-contain" />
                        </div>
                    </div>
                 )}

                 <div className="relative flex min-h-[4rem] items-center">
                   <div className="pl-6 shrink-0 text-neutral-500 hidden sm:block">
                     <Search className="w-6 h-6" />
                   </div>
                   <input
                     type="text"
                     value={inputVal}
                     onChange={(e) => setInputVal(e.target.value)}
                     placeholder="Tulis pesan text, APK info, atau tempel URL..."
                     className="w-full bg-transparent text-white px-4 sm:px-6 py-5 font-mono text-sm sm:text-base focus:outline-none placeholder:text-neutral-600 focus:ring-0"
                   />
                   
                   <input 
                     type="file" 
                     ref={fileInputRef}
                     accept="image/*"
                     className="hidden"
                     onChange={handleFileChange}
                   />

                   <div className="pr-4 shrink-0 flex items-center gap-2">
                     <button 
                       type="button" 
                       onClick={() => fileInputRef.current?.click()}
                       title="Upload Bukti Screenshot"
                       className="p-3 text-neutral-400 hover:text-emerald-400 bg-neutral-800/80 rounded-xl transition-colors shrink-0"
                     >
                       <UploadCloud className="w-5 h-5" />
                     </button>
                     <button 
                       type="submit" 
                       disabled={!inputVal.trim() && !selectedImage}
                       className="bg-emerald-500 text-neutral-950 px-6 py-3 font-medium rounded-xl hover:bg-emerald-400 transition-colors shadow-[0_0_20px_rgba(16,185,129,0.3)] disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                     >
                       <span className="hidden sm:inline">Analisis</span>
                       <Zap className="w-4 h-4 sm:hidden" />
                     </button>
                   </div>
                 </div>
              </div>
            </form>

            <div className="flex flex-wrap items-center justify-center gap-6 mt-12 text-sm text-neutral-500">
               <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500/70" /> AI Behavioral Analysis</span>
               <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500/70" /> Visual Artifact Sandbox</span>
               <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500/70" /> Live Threat Profiling</span>
            </div>
          </motion.div>
        )}

        {scanState === 'scanning' && (
          <motion.div 
             key="scanning"
             initial={{ opacity: 0 }}
             animate={{ opacity: 1 }}
             exit={{ opacity: 0, filter: 'blur(10px)' }}
             className="flex flex-col items-center justify-center mt-24 text-center min-h-[40vh]"
          >
            {/* Radar / Loading Visualization */}
            <div className="w-32 h-32 relative mb-12 flex items-center justify-center">
              <div className="absolute inset-0 border border-emerald-500/20 rounded-full animate-ping opacity-20" style={{ animationDuration: '2s' }} />
              <div className="absolute inset-4 border border-emerald-500/40 rounded-full animate-ping opacity-20" style={{ animationDuration: '2.5s' }} />
              <svg className="w-full h-full animate-spin text-emerald-500/80 drop-shadow-[0_0_15px_rgba(16,185,129,0.5)]" viewBox="0 0 100 100" style={{ animationDuration: '4s' }}>
                <circle cx="50" cy="50" r="48" fill="none" stroke="currentColor" strokeWidth="1" strokeDasharray="80 200" strokeLinecap="round" />
                <circle cx="50" cy="50" r="40" fill="none" stroke="currentColor" strokeWidth="2" strokeDasharray="60 190" strokeLinecap="round" opacity="0.5" />
              </svg>
              <div className="absolute inset-0 flex items-center justify-center">
                 <ShieldAlert className="w-10 h-10 text-emerald-400 animate-pulse" />
              </div>
            </div>

            {/* Terminal output feel */}
            <div className="bg-neutral-900 border border-neutral-800 rounded-xl p-6 w-full max-w-md text-left shadow-2xl relative overflow-hidden">
                <div className="absolute top-0 left-0 w-full h-1 bg-gradient-to-r from-emerald-500 to-transparent" />
                <div className="flex items-center gap-3 mb-4 text-emerald-400 font-mono text-sm border-b border-neutral-800 pb-3">
                   <Terminal className="w-4 h-4" />
                   <span>VERIX.INTELLIGENCE.NODE</span>
                </div>
                
                <div className="space-y-3 font-mono text-sm h-32 flex flex-col justify-end">
                    {SCAN_STEPS.slice(0, scanStepIndex + 1).map((step, idx) => (
                        <motion.div 
                          initial={{ opacity: 0, x: -10 }}
                          animate={{ opacity: 1, x: 0 }}
                          key={idx} 
                          className={`${idx === scanStepIndex ? 'text-emerald-300' : 'text-neutral-500'} flex items-start gap-2`}
                        >
                            <span className="shrink-0">{">"}</span> 
                            <span>{step}</span>
                        </motion.div>
                    ))}
                    {scanStepIndex < SCAN_STEPS.length && (
                        <div className="w-2 h-4 bg-emerald-500 animate-pulse mt-1 ml-4" />
                    )}
                </div>
            </div>
          </motion.div>
        )}

        {scanState === 'error' && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex flex-col items-center mt-32 text-center">
             <AlertTriangle className="w-16 h-16 text-red-500 mb-6" />
             <h3 className="text-2xl font-display text-white mb-2">Analysis Failed</h3>
             <p className="text-neutral-400 font-mono text-sm max-w-md bg-red-500/10 p-4 rounded-xl border border-red-500/20">{errorMessage}</p>
             <button onClick={() => setScanState('idle')} className="mt-8 px-6 py-3 bg-neutral-800 hover:bg-neutral-700 rounded-xl font-medium transition-colors">
                ← Kembali
             </button>
          </motion.div>
        )}

        {scanState === 'results' && scanResult && (
           <motion.div 
             key="results"
             initial={{ opacity: 0, scale: 0.98, y: 20 }}
             animate={{ opacity: 1, scale: 1, y: 0 }}
             className="w-full max-w-6xl mx-auto"
           >
             <div className="flex items-center justify-between mb-8">
               <button onClick={() => { setScanState('idle'); setInputVal(''); setSelectedImage(null); }} className="text-sm font-medium text-neutral-500 hover:text-white flex items-center gap-2 transition-colors">
                 ← Analisis Ulang
               </button>
               <div className="flex gap-2">
                 <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-mono text-emerald-400">
                    <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> Live Analysis
                 </div>
               </div>
             </div>
             
             {/* Main Bento Layout */}
             <div className="grid lg:grid-cols-[1fr_400px] gap-6">
                
                {/* Column 1: Explainable AI & Input */}
                <div className="space-y-6">
                   {/* Main Insight Box */}
                   <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 relative overflow-hidden group">
                      <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                         <Brain className="w-48 h-48" />
                      </div>
                      
                      <div className="flex items-center gap-3 mb-6 relative z-10">
                        <span className="w-8 h-8 flex items-center justify-center bg-cyan-500/10 text-cyan-400 rounded-lg border border-cyan-500/20">
                          <Activity className="w-4 h-4" />
                        </span>
                        <h3 className="text-lg font-display text-white">AI Threat Explanation</h3>
                      </div>
                      
                      <p className="text-xl md:text-2xl font-light leading-relaxed text-neutral-200 relative z-10">
                        {scanResult.behavioral_analysis}
                      </p>

                      <div className="mt-8 flex flex-col sm:flex-row sm:items-center gap-4 border-t border-neutral-800/50 pt-6">
                         <p className="text-sm font-mono text-neutral-500 shrink-0">PATTERN MATCH</p>
                         <div className="flex items-center gap-2 bg-neutral-950 px-4 py-2 rounded-xl border border-neutral-800 w-full">
                           <Network className="w-4 h-4 text-cyan-500" />
                           <span className="text-sm text-cyan-100/80">{scanResult.similar_pattern}</span>
                         </div>
                      </div>
                   </div>

                   {/* Source Artifact / User Input */}
                   <div className="bg-neutral-900/50 border border-neutral-800 rounded-3xl p-6">
                      <h3 className="text-sm font-mono text-neutral-500 mb-4 border-b border-neutral-800/50 pb-4">TARGET ARTIFACT</h3>
                      {selectedImage ? (
                         <div className="rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 flex justify-center items-center h-64 relative group">
                            {/* eslint-disable-next-line @next/next/no-img-element */}
                            <img src={selectedImage} alt="Scam Evidence" className="max-h-full object-contain filter group-hover:brightness-50 transition-all" />
                            <div className="absolute inset-0 pointer-events-none border-[3px] border-dashed border-emerald-500/30 rounded-xl" />
                         </div>
                      ) : (
                        <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 font-mono text-sm text-neutral-400 break-words">
                          {inputVal}
                        </div>
                      )}
                   </div>
                </div>

                {/* Column 2: Threat Dashboard */}
                <div className="space-y-6">
                   {/* Severity Score */}
                   <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                      <div className={`absolute top-0 w-full h-1 ${scanResult.severity_score >= 80 ? 'bg-red-500 shadow-red-500' : scanResult.severity_score >= 50 ? 'bg-amber-500 shadow-amber-500' : 'bg-emerald-500 shadow-emerald-500'} shadow-[0_0_20px_var(--tw-shadow-color)]`} />
                      
                      <p className="text-sm font-mono text-neutral-500 mb-6">INTELLIGENCE SCORE</p>
                      
                      {/* Ring Meter */}
                      <div className="relative w-40 h-40 flex items-center justify-center mb-4">
                        <svg className="absolute inset-0 w-full h-full transform -rotate-90" viewBox="0 0 100 100">
                          <circle cx="50" cy="50" r="45" fill="none" stroke="#262626" strokeWidth="8" />
                          <motion.circle 
                            initial={{ strokeDasharray: "0 283" }}
                            animate={{ strokeDasharray: `${(scanResult.severity_score / 100) * 283} 283` }}
                            transition={{ duration: 1.5, ease: "easeOut" }}
                            cx="50" cy="50" r="45" fill="none" 
                            stroke={scanResult.severity_score >= 80 ? "#ef4444" : scanResult.severity_score >= 50 ? "#f59e0b" : "#10b981"} 
                            strokeWidth="8" strokeLinecap="round" 
                          />
                        </svg>
                        <div className="flex flex-col items-center">
                           <span className="text-5xl font-display font-medium text-white tracking-tighter">
                             {scanResult.severity_score}
                           </span>
                           <span className="text-xs font-mono font-bold mt-1" style={{ color: scanResult.severity_score >= 80 ? "#ef4444" : scanResult.severity_score >= 50 ? "#f59e0b" : "#10b981" }}>
                             / 100
                           </span>
                        </div>
                      </div>

                      <div className={`mt-2 px-4 py-1.5 rounded-full text-xs font-mono font-bold tracking-widest uppercase border ${
                         scanResult.severity_score >= 80 ? "bg-red-500/10 text-red-400 border-red-500/20" : 
                         scanResult.severity_score >= 50 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
                         "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                      }`}>
                         {scanResult.risk_level} THREAT
                      </div>
                   </div>

                   {/* Taktik Manipulasi */}
                   <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6">
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-mono text-neutral-500 flex items-center gap-2"><Radar className="w-4 h-4" /> VECTORS</h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {scanResult.manipulation_tactics.map((tactic, idx) => (
                           <span key={idx} className="bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs font-mono text-neutral-300 flex items-center gap-2">
                             <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                             {tactic}
                           </span>
                        ))}
                      </div>
                      
                      <div className="mt-6 pt-6 border-t border-neutral-800">
                         <h3 className="text-sm font-mono text-neutral-500 mb-3 flex items-center gap-2"><Crosshair className="w-4 h-4" /> RED FLAGS</h3>
                         <ul className="space-y-2">
                           {scanResult.red_flags.map((flag, idx) => (
                              <li key={idx} className="text-sm text-red-400/90 flex items-start gap-2">
                                <span className="text-red-500 mt-0.5 shrink-0">✗</span> {flag}
                              </li>
                           ))}
                         </ul>
                      </div>
                   </div>

                   {/* Rekomendasi */}
                   <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-3xl p-6">
                      <h3 className="text-sm font-mono text-emerald-500/70 mb-4 flex items-center gap-2"><Lock className="w-4 h-4" /> ACTION PROTOCOL</h3>
                      <ul className="space-y-3">
                         {scanResult.recommended_actions.map((action, idx) => (
                            <li key={idx} className="text-sm text-emerald-100/90 flex items-start gap-3 bg-emerald-900/10 p-3 rounded-xl border border-emerald-500/10">
                              <span className="w-5 h-5 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center shrink-0 text-xs font-bold border border-emerald-500/30">
                                {idx + 1}
                              </span> 
                              <span className="leading-tight pt-0.5">{action}</span>
                            </li>
                         ))}
                      </ul>
                   </div>

                </div>
             </div>

           </motion.div>
        )}
        </AnimatePresence>
      </div>
    </div>
  );
}

'use client';

import { motion, AnimatePresence } from 'motion/react';
import { 
  ShieldAlert, Zap, UploadCloud, Search, CheckCircle2, 
  AlertTriangle, Crosshair, ArrowRight, Activity, Radar, 
  Lock, ScanSearch, Terminal, Database, Brain, Network, ChevronDown, Sparkles
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { LightRays } from './ui/light-rays';
import { useAICredits } from '@/hooks/use-ai-credits';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';

type ScanResult = {
  severity_score: number;
  risk_level: string;
  manipulation_tactics: string[];
  red_flags: string[];
  behavioral_analysis: string;
  recommended_actions: string[];
  similar_pattern?: string;
  similar_patterns?: string[];
  external_intelligence?: {
    virustotal?: string;
    safe_browsing?: string;
    urlscan?: string;
  };
  virustotal_raw?: {
    suspicious_votes: number;
    malicious_votes: number;
    total_engines: number;
    status: string;
    http_code?: number;
    content_type?: string;
    tags?: string[];
    last_analysis_date?: number;
  };
};

const SCAN_STEPS = [
  "Initializing VERIX Threat Engine...",
  "Extracting visual & text artifacts (OCR)...",
  "Targeting psychological manipulation vectors...",
  "Cross-referencing global threat databases...",
  "Running behavioral intent inference...",
  "Synthesizing Explainable AI profile..."
];

function AILockOverlay({ onTopUp }: { onTopUp: () => void }) {
  return (
    <div className="absolute inset-0 bg-neutral-950/75 backdrop-blur-md z-20 flex flex-col items-center justify-center text-center p-6 border border-neutral-800 rounded-[24px] animate-in fade-in duration-300">
      <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mb-4 relative shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-[pulse_2s_infinite]">
        <Lock className="w-5 h-5 text-amber-400" />
      </div>
      <h4 className="text-base font-display font-medium text-white mb-2">AI Analysis Locked</h4>
      <p className="text-xs text-neutral-400 max-w-[260px] mb-5 leading-relaxed font-sans">
        AI Credits kamu sudah habis. Top up untuk membuka narrative explanation, manipulation tactics, red flags, dan action protocol.
      </p>
      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onTopUp();
        }}
        className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs font-bold font-mono rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95 flex items-center gap-2 cursor-pointer relative z-30"
      >
        <Sparkles className="w-3.5 h-3.5" /> TOP UP CREDITS
      </button>
    </div>
  );
}

function ScanHistorySection() {
  const [expandedId, setExpandedId] = useState<number | null>(null);

  const mockReports = [
    { id: 1, url: 'bca-login-secure.xyz', risk: 'HIGH', score: 72, date: 'May 21', type: 'Phishing BCA', reasons: ['Impersonasi Merek BCA', 'TLD Mencurigakan (.xyz)'] },
    { id: 2, url: 's.id/resi-paket.apk', risk: 'CRITICAL', score: 85, date: 'May 21', type: 'APK Malware', reasons: ['Unduhan file APK', 'Pemendek URL (s.id)'] },
    { id: 3, url: 'tokopedia.com', risk: 'SAFE', score: 0, date: 'May 21', type: 'Safe Domain', reasons: ['Domain resmi Tokopedia', 'Enkripsi HTTPS valid'] },
    { id: 4, url: 'wa-security-protect.com', risk: 'MEDIUM', score: 40, date: 'May 20', type: 'WA Takeover', reasons: ['Impersonasi Merek WhatsApp'] },
  ];

  return (
    <div className="w-full mt-32 border-t border-neutral-900/50 pt-16 mb-20">
      <div className="flex flex-col mb-10">
        <div className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1 mb-4 w-fit">
          <span className="text-[10px] font-mono text-cyan-400 tracking-wider">HISTORICAL THREAT INTELLIGENCE</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-medium tracking-tight text-white mb-2">Scan History</h2>
        <p className="text-neutral-400 text-sm md:text-base">Semua ancaman yang telah dianalisis beserta risk profile-nya.</p>
      </div>

      <div className="flex flex-col gap-3">
        {mockReports.map((report) => {
          const isExpanded = expandedId === report.id;
          const colorClass = 
            report.risk === 'CRITICAL' ? 'text-rose-400 border-rose-500/20 bg-rose-500/5 hover:border-rose-500/50 hover:shadow-[0_0_20px_rgba(244,63,94,0.1)]' : 
            report.risk === 'HIGH' ? 'text-orange-400 border-orange-500/20 bg-orange-500/5 hover:border-orange-500/50 hover:shadow-[0_0_20px_rgba(249,115,22,0.1)]' : 
            report.risk === 'MEDIUM' ? 'text-yellow-400 border-yellow-500/20 bg-yellow-500/5 hover:border-yellow-500/50 hover:shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 
            'text-neutral-400 border-neutral-800 bg-[#0c0c0c] hover:border-neutral-700 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]';

          return (
            <div key={report.id} className="flex flex-col">
              <button 
                onClick={() => setExpandedId(isExpanded ? null : report.id)}
                className={`w-full group relative flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${colorClass} ${isExpanded ? 'rounded-b-none border-b-transparent' : ''}`}
              >
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4 w-48 md:w-64 shrink-0">
                    <div className="w-10 h-10 rounded-xl bg-black/40 flex items-center justify-center border border-white/5">
                       {report.risk === 'SAFE' ? <CheckCircle2 className="w-5 h-5 text-emerald-500" /> : <ShieldAlert className="w-5 h-5" />}
                    </div>
                    <span className="font-medium text-white truncate text-left">{report.type}</span>
                  </div>
                  <span className="font-mono text-neutral-400 text-sm hidden md:block">{report.url}</span>
                </div>
                
                <div className="flex items-center gap-8">
                  <div className="hidden sm:flex flex-col items-end">
                    <span className="font-mono text-[10px] opacity-60">SCORE</span>
                    <span className="font-mono font-bold text-white">{report.score}</span>
                  </div>
                  <div className="w-24 text-right">
                    <span className={`px-2.5 py-1 rounded-md text-[10px] font-mono font-bold tracking-widest bg-current/10 bg-opacity-20`}>
                      {report.risk}
                    </span>
                  </div>
                  <span className="text-sm font-mono text-neutral-500 hidden lg:block w-16 text-right">{report.date}</span>
                  <ChevronDown className={`w-5 h-5 text-neutral-500 transition-transform duration-300 ${isExpanded ? 'rotate-180' : ''}`} />
                </div>
              </button>
              
              <AnimatePresence>
                {isExpanded && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: 'auto', opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.2 }}
                    className="overflow-hidden"
                  >
                    <div className="p-6 bg-[#080808] border border-t-0 border-neutral-800 rounded-b-2xl flex flex-col gap-4 shadow-inner">
                      <h4 className="text-xs font-mono tracking-wider text-neutral-500 uppercase">Analysis Signals</h4>
                      <div className="flex flex-col gap-3 mt-2">
                        {report.reasons.map((reason, i) => (
                          <div key={i} className="flex items-center gap-3 text-sm text-neutral-300">
                            <div className="w-1.5 h-1.5 rounded-full bg-cyan-500" />
                            <span className="font-mono">{reason}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>
    </div>
  );
}

export function ScannerView() {
  const { credits, consumeCredit, topUpCredits } = useAICredits();
  const [inputVal, setInputVal] = useState('');
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'results' | 'error'>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCachedResult, setIsCachedResult] = useState(false);
  const [currentScanId, setCurrentScanId] = useState('');
  
  const fileInputRef = useRef<HTMLInputElement>(null);

  // Cache TTL: 24 hours
  const CACHE_MAX_AGE_MS = 1000 * 60 * 60 * 24;
  // File upload limits
  const MAX_FILE_SIZE = 5 * 1024 * 1024; // 5MB
  const ALLOWED_MIME_TYPES = ['image/png', 'image/jpeg', 'image/webp', 'image/gif'];

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

      // Validate file size
      if (file.size > MAX_FILE_SIZE) {
        setErrorMessage('Ukuran file terlalu besar. Maksimum 5MB.');
        setScanState('error');
        return;
      }

      // Validate MIME type
      if (!ALLOWED_MIME_TYPES.includes(file.type)) {
        setErrorMessage('Format file tidak didukung. Gunakan PNG, JPEG, WebP, atau GIF.');
        setScanState('error');
        return;
      }

      const base64 = await convertFileToBase64(file);
      setSelectedImage(base64);
      setScanState('idle');
    }
  };

  const generateScanId = async (text: string, imageBase64: string | null): Promise<string> => {
    const normalizedText = (text || "").trim().toLowerCase();
    const inputToHash = imageBase64 ? imageBase64 : normalizedText;
    
    // Hash input with SHA-256 using browser web crypto API
    const encoder = new TextEncoder();
    const data = encoder.encode(inputToHash);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    const hashHex = hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
    return hashHex;
  };

  const handleScan = async (e: React.FormEvent | null, forceLive: boolean = false) => {
    if (e) e.preventDefault();
    if (!inputVal.trim() && !selectedImage) return;

    setScanStepIndex(0);
    setScanState('scanning');
    setErrorMessage('');
    
    try {
      const docId = await generateScanId(inputVal, selectedImage);
      setCurrentScanId(docId);

      // Check Cache in Firestore unless forced live
      if (!forceLive) {
        try {
          const docRef = doc(db, 'scans', docId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const cachedDoc = docSnap.data();
            const cachedAge = Date.now() - new Date(cachedDoc.createdAt).getTime();

            // Only use cache if it's within TTL (24 hours)
            if (cachedAge < CACHE_MAX_AGE_MS) {
              const cachedData = cachedDoc.result as ScanResult;
              setScanResult(cachedData);
              setIsCachedResult(true);
              setTimeout(() => {
                setScanState('results');
              }, 800);
              return; // Exit early, no credit consumed!
            } else {
              console.log('Cache expired (>24h), proceeding to live scan.');
            }
          }
        } catch (cacheErr) {
          console.error("Firestore cache check failed, proceeding to live scan:", cacheErr);
        }
      }

      // Live Scan - quota check bypassed (allows scan when credits === 0)

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
      
      // Consume 1 credit on successful scan
      await consumeCredit(1);

      // Store in Firestore Cache
      try {
        const docRef = doc(db, 'scans', docId);
        await setDoc(docRef, {
          result: data,
          input: {
            text: inputVal,
            hasImage: !!selectedImage
          },
          createdAt: new Date().toISOString()
        });
      } catch (cacheWriteErr) {
        console.error("Failed to write scan to Firestore cache:", cacheWriteErr);
      }

      setScanResult(data);
      setIsCachedResult(false);
      
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
              VERIX membedah narasi penipuan secara real-time. Paste pesan SMS, link, atau upload screenshot WhatsApp — kami ungkap manipulation tactics di baliknya.
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
                       <span className="hidden sm:inline">Analyze</span>
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
                
                <div className="space-y-3 font-mono text-sm h-48 flex flex-col justify-end relative z-10">
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
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
                <button onClick={() => { setScanState('idle'); setInputVal(''); setSelectedImage(null); }} className="text-sm font-mono text-neutral-500 hover:text-emerald-400 flex items-center gap-2 transition-colors">
                  ← New Scan
                </button>
                <div className="flex items-center flex-wrap gap-3 sm:gap-4">
                  {isCachedResult ? (
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-neutral-500">CACHED:</span>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-cyan-500/10 border border-cyan-500/20 rounded-full text-xs font-mono text-cyan-400">
                           <Database className="w-3.5 h-3.5" /> LOADED FROM FIREBASE
                        </div>
                     </div>
                  ) : (
                     <div className="flex items-center gap-2">
                        <span className="text-xs font-mono text-neutral-500">STATUS:</span>
                        <div className="flex items-center gap-1.5 px-3 py-1 bg-emerald-500/10 border border-emerald-500/20 rounded-full text-xs font-mono text-emerald-400">
                           <div className="w-1.5 h-1.5 rounded-full bg-emerald-500 animate-pulse" /> SCAN COMPLETE (LIVE)
                        </div>
                     </div>
                  )}
                  
                  <button 
                    onClick={() => handleScan(null, true)}
                    title="Run live scan and update database cache"
                    className="text-xs font-mono bg-neutral-900 hover:bg-neutral-855 text-neutral-300 px-3.5 py-1.5 rounded-xl border border-neutral-800 hover:border-neutral-700 hover:text-white transition-all flex items-center gap-1.5 active:scale-95"
                  >
                     <Zap className="w-3.5 h-3.5 text-emerald-400" /> Re-Scan
                  </button>
                </div>
              </div>
             
              {/* Top Row Bento: Target Context & Threat Severity Gauge */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                 {/* 1. Target Context Card (2 cols on lg) */}
                 <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden min-h-[200px]">
                    <div className="flex items-center gap-2.5 mb-4 border-b border-neutral-800/80 pb-3">
                       <ScanSearch className="w-5 h-5 text-cyan-400" />
                        <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">Scanned Target</span>
                    </div>
                    <div className="flex-1 flex flex-col justify-center">
                       {selectedImage ? (
                          <div className="rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 flex justify-center items-center h-32 relative group">
                             {/* eslint-disable-next-line @next/next/no-img-element */}
                             <img src={selectedImage} alt="Scam Evidence" className="max-h-full object-contain filter group-hover:brightness-50 transition-all" />
                             <div className="absolute inset-0 pointer-events-none border-[3px] border-dashed border-emerald-500/30 rounded-xl" />
                          </div>
                       ) : (
                          <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 font-mono text-sm text-emerald-300 break-all select-all font-medium leading-relaxed max-h-[110px] overflow-y-auto">
                             {inputVal}
                          </div>
                       )}
                    </div>
                    <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-2 border-t border-neutral-800/20">
                       <span>Format: {selectedImage ? 'Image/Screenshot OCR' : 'URL/Text Payload'}</span>
                       <span>VERIX Core Engine v2.5</span>
                    </div>
                 </div>

                 {/* 2. Threat Severity Score Meter (1 col on lg) */}
                 <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[200px]">
                    <div className={`absolute top-0 w-full h-1 ${scanResult.severity_score >= 80 ? 'bg-red-500 shadow-red-500' : scanResult.severity_score >= 50 ? 'bg-amber-500 shadow-amber-500' : 'bg-emerald-500 shadow-emerald-500'} shadow-[0_0_20px_var(--tw-shadow-color)]`} />
                    
                     <p className="text-[10px] font-mono text-neutral-500 mb-3 uppercase tracking-wider">INTELLIGENCE SCORE</p>
                    
                    {/* Ring Meter */}
                    <div className="relative w-24 h-24 flex items-center justify-center mb-3">
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
                         <span className="text-3xl font-display font-medium text-white tracking-tighter">
                           {scanResult.severity_score}
                         </span>
                         <span className="text-[9px] font-mono font-bold" style={{ color: scanResult.severity_score >= 80 ? "#ef4444" : scanResult.severity_score >= 50 ? "#f59e0b" : "#10b981" }}>
                           / 100
                         </span>
                      </div>
                    </div>

                    <div className={`px-3.5 py-1 rounded-full text-[9px] font-mono font-bold tracking-widest uppercase border ${
                       scanResult.severity_score >= 80 ? "bg-red-500/10 text-red-400 border-red-500/20" : 
                       scanResult.severity_score >= 50 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" : 
                       "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}>
                       {scanResult.risk_level} THREAT
                    </div>
                 </div>
              </div>

              {/* Bottom Row Bento: Details, OSINT, & Action Protocols */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                 
                 {/* Column A: AI Explanations & OSINT Badges (2 cols on lg) */}
                 <div className="lg:col-span-2 space-y-6">
                    {/* AI Narrative Box */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 relative overflow-hidden group">
                       <div className="relative">
                          {credits === 0 && <AILockOverlay onTopUp={() => topUpCredits(10)} />}
                          <div className={`transition-all duration-300 ${credits === 0 ? 'blur-md opacity-30 select-none pointer-events-none' : ''}`}>
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

                             <div className="mt-8 flex flex-col sm:flex-row gap-4 border-t border-neutral-800/50 pt-6">
                                <div className="flex-1">
                                     <p className="text-xs font-mono text-neutral-500 mb-3 uppercase tracking-wider">PATTERN MATCH</p>
                                    <div className="flex flex-wrap gap-2">
                                      {scanResult.similar_patterns && Array.isArray(scanResult.similar_patterns) ? scanResult.similar_patterns.map((pattern, idx) => (
                                        <div key={idx} className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
                                          <Network className="w-3.5 h-3.5 text-cyan-500" />
                                          <span className="text-xs font-mono text-cyan-100/80">{pattern}</span>
                                        </div>
                                      )) : (
                                        <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
                                          <Network className="w-3.5 h-3.5 text-cyan-500" />
                                           <span className="text-xs font-mono text-cyan-100/80">{scanResult.similar_pattern || 'No Pattern Match'}</span>
                                        </div>
                                      )}
                                    </div>
                                </div>
                             </div>
                           </div>
                        </div>

                       {/* External Intelligence Block */}
                       {scanResult.external_intelligence && Object.keys(scanResult.external_intelligence).length > 0 && (
                         <div className="mt-6 flex flex-col gap-4 border-t border-neutral-800/50 pt-6">
                             <p className="text-xs font-mono text-neutral-500 mb-1 uppercase tracking-wider">External Intelligence Signals</p>
                            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                               
                               {/* Safe Browsing Card */}
                               {scanResult.external_intelligence.safe_browsing && (
                                  <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl flex flex-col justify-between min-h-[160px] relative overflow-hidden">
                                     <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                                        <span className="text-[11px] text-neutral-400 font-mono flex items-center gap-1.5">
                                           <ShieldAlert className="w-3.5 h-3.5 text-emerald-400" /> Google Safe Browsing
                                         </span>
                                         <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">
                                            v4 api
                                         </span>
                                     </div>
                                     
                                     <div className="my-2.5">
                                        <span className={`text-lg font-bold font-mono tracking-tight ${
                                           scanResult.external_intelligence.safe_browsing.includes("BAHAYA") ? "text-red-400" : "text-emerald-400"
                                        }`}>
                                           {scanResult.external_intelligence.safe_browsing.includes("BAHAYA") ? "MALICIOUS" : "CLEAN"}
                                        </span>
                                        <p className="text-[10px] text-neutral-400 mt-1 font-sans leading-relaxed">
                                           {scanResult.external_intelligence.safe_browsing || "Tidak terdaftar sebagai ancaman."}
                                        </p>
                                     </div>

                                     <div className="flex flex-wrap gap-1 mt-1 border-t border-neutral-900/60 pt-2 text-[8px] text-neutral-500 font-mono">
                                         <span>Checked targets: 1 URL</span>
                                     </div>
                                  </div>
                               )}

                               {/* VirusTotal Card */}
                               {scanResult.external_intelligence.virustotal && (
                                  <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl flex flex-col justify-between min-h-[160px] relative overflow-hidden">
                                     <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                                        <span className="text-[11px] text-neutral-400 font-mono flex items-center gap-1.5">
                                           <Database className="w-3.5 h-3.5 text-cyan-400" /> VirusTotal
                                        </span>
                                        {scanResult.virustotal_raw?.status && (
                                           <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">
                                              {scanResult.virustotal_raw.status}
                                           </span>
                                        )}
                                     </div>
                                     
                                     <div className="my-2">
                                        {scanResult.virustotal_raw ? (
                                           <div className="space-y-1">
                                              <div className="flex items-baseline gap-1">
                                                 <span className={`text-2xl font-bold font-mono tracking-tight ${
                                                    scanResult.virustotal_raw.malicious_votes > 0 ? "text-red-400" : "text-emerald-400"
                                                 }`}>
                                                    {scanResult.virustotal_raw.malicious_votes}
                                                 </span>
                                                 <span className="text-[10px] font-mono text-neutral-500">
                                                     / {scanResult.virustotal_raw.total_engines} malicious engines
                                                 </span>
                                              </div>
                                              
                                              {/* HTTP Status Code & Content Type */}
                                              <div className="flex flex-wrap items-center gap-x-2 gap-y-0.5 text-[9px] font-mono text-neutral-400 border-t border-neutral-900 pt-1">
                                                 {scanResult.virustotal_raw.http_code !== undefined && (
                                                    <span className="flex items-center gap-0.5">
                                                       <span className="text-neutral-500">HTTP:</span>
                                                       <span className={scanResult.virustotal_raw.http_code >= 400 ? "text-red-400" : scanResult.virustotal_raw.http_code >= 300 ? "text-amber-400" : "text-emerald-400"}>
                                                          {scanResult.virustotal_raw.http_code}
                                                       </span>
                                                    </span>
                                                 )}
                                                 {scanResult.virustotal_raw.content_type && (
                                                    <span className="truncate max-w-[100px]" title={scanResult.virustotal_raw.content_type}>
                                                       <span className="text-neutral-500">Type:</span> {scanResult.virustotal_raw.content_type.split(';')[0]}
                                                    </span>
                                                 )}
                                              </div>
                                           </div>
                                        ) : (
                                           <div>
                                              <span className={`text-base font-medium font-mono ${
                                                 !scanResult.external_intelligence.virustotal.includes("0 engine") && !scanResult.external_intelligence.virustotal.includes("AMAN") ? "text-red-400" : "text-emerald-400"
                                              }`}>
                                                 {scanResult.external_intelligence.virustotal}
                                              </span>
                                              <p className="text-[10px] text-neutral-500 mt-1">Global security vendors</p>
                                           </div>
                                        )}
                                     </div>

                                     {/* Tags/Pills list */}
                                     <div className="flex flex-wrap items-center gap-1 mt-1 border-t border-neutral-900/60 pt-2">
                                        <div className="flex flex-wrap gap-1 max-w-[60%]">
                                           {scanResult.virustotal_raw?.tags && scanResult.virustotal_raw.tags.map((tag, idx) => (
                                              <span key={idx} className="bg-neutral-900 border border-neutral-850 text-neutral-400 text-[8px] px-1 py-0.5 rounded font-mono truncate max-w-[45px]">
                                                 {tag}
                                              </span>
                                           ))}
                                        </div>
                                        {scanResult.virustotal_raw?.last_analysis_date && (
                                           <span className="text-[7.5px] text-neutral-500 font-mono ml-auto" title="Last analyzed date">
                                              {new Date(scanResult.virustotal_raw.last_analysis_date * 1000).toLocaleDateString('id-ID', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}
                                           </span>
                                        )}
                                     </div>
                                  </div>
                               )}

                               {/* URLScan.io Card */}
                               {scanResult.external_intelligence.urlscan && (
                                  <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-2xl flex flex-col justify-between min-h-[160px] relative overflow-hidden">
                                     <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                                        <span className="text-[11px] text-neutral-400 font-mono flex items-center gap-1.5">
                                           <ScanSearch className="w-3.5 h-3.5 text-amber-400" /> URLScan.io
                                        </span>
                                        <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider">
                                           sandbox
                                        </span>
                                     </div>
                                     
                                     <div className="my-2.5">
                                        <span className={`text-lg font-bold font-mono tracking-tight ${
                                           scanResult.external_intelligence.urlscan && !scanResult.external_intelligence.urlscan.includes("100") && !scanResult.external_intelligence.urlscan.includes("Clean") ? "text-amber-400" : "text-emerald-400"
                                         }`}>
                                            {scanResult.external_intelligence.urlscan.includes("85") || scanResult.external_intelligence.urlscan.includes("100") || scanResult.external_intelligence.urlscan.includes("Clean") ? "REPUTABLE" : "SUSPICIOUS"}
                                        </span>
                                        <p className="text-[10px] text-neutral-400 mt-1 font-sans leading-relaxed">
                                           {scanResult.external_intelligence.urlscan || "Skor Reputasi: 85/100"}
                                        </p>
                                     </div>

                                     <div className="flex flex-wrap gap-1 mt-1 border-t border-neutral-900/60 pt-2 text-[8px] text-neutral-500 font-mono">
                                         <span>Behavioral heuristics validation</span>
                                     </div>
                                  </div>
                               )}

                            </div>
                         </div>
                       )}
                    </div>
                 </div>

                 {/* Column B: Vectors & Recommended Protocols (1 col on lg) */}
                 <div className="space-y-6">
                    {/* Taktik Manipulasi */}
                    <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden">
                       {credits === 0 && <AILockOverlay onTopUp={() => topUpCredits(10)} />}
                       <div className={`transition-all duration-300 ${credits === 0 ? 'blur-md opacity-30 select-none pointer-events-none' : ''}`}>
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
                                  <li key={idx} className="text-xs text-red-400/90 flex items-start gap-2">
                                    <span className="text-red-500 mt-0.5 shrink-0">✗</span> {flag}
                                  </li>
                               ))}
                               {scanResult.red_flags.length === 0 && (
                                   <li className="text-xs font-mono text-neutral-500">No red flags detected.</li>
                               )}
                             </ul>
                          </div>
                       </div>
                    </div>

                    {/* Rekomendasi */}
                    <div className="bg-emerald-950/20 border border-emerald-900/30 rounded-3xl p-6 relative overflow-hidden">
                       {credits === 0 && <AILockOverlay onTopUp={() => topUpCredits(10)} />}
                       <div className={`transition-all duration-300 ${credits === 0 ? 'blur-md opacity-30 select-none pointer-events-none' : ''}`}>
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

              </div>
           </motion.div>
        )}
        </AnimatePresence>
        
        <ScanHistorySection />
      </div>
    </div>
  );
}

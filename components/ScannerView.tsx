'use client';

import { motion, AnimatePresence } from 'motion/react';
import {
  ShieldAlert, Zap, UploadCloud, Search, CheckCircle2,
  AlertTriangle, Crosshair, ArrowRight, Activity, Radar,
  Lock, ScanSearch, Terminal, Database, Brain, Network, ChevronDown, Sparkles, EyeOff,
  Link2, MessageSquare, Scan, Package, ScanFace, FileDown
} from 'lucide-react';
import { useState, useRef, useEffect } from 'react';
import { LightRays } from './ui/light-rays';
import { LinearGlow } from './ui/linear-glow';
import { useAICredits } from '@/hooks/use-ai-credits';
import { db } from '@/lib/firebase';
import { doc, getDoc, setDoc } from 'firebase/firestore';
import { CreditTopUpModal } from './CreditTopUpModal';
import { useAuth } from './FirebaseProvider';
import { cn } from '@/lib/utils';
import { downloadDeepfakePdf } from './PdfReport';
import { ScanResultToast } from './ui/ScanResultToast';

type ExifTrace = {
  hasMetadata: boolean;
  software?: string;
  editingTraces: string[];
  suspicious: boolean;
  make?: string;
  model?: string;
};

type QrisResult = {
  merchant: string;
  acquirer: string;
  city: string;
  flags: string[];
  flagLabels: string[];
  reportCount: number;
  behavioral_analysis: string;
  recommended_actions: string[];
};

type FileResult = {
  file_name: string;
  risk_score: number;
  risk_level: string;
  vt_result?: {
    malicious: number;
    suspicious: number;
    undetected: number;
    harmless: number;
    total: number;
    verdict: string;
    analysisId?: string;
    error?: string;
  };
  behavioral_analysis: string;
  recommended_actions: string[];
};

type ScanResult = {
  severity_score: number;
  risk_level: string;
  manipulation_tactics: string[];
  red_flags: string[];
  behavioral_analysis: string;
  recommended_actions: string[];
  similar_pattern?: string;
  similar_patterns?: string[];
  analysis_type?: string;
  deepfake_score?: number;
  summary?: string;
  confidence_level?: string;
  face_detected?: boolean;
  detected_artifacts?: string[];
  exif?: ExifTrace;
  // QRIS fields
  merchant?: string;
  acquirer?: string;
  city?: string;
  flags?: string[];
  flagLabels?: string[];
  reportCount?: number;
  // File fields
  file_name?: string;
  vt_result?: FileResult["vt_result"];
  external_intelligence?: {
    virustotal?: string;
    safe_browsing?: string;
    urlscan?: string;
    urlhaus?: string;
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
    engineResults?: { engine: string; category: string; result: string }[];
  };
};

const SCAN_TABS = [
  { id: 'text',     label: 'SMS / Teks',        icon: MessageSquare, color: 'cyan',   desc: 'Analisa pesan penipuan dari SMS, WhatsApp, atau chat',                    placeholder: 'Tulis pesan penipuan di sini...' },
  { id: 'link',     label: 'Link Phishing',      icon: Link2,         color: 'rose',   desc: 'Tempel URL mencurigakan untuk analisa phishing & malware',               placeholder: 'example.com atau https://...' },
  { id: 'qris',     label: 'QRIS / Gambar',      icon: Scan,          color: 'purple', desc: 'Upload screenshot QRIS palsu atau bukti chat penipuan',                   placeholder: 'Upload gambar atau tempel URL...' },
  { id: 'apk',      label: 'APK Malware',        icon: Package,       color: 'amber',  desc: 'Periksa APK mencurigakan via nama package, hash, atau info file',          placeholder: 'Nama package APK atau hash...' },
  { id: 'deepfake', label: 'Deepfake Foto',      icon: ScanFace,      color: 'fuchsia',desc: 'Deteksi foto palsu hasil AI/deepfake. Prioritaskan perlindungan identitas.', placeholder: 'Upload foto untuk analisa deepfake...' },
] as const;

const tabColorMap = {
  cyan:    { accent: '#06b6d4', accentDim: 'rgba(6,182,212,0.2)',  accentBg: 'rgba(6,182,212,0.1)' },
  rose:    { accent: '#f43f5e', accentDim: 'rgba(244,63,94,0.2)',  accentBg: 'rgba(244,63,94,0.1)' },
  purple:  { accent: '#a855f7', accentDim: 'rgba(168,85,247,0.2)', accentBg: 'rgba(168,85,247,0.1)' },
  amber:   { accent: '#f59e0b', accentDim: 'rgba(245,158,11,0.2)', accentBg: 'rgba(245,158,11,0.1)' },
  fuchsia: { accent: '#d946ef', accentDim: 'rgba(217,70,239,0.2)', accentBg: 'rgba(217,70,239,0.1)' },
};

type ScanTabId = (typeof SCAN_TABS)[number]['id'];

const SCAN_STEPS = [
  "Initializing VERIX Threat Engine...",
  "Extracting visual & text artifacts (OCR)...",
  "Targeting psychological manipulation vectors...",
  "Cross-referencing global threat databases...",
  "Running behavioral intent inference...",
  "Synthesizing Explainable AI profile..."
];

function AILockOverlay({ onTopUp, teaserText }: { onTopUp: () => void; teaserText?: string }) {
  return (
    <div className="absolute inset-0 bg-neutral-950/75 backdrop-blur-md z-20 flex flex-col items-center justify-center text-center p-6 border border-neutral-800 rounded-[24px] animate-in fade-in duration-300">
      <div className="w-12 h-12 rounded-full bg-amber-500/10 border border-amber-500/25 flex items-center justify-center mb-4 relative shadow-[0_0_15px_rgba(245,158,11,0.15)] animate-[pulse_2s_infinite]">
        <Lock className="w-5 h-5 text-amber-400" />
      </div>
      <h4 className="text-base font-display font-medium text-white mb-2">Analisis AI Terkunci</h4>
      <p className="text-xs text-neutral-400 max-w-[260px] mb-4 leading-relaxed font-sans">
        Kredit AI kamu sudah habis. Top up untuk membuka penjelasan lengkap.
      </p>

      {teaserText && (
        <div className="relative w-full max-w-[280px] mb-4 rounded-lg overflow-hidden border border-neutral-800/40">
          <div className="px-3 py-2.5 bg-neutral-900/50">
            <p className="text-[11px] text-neutral-300/90 leading-relaxed font-sans line-clamp-2">
              &ldquo;{teaserText}&rdquo;
            </p>
            <div className="absolute inset-0 bg-gradient-to-b from-transparent via-transparent to-neutral-950/90 pointer-events-none" />
          </div>
          <div className="absolute bottom-0 left-0 right-0 flex items-center justify-center pb-1.5">
            <div className="flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-amber-500/10 border border-amber-500/15">
              <EyeOff className="w-3 h-3 text-amber-400/70" />
              <span className="text-[8px] font-mono text-amber-400/70 tracking-wider">DIBLUR</span>
            </div>
          </div>
        </div>
      )}

      <button
        type="button"
        onClick={(e) => {
          e.stopPropagation();
          onTopUp();
        }}
        className="px-4 py-2.5 bg-gradient-to-r from-amber-500 to-amber-600 hover:from-amber-400 hover:to-amber-500 text-neutral-950 text-xs font-bold font-mono rounded-xl transition-all shadow-[0_0_15px_rgba(245,158,11,0.2)] hover:shadow-[0_0_20px_rgba(245,158,11,0.4)] active:scale-95 flex items-center gap-2 cursor-pointer relative z-30"
      >
        <Sparkles className="w-3.5 h-3.5" /> TOP UP KREDIT
      </button>
    </div>
  );
}

function ScanHistorySection() {
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [reports, setReports] = useState<Array<{
    id: string;
    url: string;
    risk: string;
    score: number;
    date: string;
    type: string;
    reasons: string[];
    source: string;
  }>>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch('/api/scans-history')
      .then(r => r.json())
      .then(data => {
        setReports(data.scans || []);
        setLoading(false);
      })
      .catch(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="w-full mt-32 border-t border-neutral-900/50 pt-16 mb-20">
        <div className="flex flex-col gap-3">
          {[1, 2, 3].map(i => (
            <div key={i} className="w-full h-20 rounded-2xl bg-neutral-900/50 border border-neutral-800/50 animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="w-full mt-32 border-t border-neutral-900/50 pt-16 mb-20">
      <div className="flex flex-col mb-10">
        <div className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1 mb-4 w-fit">
          <span className="text-[10px] font-mono text-cyan-400 tracking-wider">HISTORICAL THREAT INTELLIGENCE</span>
        </div>
        <h2 className="text-3xl md:text-4xl font-display font-medium tracking-tight text-white mb-2">Scan History</h2>
        <p className="text-neutral-400 text-sm md:text-base">Ancaman terdeteksi dari sumber intelijen global.</p>
      </div>

      <div className="flex flex-col gap-3">
        {reports.map((report) => {
          const isExpanded = expandedId === report.id;
          const colorClass =
            report.risk === 'CRITICAL' ? 'text-red-400 border-red-500/20 bg-red-500/5 hover:border-red-500/50 hover:shadow-[0_0_20px_rgba(255,63,63,0.1)]' :
              report.risk === 'HIGH' ? 'text-amber-400 border-amber-500/20 bg-amber-500/5 hover:border-amber-500/50 hover:shadow-[0_0_20px_rgba(255,159,28,0.1)]' :
                report.risk === 'MEDIUM' ? 'text-amber-300 border-amber-400/20 bg-amber-400/5 hover:border-amber-400/50 hover:shadow-[0_0_20px_rgba(255,200,117,0.1)]' :
                  'text-neutral-400 border-neutral-800 bg-[#0c0c0c] hover:border-neutral-700 hover:shadow-[0_0_20px_rgba(255,255,255,0.05)]';

          return (
            <div key={report.id} className="flex flex-col">
              <button
                onClick={() => setExpandedId(isExpanded ? null : report.id)}
                className={`w-full group relative flex items-center justify-between p-5 rounded-2xl border transition-all duration-300 cursor-pointer ${colorClass} ${isExpanded ? 'rounded-b-none border-b-transparent' : ''}`}
              >
                <div className="flex items-center gap-6">
                  <div className="flex items-center gap-4 w-32 sm:w-48 md:w-64 shrink-0">
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
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-mono tracking-wider text-neutral-500 uppercase">Analysis Signals</h4>
                        <span className="text-[9px] font-mono px-2 py-0.5 rounded-full bg-neutral-800 text-neutral-400 border border-neutral-700">
                          {report.source}
                        </span>
                      </div>
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
  const { user, login } = useAuth();
  const [inputVal, setInputVal] = useState('');
  const [scanState, setScanState] = useState<'idle' | 'scanning' | 'results' | 'error'>('idle');
  const [scanResult, setScanResult] = useState<ScanResult | null>(null);
  const [scanStepIndex, setScanStepIndex] = useState(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const [uploadedFile, setUploadedFile] = useState<File | null>(null);
  const [errorMessage, setErrorMessage] = useState('');
  const [isCachedResult, setIsCachedResult] = useState(false);
  const [currentScanId, setCurrentScanId] = useState('');
  const [showTopUpModal, setShowTopUpModal] = useState(false);
  const [activeScanTab, setActiveScanTab] = useState<ScanTabId>('text');
  const [isFormFocused, setIsFormFocused] = useState(false);
  const [shakeCards, setShakeCards] = useState(false);
  const [toastResult, setToastResult] = useState<ScanResult | null>(null);
  const [showToast, setShowToast] = useState(false);

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

  useEffect(() => {
    if (scanState === 'results' && credits === 0) {
      setShakeCards(true);
      const timer = setTimeout(() => setShakeCards(false), 400);
      return () => clearTimeout(timer);
    }
  }, [scanState, credits]);

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

      // Validate MIME type  allow APK for apk tab
      if (activeScanTab !== 'apk' && !ALLOWED_MIME_TYPES.includes(file.type)) {
        // Allow any file type for APK tab
        setErrorMessage('Format file tidak didukung. Gunakan PNG, JPEG, WebP, atau GIF.');
        setScanState('error');
        return;
      }

      // For APK tab, allow any file type (will be sent to /api/analyze/file)
      if (activeScanTab === 'apk' && !file.type.startsWith('image/')) {
        const bytes = await file.arrayBuffer();
        const byteArray = new Uint8Array(bytes);
        let binary = '';
        byteArray.forEach(b => binary += String.fromCharCode(b));
        const base64 = btoa(binary);
        const dataUrl = `data:${file.type || 'application/octet-stream'};base64,${base64}`;
        setSelectedImage(dataUrl);
        setUploadedFile(file);
        setInputVal(file.name);
        setScanState('idle');
        return;
      }

      const base64 = await convertFileToBase64(file);
      setSelectedImage(base64);
      setUploadedFile(file);
      setScanState('idle');
    }
  };

  const decodeQrFromImage = async (base64: string): Promise<string | null> => {
    try {
      const { default: jsQR } = await import('jsqr');
      const img = new Image();
      const canvas = document.createElement('canvas');
      const ctx = canvas.getContext('2d');
      if (!ctx) return null;

      await new Promise<void>((resolve, reject) => {
        img.onload = () => { resolve(); };
        img.onerror = reject;
        img.src = base64;
      });

      canvas.width = img.width;
      canvas.height = img.height;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const code = jsQR(imageData.data, imageData.width, imageData.height);
      return code?.data || null;
    } catch (e) {
      console.warn('[QRIS] QR decode failed:', e);
      return null;
    }
  };

  const extractExif = async (file: File): Promise<ExifTrace | null> => {
    try {
      const exifr = await import('exifr');
      const output = await exifr.default.parse(file, {
        translateKeys: false,
        reviveValues: false,
      });
      if (!output || Object.keys(output).length === 0) {
        return {
          hasMetadata: false,
          editingTraces: ['No EXIF metadata found'],
          suspicious: false,
        };
      }
      const traces: string[] = [];
      let suspicious = false;
      const software = output.Software || output.ProcessingSoftware || '';
      if (software) {
        traces.push(`Editing software: ${software}`);
        if (['photoshop', 'lightroom', 'faceapp', 'remini', 'picsart', 'snapseed', 'meitu'].some(
          (t) => software.toLowerCase().includes(t))) {
          suspicious = true;
          traces.push(`⚠ Suspicious editing tool detected`);
        }
      }
      const make = output.Make || '';
      const model = output.Model || '';
      if (make) {
        traces.push(`Device: ${make} ${model}`.trim());
      } else if (!software) {
        traces.push('No camera/device info — may be AI-generated');
        suspicious = true;
      }
      const createDate = output.DateTimeOriginal || output.CreateDate || '';
      const modifyDate = output.ModifyDate || '';
      if (createDate && modifyDate && createDate !== modifyDate) {
        traces.push('Modified after original capture');
        suspicious = true;
      }
      return { hasMetadata: true, software, editingTraces: traces, suspicious, make, model };
    } catch {
      return null;
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

    // APK file upload  send via multipart to /api/analyze/file
    if (activeScanTab === 'apk' && selectedImage) {
      setScanStepIndex(0);
      setScanState('scanning');
      setErrorMessage('');

      try {
        // Convert base64 back to blob
        const base64Data = selectedImage.split(',')[1];
        const mimeType = selectedImage.split(';')[0].split(':')[1];
        const byteChars = atob(base64Data);
        const byteNums = Array.from({ length: byteChars.length }, (_, i) => byteChars.charCodeAt(i));
        const byteArray = new Uint8Array(byteNums);
        const blob = new Blob([byteArray], { type: mimeType });
        const file = new File([blob], `scan-${Date.now()}${mimeType === 'application/vnd.android.package-archive' ? '.apk' : '.bin'}`, { type: mimeType });

        const formData = new FormData();
        formData.append('file', file);

        const res = await fetch('/api/analyze/file', {
          method: 'POST',
          body: formData,
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error || 'Failed to analyze file');

        await consumeCredit(1);
        setScanResult(data);
        setToastResult(data);
        setShowToast(true);
        setIsCachedResult(false);
        setTimeout(() => setScanState('results'), 500);
      } catch (err: any) {
        console.error(err);
        setErrorMessage(err.message || 'Error analyzing file.');
        setScanState('error');
      }
      return;
    }

    setScanStepIndex(0);
    setScanState('scanning');
    setErrorMessage('');

    try {
      // For QRIS: decode QR from image first, then send decoded data
      let qrDecodedText = inputVal;
      let qrDecodedRaw: string | null = null;

      if (activeScanTab === 'qris' && selectedImage) {
        qrDecodedRaw = await decodeQrFromImage(selectedImage);
        if (!qrDecodedRaw) {
          setErrorMessage('Tidak dapat mendeteksi QR code dari gambar. Pastikan gambar mengandung QR code yang jelas.');
          setScanState('error');
          return;
        }

        // Parse QRIS string client-side for the raw data
        // Full parsing + validation happens server-side
        qrDecodedText = qrDecodedRaw;
      }

      const textToHash = activeScanTab === 'qris' ? qrDecodedRaw || inputVal : inputVal;
      const docId = await generateScanId(textToHash, selectedImage);
      setCurrentScanId(docId);

      // Check Cache in Firestore unless forced live (skip for file/qris scans)
      if (!forceLive && activeScanTab !== 'qris') {
        try {
          const docRef = doc(db, 'scans', docId);
          const docSnap = await getDoc(docRef);
          if (docSnap.exists()) {
            const cachedDoc = docSnap.data();
            const cachedAge = Date.now() - new Date(cachedDoc.createdAt).getTime();

            if (cachedAge < CACHE_MAX_AGE_MS) {
              const cachedData = cachedDoc.result as ScanResult;
              setScanResult(cachedData);
              setToastResult(cachedData);
              setShowToast(true);
              setIsCachedResult(true);
              setTimeout(() => setScanState('results'), 800);
              return;
            }
          }
        } catch (cacheErr) {
          console.error("Firestore cache check failed, proceeding to live scan:", cacheErr);
        }
      }

      const payload: any = { text: qrDecodedText };

      if (activeScanTab === 'deepfake') {
        payload.analysis_type = 'deepfake';
        // Extract EXIF data and include it
        if (selectedImage && uploadedFile) {
          const exifData = await extractExif(uploadedFile);
          if (exifData) {
            payload.exifData = exifData;
          }
        }
      }

      if (activeScanTab === 'qris') {
        payload.analysis_type = 'qris';
        payload.qrData = qrDecodedRaw || qrDecodedText;
      }

      if (selectedImage) {
        const base64Data = selectedImage.split(',')[1];
        const mimeType = selectedImage.substring(selectedImage.indexOf(":") + 1, selectedImage.indexOf(";"));
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

      await consumeCredit(1);

      // Store in Firestore Cache (skip for qris/file)
      if (activeScanTab !== 'qris') {
        try {
          const docRef = doc(db, 'scans', docId);
          await setDoc(docRef, {
            result: data,
            input: {
              text: inputVal,
              hasImage: !!selectedImage
            },
            userId: user?.uid || null,
            createdAt: new Date().toISOString()
          });
        } catch (cacheWriteErr) {
          console.error("Failed to write scan to Firestore cache:", cacheWriteErr);
        }
      }

      setScanResult(data);
      setToastResult(data);
      setShowToast(true);
      setIsCachedResult(false);

      setTimeout(() => setScanState('results'), 500);

    } catch (err: any) {
      console.error(err);
      setErrorMessage(err.message || 'Error running VERIX engine.');
      setScanState('error');
    }
  };

  return (
    <div className="min-h-screen -z-0 bg-neutral-950 text-neutral-200 relative">
      {/* Linear glow top */}
      <LinearGlow position="top" color="emerald" opacity={30} />

      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[300px] bg-emerald-500/[0.02] blur-[120px] rounded-full pointer-events-none" />
      <div className="absolute inset-0 -z-10 opacity-70 pointer-events-none">
        <LightRays color="rgba(16, 185, 129, 0.08)" />
      </div>

      <div className="max-w-7xl mx-auto pt-32 pb-32 px-6">
        <AnimatePresence mode="wait">

          {scanState === 'idle' && (
            <motion.div
              key="idle"
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="flex flex-col items-center text-center mt-6"
            >
              {/* ─── TAB BAR ─── */}
              <div className="inline-flex items-center gap-1 sm:gap-1.5 bg-neutral-900/80 border border-neutral-800 rounded-2xl p-1.5 mb-10 shadow-xl overflow-x-auto max-w-full no-scrollbar">
                {SCAN_TABS.map((tab) => {
                  const TabIcon = tab.icon;
                  const isActive = activeScanTab === tab.id;
                  const colorKey = tab.color as keyof typeof tabColorMap;
                  return (
                    <button
                      key={tab.id}
                      onClick={() => { setActiveScanTab(tab.id as ScanTabId); setInputVal(''); setSelectedImage(null); }}
                      className={cn(
                        "relative flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs font-mono transition-all duration-300",
                        isActive
                          ? "text-white shadow-lg"
                          : "text-neutral-500 hover:text-neutral-300 hover:bg-neutral-800/60"
                      )}
                    >
                      {isActive && (
                        <motion.div
                          layoutId="scanTabGlow"
                          className="absolute inset-0 rounded-xl border"
                          style={{
                            backgroundColor: tabColorMap[colorKey].accentBg,
                            borderColor: tabColorMap[colorKey].accentDim,
                            boxShadow: `0 0 20px ${tabColorMap[colorKey].accentDim}`,
                          }}
                          transition={{ type: "spring", stiffness: 400, damping: 30 }}
                        />
                      )}
                      <span className="relative z-10 flex items-center gap-2">
                        <TabIcon className="w-4 h-4" />
                        <span className="hidden sm:inline">{tab.label}</span>
                      </span>
                    </button>
                  );
                })}
              </div>

              {/* ─── HERO ICON ─── */}
              <motion.div
                key={`hero-${activeScanTab}`}
                initial={{ opacity: 0, scale: 0.8 }}
                animate={{ opacity: 1, scale: 1 }}
                className="w-16 h-16 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center shadow-2xl mb-8 relative"
              >
                {(() => {
                  const t = SCAN_TABS.find(t => t.id === activeScanTab)!;
                  const TabIcon = t.icon;
                  const c = tabColorMap[t.color as keyof typeof tabColorMap];
                  return (
                    <>
                      <TabIcon className="w-8 h-8" style={{ color: c.accent }} />
                      <div className="absolute inset-0 rounded-2xl" style={{ border: `1px solid ${c.accentDim}`, boxShadow: `0 0 30px ${c.accentDim}` }} />
                    </>
                  );
                })()}
              </motion.div>

              {/* ─── HEADLINE ─── */}
              <motion.div key={`headline-${activeScanTab}`} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}>
                {activeScanTab === 'text' && (
                  <>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-medium text-white mb-4 tracking-tight leading-tight break-words">
                      Ancaman Digital <br className="hidden md:block" />Kini Terlihat Meyakinkan.
                    </h1>
                    <p className="text-lg text-neutral-400 mb-6 max-w-2xl">
                      VERIX membedah narasi penipuan secara real-time. Paste pesan SMS, link, atau upload screenshot WhatsApp  kami ungkap manipulation tactics di baliknya.
                    </p>
                  </>
                )}
                {activeScanTab === 'link' && (
                  <>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-medium text-white mb-4 tracking-tight leading-tight break-words">
                      Link Phishing<span className="text-rose-400">.</span>
                    </h1>
                    <p className="text-lg text-neutral-400 mb-6 max-w-2xl">
                      Tempel URL mencurigakan untuk diperiksa lintas database ancaman global. VERIX akan melacak redirect, memindai reputasi domain, dan mengungkap taktik phishing.
                    </p>
                  </>
                )}
                {activeScanTab === 'qris' && (
                  <>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-medium text-white mb-4 tracking-tight leading-tight break-words">
                      QRIS &amp; Bukti <span className="text-purple-400">Scam</span>
                    </h1>
                    <p className="text-lg text-neutral-400 mb-6 max-w-2xl">
                      Upload screenshot QRIS palsu, bukti chat, atau tautan mencurigakan. VERIX akan mengekstrak teks dari gambar dan menganalisanya untuk indikasi penipuan.
                    </p>
                  </>
                )}
                {activeScanTab === 'apk' && (
                  <>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-medium text-white mb-4 tracking-tight leading-tight break-words">
                      APK <span className="text-amber-400">Malware</span> Scanner
                    </h1>
                    <p className="text-lg text-neutral-400 mb-6 max-w-2xl">
                      Masukkan nama package, hash, atau info APK mencurigakan. VERIX akan memeriksa apakah aplikasi tersebut dikenal sebagai malware atau bagian dari kampanye penipuan.
                    </p>
                  </>
                )}
                {activeScanTab === 'deepfake' && (
                  <>
                    <h1 className="text-4xl sm:text-5xl md:text-6xl font-display font-medium text-white mb-4 tracking-tight leading-tight break-words">
                      Deteksi <span className="text-fuchsia-400">Deepfake</span>
                    </h1>
                    <p className="text-lg text-neutral-400 mb-6 max-w-2xl">
                      Upload foto yang mencurigakan  VERIX akan menganalisis tekstur kulit, pantulan mata, konsistensi pencahayaan, dan artefak GAN untuk mendeteksi pemalsuan berbasis AI. Prioritaskan perlindungan identitas Anda.
                    </p>
                  </>
                )}
              </motion.div>

              {/* ─── FORM ─── */}
              {(() => {
                const t = SCAN_TABS.find(t => t.id === activeScanTab)!;
                const TabIcon = t.icon;
                const c = tabColorMap[t.color as keyof typeof tabColorMap];
                const isDeepfake = activeScanTab === 'deepfake';
                return (
                  <form onSubmit={handleScan} className="w-full max-w-3xl relative">
                    <div
                      className="relative group rounded-2xl bg-neutral-900/80 border backdrop-blur-md shadow-2xl overflow-hidden transition-colors"
                      style={{ borderColor: isFormFocused ? c.accent : 'rgba(38,38,38,1)' }}
                      onFocusCapture={() => setIsFormFocused(true)}
                      onBlurCapture={() => setIsFormFocused(false)}
                    >
                      {/* Image preview or file info */}
                      {selectedImage && (
                        <div className="w-full p-4 border-b border-neutral-800 relative bg-neutral-950/50">
                          <button
                            type="button"
                            onClick={() => { setSelectedImage(null); setUploadedFile(null); }}
                            className="absolute top-6 right-6 bg-neutral-900 border border-neutral-700 w-8 h-8 rounded-full flex items-center justify-center text-neutral-400 hover:text-white"
                          >
                            ✕
                          </button>
                          {activeScanTab === 'apk' && uploadedFile && !uploadedFile.type.startsWith('image/') ? (
                            <>
                              <p className="text-xs font-mono mb-2" style={{ color: c.accent }}>ATTACHED APK FILE</p>
                              <div className="flex items-center gap-4 p-4 rounded-xl border border-neutral-700 bg-neutral-900/50">
                                <Package className="w-8 h-8 text-amber-400" />
                                <div>
                                  <p className="text-sm font-mono text-amber-200">{uploadedFile.name}</p>
                                  <p className="text-[10px] font-mono text-neutral-500">{(uploadedFile.size / 1024 / 1024).toFixed(1)} MB</p>
                                </div>
                              </div>
                            </>
                          ) : (
                            <>
                              <p className="text-xs font-mono mb-2" style={{ color: c.accent }}>
                                {activeScanTab === 'qris' ? 'QRIS QR CODE' : 'ATTACHED ARTIFACT'}
                              </p>
                              <div className="h-32 w-full overflow-hidden rounded-lg flex items-center justify-center">
                                {/* eslint-disable-next-line @next/next/no-img-element */}
                                <img src={selectedImage} alt="Artifact" className="max-h-full object-contain" />
                              </div>
                            </>
                          )}
                        </div>
                      )}

                      <div className="relative flex min-h-[4rem] items-center">
                        <div className="pl-6 shrink-0 hidden sm:block" style={{ color: c.accent }}>
                          <TabIcon className="w-6 h-6" />
                        </div>

                        {isDeepfake ? (
                          <div className="flex-1 flex items-center gap-3 px-4 sm:px-6 py-5">
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              className="flex-1 flex flex-col items-center justify-center gap-2 py-8 rounded-xl border-2 border-dashed transition-colors"
                              style={{ borderColor: `${c.accent}40`, backgroundColor: `${c.accent}08` }}
                            >
                              <UploadCloud className="w-8 h-8" style={{ color: c.accent }} />
                              <span className="text-sm text-neutral-400 font-mono">Klik untuk upload foto</span>
                              <span className="text-[10px] text-neutral-600">PNG, JPEG, WebP  Maks 5MB</span>
                            </button>
                          </div>
                        ) : (
                          <input
                            type="text"
                            value={inputVal}
                            onChange={(e) => setInputVal(e.target.value)}
                            placeholder={t.placeholder}
                            className="w-full bg-transparent text-white px-4 sm:px-6 py-5 font-mono text-sm sm:text-base focus:outline-none placeholder:text-neutral-600 focus:ring-0"
                          />
                        )}

                        <input
                          type="file"
                          ref={fileInputRef}
                          accept={activeScanTab === 'apk' ? '.apk,.bin,image/*' : 'image/*'}
                          className="hidden"
                          onChange={handleFileChange}
                        />

                        <div className="pr-4 shrink-0 flex items-center gap-2">
                          {!isDeepfake && (
                            <button
                              type="button"
                              onClick={() => fileInputRef.current?.click()}
                              title={activeScanTab === 'apk' ? "Upload APK" : "Upload Bukti Screenshot"}
                              className="p-3 text-neutral-400 bg-neutral-800/80 rounded-xl transition-colors shrink-0"
                              onMouseEnter={(e) => e.currentTarget.style.color = c.accent}
                              onMouseLeave={(e) => e.currentTarget.style.color = '#a3a3a3'}
                            >
                              <UploadCloud className="w-5 h-5" />
                            </button>
                          )}
                          <button
                            type="submit"
                            disabled={isDeepfake ? !selectedImage : !inputVal.trim() && !selectedImage}
                            className="px-6 py-3 font-medium rounded-xl transition-colors text-neutral-950 disabled:opacity-50 disabled:shadow-none flex items-center gap-2"
                            style={{
                              backgroundColor: c.accent,
                              boxShadow: !inputVal.trim() && !selectedImage ? 'none' : `0 0 20px ${c.accent}40`,
                            }}
                          >
                            <span className="hidden sm:inline">{isDeepfake ? 'Deteksi' : 'Analyze'}</span>
                            <Zap className="w-4 h-4 sm:hidden" />
                          </button>
                        </div>
                      </div>
                    </div>
                  </form>
                );
              })()}

              {/* ─── FEATURE BADGES ─── */}
              <motion.div key={`badge-${activeScanTab}`} className="flex flex-wrap items-center justify-center gap-3 sm:gap-6 mt-8 text-sm text-neutral-500">
                {(activeScanTab === 'deepfake') && (
                  <>
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-fuchsia-500" /> Face Texture Analysis</span>
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-fuchsia-500" /> GAN Artifact Detection</span>
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-fuchsia-500" /> Lighting Consistency Check</span>
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-fuchsia-500" /> EXIF Metadata Forensics</span>
                  </>
                )}
                {(activeScanTab === 'qris') && (
                  <>
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500" /> QR Code Decoding</span>
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500" /> Merchant Validation</span>
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500" /> Brand Impersonation Check</span>
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-purple-500" /> Community Blacklist</span>
                  </>
                )}
                {(activeScanTab === 'apk') && (
                  <>
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /> Package/Hash Analysis</span>
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /> VirusTotal File Scan</span>
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-amber-500" /> Malware Heuristic Detection</span>
                  </>
                )}
                {(activeScanTab !== 'deepfake' && activeScanTab !== 'qris' && activeScanTab !== 'apk') && (
                  <>
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500/70" /> AI Behavioral Analysis</span>
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500/70" /> Visual Artifact Sandbox</span>
                    <span className="flex items-center gap-2"><div className="w-2 h-2 rounded-full bg-emerald-500/70" /> Live Threat Profiling</span>
                  </>
                )}
              </motion.div>
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

                <div className="space-y-3 font-mono text-sm min-h-[12rem] flex flex-col justify-end relative z-10">
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
              className={cn(
                "w-full max-w-6xl mx-auto",
                shakeCards && "animate-[shake_0.4s_ease-in-out]"
              )}
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

                  {scanResult.analysis_type === 'deepfake' && (
                    <button
                      onClick={() => downloadDeepfakePdf(scanResult, inputVal || (selectedImage ? 'Uploaded Image' : ''))}
                      title="Download PDF Report"
                      className="text-xs font-mono bg-fuchsia-500/10 hover:bg-fuchsia-500/20 text-fuchsia-400 px-3.5 py-1.5 rounded-xl border border-fuchsia-500/20 hover:border-fuchsia-500/40 transition-all flex items-center gap-1.5 active:scale-95"
                    >
                      <FileDown className="w-3.5 h-3.5" /> PDF Report
                    </button>
                  )}
                </div>
              </div>

              {/* Top Row Bento: Target Context & Score */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* 1. Target Context Card (2 cols on lg) */}
                <div className="lg:col-span-2 bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col justify-between relative overflow-hidden min-h-[200px]">
                  <div className="flex items-center gap-2.5 mb-4 border-b border-neutral-800/80 pb-3">
                    {scanResult.analysis_type === 'deepfake' && <ScanFace className="w-5 h-5 text-fuchsia-400" />}
                    {scanResult.analysis_type === 'qris' && <Scan className="w-5 h-5 text-purple-400" />}
                    {scanResult.analysis_type === 'file' && <Package className="w-5 h-5 text-amber-400" />}
                    {(!scanResult.analysis_type || scanResult.analysis_type === 'deepfake') && <ScanSearch className="w-5 h-5 text-cyan-400" />}
                    <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">
                      {scanResult.analysis_type === 'deepfake' && 'Analyzed Image'}
                      {scanResult.analysis_type === 'qris' && 'QRIS Merchant'}
                      {scanResult.analysis_type === 'file' && 'Scanned File'}
                      {(!scanResult.analysis_type || (scanResult.analysis_type !== 'deepfake' && scanResult.analysis_type !== 'qris' && scanResult.analysis_type !== 'file')) && 'Scanned Target'}
                    </span>
                  </div>
                  <div className="flex-1 flex flex-col justify-center">
                    {/* QRIS: show merchant info */}
                    {scanResult.analysis_type === 'qris' && (
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                          <p className="text-[10px] font-mono text-neutral-500 mb-1">MERCHANT</p>
                          <p className="text-sm font-mono text-purple-300 font-medium">{scanResult.merchant || 'Unknown'}</p>
                        </div>
                        <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                          <p className="text-[10px] font-mono text-neutral-500 mb-1">ACQUIRER</p>
                          <p className="text-sm font-mono text-amber-300 font-medium">{scanResult.acquirer || 'Unknown'}</p>
                        </div>
                        <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                          <p className="text-[10px] font-mono text-neutral-500 mb-1">CITY</p>
                          <p className="text-sm font-mono text-cyan-300 font-medium">{scanResult.city || 'Unknown'}</p>
                        </div>
                        <div className="bg-neutral-950 p-3 rounded-xl border border-neutral-800">
                          <p className="text-[10px] font-mono text-neutral-500 mb-1">REPORTS</p>
                          <p className={`text-sm font-mono font-medium ${(scanResult.reportCount || 0) > 0 ? 'text-red-400' : 'text-emerald-400'}`}>
                            {(scanResult.reportCount || 0) > 0 ? `${scanResult.reportCount}x` : 'None'}
                          </p>
                        </div>
                      </div>
                    )}
                    {/* File: show file name + VT stats */}
                    {scanResult.analysis_type === 'file' && (
                      <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800">
                        <p className="text-[10px] font-mono text-neutral-500 mb-1">FILE NAME</p>
                        <p className="text-sm font-mono text-amber-300 font-medium break-all">{scanResult.file_name || 'Unknown'}</p>
                        {scanResult.vt_result && (
                          <div className="mt-2 flex items-center gap-4 text-[10px] font-mono">
                            <span className="text-red-400">{scanResult.vt_result.malicious} malicious</span>
                            <span className="text-amber-400">{scanResult.vt_result.suspicious} suspicious</span>
                            <span className="text-emerald-400">{scanResult.vt_result.harmless || 0} harmless</span>
                            <span className="text-neutral-500">{scanResult.vt_result.total} total</span>
                          </div>
                        )}
                      </div>
                    )}
                    {/* Deepfake / default: show image or text */}
                    {scanResult.analysis_type !== 'qris' && scanResult.analysis_type !== 'file' && (
                      selectedImage ? (
                        <div className="rounded-xl overflow-hidden border border-neutral-800 bg-neutral-950 flex justify-center items-center h-32 relative group">
                          {/* eslint-disable-next-line @next/next/no-img-element */}
                          <img src={selectedImage} alt="Evidence" className="max-h-full object-contain filter group-hover:brightness-50 transition-all" />
                          <div className="absolute inset-0 pointer-events-none border-[3px] border-dashed rounded-xl"
                            style={{ borderColor: scanResult.analysis_type === 'deepfake' ? 'rgba(217,70,239,0.3)' : 'rgba(16,185,129,0.3)' }}
                          />
                        </div>
                      ) : (
                        <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 font-mono text-sm text-emerald-300 break-all select-all font-medium leading-relaxed max-h-[110px] overflow-y-auto">
                          {inputVal}
                        </div>
                      )
                    )}
                  </div>
                  <div className="mt-3 flex items-center justify-between text-[10px] font-mono text-neutral-500 pt-2 border-t border-neutral-800/20">
                    <span>
                      {scanResult.analysis_type === 'deepfake' && 'Image/Face Deepfake Detection'}
                      {scanResult.analysis_type === 'qris' && 'QRIS Payment QR Analysis'}
                      {scanResult.analysis_type === 'file' && 'APK/File Malware Scan'}
                      {(!scanResult.analysis_type || (scanResult.analysis_type !== 'deepfake' && scanResult.analysis_type !== 'qris' && scanResult.analysis_type !== 'file')) && (selectedImage ? 'Image/Screenshot OCR' : 'URL/Text Payload')}
                    </span>
                    <span>VERIX Core Engine v2.5</span>
                  </div>
                </div>

                {/* 2. Threat Severity Score Meter (1 col on lg) */}
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 flex flex-col items-center justify-center text-center relative overflow-hidden min-h-[200px]">
                  <div className="absolute top-0 w-full h-1 shadow-[0_0_20px_var(--tw-shadow-color)]"
                    style={{
                      backgroundColor: scanResult.severity_score >= 80 ? '#ef4444' : scanResult.severity_score >= 50 ? '#f59e0b' : scanResult.analysis_type === 'deepfake' ? '#d946ef' : scanResult.analysis_type === 'qris' ? '#a855f7' : '#10b981',
                      boxShadow: `0 0 20px ${scanResult.severity_score >= 80 ? '#ef4444' : scanResult.severity_score >= 50 ? '#f59e0b' : scanResult.analysis_type === 'deepfake' ? '#d946ef' : scanResult.analysis_type === 'qris' ? '#a855f7' : '#10b981'}`,
                    }}
                  />

                  <p className="text-[10px] font-mono text-neutral-500 mb-3 uppercase tracking-wider">
                    {scanResult.analysis_type === 'deepfake' && 'DEEPFAKE SCORE'}
                    {scanResult.analysis_type === 'qris' && 'QRIS RISK SCORE'}
                    {scanResult.analysis_type === 'file' && 'MALWARE SCORE'}
                    {(!scanResult.analysis_type || (scanResult.analysis_type !== 'deepfake' && scanResult.analysis_type !== 'qris' && scanResult.analysis_type !== 'file')) && 'INTELLIGENCE SCORE'}
                  </p>

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

                  <div className={`px-3.5 py-1 rounded-full text-[9px] font-mono font-bold tracking-widest uppercase border ${scanResult.severity_score >= 80 ? "bg-red-500/10 text-red-400 border-red-500/20" :
                      scanResult.severity_score >= 50 ? "bg-amber-500/10 text-amber-400 border-amber-500/20" :
                        "bg-emerald-500/10 text-emerald-400 border-emerald-500/20"
                    }`}>
                    {scanResult.risk_level} THREAT
                  </div>
                </div>
              </div>

              {/* OSINT ROW: External Intelligence Signals (URL/link scans only) */}
              {scanResult.external_intelligence && scanResult.analysis_type !== 'qris' && (scanResult.analysis_type !== 'file' || scanResult.external_intelligence.virustotal) && Object.keys(scanResult.external_intelligence).length > 0 && (
                <div className="mb-6">
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                    {scanResult.external_intelligence.safe_browsing && (
                      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between min-h-[130px] relative overflow-hidden">
                        <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2">
                          <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1.5">
                            <ShieldAlert className="w-3 h-3 text-emerald-400" /> Google Safe Browsing
                          </span>
                        </div>
                        <div className="my-2">
                          <span className={`text-lg font-bold font-mono tracking-tight ${scanResult.external_intelligence.safe_browsing.includes("BAHAYA") ? "text-red-400" : "text-emerald-400"}`}>
                            {scanResult.external_intelligence.safe_browsing.includes("BAHAYA") ? "MALICIOUS" : "CLEAN"}
                          </span>
                          <p className="text-[9px] text-neutral-500 mt-1 font-sans">{scanResult.external_intelligence.safe_browsing}</p>
                        </div>
                      </div>
                    )}
                    {scanResult.external_intelligence.virustotal && (
                      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between min-h-[130px] relative overflow-hidden">
                        <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2">
                          <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1.5">
                            <Database className="w-3 h-3 text-cyan-400" /> VirusTotal
                          </span>
                          {scanResult.virustotal_raw?.status && (
                            <span className="text-[8px] font-mono text-neutral-500 uppercase">{scanResult.virustotal_raw.status}</span>
                          )}
                        </div>
                        <div className="my-2">
                          {scanResult.virustotal_raw ? (
                            <div className="flex items-baseline gap-1">
                              <span className={`text-lg font-bold font-mono tracking-tight ${scanResult.virustotal_raw.malicious_votes > 0 ? "text-red-400" : "text-emerald-400"}`}>
                                {scanResult.virustotal_raw.malicious_votes}
                              </span>
                              <span className="text-[9px] font-mono text-neutral-500">
                                / {scanResult.virustotal_raw.total_engines} malicious
                              </span>
                            </div>
                          ) : (
                            <span className="text-base font-medium font-mono text-neutral-400">{scanResult.external_intelligence.virustotal}</span>
                          )}
                        </div>
                      </div>
                    )}
                    {scanResult.external_intelligence.urlscan && (
                      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between min-h-[130px] relative overflow-hidden">
                        <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2">
                          <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1.5">
                            <ScanSearch className="w-3 h-3 text-amber-400" /> URLScan.io
                          </span>
                        </div>
                        <div className="my-2">
                          <span className={`text-lg font-bold font-mono tracking-tight ${!scanResult.external_intelligence.urlscan.includes("100") && !scanResult.external_intelligence.urlscan.includes("Clean") ? "text-amber-400" : "text-emerald-400"}`}>
                            {scanResult.external_intelligence.urlscan.includes("85") || scanResult.external_intelligence.urlscan.includes("100") || scanResult.external_intelligence.urlscan.includes("Clean") ? "REPUTABLE" : "SUSPICIOUS"}
                          </span>
                          <p className="text-[9px] text-neutral-500 mt-1 font-sans">{scanResult.external_intelligence.urlscan}</p>
                        </div>
                      </div>
                    )}
                    {scanResult.external_intelligence.urlhaus && (
                      <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-4 flex flex-col justify-between min-h-[130px] relative overflow-hidden">
                        <div className="flex items-center justify-between border-b border-neutral-800/60 pb-2">
                          <span className="text-[10px] text-neutral-400 font-mono flex items-center gap-1.5">
                            <ShieldAlert className="w-3 h-3 text-rose-400" /> Abuse.ch URLhaus
                          </span>
                        </div>
                        <div className="my-2">
                          <span className={`text-lg font-bold font-mono tracking-tight ${scanResult.external_intelligence.urlhaus.includes("TERINFEKSI") ? "text-rose-400" : scanResult.external_intelligence.urlhaus.includes("AMAN") ? "text-emerald-400" : "text-amber-400"}`}>
                            {scanResult.external_intelligence.urlhaus.includes("TERINFEKSI") ? "MALICIOUS" : scanResult.external_intelligence.urlhaus.includes("AMAN") ? "CLEAN" : "UNAVAILABLE"}
                          </span>
                          <p className="text-[9px] text-neutral-500 mt-1 font-sans">{scanResult.external_intelligence.urlhaus}</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Bottom Row Bento: Details, OSINT, & Action Protocols */}
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">

                {/* Column A: AI Explanations & OSINT Badges (2 cols on lg) */}
                <div className="lg:col-span-2 space-y-6">
                  {/* AI Narrative Box */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 relative overflow-hidden group">
                    <div className="relative">
                      {credits === 0 && <AILockOverlay onTopUp={() => setShowTopUpModal(true)} teaserText={scanResult?.behavioral_analysis?.substring(0, 120)} />}
                      <div className={`transition-all duration-300 ${credits === 0 ? 'blur-md opacity-30 select-none pointer-events-none' : ''}`}>
                        <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                          <Brain className="w-48 h-48" />
                        </div>

                        <div className="flex items-center gap-3 mb-6 relative z-10">
                          <span className="w-8 h-8 flex items-center justify-center rounded-lg border"
                            style={{
                              backgroundColor: scanResult.analysis_type === 'deepfake' ? 'rgba(217,70,239,0.1)' : 'rgba(6,182,212,0.1)',
                              color: scanResult.analysis_type === 'deepfake' ? '#d946ef' : '#06b6d4',
                              borderColor: scanResult.analysis_type === 'deepfake' ? 'rgba(217,70,239,0.2)' : 'rgba(6,182,212,0.2)',
                            }}
                          >
                            {scanResult.analysis_type === 'deepfake' ? <ScanFace className="w-4 h-4" /> : <Activity className="w-4 h-4" />}
                          </span>
                          <h3 className="text-lg font-display text-white">
                            {scanResult.analysis_type === 'deepfake' ? 'AI Deepfake Analysis' : 'AI Threat Explanation'}
                          </h3>
                        </div>

                        <p className="text-xl md:text-2xl font-light leading-relaxed text-neutral-200 relative z-10">
                          {scanResult.behavioral_analysis}
                        </p>

                        <div className="mt-8 flex flex-col sm:flex-row gap-4 border-t border-neutral-800/50 pt-6">
                          <div className="flex-1">
                            <p className="text-xs font-mono text-neutral-500 mb-3 uppercase tracking-wider">
                              {scanResult.analysis_type === 'deepfake' && 'DETECTED ARTIFACTS'}
                              {scanResult.analysis_type === 'qris' && 'SECURITY FLAGS'}
                              {scanResult.analysis_type === 'file' && 'VT ENGINE RESULTS'}
                              {(!scanResult.analysis_type || (scanResult.analysis_type !== 'deepfake' && scanResult.analysis_type !== 'qris' && scanResult.analysis_type !== 'file')) && 'PATTERN MATCH'}
                            </p>
                            <div className="flex flex-wrap gap-2">
                              {/* QRIS flags */}
                              {scanResult.analysis_type === 'qris' && Array.isArray(scanResult.flagLabels) && (
                                scanResult.flagLabels.length > 0 ? scanResult.flagLabels.map((label, idx) => (
                                  <div key={idx} className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
                                    <ShieldAlert className="w-3.5 h-3.5 text-purple-500" />
                                    <span className="text-xs font-mono text-purple-100/80">{label}</span>
                                  </div>
                                )) : (
                                  <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
                                    <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500" />
                                    <span className="text-xs font-mono text-emerald-100/80">Tidak ditemukan flag mencurigakan</span>
                                  </div>
                                )
                              )}
                              {/* File: VT engine results */}
                              {scanResult.analysis_type === 'file' && scanResult.vt_result && scanResult.vt_result.total > 0 && (
                                <div className="w-full space-y-1">
                                  <div className="flex items-center gap-3 text-[11px] font-mono">
                                    <span className="text-red-400">Malicious: {scanResult.vt_result.malicious}</span>
                                    <span className="text-amber-400">Suspicious: {scanResult.vt_result.suspicious}</span>
                                    <span className="text-emerald-400">Clean: {scanResult.vt_result.harmless || 0}</span>
                                  </div>
                                  <p className="text-[10px] font-mono text-neutral-500">
                                    {scanResult.vt_result.verdict === 'MALWARE' ? '🚨 File ini terdeteksi sebagai malware oleh beberapa engine' :
                                     scanResult.vt_result.verdict === 'SUSPICIOUS' ? '⚠️ File ini mencurigakan' :
                                     scanResult.vt_result.verdict === 'CLEAN' ? '✅ File ini aman' :
                                     'Tidak dapat memverifikasi'}
                                  </p>
                                </div>
                              )}
                              {/* Deepfake artifacts */}
                              {scanResult.analysis_type === 'deepfake' && Array.isArray(scanResult.detected_artifacts) ? (
                                scanResult.detected_artifacts.length > 0 ? scanResult.detected_artifacts.map((artifact, idx) => (
                                  <div key={idx} className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
                                    <ShieldAlert className="w-3.5 h-3.5 text-fuchsia-500" />
                                    <span className="text-xs font-mono text-fuchsia-100/80">{artifact}</span>
                                  </div>
                                )) : (
                                  <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
                                    <ShieldAlert className="w-3.5 h-3.5 text-fuchsia-500" />
                                    <span className="text-xs font-mono text-fuchsia-100/80">No artifacts detected</span>
                                  </div>
                                )
                              ) : null}
                              {/* Default pattern match */}
                              {!scanResult.analysis_type || (scanResult.analysis_type !== 'deepfake' && scanResult.analysis_type !== 'qris' && scanResult.analysis_type !== 'file') ? (
                                scanResult.similar_patterns && Array.isArray(scanResult.similar_patterns) ? (
                                  scanResult.similar_patterns.map((pattern, idx) => (
                                    <div key={idx} className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
                                      <Network className="w-3.5 h-3.5 text-cyan-500" />
                                      <span className="text-xs font-mono text-cyan-100/80">{pattern}</span>
                                    </div>
                                  ))
                                ) : (
                                  <div className="flex items-center gap-2 bg-neutral-950 px-3 py-1.5 rounded-lg border border-neutral-800">
                                    <Network className="w-3.5 h-3.5 text-cyan-500" />
                                    <span className="text-xs font-mono text-cyan-100/80">{scanResult.similar_pattern || 'No Pattern Match'}</span>
                                  </div>
                                )
                              ) : null}
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>

                    {/* EXIF Trace (Deepfake only) */}
                    {scanResult.analysis_type === 'deepfake' && scanResult.exif && (
                      <div className="mt-6 border-t border-neutral-800/50 pt-6">
                        <p className="text-xs font-mono text-neutral-500 mb-3 uppercase tracking-wider flex items-center gap-2">
                          <Database className="w-3.5 h-3.5" /> EXIF METADATA ANALYSIS
                        </p>
                        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-4 space-y-2">
                          <div className="flex items-center gap-2">
                            <span className="text-[10px] font-mono text-neutral-500">Status:</span>
                            <span className={`text-[11px] font-mono ${scanResult.exif.suspicious ? 'text-rose-400' : 'text-emerald-400'}`}>
                              {scanResult.exif.suspicious ? '⚠ Suspicious' : '✅ Normal'}
                            </span>
                          </div>
                          {scanResult.exif.software && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-neutral-500">Software:</span>
                              <span className="text-[11px] font-mono text-neutral-300 truncate">{scanResult.exif.software}</span>
                            </div>
                          )}
                          {scanResult.exif.make && (
                            <div className="flex items-center gap-2">
                              <span className="text-[10px] font-mono text-neutral-500">Device:</span>
                              <span className="text-[11px] font-mono text-neutral-300 truncate">{scanResult.exif.make} {scanResult.exif.model || ''}</span>
                            </div>
                          )}
                          {scanResult.exif.editingTraces.length > 0 && (
                            <div className="pt-2 border-t border-neutral-800/40">
                              <p className="text-[10px] font-mono text-neutral-500 mb-1.5">Traces:</p>
                              <div className="space-y-1">
                                {scanResult.exif.editingTraces.map((trace, idx) => (
                                  <div key={idx} className="flex items-start gap-2">
                                    <span className="text-[10px] font-mono text-neutral-400">{'>'}</span>
                                    <span className="text-[10px] font-mono text-neutral-400">{trace}</span>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* External Intelligence Block was moved to top section */}
                  </div>
                </div>

                {/* Column B: Vectors & Recommended Protocols (1 col on lg) */}
                <div className="space-y-6">
                  {/* Deepfake Signs / Taktik Manipulasi / QRIS Flags */}
                  <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-6 relative overflow-hidden">
                    {credits === 0 && <AILockOverlay onTopUp={() => setShowTopUpModal(true)} />}
                    <div className={`transition-all duration-300 ${credits === 0 ? 'blur-md opacity-30 select-none pointer-events-none' : ''}`}>
                      <div className="flex items-center justify-between mb-4">
                        <h3 className="text-sm font-mono text-neutral-500 flex items-center gap-2">
                          {scanResult.analysis_type === 'deepfake' && <><ScanFace className="w-4 h-4 text-fuchsia-400" /> DEEPFAKE SIGNS</>}
                          {scanResult.analysis_type === 'qris' && <><Scan className="w-4 h-4 text-purple-400" /> QRIS FLAGS</>}
                          {scanResult.analysis_type === 'file' && <><Package className="w-4 h-4 text-amber-400" /> VERDICT</>}
                          {(!scanResult.analysis_type || (scanResult.analysis_type !== 'deepfake' && scanResult.analysis_type !== 'qris' && scanResult.analysis_type !== 'file')) && <><Radar className="w-4 h-4" /> VECTORS</>}
                        </h3>
                      </div>
                      <div className="flex flex-wrap gap-2">
                        {/* QRIS: show flags as badges */}
                        {scanResult.analysis_type === 'qris' && Array.isArray(scanResult.flags) && scanResult.flags.map((flag, idx) => (
                          <span key={idx} className="bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs font-mono text-neutral-300 flex items-center gap-2">
                            <div className="w-1.5 h-1.5 rounded-full bg-purple-500" />
                            {flag}
                          </span>
                        ))}
                        {/* File: show VT verdict */}
                        {scanResult.analysis_type === 'file' && scanResult.vt_result && (
                          <span className="bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs font-mono text-neutral-300 flex items-center gap-2">
                            <div className={`w-1.5 h-1.5 rounded-full ${scanResult.vt_result.verdict === 'MALWARE' ? 'bg-red-500' : scanResult.vt_result.verdict === 'SUSPICIOUS' ? 'bg-amber-500' : 'bg-emerald-500'}`} />
                            {scanResult.vt_result.verdict}
                          </span>
                        )}
                        {/* Default: manipulation tactics */}
                        {(!scanResult.analysis_type || (scanResult.analysis_type !== 'deepfake' && scanResult.analysis_type !== 'qris' && scanResult.analysis_type !== 'file')) && (
                          scanResult.manipulation_tactics.map((tactic, idx) => (
                            <span key={idx} className="bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs font-mono text-neutral-300 flex items-center gap-2">
                              <div className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                              {tactic}
                            </span>
                          ))
                        )}
                        {/* Deepfake: show deepfake signs */}
                        {scanResult.analysis_type === 'deepfake' && (
                          <>
                            {scanResult.face_detected !== undefined && (
                              <span className="bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs font-mono text-neutral-300 flex items-center gap-2">
                                <div className={`w-1.5 h-1.5 rounded-full ${scanResult.face_detected ? 'bg-fuchsia-500' : 'bg-emerald-500'}`} />
                                {scanResult.face_detected ? 'Face Detected' : 'No Face'}
                              </span>
                            )}
                            {scanResult.confidence_level && (
                              <span className="bg-neutral-950 border border-neutral-800 px-3 py-1.5 rounded-lg text-xs font-mono text-neutral-300 flex items-center gap-2">
                                <div className="w-1.5 h-1.5 rounded-full bg-fuchsia-500" />
                                Confidence: {scanResult.confidence_level}
                              </span>
                            )}
                          </>
                        )}
                      </div>

                      <div className="mt-6 pt-6 border-t border-neutral-800">
                        <h3 className="text-sm font-mono text-neutral-500 mb-3 flex items-center gap-2"><Crosshair className="w-4 h-4" /> RED FLAGS</h3>
                        <ul className="space-y-2">
                          {/* QRIS: show flagLabels */}
                          {scanResult.analysis_type === 'qris' && Array.isArray(scanResult.flagLabels) && scanResult.flagLabels.map((label, idx) => (
                            <li key={idx} className="text-xs text-red-400/90 flex items-start gap-2">
                              <span className="text-red-500 mt-0.5 shrink-0">✗</span> {label}
                            </li>
                          ))}
                          {/* Default: show red flags */}
                          {(!scanResult.analysis_type || scanResult.analysis_type !== 'qris') && (
                            Array.isArray(scanResult.red_flags) ? scanResult.red_flags.map((flag, idx) => (
                              <li key={idx} className="text-xs text-red-400/90 flex items-start gap-2">
                                <span className="text-red-500 mt-0.5 shrink-0">✗</span> {flag}
                              </li>
                            )) : (
                              <li className="text-xs font-mono text-neutral-500">No red flags detected.</li>
                            )
                          )}
                          {scanResult.analysis_type === 'qris' && (!scanResult.flagLabels || scanResult.flagLabels.length === 0) && (
                            <li className="text-xs font-mono text-neutral-500">Tidak ada flag mencurigakan.</li>
                          )}
                        </ul>
                      </div>
                    </div>
                  </div>

                  {/* Rekomendasi / Protection Protocol */}
                  <div className={cn("rounded-3xl p-6 relative overflow-hidden border",
                    scanResult.analysis_type === 'deepfake' ? 'bg-fuchsia-950/20 border-fuchsia-900/30' :
                    scanResult.analysis_type === 'qris' ? 'bg-purple-950/20 border-purple-900/30' :
                    scanResult.analysis_type === 'file' ? 'bg-amber-950/20 border-amber-900/30' :
                    'bg-emerald-950/20 border-emerald-900/30')}>
                    {credits === 0 && <AILockOverlay onTopUp={() => setShowTopUpModal(true)} />}
                    <div className={`transition-all duration-300 ${credits === 0 ? 'blur-md opacity-30 select-none pointer-events-none' : ''}`}>
                      <h3 className={cn("text-sm font-mono mb-4 flex items-center gap-2",
                        scanResult.analysis_type === 'deepfake' ? 'text-fuchsia-500/70' :
                        scanResult.analysis_type === 'qris' ? 'text-purple-500/70' :
                        scanResult.analysis_type === 'file' ? 'text-amber-500/70' :
                        'text-emerald-500/70')}>
                        <Lock className="w-4 h-4" /> {scanResult.analysis_type === 'deepfake' ? 'PROTECTION PROTOCOL' : scanResult.analysis_type === 'qris' ? 'QRIS SAFETY PROTOCOL' : scanResult.analysis_type === 'file' ? 'FILE SAFETY PROTOCOL' : 'ACTION PROTOCOL'}
                      </h3>
                      <ul className="space-y-3">
                        {scanResult.recommended_actions.map((action, idx) => (
                          <li key={idx} className={cn("text-sm flex items-start gap-3 p-3 rounded-xl border",
                            scanResult.analysis_type === 'deepfake' ? 'text-fuchsia-100/90 bg-fuchsia-900/10 border-fuchsia-500/10' :
                            scanResult.analysis_type === 'qris' ? 'text-purple-100/90 bg-purple-900/10 border-purple-500/10' :
                            scanResult.analysis_type === 'file' ? 'text-amber-100/90 bg-amber-900/10 border-amber-500/10' :
                            'text-emerald-100/90 bg-emerald-900/10 border-emerald-500/10')}>
                            <span className={cn("w-5 h-5 rounded-full flex items-center justify-center shrink-0 text-xs font-bold border",
                              scanResult.analysis_type === 'deepfake' ? 'bg-fuchsia-500/20 text-fuchsia-400 border-fuchsia-500/30' :
                              scanResult.analysis_type === 'qris' ? 'bg-purple-500/20 text-purple-400 border-purple-500/30' :
                              scanResult.analysis_type === 'file' ? 'bg-amber-500/20 text-amber-400 border-amber-500/30' :
                              'bg-emerald-500/20 text-emerald-400 border-emerald-500/30')}>
                              {idx + 1}
                            </span>
                            <span className="leading-tight pt-0.5 break-words">{action}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>

              </div>

              {/* Security Vendors Analysis — VirusTotal (URL/link scans only) */}
              {scanResult.virustotal_raw?.engineResults && scanResult.virustotal_raw.engineResults.length > 0 && scanResult.analysis_type !== 'qris' && scanResult.analysis_type !== 'file' && scanResult.analysis_type !== 'deepfake' && (
                <div className="bg-neutral-900 border border-neutral-800 rounded-3xl overflow-hidden">
                  <div className="flex items-center gap-2.5 px-6 py-4 border-b border-neutral-800/80">
                    <Database className="w-4 h-4 text-cyan-400" />
                    <span className="text-xs font-mono text-neutral-400 uppercase tracking-wider">Security Vendors Analysis — VirusTotal ({scanResult.virustotal_raw.engineResults.length} engines)</span>
                  </div>
                  <div className="overflow-x-auto no-scrollbar">
                    <table className="w-full text-xs font-mono">
                      <thead>
                        <tr className="border-b border-neutral-800/40 bg-neutral-950/30">
                          <th className="text-left px-6 py-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">Security Vendor</th>
                          <th className="text-left px-6 py-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">Status</th>
                          <th className="text-left px-6 py-3 text-[10px] text-neutral-500 uppercase tracking-wider font-medium">Result</th>
                        </tr>
                      </thead>
                      <tbody>
                        {scanResult.virustotal_raw.engineResults.map((vendor, idx) => {
                          const isMalicious = vendor.category === 'malicious';
                          const isSuspicious = vendor.category === 'suspicious';
                          const isHarmless = vendor.category === 'harmless';
                          const rowColor = isMalicious ? 'bg-red-950/10' : isSuspicious ? 'bg-amber-950/10' : isHarmless ? 'bg-emerald-950/10' : '';
                          const dotColor = isMalicious ? 'bg-red-500' : isSuspicious ? 'bg-amber-500' : isHarmless ? 'bg-emerald-500' : 'bg-neutral-600';
                          const textColor = isMalicious ? 'text-red-400' : isSuspicious ? 'text-amber-400' : isHarmless ? 'text-emerald-400' : 'text-neutral-500';
                          return (
                            <tr key={idx} className={`border-b border-neutral-800/20 hover:bg-neutral-800/20 transition-colors ${rowColor}`}>
                              <td className="px-6 py-3 text-neutral-200 font-medium">{vendor.engine}</td>
                              <td className="px-6 py-3">
                                <span className={`inline-flex items-center gap-1.5 ${textColor}`}>
                                  <span className={`w-1.5 h-1.5 rounded-full ${dotColor}`} />
                                  {vendor.category.toUpperCase()}
                                </span>
                              </td>
                              <td className="px-6 py-3 text-neutral-400">{vendor.result || '—'}</td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}
            </motion.div>
          )}
        </AnimatePresence>

        {/* <ScanHistorySection /> */}
      </div>
      <CreditTopUpModal
        isOpen={showTopUpModal}
        onClose={() => setShowTopUpModal(false)}
        user={user as Record<string, unknown> | null}
        topUpCredits={topUpCredits}
        credits={credits}
        onLogin={login}
      />
      <ScanResultToast
        result={toastResult}
        visible={showToast}
        onClose={() => setShowToast(false)}
      />
    </div>
  );
}

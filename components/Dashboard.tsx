'use client';

import { motion } from 'motion/react';
import { ArrowRight, ShieldAlert, Zap, Lock, Smartphone, FileWarning, Eye, UploadCloud, Search, AlertCircle, BarChart3, Users, MessageSquare, Link2, Radar, MessageCircle, Image as ImageIcon, ShoppingBag, Mic, CreditCard, Shield } from 'lucide-react';
import { LightRays } from './ui/light-rays';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { cn } from '@/lib/utils';
import { useAuth } from './FirebaseProvider';
import { IndonesiaMap } from './ui/IndonesiaMap';

// Premium UI Primitives
import { Spotlight } from './ui/Spotlight';
import { BorderBeam } from './ui/BorderBeam';
import { Meteors } from './ui/Meteors';
import { AuroraBackground } from './ui/AuroraBackground';
import { AnimatedBeam } from './ui/AnimatedBeam';
import { ShineCard, ShineCardContainer } from './ui/ShineCard';

// Coordinates index for stable ID jitter mapping
const REGION_COORDS: Record<string, [number, number]> = {
  "Jakarta": [106.8229, -6.1944],
  "Jawa Barat": [107.6191, -6.9175],
  "Jawa Timur": [112.7508, -7.2504],
  "Jawa Tengah": [110.4208, -6.9932],
  "Sumatera Utara": [98.6722, 3.5952],
  "Sulawesi Selatan": [119.4327, -5.1477],
  "Bali": [115.2167, -8.6500],
  "Kalimantan Timur": [117.1536, -0.5022]
};

// Stable coordinate jitter helper so multiple threats in same region don't stack directly
function getJitteredCoords(regionName: string, id: string): [number, number] {
  const base = REGION_COORDS[regionName] || [118, -2];
  let hash = 0;
  for (let i = 0; i < id.length; i++) {
    hash = id.charCodeAt(i) + ((hash << 5) - hash);
  }
  const jitterX = ((hash % 100) / 100 - 0.5) * 0.45;
  const jitterY = (((hash >> 8) % 100) / 100 - 0.5) * 0.45;
  return [base[0] + jitterX, base[1] + jitterY];
}

// Map keywords to Indonesian map provinces
function parseRegionFromTitle(title: string, link: string): string {
  const lower = (title + " " + link).toLowerCase();
  if (lower.includes("jakarta") || lower.includes("jkt") || lower.includes("jabodetabek") || lower.includes("raya")) return "Jakarta";
  if (lower.includes("jawa barat") || lower.includes("jabar") || lower.includes("bandung") || lower.includes("depok") || lower.includes("bogor") || lower.includes("bekasi")) return "Jawa Barat";
  if (lower.includes("jawa timur") || lower.includes("jatim") || lower.includes("surabaya") || lower.includes("malang") || lower.includes("sidoarjo")) return "Jawa Timur";
  if (lower.includes("jawa tengah") || lower.includes("jateng") || lower.includes("semarang") || lower.includes("solo") || lower.includes("yogyakarta") || lower.includes("jogja")) return "Jawa Tengah";
  if (lower.includes("sumatera utara") || lower.includes("sumut") || lower.includes("medan") || lower.includes("deliserdang")) return "Sumatera Utara";
  if (lower.includes("sulawesi selatan") || lower.includes("sulsel") || lower.includes("makassar")) return "Sulawesi Selatan";
  if (lower.includes("bali") || lower.includes("denpasar") || lower.includes("kuta")) return "Bali";
  if (lower.includes("kalimantan timur") || lower.includes("kaltim") || lower.includes("samarinda") || lower.includes("balikpapan")) return "Kalimantan Timur";

  const INDO_REGIONS_LIST = ["Jakarta", "Jawa Barat", "Jawa Timur", "Jawa Tengah", "Sumatera Utara", "Sulawesi Selatan", "Bali", "Kalimantan Timur"];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % INDO_REGIONS_LIST.length;
  return INDO_REGIONS_LIST[index];
}

function HeroSection({ setActiveTab }: { setActiveTab: (id: string) => void }) {
  const { user, login } = useAuth();
  const videoRef = React.useRef<HTMLVideoElement>(null);
  const [videoLoaded, setVideoLoaded] = useState(false);

  React.useEffect(() => {
    if (videoRef.current) {
      // Force play on mount/hydration
      videoRef.current.defaultMuted = true;
      videoRef.current.muted = true;

      const playVideo = () => {
        videoRef.current?.play().catch((err) => {
          console.warn("Video autoPlay failed or was blocked by browser. This is normal for some browser settings, we will try again on user interaction.", err);
        });
      };

      playVideo();

      // Also try to play on any first interaction if blocked
      const handleInteraction = () => {
        if (videoRef.current && videoRef.current.paused) {
          videoRef.current.play().catch(() => { });
        }
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('touchstart', handleInteraction);
      };

      document.addEventListener('click', handleInteraction);
      document.addEventListener('touchstart', handleInteraction);

      return () => {
        document.removeEventListener('click', handleInteraction);
        document.removeEventListener('touchstart', handleInteraction);
      };
    }
  }, []);

  return (
    <section className="relative pb-12 flex flex-col items-center justify-between text-center overflow-hidden min-h-screen w-full">

      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        onLoadedData={() => setVideoLoaded(true)}
        className={cn(
          "absolute inset-0 w-full h-full object-cover z-0 pointer-events-none transition-opacity duration-1000",
          videoLoaded ? "opacity-40" : "opacity-0"
        )}
      >
        <source src="/hero-section.mp4" type="video/mp4" />
      </video>

      {/* Ambient green center glow */}
      <div className="absolute top-1/3 left-1/2 -translate-x-1/2 w-[600px] h-[600px] bg-emerald-500/[0.03] blur-[150px] rounded-full pointer-events-none animate-pulse-slow z-0" />

      {/* Bottom green linear glow line */}
      <div className="absolute bottom-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/35 to-transparent z-20" />

      {/* Aurora Background Overlay with Content */}
      <AuroraBackground className="relative z-10 w-full flex-1 flex flex-col items-center justify-center">
        <div className="relative z-10 w-full max-w-6xl mx-auto flex-1 flex flex-col items-center justify-center text-center px-4 py-16">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, ease: "easeOut" }}
            className="inline-flex items-center space-x-3 bg-neutral-900/80 backdrop-blur-md border border-neutral-800/80 rounded-full px-5 py-2 mb-8 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
          >
            <div className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
            </div>
            <span className="text-[10px] md:text-xs font-mono text-emerald-400 font-medium tracking-widest uppercase">JARINGAN ANCAMAN REALTIME AKTIF</span>
          </motion.div>

          <motion.h1
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
            className="text-5xl sm:text-6xl md:text-8xl font-display font-medium tracking-tight mb-8 max-w-6xl leading-[1.05]"
          >
            Deteksi Penipuan <br className="hidden md:block" />
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-neutral-500">Sebelum Mereka Mendeteksi Anda.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-neutral-400 max-w-3xl mb-14 leading-relaxed font-light"
          >
            VERIX menggabungkan AI dan sistem keamanan nyata untuk melindungi Anda dari phishing, penipuan, dan ancaman digital secara real-time.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.3, ease: "easeOut" }}
            className="flex flex-col sm:flex-row gap-5 w-full sm:w-auto px-4 relative z-20"
          >
            {user ? (
              <button onClick={() => setActiveTab('scanner')} className="group relative w-full sm:w-auto bg-white text-neutral-950 px-10 py-4 rounded-xl font-medium hover:bg-neutral-200 transition-colors flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.15)] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-600/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="relative z-10 font-semibold tracking-wide text-sm md:text-base">Mulai Analisis</span>
                <ArrowRight className="w-5 h-5 text-emerald-600 relative z-10 group-hover:translate-x-1 transition-transform" />
              </button>
            ) : (
              <button onClick={() => login()} className="group relative w-full sm:w-auto bg-white text-neutral-950 px-10 py-4 rounded-xl font-medium hover:bg-neutral-200 transition-colors flex items-center justify-center gap-3 shadow-[0_0_40px_rgba(255,255,255,0.15)] overflow-hidden">
                <div className="absolute inset-0 bg-gradient-to-r from-transparent via-emerald-600/10 to-transparent -translate-x-full group-hover:animate-[shimmer_1.5s_infinite]" />
                <span className="relative z-10 font-semibold tracking-wide text-sm md:text-base">Login</span>
                <ArrowRight className="w-5 h-5 text-emerald-600 relative z-10 group-hover:translate-x-1 transition-transform" />
              </button>
            )}
            <button
              onClick={() => setActiveTab('scanner')}
              className="w-full sm:w-auto bg-neutral-900/80 backdrop-blur-md text-white px-10 py-4 rounded-xl font-medium hover:bg-neutral-800 transition-all duration-300 border border-neutral-800 hover:border-neutral-700 flex items-center justify-center gap-3 group shadow-xl"
            >
              <Zap className="w-5 h-5 text-emerald-400 group-hover:text-emerald-300 transition-colors" />
              <span className="tracking-wide text-sm md:text-base">Mulai Analisa</span>
            </button>
          </motion.div>
        </div>
      </AuroraBackground>

      {/* LiveScamRadar at the bottom sharing video bg */}
      <div className="w-full relative z-20">
        <LiveScamRadar />
      </div>
    </section>
  );
}

import { useIntel } from './IntelligenceProvider';

function getRelativeTime(dateStr: string) {
  try {
    const published = new Date(dateStr);
    const diffMs = Date.now() - published.getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch (e) {
    return 'Baru saja';
  }
}

const getSourceLabel = (src: string) => {
  if (src.includes('turnbackhoax')) return 'TurnBackHoax';
  if (src.includes('google')) return 'Google News';
  if (src.includes('kominfo')) return 'Kominfo';
  return src;
};

function LiveScamRadar() {
  const intel = useIntel();

  const fallbackAlerts = [
    {
      title: 'Phishing BCA Mobile Clone Menyasar Nasabah',
      source: 'turnbackhoax.id',
      link: 'https://turnbackhoax.id/?s=bca',
      severity: 'critical',
      time: '5m ago',
      type: 'Phishing'
    },
    {
      title: 'Penyebaran APK Undangan Pernikahan Palsu di WA',
      source: 'kominfo.go.id',
      link: 'https://www.kominfo.go.id',
      severity: 'danger',
      time: '12m ago',
      type: 'APK Malware'
    },
    {
      title: 'Voice Cloning (Deepfake) Modus Minta Uang',
      source: 'turnbackhoax.id',
      link: 'https://turnbackhoax.id/?s=deepfake',
      severity: 'warning',
      time: '25m ago',
      type: 'Social Engineering'
    },
    {
      title: 'Penipuan Lowongan Kerja Like & Share Telegram',
      source: 'news.google.com',
      link: 'https://news.google.com',
      severity: 'warning',
      time: '40m ago',
      type: 'Job Scam'
    },
    {
      title: 'Situs Palsu Donasi Masjid Raya QRIS Palsu',
      source: 'turnbackhoax.id',
      link: 'https://turnbackhoax.id/?s=qris',
      severity: 'critical',
      time: '1h ago',
      type: 'QRIS Manipulation'
    }
  ];

  let alerts = fallbackAlerts;

  if (intel?.data && intel.data.length > 0) {
    alerts = intel.data.map((item: any) => {
      let severity = 'warning';
      if (item.severity === 'CRITICAL') severity = 'critical';
      else if (item.severity === 'HIGH') severity = 'danger';
      else if (item.severity === 'MEDIUM') severity = 'warning';
      else severity = 'info';

      return {
        title: item.title,
        source: item.source || 'news.google.com',
        link: item.link || '#',
        severity,
        time: getRelativeTime(item.publishedAt),
        type: item.type || 'Threat'
      };
    });
  }

  const doubledAlerts = [...alerts, ...alerts];

  return (
    <div className="py-6 bg-neutral-950/20 backdrop-blur-md border-t border-neutral-800/40 relative z-20 overflow-hidden w-full">
      <div className="w-full overflow-hidden relative flex items-center h-full">
        {/* Progressive blur overlays */}
        <div
          className="absolute left-0 top-0 bottom-0 w-16 sm:w-36 pointer-events-none z-30"
          style={{
            backdropFilter: 'blur(8px)',
            maskImage: 'linear-gradient(to right, rgba(0,0,0,1), rgba(0,0,0,0))',
            WebkitMaskImage: 'linear-gradient(to right, rgba(0,0,0,1), rgba(0,0,0,0))'
          }}
        />
        <div
          className="absolute right-0 top-0 bottom-0 w-16 sm:w-36 pointer-events-none z-30"
          style={{
            backdropFilter: 'blur(8px)',
            maskImage: 'linear-gradient(to left, rgba(0,0,0,1), rgba(0,0,0,0))',
            WebkitMaskImage: 'linear-gradient(to left, rgba(0,0,0,1), rgba(0,0,0,0))'
          }}
        />

        {/* Scrolling Ticker view */}
        <div
          className="w-full overflow-hidden relative flex items-center"
          style={{
            maskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)',
            WebkitMaskImage: 'linear-gradient(to right, transparent, black 8%, black 92%, transparent)'
          }}
        >
          <div className="flex gap-4 w-max animate-marquee hover-pause py-2 px-6">
            {doubledAlerts.map((alert: any, i: number) => (
              <a
                key={i}
                href={alert.link}
                target="_blank"
                rel="noopener noreferrer"
                className="flex-shrink-0 flex items-center gap-4 bg-neutral-900/50 backdrop-blur-sm border border-neutral-800/80 hover:border-neutral-700/80 hover:bg-neutral-800/60 rounded-xl px-5 py-3 transition-all duration-300 group shadow-md relative z-20"
              >
                <div className="flex items-center gap-3">
                  <div className="p-2 rounded-lg bg-neutral-950 border border-neutral-800 group-hover:border-neutral-700 transition-colors">
                    {alert.severity === 'critical' ? (
                      <ShieldAlert className="w-4 h-4 text-red-500 animate-pulse" />
                    ) : alert.severity === 'danger' ? (
                      <FileWarning className="w-4 h-4 text-amber-500" />
                    ) : alert.severity === 'warning' ? (
                      <AlertCircle className="w-4 h-4 text-yellow-500" />
                    ) : (
                      <Radar className="w-4 h-4 text-blue-500" />
                    )}
                  </div>
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <span className="text-[9px] font-mono bg-neutral-950 border border-neutral-800 px-2 py-0.5 rounded text-neutral-400 uppercase tracking-wider">
                        {alert.type}
                      </span>
                      <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${alert.source.includes('turnbackhoax')
                        ? 'bg-red-500/10 text-red-400 border-red-500/20'
                        : alert.source.includes('kominfo')
                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                          : 'bg-blue-500/10 text-blue-400 border-blue-500/20'
                        }`}>
                        {getSourceLabel(alert.source)}
                      </span>
                    </div>
                    <p className="text-sm font-medium text-neutral-200 group-hover:text-white transition-colors max-w-[280px] sm:max-w-[320px] truncate">
                      {alert.title}
                    </p>
                  </div>
                </div>
                <div className="flex flex-col items-end gap-1 border-l border-neutral-800/60 pl-4 h-full justify-center">
                  <span className="text-[10px] font-mono text-neutral-500">
                    {alert.time}
                  </span>
                  <span className="text-[9px] font-mono text-emerald-400 flex items-center gap-0.5 group-hover:underline">
                    BUKA <ArrowRight className="w-2.5 h-2.5" />
                  </span>
                </div>
              </a>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function BentoGrid() {
  return (
    <section className="py-32 max-w-7xl mx-auto px-6 relative">
      {/* Ambient glows */}
      <div className="absolute top-0 left-10 right-10 h-[1.5px] bg-gradient-to-r from-transparent via-emerald-500/40 to-transparent" />
      <div className="absolute -top-40 left-10 w-[500px] h-[500px] bg-emerald-500/[0.03] blur-[130px] rounded-full pointer-events-none animate-pulse-slow" />
      <div className="absolute -bottom-40 right-10 w-[500px] h-[500px] bg-blue-500/[0.03] blur-[130px] rounded-full pointer-events-none animate-pulse-slow" />

      <div className="text-center mb-24 relative">
        <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] w-80 h-80 mx-auto rounded-full -top-20 pointer-events-none" />
        <span className="inline-flex items-center gap-2 bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-full px-4 py-1.5 mb-6 text-[10px] font-mono text-emerald-400 font-medium tracking-wider uppercase">
          Fitur Keamanan Terpadu
        </span>
        <h2 className="text-4xl md:text-6xl font-display font-medium tracking-tight mb-6">
          Satu Platform. Perlindungan Total.
        </h2>
        <p className="text-neutral-400 text-lg max-w-2xl mx-auto leading-relaxed">
          VERIX memadukan kecerdasan buatan analitis dan proteksi deterministik untuk membongkar scam sebelum merugikan Anda.
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-auto">

        {/* 1. Real-Time Threat Detection */}
        <div className="group relative rounded-3xl border border-neutral-800/80 bg-neutral-900 hover:bg-neutral-800/85 transition-all duration-500 p-8 flex flex-col justify-between overflow-hidden md:col-span-2 min-h-[380px]">
          <BorderBeam colorFrom="#10b981" colorTo="#3b82f6" duration={10} borderWidth={1.5} />
          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6">
                <Radar className="w-5 h-5 text-emerald-400" />
              </div>
              <span className="text-xs font-mono text-emerald-400 uppercase tracking-widest font-semibold">01. INTI MESIN</span>
              <h3 className="text-2xl font-display font-medium text-white tracking-tight mt-2 mb-3">Deteksi Ancaman Real-Time</h3>
              <p className="text-neutral-400 text-sm mb-4">"Pindai apa saja. Ketahui seketika."</p>
              <ul className="space-y-2 text-neutral-500 text-xs">
                <li className="flex items-center gap-2">✓ Analisis URL, teks, dan screenshot dalam hitungan detik</li>
                <li className="flex items-center gap-2">✓ Hybrid engine (rule-based + AI) untuk akurasi tinggi</li>
                <li className="flex items-center gap-2">✓ Deteksi phishing, scam, malware, dan social engineering</li>
                <li className="flex items-center gap-2">✓ Tidak bergantung sepenuhnya pada AI (anti-halusinasi)</li>
              </ul>
            </div>

            {/* Visual element: scanning mock */}
            <div className="bg-neutral-950/80 border border-neutral-900/40 p-4 rounded-xl flex items-center justify-between text-xs font-mono mt-auto">
              <div className="flex items-center gap-3">
                <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
                <span className="text-neutral-400 truncate max-w-[200px] sm:max-w-xs">https://bca-klik-auth.secure-login.id</span>
              </div>
              <span className="text-emerald-400 font-bold">TERDUGA PHISHING</span>
            </div>

            <p className="text-[11px] text-neutral-600 font-mono italic mt-4">
              "Bukan sekadar AI ini sistem analisis keamanan."
            </p>
          </div>
        </div>

        {/* 2. VERIX Pulse (Live Threat Intelligence) */}
        <div className="group relative rounded-3xl border border-neutral-800/80 bg-neutral-900 hover:bg-neutral-800/85 transition-all duration-500 p-8 flex flex-col justify-between overflow-hidden md:col-span-1 min-h-[380px]">
          <Meteors number={10} />
          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6">
                <Radar className="w-5 h-5 text-amber-400 animate-pulse" />
              </div>
              <span className="text-xs font-mono text-amber-400 uppercase tracking-widest font-semibold">02. DENYUT ANCAMAN</span>
              <h3 className="text-2xl font-display font-medium text-white tracking-tight mt-2 mb-3">VERIX Pulse</h3>
              <p className="text-neutral-400 text-sm mb-4">"Lihat apa yang sedang terjadi."</p>
              <ul className="space-y-2 text-neutral-500 text-xs">
                <li className="flex items-center gap-2">✓ Feed ancaman real-time (Abuse.ch + PhishTank + lokal)</li>
                <li className="flex items-center gap-2">✓ Hotspot scam di Indonesia</li>
                <li className="flex items-center gap-2">✓ AI situational report harian</li>
              </ul>
            </div>

            {/* Live Indicator */}
            <div className="flex items-center gap-4 bg-neutral-950/60 p-3.5 border border-neutral-900 rounded-xl mt-auto z-10">
              <span className="flex h-2.5 w-2.5 relative">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500"></span>
              </span>
              <div className="text-left">
                <p className="text-[10px] font-mono text-neutral-400 uppercase">ANCAMAN AKTIF TERDETEKSI</p>
                <p className="text-xs font-semibold text-white truncate max-w-[150px]">Phishing Tagihan Listrik PLN (.APK)</p>
              </div>
            </div>

            <p className="text-[11px] text-neutral-600 font-mono italic mt-4">
              "Radar ancaman digital."
            </p>
          </div>
        </div>

        {/* 3. Cybersecurity Reports */}
        <ShineCardContainer className="col-span-1 md:col-span-1 min-h-[380px]">
          <ShineCard glowColor="rgba(16, 185, 129, 0.1)">
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6">
                  <BarChart3 className="w-5 h-5 text-teal-400" />
                </div>
                <span className="text-xs font-mono text-teal-400 uppercase tracking-widest font-semibold">03. INTELIJEN</span>
                <h3 className="text-xl font-display font-medium text-white tracking-tight mt-2 mb-2">Laporan Keamanan Siber</h3>
                <p className="text-neutral-400 text-xs mb-4">"Setiap pindaian menjadi intelijen."</p>
                <ul className="space-y-1.5 text-neutral-500 text-[11px]">
                  <li className="flex items-center gap-1">✓ Riwayat scan lengkap dengan risk scoring</li>
                  <li className="flex items-center gap-1">✓ Detail red flags & indikator teknis</li>
                  <li className="flex items-center gap-1">✓ Export laporan (bukti hukum / edukasi)</li>
                  <li className="flex items-center gap-1">✓ Insight tren serangan personal</li>
                </ul>
              </div>

              <p className="text-[10px] text-neutral-600 font-mono italic mt-6">
                "Dari satu scan → jadi insight."
              </p>
            </div>
          </ShineCard>
        </ShineCardContainer>

        {/* 4. AI-Powered Explanation */}
        <div className="group relative rounded-3xl border border-neutral-800/80 bg-neutral-900 hover:bg-neutral-800/85 transition-all duration-500 p-8 flex flex-col justify-between overflow-hidden md:col-span-2 min-h-[380px]">
          <Spotlight fill="rgba(59, 130, 246, 0.12)" />
          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6">
                <Eye className="w-5 h-5 text-blue-400" />
              </div>
              <span className="text-xs font-mono text-blue-400 uppercase tracking-widest font-semibold">04. AI PENJELASAN</span>
              <h3 className="text-2xl font-display font-medium text-white tracking-tight mt-2 mb-3">Penjelasan Bertenaga AI</h3>
              <p className="text-neutral-400 text-sm mb-4">"Pahami ancaman layaknya seorang analis."</p>
              <ul className="space-y-2 text-neutral-500 text-xs">
                <li className="flex items-center gap-2">✓ Penjelasan detail kenapa suatu konten berbahaya</li>
                <li className="flex items-center gap-2">✓ Breakdown taktik manipulasi (urgency, impersonation, dll)</li>
                <li className="flex items-center gap-2">✓ Output konsisten (deterministic-configured AI)</li>
                <li className="flex items-center gap-2">✓ Multi-model fallback (DeepSeek, Pixtral, Qwen, Gemini)</li>
              </ul>
            </div>

            {/* Floating AI Model Bubbles */}
            <div className="absolute right-6 top-1/2 -translate-y-1/2 w-[140px] h-[160px] pointer-events-none">
              <div className="relative w-full h-full">
                {/* DeepSeek V3 — Top Left */}
                <div
                  className="absolute left-0 top-2 w-10 h-10 rounded-full bg-neutral-800/40 backdrop-blur-sm border border-neutral-700/30 flex items-center justify-center shadow-[0_0_14px_rgba(59,130,246,0.18)] animate-[float-bubble-1_6s_ease-in-out_infinite]"
                  style={{ animationDelay: '0s' }}
                >
                  <Image src="/logos/deepseek.svg" width={18} height={18} alt="DeepSeek" />
                </div>
                {/* Pixtral Large — Top Right */}
                <div
                  className="absolute right-0 top-0 w-10 h-10 rounded-full bg-neutral-800/40 backdrop-blur-sm border border-neutral-700/30 flex items-center justify-center shadow-[0_0_14px_rgba(168,85,247,0.18)] animate-[float-bubble-2_5s_ease-in-out_infinite]"
                  style={{ animationDelay: '0.5s' }}
                >
                  <Image src="/logos/mistral.svg" width={18} height={18} alt="Pixtral" />
                </div>
                {/* Qwen 2.5 VL — Bottom Left */}
                <div
                  className="absolute left-2 bottom-2 w-10 h-10 rounded-full bg-neutral-800/40 backdrop-blur-sm border border-neutral-700/30 flex items-center justify-center shadow-[0_0_14px_rgba(16,185,129,0.18)] animate-[float-bubble-3_7s_ease-in-out_infinite]"
                  style={{ animationDelay: '1s' }}
                >
                  <Image src="/logos/qwen.svg" width={18} height={18} alt="Qwen" />
                </div>
                {/* Gemini Vision — Bottom Right (Larger) */}
                <div
                  className="absolute right-2 bottom-0 w-14 h-14 rounded-full bg-neutral-800/60 backdrop-blur-md border-2 border-amber-500/25 flex items-center justify-center shadow-[0_0_24px_rgba(245,158,11,0.25)] animate-[float-bubble-gemini_8s_ease-in-out_infinite]"
                  style={{ animationDelay: '1.5s' }}
                >
                  <Image src="/logos/gemini.svg" width={24} height={24} alt="Gemini" />
                </div>
              </div>
            </div>

            <p className="text-[11px] text-neutral-600 font-mono italic mt-4">
              "Dari ‘ini scam’ → jadi ‘ini kenapa scam’."
            </p>
          </div>
        </div>

        {/* 5. WhatsApp Security Assistant */}
        <div className="group relative rounded-3xl border border-neutral-800/80 bg-neutral-900 hover:bg-neutral-800/85 transition-all duration-500 p-8 flex flex-col justify-between overflow-hidden md:col-span-2 min-h-[380px]">
          <div className="relative z-10 flex flex-col h-full justify-between gap-6">
            <div>
              <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center mb-6">
                <MessageSquare className="w-5 h-5 text-purple-400" />
              </div>
              <span className="text-xs font-mono text-purple-400 uppercase tracking-widest font-semibold">05. BOT PESAN</span>
              <h3 className="text-2xl font-display font-medium text-white tracking-tight mt-2 mb-3">Asisten Keamanan WhatsApp</h3>
              <p className="text-neutral-400 text-sm mb-4">"Teruskan. Pindai. Tetap aman."</p>
              <ul className="space-y-2 text-neutral-500 text-xs">
                <li className="flex items-center gap-2">✓ Kirim pesan mencurigakan langsung ke bot</li>
                <li className="flex items-center gap-2">✓ Auto-detect link & scam dari chat</li>
                <li className="flex items-center gap-2">✓ Bisa scan screenshot penipuan</li>
                <li className="flex items-center gap-2">✓ Tidak perlu buka website</li>
              </ul>
            </div>

            {/* Embedded Animated Beam Diagram */}
            <div className="w-full mt-auto">
              <AnimatedBeam />
            </div>

            <p className="text-[11px] text-neutral-600 font-mono italic mt-4">
              "Security yang ikut ke chat kamu."
            </p>
          </div>
        </div>

        {/* 6. Browser Extension (Coming Soon) */}
        <ShineCardContainer className="col-span-1 md:col-span-1 min-h-[380px] opacity-40 grayscale pointer-events-none select-none relative">
          <ShineCard glowColor="rgba(59, 130, 246, 0.05)">
            <div className="flex flex-col h-full justify-between">
              <div>
                <div className="flex items-center justify-between mb-6">
                  <div className="w-12 h-12 rounded-2xl bg-neutral-900 border border-neutral-800 flex items-center justify-center">
                    <Link2 className="w-5 h-5 text-blue-400/60" />
                  </div>
                  <span className="px-2.5 py-1 rounded-full bg-blue-500/10 border border-blue-500/20 text-[10px] font-mono text-blue-400 font-medium">Segera Hadir</span>
                </div>
                <span className="text-xs font-mono text-blue-400/60 uppercase tracking-widest font-semibold">06. EKSTENSI</span>
                <h3 className="text-xl font-display font-medium text-white/60 tracking-tight mt-2 mb-2">Ekstensi Browser</h3>
                <p className="text-neutral-500 text-xs mb-4">"Perlindungan, di mana pun Anda menjelajah."</p>
                <ul className="space-y-1.5 text-neutral-600 text-[11px]">
                  <li className="flex items-center gap-1">✓ Deteksi phishing saat browsing</li>
                  <li className="flex items-center gap-1">✓ Peringatan real-time sebelum klik link</li>
                  <li className="flex items-center gap-1">✓ Integrasi langsung dengan engine VERIX</li>
                  <li className="flex items-center gap-1">✓ Ringan & mengutamakan privasi</li>
                </ul>
              </div>

              <p className="text-[10px] text-neutral-700 font-mono italic mt-6">
                "Jangan tunggu kena dulu baru sadar."
              </p>
            </div>
          </ShineCard>
        </ShineCardContainer>

      </div>
    </section>
  );
}

function InteractiveDemo() {
  const [activeDemo, setActiveDemo] = useState(0);
  const demos = ['WhatsApp Social Engineering', 'Fake Transfer Receipt', 'QRIS Payment Manipulation'];

  return (
    <section className="py-32 bg-neutral-900/60 border-t border-neutral-800/80 relative overflow-hidden">
      <LightRays count={8} color="rgba(255, 159, 28, 0.08)" speed={12} blur={40} length="70vh" className="opacity-60" />
      {/* Top amber linear glow */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/45 to-transparent" />
      {/* Ambient amber/rose glows */}
      <div className="absolute -bottom-20 right-1/4 w-[450px] h-[450px] bg-rose-500/[0.02] blur-[120px] rounded-full pointer-events-none animate-pulse-slow" />
      <div className="absolute -top-20 left-1/4 w-[400px] h-[400px] bg-amber-500/[0.03] blur-[120px] rounded-full pointer-events-none animate-pulse-slow" />
      <div className="max-w-7xl mx-auto px-6 relative z-10 flex flex-col lg:flex-row gap-20 items-center">
        <div className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 bg-neutral-950 border border-neutral-800 rounded-full px-3 py-1">
            <span className="text-[10px] font-mono text-neutral-400 tracking-wider">LIVE ENGINE DEMONSTRATION</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-medium tracking-tight border-b border-neutral-800 pb-8">Kasus Intelijen Viral</h2>
          <p className="text-neutral-400 text-lg">Lihat bagaimana VERIX membongkar taktik manipulasi di balik kasus cyber crime viral terbaru yang merugikan masyarakat.</p>

          <div className="space-y-3 pt-2">
            {demos.map((demo, idx) => (
              <button
                key={idx}
                onClick={() => setActiveDemo(idx)}
                className={`w-full text-left px-6 py-5 rounded-2xl transition-all flex justify-between items-center group ${activeDemo === idx
                  ? 'bg-neutral-950 border border-neutral-800 shadow-sm'
                  : 'hover:bg-neutral-800/50 text-neutral-500 hover:text-white'
                  }`}
              >
                <div className="flex items-center gap-4">
                  <div className={`font-mono text-xs ${activeDemo === idx ? 'text-emerald-400' : 'text-neutral-600'}`}>0{idx + 1}</div>
                  <span className={`font-medium ${activeDemo === idx ? 'text-white' : ''}`}>{demo}</span>
                </div>
                {activeDemo === idx && <ArrowRight className="w-5 h-5 text-neutral-400 opacity-50" />}
              </button>
            ))}
          </div>
        </div>

        <div className="flex-[1.2] w-full bg-neutral-950 rounded-3xl border border-neutral-800 flex items-center justify-center p-8 lg:p-12 h-[500px] relative overflow-hidden">
          {/* Graph paper background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />

          <div className="relative z-10 w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-neutral-900 border-b border-neutral-800 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-mono text-neutral-400">MENGANALISIS BUKTI</span>
              </div>
              <span className="text-[10px] font-mono text-white bg-neutral-800 px-2 py-1 rounded">confidence.98%</span>
            </div>

            <div className="p-6">
              {activeDemo === 0 && (
                <div className="space-y-4">
                  <div className="bg-neutral-900 p-4 rounded-xl text-neutral-300 text-sm border border-neutral-800">
                    &quot;Paket COD Anda tidak dapat dikirim. <span className="bg-red-500/20 text-red-200 border border-red-500/30 rounded px-1">Unduh resi disini: resi-paket.apk</span>&quot;
                  </div>
                  <div className="pt-4 border-t border-neutral-800 mt-4">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <FileWarning className="w-4 h-4" />
                      <span className="text-xs font-mono font-bold">SIGNATURE MALWARE TERDETEKSI</span>
                    </div>
                    <p className="text-neutral-500 text-xs">File berekstensi .apk disamarkan sebagai resi J&T. Berpotensi mencuri akses SMS OTP untuk kuras rekening.</p>
                  </div>
                </div>
              )}
              {activeDemo === 1 && (
                <div className="space-y-4">
                  <div className="bg-neutral-900 border border-neutral-800 rounded-xl overflow-hidden relative group">
                    <div className="absolute inset-0 bg-red-500/5 pointer-events-none" />
                    <div className="p-4 flex flex-col gap-2">
                      <div className="flex justify-between items-center border-b border-neutral-800 pb-2">
                        <span className="text-xs text-neutral-400">Transfer Berhasil</span>
                        <span className="text-xs font-mono text-neutral-500">20/05/2026 14:32</span>
                      </div>
                      <div className="text-center py-4 relative">
                        <div className="absolute inset-0 border border-red-500/50 rounded pointer-events-none border-dashed bg-red-500/10" />
                        <span className="text-[10px] text-red-500 absolute -top-2 right-2 bg-neutral-950 px-1 border border-red-500/50 rounded font-mono">ANOMALI FONT</span>
                        <h4 className="text-2xl font-bold text-white tracking-tight">Rp 5.500.000</h4>
                        <p className="text-neutral-500 text-xs mt-1">Ke BCA: Toko Kamera...</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-neutral-800 mt-4">
                    <div className="flex items-center gap-2 text-amber-500 mb-2">
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-xs font-mono font-bold">MANIPULASI TERDETEKSI</span>
                    </div>
                    <p className="text-neutral-500 text-xs">Analisis pixel menemukan inkonsistensi font pada nominal transfer <span className="text-amber-400 font-mono">(Arial vs Inter)</span> dan noise level ELA (Error Level Analysis) yang mencurigakan.</p>
                  </div>
                </div>
              )}
              {activeDemo === 2 && (
                <div className="space-y-4">
                  <div className="bg-white p-6 rounded-xl flex items-center justify-center relative overflow-hidden shadow-inner">
                    <div className="absolute left-0 right-0 top-1/2 h-0.5 bg-emerald-500 shadow-[0_0_15px_rgba(16,185,129,0.5)] animate-[ping_2s_ease-in-out_infinite]" />
                    <div className="grid grid-cols-2 gap-1 opacity-80">
                      {/* Abstract QR code representation */}
                      <div className="w-8 h-8 border-4 border-neutral-950" />
                      <div className="w-8 h-8 border-4 border-neutral-950" />
                      <div className="w-8 h-8 bg-neutral-950" />
                      <div className="w-8 h-8 border-4 border-neutral-950" />
                    </div>
                  </div>
                  <div className="pt-2 border-t border-neutral-800 mt-4">
                    <div className="flex items-center gap-2 text-red-400 mb-2">
                      <FileWarning className="w-4 h-4" />
                      <span className="text-xs font-mono font-bold">KETIDAKCOCOKAN MERCHANT</span>
                    </div>
                    <p className="text-neutral-500 text-xs">QRIS fisik mengatasnamakan <span className="text-white bg-neutral-800 px-1 rounded">&quot;Toko Kopi Kita&quot;</span> namun di-redirect ke entitas <span className="text-red-400 bg-red-500/10 px-1 border border-red-500/20 rounded">&quot;Yayasan XYZ (Blacklisted)&quot;</span>.</p>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ExplainableAI() {
  return (
    <section className="py-32 max-w-7xl mx-auto px-6 relative overflow-hidden">
      {/* Top purple linear glow */}
      <div className="absolute top-0 left-10 right-10 h-[1.5px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
      {/* Ambient indigo/purple glows */}
      <div className="absolute left-12 top-0 bottom-0 w-[1px] bg-gradient-to-b from-transparent via-blue-500/10 to-transparent pointer-events-none" />
      <div className="absolute -top-20 left-10 w-[500px] h-[500px] bg-indigo-500/[0.03] blur-[140px] rounded-full pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-10 right-10 w-[400px] h-[400px] bg-purple-500/[0.03] blur-[120px] rounded-full pointer-events-none animate-pulse-slow" />
      <div className="flex flex-col lg:flex-row gap-20 items-center relative z-10">
        <div className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1 mb-2">
            <span className="text-[10px] font-mono text-neutral-400 tracking-wider">ENGINE AI PENJELASAN</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-medium tracking-tight">Anatomi Sebuah Manipulasi</h2>
          <p className="text-neutral-400 text-lg leading-relaxed">AI kami tidak sekadar memberi label bahaya. Layaknya analis forensik cyber, VERIX menyoroti taktik <i>social engineering</i> yang digunakan penipu, membongkar struktur narasi mereka.</p>

          <ul className="space-y-6 pt-4">
            <li className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mt-1 shrink-0"><span className="text-emerald-400 font-mono text-xs">01</span></div>
              <div>
                <h4 className="text-white font-medium mb-1">Analisis Pemicu Emosi</h4>
                <p className="text-neutral-500 text-sm">Mendeteksi ancaman, batas waktu palsu, atau janji keuntungan instan.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mt-1 shrink-0"><span className="text-emerald-400 font-mono text-xs">02</span></div>
              <div>
                <h4 className="text-white font-medium mb-1">Peniruan Identitas Entitas</h4>
                <p className="text-neutral-500 text-sm">Validasi apakah gaya bahasa sesuai dengan SOP komunikasi institusi asli.</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="flex-[1.2] w-full relative">
          <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/10 via-transparent to-blue-500/10 blur-2xl rounded-full opacity-50" />
          <div className="relative bg-neutral-950 border border-neutral-800 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-neutral-900">
              <span className="text-[10px] font-mono text-neutral-500">LOG ANALISIS ANCAMAN</span>
              <span className="text-[10px] font-mono text-neutral-500">ID: WH-924-A</span>
            </div>

            <div className="bg-neutral-900 px-6 py-5 rounded-2xl border border-neutral-800 text-sm mb-8 relative">
              <div className="absolute -left-3 top-6 w-6 h-[1.5px] bg-neutral-800" />
              <span className="font-mono text-neutral-500 block mb-2 text-xs">INGESTI TEKS MENTAH</span>
              <p className="text-neutral-300 leading-relaxed font-medium">&quot;Terkait akun <span className="bg-amber-500/20 text-amber-200 px-1 rounded">BCA Anda</span>, mohon segera <span className="bg-red-500/20 text-red-200 px-1 rounded">klik link berikut</span> untuk menghindari <span className="bg-red-500/20 text-red-200 px-1 rounded">pemblokiran secara permanen</span> hari ini.&quot;</p>
            </div>

            <div className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex gap-6 relative">
                <div className="w-px h-full bg-neutral-800 absolute left-[15px] top-8" />
                <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 z-10 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="pb-4">
                  <h4 className="font-medium text-white mb-1">Pembuatan Urgensi</h4>
                  <p className="text-sm text-neutral-500">Pembuatan batas waktu irasional (&quot;pemblokiran permanen&quot;) untuk memaksa pengambilan keputusan tanpa berpikir panjang.</p>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="flex gap-6 relative">
                <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 z-10 text-amber-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">Otoritas Palsu</h4>
                  <p className="text-sm text-neutral-500">Identitas nomor pengirim (WhatsApp biasa) tidak cocok dengan profil korporat Verified Institusi.</p>
                </div>
              </motion.div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function ScamStatistics({ setActiveTab }: { setActiveTab: (id: string) => void }) {
  const intel = useIntel();

  // Parse region scores and markers dynamically matching ThreatPulseView.tsx logic
  const threatsList = (intel?.data && intel.data.length > 0) ? intel.data.map((item: any) => {
    return {
      id: item.id,
      title: item.title,
      type: item.type,
      severity: item.severity,
      timestamp: item.publishedAt,
      region: parseRegionFromTitle(item.title, item.link),
      country: "ID"
    };
  }) : [
    { id: 'm1', title: 'Phishing KlikBCA Clone', severity: 'CRITICAL', publishedAt: new Date().toISOString(), link: 'https://bca.com', type: 'PHISHING', region: 'Jakarta', country: 'ID' },
    { id: 'm2', title: 'Undangan Pernikahan APK', severity: 'HIGH', publishedAt: new Date().toISOString(), link: 'https://whatsapp.com', type: 'MALWARE', region: 'Jawa Barat', country: 'ID' },
    { id: 'm3', title: 'Palsu Donasi QRIS Masjid', severity: 'MEDIUM', publishedAt: new Date().toISOString(), link: 'https://qris.com', type: 'QRIS', region: 'Jawa Timur', country: 'ID' }
  ];

  const provinceScores: Record<string, { count: number; score: number }> = {};
  threatsList.forEach((t: any) => {
    if (t.country === "ID" && t.region) {
      let regionName = t.region;
      if (regionName === "Jakarta Raya") regionName = "Jakarta";

      if (!provinceScores[regionName]) {
        provinceScores[regionName] = { count: 0, score: 0 };
      }
      provinceScores[regionName].count += 1;

      let severityWeight = 1;
      if (t.severity === "CRITICAL") severityWeight = 3;
      else if (t.severity === "HIGH") severityWeight = 2;

      provinceScores[regionName].score += severityWeight;
    }
  });

  const getDecayWeight = (timestampStr: string) => {
    const hours = (Date.now() - new Date(timestampStr).getTime()) / (1000 * 60 * 60);
    return Math.max(0.35, Math.min(1.0, Math.exp(-hours / 24)));
  };

  const markers = threatsList.map((threat: any) => {
    const [long, lat] = getJitteredCoords(threat.region, threat.id);
    const weight = getDecayWeight(threat.timestamp);
    return {
      id: threat.id,
      longitude: long,
      latitude: lat,
      severity: threat.severity as 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL',
      weight: weight
    };
  });
  let malwareCount = 0;
  let phishingCount = 0;
  let socEngCount = 0;

  threatsList.forEach((t: any) => {
    const typeUpper = (t.type || '').toUpperCase();
    const titleUpper = (t.title || '').toUpperCase();

    if (typeUpper.includes('MALWARE') || titleUpper.includes('APK')) {
      malwareCount++;
    } else if (typeUpper.includes('PHISHING') || typeUpper.includes('QRIS') || titleUpper.includes('PHISHING') || titleUpper.includes('KLIKBCA')) {
      phishingCount++;
    } else {
      socEngCount++;
    }
  });

  const totalCount = malwareCount + phishingCount + socEngCount || 1;
  const malwarePct = Math.round((malwareCount / totalCount) * 100);
  const phishingPct = Math.round((phishingCount / totalCount) * 100);
  const socEngPct = Math.max(0, 100 - malwarePct - phishingPct);

  const globalThreatsDetected = intel?.globalThreatsDetected ?? 0;
  const accountsSaved = intel?.accountsSaved ?? 0;
  const threatPct = intel?.threatPctChange ?? 0;

  return (
    <section className="py-32 bg-neutral-950 border-y border-neutral-900 relative overflow-hidden">
      {/* Top teal linear glow */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />
      {/* Ambient emerald/teal glows */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/[0.04] blur-[100px] rounded-full pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      {/* Scanning grid line overlay */}
      <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent pointer-events-none z-10 animate-scan-y" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono text-emerald-400 font-bold tracking-widest">TELEMETRI LANGSUNG</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-medium mb-6 tracking-tight">Peta Panas Ancaman Indonesia</h2>
            <p className="text-neutral-400 text-lg max-w-2xl leading-relaxed">Visualisasi data intelijen secara real-time dari jutaan pemindaian link, laporan komunitas, dan analisis anomali transaksi perbankan di seluruh wilayah Indonesia.</p>
          </div>
          <button onClick={() => setActiveTab('threatpulse')} className="text-white bg-neutral-900 border border-neutral-800 px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-neutral-800 transition-colors shadow-sm">
            Buka Laporan Lengkap <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3 bg-neutral-950 border border-neutral-800 p-8 rounded-3xl h-[400px] relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-50 z-10" />

            <div className="absolute inset-4 z-0 flex items-center justify-center overflow-hidden mix-blend-screen opacity-90 w-full h-full max-h-[340px]">
              <IndonesiaMap
                theme="green"
                provinceScores={provinceScores}
                markers={markers}
              />
            </div>

            {/* Target crosshairs for aesthetics - retained decorative corner grids */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-emerald-400/50" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-emerald-400/50" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-emerald-400/50" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-emerald-400/50" />

            <div className="absolute bottom-6 left-8 bg-neutral-950/80 backdrop-blur border border-neutral-800 p-4 rounded-xl z-20">
              <span className="text-[10px] font-mono text-neutral-500 mb-2 block">VEKTOR AKTIF</span>
              <div className="flex gap-4">
                <div><span className="text-red-400 font-mono text-sm block">{malwarePct}%</span><span className="text-xs text-neutral-400">Malware</span></div>
                <div><span className="text-amber-400 font-mono text-sm block">{phishingPct}%</span><span className="text-xs text-neutral-400">Phishing</span></div>
                <div><span className="text-blue-400 font-mono text-sm block">{socEngPct}%</span><span className="text-xs text-neutral-400">SocEng</span></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-4">
                <span className="text-neutral-400 text-sm font-medium">Ancaman Terdeteksi (24j)</span>
              </div>
              <p className="text-5xl font-display font-medium text-white mb-3">{globalThreatsDetected.toLocaleString()}</p>
              <p className="text-sm font-mono text-red-400 flex items-center gap-1">↑ {threatPct}% dari kemarin</p>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-900/50 p-6 rounded-3xl flex-1 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-emerald-400/80 text-sm font-medium">Akun Terdampak Diselamatkan</span>
              </div>
              <p className="text-5xl font-display font-medium text-emerald-400 mb-3 relative z-10">{accountsSaved.toLocaleString()}</p>
              <p className="text-sm font-mono text-emerald-500/60 relative z-10">Total bulan ini</p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

function IntelligenceEcosystem() {
  const intel = useIntel();

  const stats = intel?.ecosystemStats || {
    virusTotal: 14592,
    safeBrowsing: 4102,
    geminiVision: 9341,
    turnBackHoax: 156,
    urlScan: 5120,
    newsApi: 2401
  };

  const sources = [
    {
      name: 'VirusTotal',
      purpose: 'Intelijen malware & phishing',
      status: 'Pemantauan Aktif',
      icon: ShieldAlert,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/20',
      stats: stats.virusTotal.toLocaleString(),
      statLabel: 'Ancaman dianalisis hari ini',
      items: ['Domain phishing', 'Malware APK', 'Redirect mencurigakan']
    },
    {
      name: 'Google Safe Browsing',
      purpose: 'Deteksi ancaman URL',
      status: 'Tersinkronisasi',
      icon: Link2,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
      stats: stats.safeBrowsing.toLocaleString(),
      statLabel: 'Diblokir hari ini',
      items: ['URL Berbahaya', 'Halaman login palsu', 'Phishing kredensial']
    },
    {
      name: 'Gemini Vision',
      purpose: 'Analisis penipuan visual',
      status: 'Visi AI Aktif',
      icon: Eye,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      border: 'border-purple-400/20',
      stats: stats.geminiVision.toLocaleString(),
      statLabel: 'Pemindaian AI hari ini',
      items: ['Tangkapan layar palsu', 'Manipulasi QR', 'Pemalsuan visual']
    },
    {
      name: 'TurnBackHoax',
      purpose: 'Verifikasi hoaks Indonesia',
      status: 'Feed Langsung',
      icon: FileWarning,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      border: 'border-amber-400/20',
      stats: stats.turnBackHoax.toLocaleString(),
      statLabel: 'Laporan aktif',
      items: ['Hoaks Indonesia', 'Misinformasi', 'Berita palsu viral']
    },
    {
      name: 'URLScan',
      purpose: 'Analisis domain mencurigakan',
      status: 'Terhubung',
      icon: Search,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
      border: 'border-cyan-400/20',
      stats: stats.urlScan.toLocaleString(),
      statLabel: 'Pemindaian realtime',
      items: ['Domain mencurigakan', 'Rantai redirect', 'Skrip tersembunyi']
    },
    {
      name: 'NewsAPI',
      purpose: 'Pemantauan penipuan realtime',
      status: 'Intel Langsung',
      icon: Radar,
      color: 'text-rose-400',
      bg: 'bg-rose-400/10',
      border: 'border-rose-400/20',
      stats: stats.newsApi.toLocaleString(),
      statLabel: 'Berita diproses',
      items: ['Wabah penipuan', 'Insiden siber', 'Tren penipuan']
    }
  ];

  return (
    <section className="py-32 bg-neutral-950 border-y border-neutral-800/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-neutral-800)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-neutral-800)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
      {/* Iridescent pulsing glows */}
      <div className="absolute top-10 left-1/4 w-[400px] h-[400px] bg-emerald-500/[0.03] blur-[120px] rounded-full pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-cyan-500/[0.03] blur-[130px] rounded-full pointer-events-none animate-pulse-slow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-rose-500/[0.02] blur-[150px] rounded-full pointer-events-none animate-pulse-slow" />
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-24 relative">
          <div className="inline-flex items-center gap-2 bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-full px-4 py-1.5 mb-8 hover:bg-neutral-800 transition-colors cursor-default">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(182,255,59,0.5)]" />
            <span className="text-[10px] font-mono text-emerald-400 tracking-wider">EKOSISTEM INTELIJEN LANGSUNG</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-display font-medium tracking-tight mb-8">Ditenagai oleh Intelijen <br className="hidden md:block" /> Ancaman Realtime<span className="text-emerald-400">.</span></h2>
          <p className="text-neutral-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            VERIX menggabungkan AI analysis dengan sumber keamanan digital terpercaya untuk mendeteksi ancaman digital secara realtime.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {sources.map((source, idx) => {
            const Icon = source.icon;

            // Generate a synthetic inline style color map for the glowing dot since Tailwind JIT might not pick up dynamic colors easily without safe-listing
            let dotColor = '#10B981'; // emerald default
            if (source.color.includes('emerald')) dotColor = '#B6FF3B';
            else if (source.color.includes('blue')) dotColor = '#4DA8FF';
            else if (source.color.includes('amber')) dotColor = '#FFB547';
            else if (source.color.includes('purple')) dotColor = '#A855F7';
            else if (source.color.includes('cyan')) dotColor = '#22D3EE';
            else if (source.color.includes('rose')) dotColor = '#FB7185';

            return (
              <motion.div
                key={idx}
                whileHover={{ y: -6 }}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-50px" }}
                transition={{ delay: idx * 0.1, duration: 0.5 }}
                className="bg-neutral-900/90 backdrop-blur-md border border-neutral-800 hover:border-neutral-600 p-8 rounded-[2rem] flex flex-col relative overflow-hidden group transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/5 h-full"
              >
                {/* Glow & Scan Effects */}
                <div className={`absolute top-0 right-0 w-64 h-64 opacity-5 filter blur-[80px] transition-all duration-700 group-hover:opacity-30 group-hover:scale-150 ${source.bg}`} />
                <div className={`absolute -inset-px opacity-0 group-hover:opacity-10 rounded-[2rem] transition-opacity duration-500 bg-gradient-to-br from-white to-transparent`} />
                <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />

                <div className="flex items-start justify-between mb-8 z-10">
                  <div className={`w-14 h-14 rounded-2xl flex items-center justify-center ${source.bg} ${source.border} border relative overflow-hidden group-hover:scale-110 transition-transform duration-500`}>
                    <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                    <Icon className={`w-6 h-6 ${source.color} relative z-10 group-hover:animate-pulse`} />
                  </div>
                  <div className="flex items-center gap-2 bg-neutral-950 rounded-full px-3 py-1.5 border border-neutral-800 group-hover:border-neutral-700 transition-colors shadow-inner">
                    <span
                      className={`w-2 h-2 rounded-full animate-pulse`}
                      style={{ backgroundColor: dotColor, boxShadow: `0 0 8px ${dotColor}` }}
                    />
                    <span className="text-[10px] font-mono text-neutral-300 tracking-wide">{source.status}</span>
                  </div>
                </div>

                <div className="z-10 flex-1">
                  <h3 className="text-2xl font-medium text-white mb-2 tracking-tight group-hover:text-emerald-50 transition-colors">{source.name}</h3>
                  <p className="text-neutral-400 text-sm leading-relaxed group-hover:text-neutral-300 transition-colors">{source.purpose}</p>

                  <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-out">
                    <div className="overflow-hidden">
                      <div className="space-y-3 pt-6 pb-2">
                        {source.items.map((item, i) => (
                          <div key={i} className="flex items-center gap-3">
                            <div className={`w-1.5 h-1.5 rounded-full ${source.bg.replace('/10', '')} shadow-[0_0_5px_currentColor]`} style={{ color: dotColor, backgroundColor: dotColor }} />
                            <span className="text-sm font-mono text-neutral-400 group-hover:text-neutral-200 transition-colors">{item}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </motion.div>
            )
          })}
        </div>

        {/* Animated Intelligence Pipeline Visual */}
        <div className="mt-32 pt-20 border-t border-neutral-800/50">
          <div className="text-center mb-16 relative">
            <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] w-64 h-64 mx-auto rounded-full -top-10" />
            <h3 className="text-3xl font-display font-medium text-white mb-6 tracking-tight relative z-10">Alur Intelijen AI</h3>
            <p className="text-neutral-400 text-lg relative z-10 max-w-xl mx-auto">Analisis ancaman multi-layer dalam hitungan milidetik. Dari deteksi awal hingga perlindungan aktif.</p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 lg:p-12 relative overflow-hidden max-w-5xl mx-auto shadow-2xl">
            {/* Tech grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-neutral-800)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-neutral-800)_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_80%,transparent_100%)] opacity-30 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-2 pt-4 pb-4">
              {[
                { name: 'Sumber Ancaman', icon: Radar, color: 'text-neutral-400' },
                { name: 'Deteksi AI', icon: Eye, color: 'text-blue-400' },
                { name: 'Klasifikasi Risiko', icon: AlertCircle, color: 'text-amber-400' },
                { name: 'Intel Ancaman', icon: ShieldAlert, color: 'text-purple-400' },
                { name: 'Perlindungan Pengguna', icon: Lock, color: 'text-emerald-400', highlight: true }
              ].map((step, idx, arr) => (
                <React.Fragment key={idx}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.15, type: 'spring', stiffness: 200, damping: 20 }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="flex flex-col items-center gap-5 relative group cursor-default"
                  >
                    <div className={`w-20 h-20 rounded-2xl bg-neutral-950 border ${step.highlight ? 'border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.3)]' : 'border-neutral-800 group-hover:border-neutral-600'} flex items-center justify-center transition-all relative overflow-hidden z-10 group-hover:scale-105`}>
                      {step.highlight && (
                        <div className="absolute inset-0 bg-emerald-500/20 blur-2xl animate-pulse" />
                      )}
                      <step.icon className={`w-8 h-8 ${step.color} relative z-10 transition-colors`} />
                    </div>
                    <span className={`text-xs font-mono tracking-wide ${step.highlight ? 'text-emerald-400 font-bold' : 'text-neutral-400 group-hover:text-neutral-300'} text-center max-w-[120px] leading-relaxed uppercase`}>{step.name}</span>
                  </motion.div>

                  {idx < arr.length - 1 && (
                    <div className="hidden md:flex flex-col items-center flex-1 mx-4 relative">
                      {/* Animated Line */}
                      <div className="w-full h-[2px] bg-neutral-800 overflow-hidden rounded-full mb-8 relative">
                        <motion.div
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{ repeat: Infinity, duration: 2, delay: idx * 0.2, ease: "linear" }}
                          className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent"
                        />
                        {/* Add multiple particles running across */}
                        <motion.div
                          animate={{ x: ["-100%", "500%"] }}
                          transition={{ repeat: Infinity, duration: 3, delay: idx * 0.2 + 0.5, ease: "linear" }}
                          className="absolute top-1/2 left-0 w-2 h-2 bg-emerald-400 rounded-full blur-[2px] -translate-y-1/2"
                        />
                      </div>
                    </div>
                  )}

                  {idx < arr.length - 1 && (
                    <div className="md:hidden h-12 w-[2px] bg-neutral-800 relative overflow-hidden rounded-full my-2">
                      <motion.div
                        animate={{ y: ["-100%", "200%"] }}
                        transition={{ repeat: Infinity, duration: 2, delay: idx * 0.2, ease: "linear" }}
                        className="w-full h-1/2 bg-gradient-to-b from-transparent via-emerald-400/50 to-transparent"
                      />
                    </div>
                  )}
                </React.Fragment>
              ))}
            </div>
          </div>
        </div>

      </div>
    </section>
  );
}

function EducationSection() {
  const articles = [
    { title: 'Phishing Bank BCA & Mandiri', short: 'Penipuan menggunakan tautan palsu yang menyerupai situs resmi bank.', icon: CreditCard, color: 'text-cyan-400', col: 'col-span-1 md:col-span-2' },
    { title: 'APK Malware (Kurir & Undangan)', short: 'Pencurian data dan OTP melalui aplikasi Android berbahaya.', icon: Smartphone, color: 'text-rose-400', col: 'col-span-1' },
    { title: 'QRIS Scam (Palsu)', short: 'Penipuan melalui stiker QRIS palsu di kotak amal atau kasir.', icon: Shield, color: 'text-emerald-400', col: 'col-span-1' },
    { title: 'OTP Fraud & Takeover', short: 'Pengambilalihan akun WhatsApp atau E-Commerce melalui manipulasi kode OTP.', icon: Lock, color: 'text-yellow-400', col: 'col-span-1 md:col-span-2' }
  ];

  return (
    <section className="py-32 max-w-7xl mx-auto px-6 relative overflow-hidden">
      {/* Top teal linear glow */}
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />
      {/* Ambient emerald/teal glows */}
      <div className="absolute -top-10 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/[0.04] blur-[100px] rounded-full pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-0 left-0 right-0 h-[1px] bg-gradient-to-r from-transparent via-emerald-400/20 to-transparent" />
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1 mb-6">
          <span className="text-[10px] font-mono text-cyan-400 tracking-wider">EDUKASI INTELIJEN ANCAMAN</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-display font-medium tracking-tight mb-6">Tetap Selangkah di Depan Penipuan.</h2>
        <p className="text-neutral-400 text-lg max-w-2xl mx-auto">Kenali pola penipuan modern sebelum terjadi. Jangan biarkan Anda atau keluarga menjadi korban selanjutnya.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-[280px]">
        {articles.map((article, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`group rounded-3xl border border-neutral-800/80 bg-neutral-900 hover:bg-neutral-800 transition-all duration-500 p-8 flex flex-col justify-between overflow-hidden relative shadow-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.05)] cursor-default ${article.col}`}
          >
            <div className="absolute top-0 right-0 w-32 h-32 bg-white/5 blur-3xl opacity-0 group-hover:opacity-100 transition-opacity" />

            <div className="w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 bg-neutral-900 border border-neutral-800 shadow-inner mb-6">
              <article.icon className={`w-6 h-6 ${article.color}`} />
            </div>

            <div className="z-10">
              <h3 className="text-2xl font-display font-medium text-white tracking-tight mb-3">{article.title}</h3>
              <p className="text-neutral-400 leading-relaxed">
                {article.short}
              </p>
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/40 pointer-events-none" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

export function Dashboard({ setActiveTab }: { setActiveTab: (id: string) => void }) {
  return (
    <div className="w-full flex-1">
      <HeroSection setActiveTab={setActiveTab} />
      <BentoGrid />
      <InteractiveDemo />
      <ExplainableAI />
      {/* <ScamStatistics setActiveTab={setActiveTab} /> */}
      <IntelligenceEcosystem />
      <EducationSection />
      <div className="py-24 text-center max-w-4xl mx-auto px-6 relative overflow-hidden">
        {/* Pure white-to-emerald spotlight & bottom white linear glow */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/[0.03] blur-[120px] rounded-full pointer-events-none animate-pulse-slow" />
        <div className="absolute top-10 left-1/3 w-[300px] h-[300px] bg-white/[0.02] blur-[100px] rounded-full pointer-events-none animate-pulse-slow" />
        <div className="absolute bottom-0 left-10 right-10 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

        <div className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1 mb-6 relative z-10">
          <span className="text-[10px] font-mono text-emerald-400 tracking-wider">VERIFIKASI RISIKO DIGITAL</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-display font-medium mb-6 tracking-tight relative z-10">Saring Sebelum Percaya.</h2>
        <p className="text-lg text-neutral-400 mb-10 relative z-10">Deteksi Ancaman Sebelum Terlambat. Bergabung dengan ekosistem intelijen digital kami dan lindungi diri Anda hari ini.</p>
        <button onClick={() => setActiveTab('scanner')} className="bg-emerald-400 text-neutral-950 px-10 py-4 rounded-xl font-medium hover:bg-emerald-300 transition-colors shadow-[0_0_40px_rgba(182,255,59,0.15)] flex items-center gap-2 mx-auto relative z-10">
          Mulai Analisis Sekarang <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

'use client';

import { motion } from 'motion/react';
import { ArrowRight, Zap } from 'lucide-react';
import { useState, useEffect, useRef } from 'react';
import React from 'react';
import dynamic from 'next/dynamic';
import { useAuth } from './FirebaseProvider';
import { ThreatStatsSection } from './ThreatStatsSection';
import { AuroraBackground } from './ui/AuroraBackground';
import { RotatingWords } from './ui/RotatingWords';
import { cn } from '@/lib/utils';

const BelowFoldContent = dynamic(() => import('./dashboard/BelowFoldContent'), { ssr: false });

function LazyBelowFold({ setActiveTab }: { setActiveTab: (id: string) => void }) {
  const [visible, setVisible] = useState(false);
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { rootMargin: '400px' }
    );
    observer.observe(el);
    return () => observer.disconnect();
  }, []);

  return (
    <div ref={ref}>
      {visible ? (
        <BelowFoldContent setActiveTab={setActiveTab} />
      ) : (
        <div className="h-[200px]" />
      )}
    </div>
  );
}

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
const REGION_MAPPINGS = [
  { name: "Jakarta", keywords: ["jakarta", "jkt", "jabodetabek", "raya"] },
  { name: "Jawa Barat", keywords: ["jawa barat", "jabar", "bandung", "depok", "bogor", "bekasi"] },
  { name: "Jawa Timur", keywords: ["jawa timur", "jatim", "surabaya", "malang", "sidoarjo"] },
  { name: "Jawa Tengah", keywords: ["jawa tengah", "jateng", "semarang", "solo", "yogyakarta", "jogja"] },
  { name: "Sumatera Utara", keywords: ["sumatera utara", "sumut", "medan", "deliserdang"] },
  { name: "Sulawesi Selatan", keywords: ["sulawesi selatan", "sulsel", "makassar"] },
  { name: "Bali", keywords: ["bali", "denpasar", "kuta"] },
  { name: "Kalimantan Timur", keywords: ["kalimantan timur", "kaltim", "samarinda", "balikpapan"] }
];

function parseRegionFromTitle(title: string, link: string): string {
  const lower = (title + " " + link).toLowerCase();
  
  for (const region of REGION_MAPPINGS) {
    if (region.keywords.some(kw => lower.includes(kw))) {
      return region.name;
    }
  }

  const INDO_REGIONS_LIST = REGION_MAPPINGS.map(r => r.name);
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
            className="text-5xl sm:text-6xl md:text-8xl font-display font-medium tracking-tight mb-8 max-w-6xl leading-[1.2]"
          >
            <div className="flex flex-col md:flex-row md:items-start gap-2 md:gap-8 items-center">
              <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-neutral-500">Deteksi</span>
              <RotatingWords words={["Link Phishing", "Foto Deepfake", "APK Berbahaya", "QRIS Palsu", "Penipuan WA"]} />
            </div>
            <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-neutral-500">Sebelum Terlambat.</span>
          </motion.h1>

          <motion.p
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
            className="text-lg md:text-xl text-neutral-400 max-w-3xl mb-14 leading-relaxed font-light"
          >
            Analisis ancaman digital berbasis AI & intelijen nyata secara real-time.
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

    </section>
  );
}

export function Dashboard({ setActiveTab }: { setActiveTab: (id: string) => void }) {
  return (
    <div className="w-full flex-1">
      <HeroSection setActiveTab={setActiveTab} />
      <ThreatStatsSection />
      <LazyBelowFold setActiveTab={setActiveTab} />
    </div>
  );
}


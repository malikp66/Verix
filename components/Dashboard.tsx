'use client';

import { motion } from 'motion/react';
import { ArrowRight, ShieldAlert, Zap, Lock, Smartphone, FileWarning, Eye, UploadCloud, Search, AlertCircle, BarChart3, Users, MessageSquare, Link2, Radar, MessageCircle, Image as ImageIcon, ShoppingBag, Mic, CreditCard, Shield } from 'lucide-react';
import { LightRays } from './ui/light-rays';
import React, { useState, useEffect } from 'react';
import Image from 'next/image';
import { useAuth } from './FirebaseProvider';
import { IndonesiaMap } from './ui/IndonesiaMap';

function HeroSection({ setActiveTab }: { setActiveTab: (id: string) => void }) {
  const { user, login } = useAuth();
  const videoRef = React.useRef<HTMLVideoElement>(null);

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
    <section className="relative py-12 flex flex-col items-center justify-between text-center overflow-hidden min-h-screen w-full">

      {/* Video Background */}
      <video
        ref={videoRef}
        autoPlay
        muted
        loop
        playsInline
        preload="auto"
        className="absolute inset-0 w-full h-full object-cover z-0 pointer-events-none opacity-60 transition-opacity duration-1000"
      >
        <source src="/hero-section.mp4" type="video/mp4" />
      </video>

      {/* Content wrapper with relative z-10 to sit on top of the video and overlay */}
      <div className="relative z-10 w-full max-w-6xl mx-auto flex-1 flex flex-col items-center justify-center text-center px-4 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, ease: "easeOut" }}
          className="inline-flex items-center space-x-3 bg-[#121821]/80 backdrop-blur-md border border-neutral-800/80 rounded-full px-5 py-2 mb-8 shadow-[0_0_20px_rgba(16,185,129,0.15)]"
        >
          <div className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-500"></span>
          </div>
          <span className="text-[10px] md:text-xs font-mono text-emerald-400 font-medium tracking-widest uppercase">REALTIME THREAT NETWORK ACTIVE</span>
        </motion.div>

        <motion.h1
          initial={{ opacity: 0, y: 30 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.1, ease: "easeOut" }}
          className="text-5xl sm:text-6xl md:text-8xl font-display font-medium tracking-tight mb-8 max-w-6xl leading-[1.05]"
        >
          Ancaman Digital Kini <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-b from-white via-white to-neutral-500">Terlihat Meyakinkan.</span>
        </motion.h1>

        <motion.p
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.2, ease: "easeOut" }}
          className="text-lg md:text-xl text-neutral-400 max-w-3xl mb-14 leading-relaxed font-light"
        >
          VERIX membantu mendeteksi phishing, manipulasi digital, QR scam, fake screenshot, APK berbahaya, dan ancaman digital menggunakan AI threat intelligence.
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
          <button onClick={() => setActiveTab('threatpulse')} className="w-full sm:w-auto bg-[#121821]/80 backdrop-blur-md text-white px-10 py-4 rounded-xl font-medium hover:bg-[#161D27] transition-all duration-300 border border-neutral-800 hover:border-neutral-700 flex items-center justify-center gap-3 group shadow-xl">
            <Radar className="w-5 h-5 text-neutral-400 group-hover:text-emerald-400 transition-colors" />
            <span className="tracking-wide text-sm md:text-base">Lihat Threat Radar</span>
          </button>
        </motion.div>
      </div>

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
                className="flex-shrink-0 flex items-center gap-4 bg-[#121821]/50 backdrop-blur-sm border border-neutral-800/80 hover:border-neutral-700/80 hover:bg-neutral-800/60 rounded-xl px-5 py-3 transition-all duration-300 group shadow-md relative z-20"
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
  const features = [
    { title: 'WhatsApp Intelligence', col: 'col-span-1 md:col-span-2', row: 'row-span-2', icon: MessageCircle, color: 'text-white', bg: 'bg-neutral-900 border-neutral-800' },
    { title: 'Phishing URL Analyzer', col: 'col-span-1', row: 'row-span-1', icon: Link2, color: 'text-white', bg: 'bg-neutral-900 border-neutral-800' },
    { title: 'Rekening Database', col: 'col-span-1', row: 'row-span-1', icon: Search, color: 'text-white', bg: 'bg-neutral-900 border-neutral-800' },
    { title: 'Image Forensics', col: 'col-span-1', row: 'row-span-1', icon: ImageIcon, color: 'text-white', bg: 'bg-neutral-900 border-neutral-800' },
    { title: 'Fake Marketplace', col: 'col-span-1', row: 'row-span-1', icon: ShoppingBag, color: 'text-white', bg: 'bg-neutral-900 border-neutral-800' },
    { title: 'Malware APK Engine', col: 'col-span-1 md:col-span-2', row: 'row-span-1', icon: FileWarning, color: 'text-red-400', bg: 'bg-red-500/5 border-red-500/20' },
    { title: 'Deepfake Audio', col: 'col-span-1 md:col-span-2', row: 'row-span-1', icon: Mic, color: 'text-amber-400', bg: 'bg-amber-500/5 border-amber-500/20' },
  ];

  return (
    <section className="py-32 max-w-7xl mx-auto px-6">
      <div className="text-center mb-20">
        <h2 className="text-4xl md:text-5xl font-display font-medium tracking-tight mb-6">Unified Cyber Threat Platform</h2>
        <p className="text-neutral-400 text-lg max-w-2xl mx-auto">Satu platform intelligence terintegrasi untuk mendeteksi berbagai vektor serangan manipulasi digital yang menargetkan masyarakat Indonesia.</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 auto-rows-[180px]">
        {features.map((f, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className={`group rounded-3xl border transition-all duration-500 p-8 flex flex-col justify-between overflow-hidden relative ${f.bg} hover:bg-neutral-800/50 ${f.col} ${f.row}`}
          >
            <div className={`w-12 h-12 rounded-2xl flex items-center justify-center shrink-0 bg-neutral-950 border border-neutral-800 shadow-inner`}>
              <f.icon className={`w-5 h-5 ${f.color}`} />
            </div>

            <div className="mt-6 z-10">
              <h3 className="text-xl font-medium text-white tracking-tight">{f.title}</h3>
              {f.row === 'row-span-2' && (
                <p className="text-neutral-400 mt-4 leading-relaxed">
                  Deteksi manipulasi psikologis, urgency palsu, dan taktik impersonation (social engineering) secara otomatis menggunakan NLP AI yang dilatih khusus untuk teks Bahasa Indonesia.
                </p>
              )}
            </div>

            <div className="absolute inset-0 bg-gradient-to-br from-transparent to-black/20 pointer-events-none" />
          </motion.div>
        ))}
      </div>
    </section>
  );
}

function InteractiveDemo() {
  const [activeDemo, setActiveDemo] = useState(0);
  const demos = ['WhatsApp Social Engineering', 'Fake Transfer Receipt', 'QRIS Payment Manipulation'];

  return (
    <section className="py-32 bg-neutral-900 border-t border-neutral-800">
      <div className="max-w-7xl mx-auto px-6 flex flex-col lg:flex-row gap-20 items-center">
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

        <div className="flex-[1.2] w-full bg-[#0A0A0A] rounded-3xl border border-neutral-800 flex items-center justify-center p-8 lg:p-12 h-[500px] relative overflow-hidden">
          {/* Graph paper background */}
          <div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.03)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:32px_32px]" />

          <div className="relative z-10 w-full max-w-sm bg-neutral-950 border border-neutral-800 rounded-2xl overflow-hidden shadow-2xl">
            <div className="bg-neutral-900 border-b border-neutral-800 px-5 py-3 flex items-center justify-between">
              <div className="flex items-center gap-2">
                <div className="w-2.5 h-2.5 rounded-full bg-red-500 animate-pulse" />
                <span className="text-xs font-mono text-neutral-400">ANALYZING EVIDENCE</span>
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
                      <span className="text-xs font-mono font-bold">MALWARE SIGNATURE DETECTED</span>
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
                        <span className="text-[10px] text-red-500 absolute -top-2 right-2 bg-neutral-950 px-1 border border-red-500/50 rounded font-mono">FONT ANOMALY</span>
                        <h4 className="text-2xl font-bold text-white tracking-tight">Rp 5.500.000</h4>
                        <p className="text-neutral-500 text-xs mt-1">Ke BCA: Toko Kamera...</p>
                      </div>
                    </div>
                  </div>
                  <div className="pt-2 border-t border-neutral-800 mt-4">
                    <div className="flex items-center gap-2 text-amber-500 mb-2">
                      <ImageIcon className="w-4 h-4" />
                      <span className="text-xs font-mono font-bold">MANIPULATION DETECTED</span>
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
                      <span className="text-xs font-mono font-bold">MERCHANT MISMATCH</span>
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
    <section className="py-32 max-w-7xl mx-auto px-6">
      <div className="flex flex-col lg:flex-row gap-20 items-center">
        <div className="flex-1 space-y-8">
          <div className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1 mb-2">
            <span className="text-[10px] font-mono text-neutral-400 tracking-wider">EXPLAINABLE AI ENGINE</span>
          </div>
          <h2 className="text-4xl md:text-5xl font-display font-medium tracking-tight">Anatomi Sebuah Manipulasi</h2>
          <p className="text-neutral-400 text-lg leading-relaxed">AI kami tidak sekadar memberi label bahaya. Layaknya analis forensik cyber, VERIX menyoroti taktik <i>social engineering</i> yang digunakan penipu, membongkar struktur narasi mereka.</p>

          <ul className="space-y-6 pt-4">
            <li className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mt-1 shrink-0"><span className="text-emerald-400 font-mono text-xs">01</span></div>
              <div>
                <h4 className="text-white font-medium mb-1">Emotion Trigger Analysis</h4>
                <p className="text-neutral-500 text-sm">Mendeteksi ancaman, batas waktu palsu, atau janji keuntungan instan.</p>
              </div>
            </li>
            <li className="flex items-start gap-4">
              <div className="w-8 h-8 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center mt-1 shrink-0"><span className="text-emerald-400 font-mono text-xs">02</span></div>
              <div>
                <h4 className="text-white font-medium mb-1">Entity Impersonation</h4>
                <p className="text-neutral-500 text-sm">Validasi apakah gaya bahasa sesuai dengan SOP komunikasi institusi asli.</p>
              </div>
            </li>
          </ul>
        </div>

        <div className="flex-[1.2] w-full relative">
          <div className="absolute -inset-4 bg-gradient-to-tr from-emerald-500/10 via-transparent to-blue-500/10 blur-2xl rounded-full opacity-50" />
          <div className="relative bg-[#0A0A0A] border border-neutral-800 rounded-3xl p-8 shadow-2xl">
            <div className="flex items-center justify-between mb-8 pb-6 border-b border-neutral-900">
              <span className="text-[10px] font-mono text-neutral-500">THREAT ANALYSIS LOG</span>
              <span className="text-[10px] font-mono text-neutral-500">ID: WH-924-A</span>
            </div>

            <div className="bg-neutral-900 px-6 py-5 rounded-2xl border border-neutral-800 text-sm mb-8 relative">
              <div className="absolute -left-3 top-6 w-6 h-[1.5px] bg-neutral-800" />
              <span className="font-mono text-neutral-500 block mb-2 text-xs">RAW TEXT INGESTION</span>
              <p className="text-neutral-300 leading-relaxed font-medium">&quot;Terkait akun <span className="bg-amber-500/20 text-amber-200 px-1 rounded">BCA Anda</span>, mohon segera <span className="bg-red-500/20 text-red-200 px-1 rounded">klik link berikut</span> untuk menghindari <span className="bg-red-500/20 text-red-200 px-1 rounded">pemblokiran secara permanen</span> hari ini.&quot;</p>
            </div>

            <div className="space-y-4">
              <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} className="flex gap-6 relative">
                <div className="w-px h-full bg-neutral-800 absolute left-[15px] top-8" />
                <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 z-10 text-red-400">
                  <AlertCircle className="w-4 h-4" />
                </div>
                <div className="pb-4">
                  <h4 className="font-medium text-white mb-1">Urgency Generation</h4>
                  <p className="text-sm text-neutral-500">Pembuatan batas waktu irasional (&quot;pemblokiran permanen&quot;) untuk memaksa pengambilan keputusan tanpa berpikir panjang.</p>
                </div>
              </motion.div>
              <motion.div initial={{ opacity: 0, y: 10 }} whileInView={{ opacity: 1, y: 0 }} viewport={{ once: true }} transition={{ delay: 0.1 }} className="flex gap-6 relative">
                <div className="w-8 h-8 rounded-full bg-neutral-900 border border-neutral-800 flex items-center justify-center shrink-0 z-10 text-amber-400">
                  <Lock className="w-4 h-4" />
                </div>
                <div>
                  <h4 className="font-medium text-white mb-1">False Authority</h4>
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

  const threats = intel?.globalThreatsDetected || 12492;
  const saved = intel?.accountsSaved || 85230;
  const threatPct = intel?.threatPctChange || 14.5;

  return (
    <section className="py-32 bg-[#0A0A0A] border-y border-neutral-900 relative overflow-hidden">
      <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:24px_24px] pointer-events-none" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="flex flex-col md:flex-row justify-between items-end mb-16 gap-6">
          <div>
            <div className="flex items-center gap-3 mb-4">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              <span className="text-xs font-mono text-emerald-400 font-bold tracking-widest">LIVE TELEMETRY</span>
            </div>
            <h2 className="text-4xl md:text-5xl font-display font-medium mb-6 tracking-tight">Threat Heatmap Indonesia</h2>
            <p className="text-neutral-400 text-lg max-w-2xl leading-relaxed">Visualisasi data intelijen secara real-time dari jutaan pemindaian link, laporan komunitas, dan analisis anomali transaksi perbankan di seluruh wilayah Indonesia.</p>
          </div>
          <button onClick={() => setActiveTab('data')} className="text-white bg-neutral-900 border border-neutral-800 px-6 py-3 rounded-xl font-medium flex items-center gap-2 hover:bg-neutral-800 transition-colors shadow-sm">
            Open Full Reports <ArrowRight className="w-4 h-4" />
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="md:col-span-3 bg-neutral-950 border border-neutral-800 p-8 rounded-3xl h-[400px] relative overflow-hidden flex items-center justify-center">
            <div className="absolute inset-0 bg-[linear-gradient(to_bottom,rgba(255,255,255,0.03)_1px,transparent_1px)] bg-[size:100%_4px] pointer-events-none opacity-50 z-10" />

            <div className="absolute inset-4 z-0 flex items-center justify-center overflow-hidden mix-blend-screen opacity-90 w-full h-full max-h-[340px]">
              <IndonesiaMap
                theme="green"
                markers={[
                  { id: 'jkt', longitude: 106.8456, latitude: -6.2088, severity: 'CRITICAL', label: 'JKT', weight: 1.0 },
                  { id: 'sby', longitude: 112.7521, latitude: -7.2504, severity: 'HIGH', weight: 0.8 },
                  { id: 'plb', longitude: 104.7566, latitude: -2.9909, severity: 'LOW', weight: 0.9 }
                ]}
              />
            </div>

            {/* Target crosshairs for aesthetics */}
            <div className="absolute top-4 left-4 w-4 h-4 border-t-2 border-l-2 border-emerald-400/50" />
            <div className="absolute top-4 right-4 w-4 h-4 border-t-2 border-r-2 border-emerald-400/50" />
            <div className="absolute bottom-4 left-4 w-4 h-4 border-b-2 border-l-2 border-emerald-400/50" />
            <div className="absolute bottom-4 right-4 w-4 h-4 border-b-2 border-r-2 border-emerald-400/50" />

            <div className="absolute bottom-6 left-8 bg-neutral-950/80 backdrop-blur border border-neutral-800 p-4 rounded-xl z-20">
              <span className="text-[10px] font-mono text-neutral-500 mb-2 block">ACTIVE VECTORS</span>
              <div className="flex gap-4">
                <div><span className="text-red-400 font-mono text-sm block">42%</span><span className="text-xs text-neutral-400">Malware</span></div>
                <div><span className="text-amber-400 font-mono text-sm block">38%</span><span className="text-xs text-neutral-400">Phishing</span></div>
                <div><span className="text-blue-400 font-mono text-sm block">20%</span><span className="text-xs text-neutral-400">SocEng</span></div>
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="bg-neutral-900 border border-neutral-800 p-6 rounded-3xl flex-1 flex flex-col justify-center">
              <div className="flex items-center justify-between mb-4">
                <span className="text-neutral-400 text-sm font-medium">Ancaman Terdeteksi (24j)</span>
              </div>
              <p className="text-5xl font-display font-medium text-white mb-3">{threats.toLocaleString()}</p>
              <p className="text-sm font-mono text-red-400 flex items-center gap-1">↑ {threatPct}% dari kemarin</p>
            </div>

            <div className="bg-emerald-950/30 border border-emerald-900/50 p-6 rounded-3xl flex-1 flex flex-col justify-center relative overflow-hidden">
              <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-transparent pointer-events-none" />
              <div className="flex items-center justify-between mb-4 relative z-10">
                <span className="text-emerald-400/80 text-sm font-medium">Akun Terdampak Diselamatkan</span>
              </div>
              <p className="text-5xl font-display font-medium text-emerald-400 mb-3 relative z-10">{saved.toLocaleString()}</p>
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
      purpose: 'Malware & phishing intelligence',
      status: 'Active Monitoring',
      icon: ShieldAlert,
      color: 'text-emerald-400',
      bg: 'bg-emerald-400/10',
      border: 'border-emerald-400/20',
      stats: stats.virusTotal.toLocaleString(),
      statLabel: 'Threats analyzed today',
      items: ['Phishing domains', 'Malware APK', 'Suspicious redirects']
    },
    {
      name: 'Google Safe Browsing',
      purpose: 'URL threat detection',
      status: 'Synced',
      icon: Link2,
      color: 'text-blue-400',
      bg: 'bg-blue-400/10',
      border: 'border-blue-400/20',
      stats: stats.safeBrowsing.toLocaleString(),
      statLabel: 'Blocked today',
      items: ['Dangerous URLs', 'Fake login pages', 'Credential phishing']
    },
    {
      name: 'Gemini Vision',
      purpose: 'Visual scam analysis',
      status: 'AI Vision Active',
      icon: Eye,
      color: 'text-purple-400',
      bg: 'bg-purple-400/10',
      border: 'border-purple-400/20',
      stats: stats.geminiVision.toLocaleString(),
      statLabel: 'AI scans today',
      items: ['Fake screenshots', 'QR manipulation', 'Visual tampering']
    },
    {
      name: 'TurnBackHoax',
      purpose: 'Hoax verification Indonesia',
      status: 'Live Feed',
      icon: FileWarning,
      color: 'text-amber-400',
      bg: 'bg-amber-400/10',
      border: 'border-amber-400/20',
      stats: stats.turnBackHoax.toLocaleString(),
      statLabel: 'Active reports',
      items: ['Indonesian hoaxes', 'Misinformation', 'Viral fake news']
    },
    {
      name: 'URLScan',
      purpose: 'Suspicious domain analysis',
      status: 'Connected',
      icon: Search,
      color: 'text-cyan-400',
      bg: 'bg-cyan-400/10',
      border: 'border-cyan-400/20',
      stats: stats.urlScan.toLocaleString(),
      statLabel: 'Realtime scans',
      items: ['Suspicious domains', 'Redirect chains', 'Hidden scripts']
    },
    {
      name: 'NewsAPI',
      purpose: 'Realtime scam monitoring',
      status: 'Live Intel',
      icon: Radar,
      color: 'text-rose-400',
      bg: 'bg-rose-400/10',
      border: 'border-rose-400/20',
      stats: stats.newsApi.toLocaleString(),
      statLabel: 'News processed',
      items: ['Scam outbreaks', 'Cyber incidents', 'Fraud trends']
    }
  ];

  return (
    <section className="py-32 bg-[#0B0F14] border-y border-neutral-800/50 relative overflow-hidden">
      {/* Background Effects */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#161D27_1px,transparent_1px),linear-gradient(to_bottom,#161D27_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_0%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-full max-w-5xl h-[500px] bg-emerald-500/5 blur-[120px] rounded-full pointer-events-none fade-in" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-24 relative">
          <div className="inline-flex items-center gap-2 bg-[#121821]/80 backdrop-blur border border-neutral-800 rounded-full px-4 py-1.5 mb-8 hover:bg-[#161D27] transition-colors cursor-default">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(182,255,59,0.5)]" />
            <span className="text-[10px] font-mono text-emerald-400 tracking-wider">LIVE INTELLIGENCE ECOSYSTEM</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-display font-medium tracking-tight mb-8">Powered by Realtime <br className="hidden md:block" /> Threat Intelligence<span className="text-emerald-400">.</span></h2>
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
                className="bg-[#121821]/90 backdrop-blur-md border border-neutral-800 hover:border-neutral-600 p-8 rounded-[2rem] flex flex-col relative overflow-hidden group transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/5 h-full"
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
                  <div className="flex items-center gap-2 bg-[#0A0E13] rounded-full px-3 py-1.5 border border-neutral-800 group-hover:border-neutral-700 transition-colors shadow-inner">
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

                <div className="grid grid-rows-[0fr] group-hover:grid-rows-[1fr] transition-[grid-template-rows] duration-500 ease-out">
                  <div className="overflow-hidden">
                    <div className="z-10 mt-6 pt-6 border-t border-neutral-800/80 flex items-center justify-between group-hover:border-neutral-700 transition-colors">
                      <div className="flex flex-col">
                        <span className="text-3xl font-display font-medium text-white group-hover:text-emerald-400 transition-colors tracking-tight">{source.stats}</span>
                        <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-widest mt-1">{source.statLabel}</span>
                      </div>
                      <div className="w-10 h-10 rounded-full border border-neutral-800 flex items-center justify-center bg-[#0B0F14] group-hover:bg-[#161D27] group-hover:border-neutral-600 transition-all">
                        <ArrowRight className={`w-4 h-4 text-neutral-500 group-hover:text-emerald-400 group-hover:translate-x-0.5 transition-all`} />
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
            <h3 className="text-3xl font-display font-medium text-white mb-6 tracking-tight relative z-10">AI Intelligence Pipeline</h3>
            <p className="text-neutral-400 text-lg relative z-10 max-w-xl mx-auto">Analisis ancaman multi-layer dalam hitungan milidetik. Dari deteksi awal hingga perlindungan aktif.</p>
          </div>

          <div className="bg-[#121821] border border-neutral-800 rounded-3xl p-8 lg:p-12 relative overflow-hidden max-w-5xl mx-auto shadow-2xl">
            {/* Tech grid overlay */}
            <div className="absolute inset-0 bg-[linear-gradient(to_right,#161D27_1px,transparent_1px),linear-gradient(to_bottom,#161D27_1px,transparent_1px)] bg-[size:3rem_3rem] [mask-image:radial-gradient(ellipse_60%_60%_at_50%_50%,#000_80%,transparent_100%)] opacity-30 pointer-events-none" />

            <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-8 md:gap-2 pt-4 pb-4">
              {[
                { name: 'Threat Sources', icon: Radar, color: 'text-neutral-400' },
                { name: 'AI Detection', icon: Eye, color: 'text-blue-400' },
                { name: 'Risk Classification', icon: AlertCircle, color: 'text-amber-400' },
                { name: 'Threat Intel', icon: ShieldAlert, color: 'text-purple-400' },
                { name: 'User Protection', icon: Lock, color: 'text-emerald-400', highlight: true }
              ].map((step, idx, arr) => (
                <React.Fragment key={idx}>
                  <motion.div
                    initial={{ opacity: 0, scale: 0.9 }}
                    whileInView={{ opacity: 1, scale: 1 }}
                    transition={{ delay: idx * 0.15, type: 'spring', stiffness: 200, damping: 20 }}
                    viewport={{ once: true, margin: "-50px" }}
                    className="flex flex-col items-center gap-5 relative group cursor-default"
                  >
                    <div className={`w-20 h-20 rounded-2xl bg-[#0B0F14] border ${step.highlight ? 'border-emerald-500 shadow-[0_0_40px_rgba(16,185,129,0.3)]' : 'border-neutral-800 group-hover:border-neutral-600'} flex items-center justify-center transition-all relative overflow-hidden z-10 group-hover:scale-105`}>
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
    <section className="py-32 max-w-7xl mx-auto px-6">
      <div className="text-center mb-16">
        <div className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1 mb-6">
          <span className="text-[10px] font-mono text-cyan-400 tracking-wider">THREAT INTELLIGENCE EDUCATION</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-display font-medium tracking-tight mb-6">Stay Ahead of Scams.</h2>
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
            className={`group rounded-3xl border border-neutral-800/80 bg-[#0c0c0c] hover:bg-[#111111] transition-all duration-500 p-8 flex flex-col justify-between overflow-hidden relative shadow-2xl hover:shadow-[0_0_40px_rgba(255,255,255,0.05)] cursor-default ${article.col}`}
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
      <ScamStatistics setActiveTab={setActiveTab} />
      <IntelligenceEcosystem />
      <EducationSection />
      <div className="py-24 text-center max-w-4xl mx-auto px-6">
        <div className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1 mb-6">
          <span className="text-[10px] font-mono text-emerald-400 tracking-wider">VERIFIKASI RISIKO DIGITAL</span>
        </div>
        <h2 className="text-4xl md:text-5xl font-display font-medium mb-6 tracking-tight">Saring Sebelum Percaya.</h2>
        <p className="text-lg text-neutral-400 mb-10">Deteksi Ancaman Sebelum Terlambat. Bergabung dengan ekosistem intelijen digital kami dan lindungi diri Anda hari ini.</p>
        <button onClick={() => setActiveTab('scanner')} className="bg-emerald-400 text-neutral-950 px-10 py-4 rounded-xl font-medium hover:bg-emerald-300 transition-colors shadow-[0_0_40px_rgba(182,255,59,0.15)] flex items-center gap-2 mx-auto">
          Mulai Analisis Sekarang <ArrowRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

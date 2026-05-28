'use client';

import { motion, AnimatePresence } from 'motion/react';
import { ArrowRight, FileWarning, ImageIcon, Radar, BarChart3, Eye, Link2, MessageSquare, ChevronDown, AlertCircle, Lock, ShieldAlert, Search, Smartphone, Shield, CreditCard } from 'lucide-react';
import React, { useState } from 'react';
import Image from 'next/image';
import { LightRays } from '../ui/light-rays';
import { AnimatedBeam } from '../ui/AnimatedBeam';
import { ScrollVelocityContainer, ScrollVelocityRow } from '../ui/scroll-based-velocity';
import { useIntel } from '../IntelligenceProvider';
import { cn } from '@/lib/utils';

function InteractiveDemo() {
  const [activeDemo, setActiveDemo] = useState(0);
  const demos = ['WhatsApp Social Engineering', 'Fake Transfer Receipt', 'QRIS Payment Manipulation'];

  return (
    <section className="py-32 bg-neutral-900/60 border-t border-neutral-800/80 relative overflow-hidden">
      <LightRays count={8} color="rgba(255, 159, 28, 0.08)" speed={12} blur={40} length="70vh" className="opacity-60" />
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-amber-500/45 to-transparent" />
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
      <div className="absolute top-0 left-10 right-10 h-[1.5px] bg-gradient-to-r from-transparent via-purple-500/40 to-transparent" />
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

function BentoGrid() {
  const [activeCard, setActiveCard] = useState(0);

  const cards = [
    {
      id: "deteksi", number: "01", label: "INTI MESIN", color: "emerald",
      icon: Radar,
      title: "Deteksi Ancaman Real-Time", tagline: '"Pindai apa saja. Ketahui seketika."',
      bullets: [
        "Analisis URL, teks, dan screenshot dalam hitungan detik",
        "Hybrid engine (rule-based + AI) untuk akurasi tinggi",
        "Deteksi phishing, scam, malware, dan social engineering",
        "Tidak bergantung sepenuhnya pada AI (anti-halusinasi)",
      ],
      quote: '"Bukan sekadar AI — ini sistem analisis keamanan."',
      visual: (
        <div className="bg-neutral-950/80 border border-neutral-900/40 p-4 rounded-xl flex items-center justify-between text-xs font-mono">
          <div className="flex items-center gap-3">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping" />
            <span className="text-neutral-400 truncate max-w-[200px] sm:max-w-xs">https://bca-klik-auth.secure-login.id</span>
          </div>
          <span className="text-emerald-400 font-bold">TERDUGA PHISHING</span>
        </div>
      ),
    },
    {
      id: "pulse", number: "02", label: "DENYUT ANCAMAN", color: "amber",
      icon: Radar,
      title: "VERIX Pulse", tagline: '"Lihat apa yang sedang terjadi."',
      bullets: [
        "Feed ancaman real-time (Abuse.ch + PhishTank + lokal)",
        "Hotspot scam di Indonesia",
        "AI situational report harian",
      ],
      quote: '"Radar ancaman digital."',
      visual: (
        <div className="flex items-center gap-4 bg-neutral-950/60 p-3.5 border border-neutral-900 rounded-xl z-10">
          <span className="flex h-2.5 w-2.5 relative">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75" />
            <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-red-500" />
          </span>
          <div className="text-left">
            <p className="text-[10px] font-mono text-neutral-400 uppercase">ANCAMAN AKTIF TERDETEKSI</p>
            <p className="text-xs font-semibold text-white truncate max-w-[150px]">Phishing Tagihan Listrik PLN (.APK)</p>
          </div>
        </div>
      ),
    },
    {
      id: "laporan", number: "03", label: "INTELIJEN", color: "teal",
      icon: BarChart3,
      title: "Laporan Keamanan Siber", tagline: '"Setiap pindaian menjadi intelijen."',
      bullets: [
        "Riwayat scan lengkap dengan risk scoring",
        "Detail red flags & indikator teknis",
        "Export laporan (bukti hukum / edukasi)",
        "Insight tren serangan personal",
      ],
      quote: '"Dari satu scan → jadi insight."',
    },
    {
      id: "ai", number: "04", label: "AI PENJELASAN", color: "blue",
      icon: Eye,
      title: "Penjelasan Bertenaga AI", tagline: '"Pahami ancaman layaknya seorang analis."',
      bullets: [
        "Penjelasan detail kenapa suatu konten berbahaya",
        "Breakdown taktik manipulasi (urgency, impersonation, dll)",
        "Output konsisten (deterministic-configured AI)",
        "Multi-model fallback (DeepSeek, Pixtral, Qwen, Gemini)",
      ],
      quote: '"Dari \u2018ini scam\u2019 → jadi \u2018ini kenapa scam\u2019."',
      visual: (
        <div className="relative w-full h-[120px] md:h-[140px] pointer-events-none">
          <div className="absolute left-4 top-2 w-10 h-10 rounded-full bg-neutral-800/40 backdrop-blur-sm border border-neutral-700/30 flex items-center justify-center shadow-[0_0_14px_rgba(59,130,246,0.18)] animate-[float-bubble-1_6s_ease-in-out_infinite]">
            <Image src="/logos/deepseek.svg" width={18} height={18} alt="DeepSeek" />
          </div>
          <div className="absolute right-8 top-0 w-10 h-10 rounded-full bg-neutral-800/40 backdrop-blur-sm border border-neutral-700/30 flex items-center justify-center shadow-[0_0_14px_rgba(168,85,247,0.18)] animate-[float-bubble-2_5s_ease-in-out_infinite]">
            <Image src="/logos/mistral.svg" width={18} height={18} alt="Pixtral" />
          </div>
          <div className="absolute left-12 bottom-2 w-10 h-10 rounded-full bg-neutral-800/40 backdrop-blur-sm border border-neutral-700/30 flex items-center justify-center shadow-[0_0_14px_rgba(16,185,129,0.18)] animate-[float-bubble-3_7s_ease-in-out_infinite]">
            <Image src="/logos/qwen.svg" width={18} height={18} alt="Qwen" />
          </div>
          <div className="absolute right-4 bottom-0 w-14 h-14 rounded-full bg-neutral-800/60 backdrop-blur-md border-2 border-amber-500/25 flex items-center justify-center shadow-[0_0_24px_rgba(245,158,11,0.25)] animate-[float-bubble-gemini_8s_ease-in-out_infinite]">
            <Image src="/logos/gemini.svg" width={24} height={24} alt="Gemini" />
          </div>
        </div>
      ),
    },
    {
      id: "ekstensi", number: "05", label: "EKSTENSI", color: "blue",
      icon: Link2, comingSoon: true,
      title: "Ekstensi Browser", tagline: '"Perlindungan, di mana pun Anda menjelajah."',
      bullets: [
        "Deteksi phishing saat browsing",
        "Peringatan real-time sebelum klik link",
        "Integrasi langsung dengan engine VERIX",
        "Ringan & mengutamakan privasi",
      ],
      quote: '"Jangan tunggu kena dulu baru sadar."',
    },
    {
      id: "whatsapp", number: "06", label: "BOT PESAN", color: "purple",
      icon: MessageSquare, comingSoon: true,
      title: "Asisten Keamanan WhatsApp", tagline: '"Teruskan. Pindai. Tetap aman."',
      bullets: [
        "Kirim pesan mencurigakan langsung ke bot",
        "Auto-detect link & scam dari chat",
        "Bisa scan screenshot penipuan",
        "Tidak perlu buka website",
      ],
      quote: '"Security yang ikut ke chat kamu."',
      visual: <AnimatedBeam />,
    },
  ];

  return (
    <section className="py-32 max-w-7xl mx-auto px-6 relative overflow-hidden">
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

      <div className="flex flex-col gap-4 max-w-4xl mx-auto md:hidden">
        {cards.map((card, idx) => {
          const isActive = activeCard === idx;
          const accent = card.color;

          return (
            <div
              key={card.id}
              className={`relative rounded-3xl border transition-all duration-500 overflow-hidden cursor-pointer ${
                isActive
                  ? "border-emerald-800/40 bg-neutral-900 shadow-[0_0_30px_rgba(16,185,129,0.05)]"
                  : "border-neutral-800/60 bg-neutral-900/50 hover:bg-neutral-900/80"
              }`}
              onClick={() => setActiveCard(isActive ? -1 : idx)}
            >
              <div className="flex items-center justify-between px-6 py-5">
                <div className="flex items-center gap-4 min-w-0">
                  <span className="font-mono text-xs text-neutral-500 shrink-0">{card.number}</span>
                  <div className="w-10 h-10 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center shrink-0">
                    <card.icon className={`w-4 h-4 text-${accent}-400${accent === "amber" ? " animate-pulse" : ""}`} />
                  </div>
                  <div className="min-w-0">
                    <span className={`text-[10px] font-mono text-${accent}-400 uppercase tracking-widest font-semibold`}>{card.label}</span>
                    <h3 className="text-base font-display font-medium text-white mt-0.5 truncate">{card.title}</h3>
                  </div>
                </div>
                <div className="flex items-center gap-3 shrink-0 ml-3">
                  {card.comingSoon && (
                    <span className="text-[9px] font-mono text-neutral-400 bg-neutral-800/60 px-2 py-1 rounded-full border border-neutral-700/40">Segera Hadir</span>
                  )}
                  <motion.div animate={{ rotate: isActive ? 180 : 0 }} transition={{ duration: 0.3 }}>
                    <ChevronDown className="w-4 h-4 text-neutral-500" />
                  </motion.div>
                </div>
              </div>

              <AnimatePresence initial={false}>
                {isActive && (
                  <motion.div
                    initial={{ height: 0, opacity: 0 }}
                    animate={{ height: "auto", opacity: 1 }}
                    exit={{ height: 0, opacity: 0 }}
                    transition={{ duration: 0.35, ease: "easeInOut" }}
                    className="overflow-hidden"
                  >
                    <div className="px-6 pb-8 pt-4 border-t border-neutral-800/40 relative">
                      <p className="text-neutral-400 text-sm mb-4">{card.tagline}</p>
                      <ul className="space-y-2 text-neutral-500 text-xs mb-5">
                        {card.bullets.map((b, i) => <li key={i} className="flex items-center gap-2">✓ {b}</li>)}
                      </ul>
                      {card.visual && <div className="mb-5">{card.visual}</div>}
                      <p className="text-[11px] text-neutral-600 font-mono italic">{card.quote}</p>
                      {card.comingSoon && (
                        <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-[2px] rounded-b-3xl flex items-center justify-center z-10">
                          <div className="flex flex-col items-center gap-2">
                            <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800/80 px-3 py-1 rounded-full border border-neutral-700/60 tracking-wider">Segera Hadir</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          );
        })}
      </div>

      <div className="hidden md:flex flex-row gap-3 h-[560px] max-w-7xl mx-auto">
        {cards.map((card, idx) => {
          const isActive = activeCard === idx;
          const accent = card.color;

          return (
            <motion.div
              key={card.id}
              layout
              animate={{ flex: isActive ? 1 : '0 0 110px' }}
              transition={{ duration: 0.45, ease: [0.25, 0.1, 0.25, 1] }}
              className={`relative rounded-3xl border overflow-hidden cursor-pointer ${
                isActive
                  ? "border-emerald-800/40 bg-neutral-900 shadow-[0_0_30px_rgba(16,185,129,0.05)]"
                  : "border-neutral-800/60 bg-neutral-900/50 hover:bg-neutral-900/80"
              }`}
              onClick={() => setActiveCard(isActive ? -1 : idx)}
            >
              {!isActive && (
                <div className="flex flex-col items-center justify-center gap-4 h-full px-2 py-8 select-none w-[110px]">
                  <div className="w-14 h-14 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center">
                    <card.icon className={`w-6 h-6 text-${accent}-400${accent === "amber" ? " animate-pulse" : ""}`} />
                  </div>
                  <span className="font-mono text-sm font-semibold text-neutral-500">{card.number}</span>
                  <span className="[writing-mode:vertical-rl] text-[10px] font-mono text-neutral-400 uppercase tracking-widest font-semibold">
                    {card.label}
                  </span>
                  {card.comingSoon && (
                    <span className="text-[8px] font-mono text-neutral-500 bg-neutral-800/60 px-1.5 py-0.5 rounded-full border border-neutral-700/40 mt-1">Segera</span>
                  )}
                </div>
              )}

              {isActive && (
                <div className="p-8 md:p-10 flex flex-col h-full overflow-y-auto no-scrollbar">
                  <div className="flex items-center justify-between mb-6 shrink-0">
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-2xl bg-neutral-800/80 border border-neutral-700/60 flex items-center justify-center shrink-0">
                        <card.icon className={`w-6 h-6 text-${accent}-400${accent === "amber" ? " animate-pulse" : ""}`} />
                      </div>
                      <div>
                        <span className={`text-xs font-mono text-${accent}-400 uppercase tracking-widest font-semibold`}>{card.number}. {card.label}</span>
                        <h3 className="text-2xl font-display font-semibold text-white mt-1">{card.title}</h3>
                      </div>
                    </div>
                    {card.comingSoon && (
                      <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800/60 px-2.5 py-1 rounded-full border border-neutral-700/40 shrink-0 ml-2">Segera Hadir</span>
                    )}
                  </div>

                  <div className="flex-1 min-h-0 space-y-5 relative">
                    <p className="text-neutral-400 text-base leading-relaxed">{card.tagline}</p>
                    <ul className="space-y-3 text-neutral-500 text-sm">
                      {card.bullets.map((b, i) => <li key={i} className="flex items-center gap-2">✓ {b}</li>)}
                    </ul>
                    {card.visual && <div>{card.visual}</div>}
                    {card.comingSoon && (
                      <div className="absolute inset-0 bg-neutral-950/60 backdrop-blur-[2px] rounded-2xl flex items-center justify-center z-10">
                        <div className="flex flex-col items-center gap-2">
                          <span className="text-[10px] font-mono text-neutral-400 bg-neutral-800/80 px-3 py-1 rounded-full border border-neutral-700/60 tracking-wider">Segera Hadir</span>
                        </div>
                      </div>
                    )}
                  </div>

                  <p className={cn("text-xs text-neutral-600 font-mono italic shrink-0 mt-auto pt-4", card.comingSoon && "opacity-30")}>{card.quote}</p>
                </div>
              )}
            </motion.div>
          );
        })}
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
    <section className="py-16 md:py-32 bg-neutral-950 border-y border-neutral-800/50 relative overflow-hidden">
      <div className="absolute inset-0 bg-[linear-gradient(to_right,var(--color-neutral-800)_1px,transparent_1px),linear-gradient(to_bottom,var(--color-neutral-800)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_80%_80%_at_50%_50%,#000_70%,transparent_100%)] opacity-20 pointer-events-none" />
      <div className="absolute top-10 left-1/4 w-[400px] h-[400px] bg-emerald-500/[0.03] blur-[120px] rounded-full pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-10 right-1/4 w-[450px] h-[450px] bg-cyan-500/[0.03] blur-[130px] rounded-full pointer-events-none animate-pulse-slow" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 w-[400px] h-[400px] bg-rose-500/[0.02] blur-[150px] rounded-full pointer-events-none animate-pulse-slow" />
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-cyan-500/40 to-transparent" />

      <div className="max-w-7xl mx-auto px-6 relative z-10">
        <div className="text-center mb-12 md:mb-24 relative">
          <div className="inline-flex items-center gap-2 bg-neutral-900/80 backdrop-blur border border-neutral-800 rounded-full px-4 py-1.5 mb-8 hover:bg-neutral-800 transition-colors cursor-default">
            <span className="w-2 h-2 rounded-full bg-emerald-400 animate-[pulse_2s_ease-in-out_infinite] shadow-[0_0_10px_rgba(182,255,59,0.5)]" />
            <span className="text-[10px] font-mono text-emerald-400 tracking-wider">EKOSISTEM INTELIJEN LANGSUNG</span>
          </div>
          <h2 className="text-5xl md:text-6xl font-display font-medium tracking-tight mb-8">Ditenagai oleh Intelijen <br className="hidden md:block" /> Ancaman Realtime<span className="text-emerald-400">.</span></h2>
          <p className="text-neutral-400 text-lg md:text-xl max-w-3xl mx-auto leading-relaxed">
            VERIX menggabungkan AI analysis dengan sumber keamanan digital terpercaya untuk mendeteksi ancaman digital secara realtime.
          </p>
        </div>

        {(() => {
          const renderSourceCard = (source: typeof sources[0], keyId: number) => {
            const Icon = source.icon;

            let dotColor = '#10B981';
            if (source.color.includes('emerald')) dotColor = '#B6FF3B';
            else if (source.color.includes('blue')) dotColor = '#4DA8FF';
            else if (source.color.includes('amber')) dotColor = '#FFB547';
            else if (source.color.includes('purple')) dotColor = '#A855F7';
            else if (source.color.includes('cyan')) dotColor = '#22D3EE';
            else if (source.color.includes('rose')) dotColor = '#FB7185';

            return (
              <div key={keyId} className="w-[290px] sm:w-[360px] lg:w-[440px] shrink-0 h-[260px] sm:h-[290px] lg:h-[320px] mx-3">
                <div className="h-full bg-neutral-900/90 backdrop-blur-md border border-neutral-800 hover:border-neutral-600 p-6 sm:p-8 rounded-[2rem] flex flex-col relative overflow-hidden group transition-all duration-500 shadow-xl hover:shadow-2xl hover:shadow-emerald-500/5">
                  <div className={`absolute top-0 right-0 w-64 h-64 opacity-5 filter blur-[80px] transition-all duration-700 group-hover:opacity-30 group-hover:scale-150 ${source.bg}`} />
                  <div className={`absolute -inset-px opacity-0 group-hover:opacity-10 rounded-[2rem] transition-opacity duration-500 bg-gradient-to-br from-white to-transparent`} />
                  <div className="absolute top-0 left-0 w-full h-[2px] bg-gradient-to-r from-transparent via-emerald-400/50 to-transparent -translate-x-full group-hover:animate-[shimmer_2s_infinite]" />

                  <div className="flex items-start justify-between mb-5 sm:mb-8 z-10">
                    <div className={`w-12 h-12 sm:w-14 sm:h-14 rounded-2xl flex items-center justify-center ${source.bg} ${source.border} border relative overflow-hidden group-hover:scale-110 transition-transform duration-500`}>
                      <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity" />
                      <Icon className={`w-5 h-5 sm:w-6 sm:h-6 ${source.color} relative z-10 group-hover:animate-pulse`} />
                    </div>
                    <div className="flex items-center gap-2 bg-neutral-950 rounded-full px-3 py-1.5 border border-neutral-800 group-hover:border-neutral-700 transition-colors shadow-inner">
                      <span className="w-2 h-2 rounded-full animate-pulse" style={{ backgroundColor: dotColor, boxShadow: `0 0 8px ${dotColor}` }} />
                      <span className="text-[10px] font-mono text-neutral-300 tracking-wide">{source.status}</span>
                    </div>
                  </div>

                  <div className="z-10 flex-1 min-h-0 flex flex-col">
                    <h3 className="text-xl sm:text-2xl font-medium text-white mb-1.5 tracking-tight group-hover:text-emerald-50 transition-colors">{source.name}</h3>
                    <p className="text-neutral-400 text-xs sm:text-sm leading-relaxed group-hover:text-neutral-300 transition-colors">{source.purpose}</p>
                    <div className="flex flex-wrap gap-x-4 gap-y-1.5 pt-4 sm:pt-6 mt-auto">
                      {source.items.map((item, i) => (
                        <div key={i} className="flex items-center gap-1.5">
                          <div className={`w-1.5 h-1.5 rounded-full ${source.bg.replace('/10', '')} shadow-[0_0_5px_currentColor] shrink-0`} style={{ color: dotColor, backgroundColor: dotColor }} />
                          <span className="text-xs sm:text-sm font-mono text-neutral-400 group-hover:text-neutral-200 transition-colors whitespace-nowrap">{item}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            );
          };

          return (
            <ScrollVelocityContainer>
              <div className="absolute left-0 top-0 bottom-0 w-20 sm:w-28 lg:w-40 z-10 pointer-events-none bg-gradient-to-r from-neutral-950 via-neutral-950/90 to-transparent" />
              <div className="absolute right-0 top-0 bottom-0 w-20 sm:w-28 lg:w-40 z-10 pointer-events-none bg-gradient-to-l from-neutral-950 via-neutral-950/90 to-transparent" />
              <ScrollVelocityRow baseVelocity={6} direction={1} className="mb-4 sm:mb-6">
                {sources.slice(0, 3).map((source, idx) => renderSourceCard(source, idx))}
              </ScrollVelocityRow>
              <ScrollVelocityRow baseVelocity={6} direction={-1}>
                {sources.slice(3, 6).map((source, idx) => renderSourceCard(source, idx + 3))}
              </ScrollVelocityRow>
            </ScrollVelocityContainer>
          );
        })()}

        <div className="mt-32 pt-20 border-t border-neutral-800/50">
          <div className="text-center mb-16 relative">
            <div className="absolute inset-0 bg-emerald-500/5 blur-[100px] w-64 h-64 mx-auto rounded-full -top-10" />
            <h3 className="text-3xl font-display font-medium text-white mb-6 tracking-tight relative z-10">Alur Intelijen AI</h3>
            <p className="text-neutral-400 text-lg relative z-10 max-w-xl mx-auto">Analisis ancaman multi-layer dalam hitungan milidetik. Dari deteksi awal hingga perlindungan aktif.</p>
          </div>

          <div className="bg-neutral-900 border border-neutral-800 rounded-3xl p-8 lg:p-12 relative overflow-hidden max-w-5xl mx-auto shadow-2xl">
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
                      <div className="w-full h-[2px] bg-neutral-800 overflow-hidden rounded-full mb-8 relative">
                        <motion.div
                          animate={{ x: ["-100%", "200%"] }}
                          transition={{ repeat: Infinity, duration: 2, delay: idx * 0.2, ease: "linear" }}
                          className="absolute inset-0 w-1/2 bg-gradient-to-r from-transparent via-emerald-400/60 to-transparent"
                        />
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
      <div className="absolute top-0 left-0 right-0 h-[1.5px] bg-gradient-to-r from-transparent via-teal-500/40 to-transparent" />
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

function CTASection({ setActiveTab }: { setActiveTab: (id: string) => void }) {
  return (
    <div className="py-24 text-center max-w-4xl mx-auto px-6 relative overflow-hidden">
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[500px] h-[500px] bg-emerald-500/[0.03] blur-[120px] rounded-full pointer-events-none animate-pulse-slow" />
      <div className="absolute top-10 left-1/3 w-[300px] h-[300px] bg-white/[0.02] blur-[100px] rounded-full pointer-events-none animate-pulse-slow" />
      <div className="absolute bottom-0 left-10 right-10 h-[1.5px] bg-gradient-to-r from-transparent via-white/20 to-transparent" />

      <div className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1 mb-6 relative z-10">
        <span className="text-[10px] font-mono text-emerald-400 tracking-wider">VERIFIKASI RISIKO DIGITAL</span>
      </div>
      <h2 className="text-4xl md:text-5xl font-display font-medium mb-6 tracking-tight relative z-10">Verifikasi Sebelum Percaya.</h2>
      <p className="text-lg text-neutral-400 mb-10 relative z-10">Deteksi Ancaman Sebelum Terlambat. Bergabung dengan ekosistem intelijen digital kami dan lindungi diri Anda hari ini.</p>
      <button onClick={() => setActiveTab('scanner')} className="bg-emerald-400 text-neutral-950 px-10 py-4 rounded-xl font-medium hover:bg-emerald-300 transition-colors shadow-[0_0_40px_rgba(182,255,59,0.15)] flex items-center gap-2 mx-auto relative z-10">
        Mulai Analisis Sekarang <ArrowRight className="w-4 h-4" />
      </button>
    </div>
  );
}

export default function BelowFoldContent({ setActiveTab }: { setActiveTab: (id: string) => void }) {
  return (
    <>
      <InteractiveDemo />
      <ExplainableAI />
      <BentoGrid />
      <IntelligenceEcosystem />
      <EducationSection />
      <CTASection setActiveTab={setActiveTab} />
    </>
  );
}

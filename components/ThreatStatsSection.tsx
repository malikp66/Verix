"use client"

import { useIntel } from "./IntelligenceProvider"
import { NumberTicker } from "./ui/number-ticker"
import { Marquee } from "./ui/marquee"
import { cn } from "@/lib/utils"
import { motion } from "motion/react"
import { ShieldAlert, FileWarning, Scan, UserCheck, Users, Smartphone, ShoppingBag, AlertCircle, ArrowUpRight } from 'lucide-react'

const stats = [
  {
    value: 1.9,
    decimalPlaces: 1 as const,
    prefix: "",
    suffix: "M+",
    label: "Kasus kejahatan digital",
    sub: "ditangani di Indonesia",
    color: "text-cyan-400",
    borderColor: "border-cyan-500/20",
    hoverBorder: "hover:border-cyan-400/40",
    glowColor: "rgba(34,211,238,0.15)",
  },
  {
    value: 2.3,
    decimalPlaces: 1 as const,
    prefix: "Rp ",
    suffix: "T+",
    label: "Total kerugian",
    sub: "akibat penipuan online",
    color: "text-red-400",
    borderColor: "border-red-500/20",
    hoverBorder: "hover:border-red-400/40",
    glowColor: "rgba(248,113,113,0.15)",
  },
  {
    value: 1.6,
    decimalPlaces: 1 as const,
    prefix: "",
    suffix: "M+",
    label: "Situs berbahaya",
    sub: "diblokir oleh Kominfo",
    color: "text-yellow-400",
    borderColor: "border-yellow-500/20",
    hoverBorder: "hover:border-yellow-400/40",
    glowColor: "rgba(250,204,21,0.15)",
  },
]

function getRelativeTime(dateStr: string) {
  try {
    const diffMs = Date.now() - new Date(dateStr).getTime();
    const diffMins = Math.floor(diffMs / 60000);
    if (diffMins < 1) return 'Baru saja';
    if (diffMins < 60) return `${diffMins}m ago`;
    const diffHours = Math.floor(diffMins / 60);
    if (diffHours < 24) return `${diffHours}h ago`;
    const diffDays = Math.floor(diffHours / 24);
    return `${diffDays}d ago`;
  } catch {
    return 'Baru saja';
  }
}

const now = Date.now();
const fallbackNews = [
  { title: "Phishing BCA Mobile Clone Menyasar 150+ Nasabah Baru", type: "Phishing", link: "https://news.google.com", publishedAt: new Date(now - 5*60000).toISOString() },
  { title: "APK Undangan Nikah Palsu Menyebar Masif via WhatsApp Group", type: "APK Malware", link: "https://news.google.com", publishedAt: new Date(now - 12*60000).toISOString() },
  { title: "QRIS Palsu Masjid Raya Ditemukan di 3 Kota Besar", type: "QRIS Scam", link: "https://news.google.com", publishedAt: new Date(now - 25*60000).toISOString() },
  { title: "Pinjol Ilegal Gunakan AI Deepfake untuk Tagih Utang", type: "Deepfake", link: "https://news.google.com", publishedAt: new Date(now - 40*60000).toISOString() },
  { title: "Penipuan Lowongan Kerja Like & Share Targetkan Pelajar", type: "Social Engineering", link: "https://news.google.com", publishedAt: new Date(now - 60*60000).toISOString() },
  { title: "Situs Palsu BPJS Kesehatan Curi Data 5.000+ Pengguna", type: "Phishing", link: "https://news.google.com", publishedAt: new Date(now - 90*60000).toISOString() },
  { title: "Modus OTP Fraud via SMS Spoofing Menyerang Nasabah Bank", type: "OTP Fraud", link: "https://news.google.com", publishedAt: new Date(now - 120*60000).toISOString() },
  { title: "Penipuan COD Fiktif Menggunakan Nomor Resi Palsu", type: "E-Commerce Scam", link: "https://news.google.com", publishedAt: new Date(now - 180*60000).toISOString() },
  { title: "Deepfake CEO Video Call Tipu Transfer Rp 1,2 Miliar", type: "Deepfake", link: "https://news.google.com", publishedAt: new Date(now - 240*60000).toISOString() },
]

const typeConfig: Record<string, { icon: React.ReactNode; bg: string; color: string; hoverBorder: string; btn: string }> = {
  Phishing:           { icon: <ShieldAlert className="w-3.5 h-3.5" />, bg: 'bg-red-500/10',      color: 'text-red-400',      hoverBorder: 'hover:border-red-500/20',      btn: 'bg-red-500/10 hover:bg-red-500/20 text-red-400/70 hover:text-red-400' },
  'APK Malware':      { icon: <FileWarning className="w-3.5 h-3.5" />, bg: 'bg-orange-500/10',   color: 'text-orange-400',   hoverBorder: 'hover:border-orange-500/20',   btn: 'bg-orange-500/10 hover:bg-orange-500/20 text-orange-400/70 hover:text-orange-400' },
  'QRIS Scam':        { icon: <Scan className="w-3.5 h-3.5" />,        bg: 'bg-rose-500/10',     color: 'text-rose-400',     hoverBorder: 'hover:border-rose-500/20',     btn: 'bg-rose-500/10 hover:bg-rose-500/20 text-rose-400/70 hover:text-rose-400' },
  Deepfake:           { icon: <UserCheck className="w-3.5 h-3.5" />,   bg: 'bg-purple-500/10',   color: 'text-purple-400',   hoverBorder: 'hover:border-purple-500/20',   btn: 'bg-purple-500/10 hover:bg-purple-500/20 text-purple-400/70 hover:text-purple-400' },
  'Social Engineering': { icon: <Users className="w-3.5 h-3.5" />,     bg: 'bg-amber-500/10',    color: 'text-amber-400',    hoverBorder: 'hover:border-amber-500/20',    btn: 'bg-amber-500/10 hover:bg-amber-500/20 text-amber-400/70 hover:text-amber-400' },
  'OTP Fraud':        { icon: <Smartphone className="w-3.5 h-3.5" />,  bg: 'bg-pink-500/10',     color: 'text-pink-400',     hoverBorder: 'hover:border-pink-500/20',     btn: 'bg-pink-500/10 hover:bg-pink-500/20 text-pink-400/70 hover:text-pink-400' },
  'E-Commerce Scam':  { icon: <ShoppingBag className="w-3.5 h-3.5" />, bg: 'bg-red-500/10',      color: 'text-red-400',      hoverBorder: 'hover:border-red-500/20',      btn: 'bg-red-500/10 hover:bg-red-500/20 text-red-400/70 hover:text-red-400' },
}

function ReviewCard({ title, type, link, publishedAt }: { title: string; type?: string; link?: string; publishedAt?: string }) {
  const cfg = type ? typeConfig[type] : undefined
  const icon = cfg?.icon || <AlertCircle className="w-3.5 h-3.5" />
  const bg = cfg?.bg || 'bg-red-500/10'
  const color = cfg?.color || 'text-red-400'
  const hoverBorder = cfg?.hoverBorder || 'hover:border-red-500/20'
  const btn = cfg?.btn || 'bg-red-500/10 hover:bg-red-500/20 text-red-400/70 hover:text-red-400'

  return (
    <figure
      className={cn(
        "relative shrink-0 w-64 rounded-xl border p-4 transition-all duration-300",
        "border-white/[0.08] bg-white/[0.03] hover:bg-white/[0.06]", hoverBorder
      )}
    >
      <div className="flex items-start justify-between gap-2">
        <div className="flex flex-row items-center gap-3 min-w-0">
          <div className={cn("w-8 h-8 rounded-full flex items-center justify-center shrink-0", bg, color)}>
            {icon}
          </div>
          <div className="flex flex-col min-w-0">
            <figcaption className="text-sm font-medium text-white truncate">{type || "SCAM ALERT"}</figcaption>
            <p className="text-xs text-neutral-500">{publishedAt ? getRelativeTime(publishedAt) : 'Baru saja'}</p>
          </div>
        </div>
        {link && (
          <a
            href={link}
            target="_blank"
            rel="noopener noreferrer"
            onClick={(e) => e.stopPropagation()}
            className={cn("shrink-0 w-6 h-6 rounded-md flex items-center justify-center transition-colors", btn)}
          >
            <ArrowUpRight className="w-3 h-3" />
          </a>
        )}
      </div>
      <blockquote className="mt-2.5 text-sm text-neutral-300 leading-snug line-clamp-2">{title}</blockquote>
    </figure>
  )
}

export function ThreatStatsSection() {
  const intel = useIntel()

  const newsItems =
    intel?.data && intel.data.length > 0
      ? intel.data.map((item: any) => ({
          title: item.title,
          type: item.type || "SCAM ALERT",
          link: item.link,
          publishedAt: item.publishedAt,
        }))
      : fallbackNews

  const split = Math.ceil(newsItems.length / 3)
  const col1 = newsItems.slice(0, split)
  const col2 = newsItems.slice(split, split * 2)
  const col3 = newsItems.slice(split * 2)

  const quadrupledCol1 = [...col1, ...col1, ...col1, ...col1]
  const quadrupledCol2 = [...col2, ...col2, ...col2, ...col2]
  const quadrupledCol3 = [...col3, ...col3, ...col3, ...col3]

  return (
    <section className="py-24 px-6 md:px-12 max-w-7xl mx-auto relative">
      {/* Background glow */}
      <div className="absolute top-40 left-1/2 -translate-x-1/2 w-[800px] h-[800px] bg-emerald-500/[0.02] blur-[180px] rounded-full pointer-events-none" />

      <div className="grid md:grid-cols-2 gap-16 items-center relative z-10">
        {/* ──── LEFT ──── */}
        <div className="space-y-8">
          {/* LIVE badge */}
          <div className="inline-flex items-center gap-2 bg-neutral-900 border border-neutral-800 rounded-full px-3 py-1">
            <span className="relative flex h-2 w-2">
              <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
              <span className="relative inline-flex rounded-full h-2 w-2 bg-emerald-400" />
            </span>
            <span className="text-[10px] font-mono text-emerald-400 tracking-wider">LIVE INCIDENTS</span>
          </div>

          {/* Hook headline */}
          <div className="space-y-2">
            <p className="text-base text-neutral-300 font-medium italic leading-relaxed max-w-md">
              &ldquo;Masalah ini bukan kecil. Ini skala nasional.&rdquo;
            </p>
          </div>

          {/* Headline */}
          <h2 className="text-3xl md:text-4xl font-display font-semibold tracking-tight text-white leading-[1.2]">
            Ancaman Digital di Indonesia Meningkat Drastis.
          </h2>

          {/* Subtext */}
          <p className="text-neutral-400 leading-relaxed max-w-lg text-sm">
            Phishing, APK malware, dan penipuan sosial terus berkembang  menargetkan jutaan pengguna
            setiap hari tanpa disadari. Data terbaru menunjukkan peningkatan eksponensial dalam serangan
            siber di Indonesia.
          </p>

          {/* Stats grid  3 equal columns */}
          <div className="grid grid-cols-3 gap-3 pt-2">
            {stats.map((stat, i) => (
              <motion.div
                key={stat.label}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.15, duration: 0.5 }}
                className={cn(
                  "group relative rounded-2xl border p-4 transition-all duration-300",
                  "bg-white/[0.02] backdrop-blur-sm",
                  stat.borderColor,
                  stat.hoverBorder,
                  "hover:scale-[1.02]"
                )}
              >
                {/* Hover glow */}
                <div
                  className="absolute inset-0 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-500 pointer-events-none"
                  style={{
                    background: `radial-gradient(160px circle at center, ${stat.glowColor}, transparent)`,
                  }}
                />
                <div className="relative z-10">
                  <div className={cn("text-2xl md:text-3xl font-display font-bold tracking-tight mb-1 truncate", stat.color)}>
                    {stat.prefix}
                    <NumberTicker
                      value={stat.value}
                      decimalPlaces={stat.decimalPlaces}
                      className={stat.color}
                    />
                    {stat.suffix}
                  </div>
                  <p className="text-neutral-300 text-xs sm:text-sm font-medium leading-tight">{stat.label}</p>
                  <p className="text-neutral-500 text-[10px] sm:text-xs mt-0.5 leading-tight">{stat.sub}</p>
                </div>
              </motion.div>
            ))}
          </div>

          {/* Footnote */}
          <p className="text-[11px] text-neutral-600 max-w-md">
            Berdasarkan laporan Kominfo, BSSN, dan riset industri keamanan siber
          </p>
        </div>

        {/* ──── RIGHT  3D Vertical Marquee ──── */}
        <div className="relative h-[520px] w-full overflow-hidden rounded-2xl border border-white/[0.06] bg-white/[0.01] [perspective:300px]">
          <div
            className="flex flex-row items-center gap-3 absolute inset-0"
            style={{
              transform: "translateX(-200px) translateY(0px) translateZ(-80px) rotateX(20deg) rotateY(-10deg) rotateZ(20deg)",
            }}
          >
            <Marquee vertical pauseOnHover className="gap-3" style={{ "--duration": "18s" } as React.CSSProperties}>
              {quadrupledCol1.map((item, i) => (
                <ReviewCard key={`c1-${i}`} title={item.title} type={item.type} link={item.link} publishedAt={item.publishedAt} />
              ))}
            </Marquee>
            <Marquee vertical reverse pauseOnHover className="gap-3" style={{ "--duration": "22s" } as React.CSSProperties}>
              {quadrupledCol2.map((item, i) => (
                <ReviewCard key={`c2-${i}`} title={item.title} type={item.type} link={item.link} publishedAt={item.publishedAt} />
              ))}
            </Marquee>
            <Marquee vertical pauseOnHover className="gap-3" style={{ "--duration": "20s" } as React.CSSProperties}>
              {quadrupledCol3.map((item, i) => (
                <ReviewCard key={`c3-${i}`} title={item.title} type={item.type} link={item.link} publishedAt={item.publishedAt} />
              ))}
            </Marquee>
          </div>

          {/* Gradient overlays  all 4 sides */}
          <div className="pointer-events-none absolute inset-x-0 top-0 h-1/4 bg-gradient-to-b from-neutral-950 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-x-0 bottom-0 h-1/4 bg-gradient-to-t from-neutral-950 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 left-0 w-1/5 bg-gradient-to-r from-neutral-950 to-transparent z-10" />
          <div className="pointer-events-none absolute inset-y-0 right-0 w-1/5 bg-gradient-to-l from-neutral-950 to-transparent z-10" />
        </div>
      </div>
    </section>
  )
}

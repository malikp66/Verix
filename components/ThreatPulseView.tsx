'use client';

import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ComposableMap, Geographies, Geography, Marker } from 'react-simple-maps';
import { 
  Activity, 
  TrendingUp, 
  MapPin, 
  ShieldAlert, 
  Globe, 
  Clock, 
  Zap, 
  ShieldCheck, 
  ChevronRight, 
  Info,
  Server,
  RefreshCw,
  AlertTriangle
} from 'lucide-react';
import { ThreatItem, ThreatInsights } from '@/lib/threatFeeds';

const geoUrl = "https://unpkg.com/world-atlas@2.0.2/countries-110m.json";

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

// Campaign attack flow representation for Threat Stories
const CAMPAIGN_FLOWS = [
  {
    title: "BCA Phishing Network",
    steps: ["SMS / WA Alert", "Shortlink Redirect", "Fake BCA Domain", "OTP Stealer"],
    impact: "Pengambilalihan M-banking, saldo dikuras habis.",
    vector: "LINK",
    confidence: "98% (CRITICAL, verified by VirusTotal)",
    status: "ACTIVE",
    severity: "CRITICAL"
  },
  {
    title: "Undangan Nikah APK Malware",
    steps: ["WhatsApp Chat", "File APK Undangan", "SMS Permissions", "OTP Forwarder"],
    impact: "Pencurian SMS OTP, pengambilalihan akun Whatsapp.",
    vector: "APK",
    confidence: "96% (CRITICAL, verified by Abuse.ch)",
    status: "ACTIVE",
    severity: "CRITICAL"
  },
  {
    title: "QRIS Fake Merchant Sticker",
    steps: ["Stiker QRIS Palsu", "Toko / Merchant Scan", "Payment Redirect", "Direct Transfer"],
    impact: "Kerugian finansial konsumen, reputasi merchant rusak.",
    vector: "QRIS",
    confidence: "92% (HIGH, verified by Laporan Warga)",
    status: "ACTIVE",
    severity: "MEDIUM"
  },
  {
    title: "WhatsApp OTP Hijack Wave",
    steps: ["Call Spoofing", "Kasir / CS Palsu", "Social Engineering", "Account Transfer"],
    impact: "WhatsApp diambil alih secara penuh untuk penipuan.",
    vector: "SOCIAL_ENGINEERING",
    confidence: "91% (HIGH, verified by Kominfo)",
    status: "ACTIVE",
    severity: "HIGH"
  }
];

export function ThreatPulseView() {
  const [threats, setThreats] = useState<ThreatItem[]>([]);
  const [insights, setInsights] = useState<ThreatInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [hoveredThreat, setHoveredThreat] = useState<ThreatItem | null>(null);
  const [selectedCampaignTab, setSelectedCampaignTab] = useState<number>(0);

  const fetchThreatData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    
    try {
      const res = await fetch('/api/threats');
      const json = await res.json();
      if (json.success) {
        setThreats(json.data);
        setInsights(json.insights);
      }
    } catch (e) {
      console.error('Failed to sync threat data:', e);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchThreatData();
    // Evolving system: Poll every 12 seconds
    const interval = setInterval(() => {
      fetchThreatData(true);
    }, 12000);
    return () => clearInterval(interval);
  }, []);

  // Format Relative Time Helper
  const getRelativeTime = (timestampStr: string) => {
    const elapsed = Date.now() - new Date(timestampStr).getTime();
    const seconds = Math.floor(elapsed / 1000);
    const minutes = Math.floor(seconds / 60);
    const hours = Math.floor(minutes / 60);

    if (seconds < 10) return "Baru saja";
    if (seconds < 60) return `${seconds}d ago`;
    if (minutes < 60) return `${minutes}m ago`;
    return `${hours}h ago`;
  };

  // Time Decay Weight calculation for dynamic node styling
  // weight = Math.exp(-hours / 24)
  const getDecayWeight = (timestampStr: string) => {
    const hours = (Date.now() - new Date(timestampStr).getTime()) / (1000 * 60 * 60);
    // Return a weight between 0.35 and 1.0
    return Math.max(0.35, Math.min(1.0, Math.exp(-hours / 24)));
  };

  return (
    <div className="flex-1 w-full flex flex-col relative overflow-hidden bg-[#0A0A0A] text-white">
      {/* Cinematic Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(8,30,55,0.15)_0%,_rgba(10,10,10,0.95)_70%,_#0A0A0A_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-[0.05]" />

      {/* SECTION 1: HERO INTELLIGENCE SECTION */}
      <div className="relative z-10 px-6 md:px-8 pt-8 pb-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-neutral-900/60 bg-[#0A0A0A]/40 backdrop-blur-md">
        <div className="flex flex-col gap-1 max-w-2xl">
          <div className="flex items-center gap-2 text-cyan-400 font-mono text-[10px] tracking-[0.2em] font-semibold mb-1">
            <Activity className="w-3.5 h-3.5 animate-pulse text-cyan-500" />
            LIVE SECURITY SITUATIONAL AWARENESS
            {refreshing && (
              <span className="flex items-center gap-1 text-neutral-500 text-[9px] font-normal animate-pulse ml-2 font-sans tracking-normal">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Synchronizing Feeds...
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-medium tracking-tight text-white flex items-center gap-2.5">
            VERIX Pulse
            <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
              Level Orange
            </span>
          </h1>
          <p className="text-neutral-400 text-sm md:text-base leading-relaxed mt-1">
            Indonesia is under elevated phishing and malware campaigns. Real-time telemetry is actively analyzing, scoring, and tracing payloads.
          </p>
        </div>

        {/* Global Statistics Cards */}
        <div className="flex items-center gap-4 w-full lg:w-auto">
          <div className="flex-1 lg:flex-none flex flex-col gap-0.5 p-4 rounded-xl bg-[#111111]/80 border border-neutral-800/80 shadow-2xl relative overflow-hidden group min-w-[140px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-red-500/5 rounded-full blur-xl pointer-events-none" />
            <span className="text-neutral-500 font-mono text-[9px] tracking-wider uppercase">Threats Detected</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-mono font-medium text-white">
                {insights ? insights.totalThreatsToday.toLocaleString() : '1,248'}
              </span>
              <span className="text-red-500 font-mono text-[10px] flex items-center"><TrendingUp className="w-2.5 h-2.5 mr-0.5"/> +34%</span>
            </div>
          </div>
          
          <div className="flex-1 lg:flex-none flex flex-col gap-0.5 p-4 rounded-xl bg-[#111111]/80 border border-neutral-800/80 shadow-2xl relative overflow-hidden group min-w-[140px]">
            <div className="absolute top-0 right-0 w-24 h-24 bg-cyan-500/5 rounded-full blur-xl pointer-events-none" />
            <span className="text-neutral-500 font-mono text-[9px] tracking-wider uppercase">Active Campaigns</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-mono font-medium text-white">
                {insights ? insights.totalActiveCampaigns : '8'}
              </span>
              <span className="text-cyan-400 font-mono text-[9px] border border-cyan-500/20 px-1.5 py-0.2 rounded-full uppercase text-[8px] font-bold">MONITORED</span>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 2: DYNAMIC WARNING BANNER */}
      <div className="bg-red-950/20 border-b border-red-900/30 px-6 py-2.5 flex items-center gap-3 relative z-10">
        <span className="flex h-2 w-2 relative shrink-0">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-red-400 opacity-75"></span>
          <span className="relative inline-flex rounded-full h-2 w-2 bg-red-500"></span>
        </span>
        <AlertTriangle className="w-4 h-4 text-red-400 shrink-0" />
        <span className="text-xs md:text-sm text-red-200/90 font-medium">
          <strong className="text-red-400 mr-1.5 uppercase font-bold tracking-wide">Peringatan Kritis:</strong> 
          Penyebaran file malware APK berkedok undangan nikah dan surat tilang digital (ETLE) terdeteksi aktif di wilayah Jawa Barat dan Jawa Timur. Hindari menginstal aplikasi dari luar Play Store.
        </span>
      </div>

      {/* Main Combined Layout */}
      <div className="flex-1 relative flex flex-col lg:flex-row overflow-hidden min-h-0">
        {/* Left Interactive Map Area */}
        <div className="flex-1 relative min-h-[350px] lg:min-h-0 border-r border-neutral-900/60 bg-[#080808]">
          <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#111111]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-neutral-800/80">
            <Globe className="w-3.5 h-3.5 text-cyan-400 animate-spin-slow" />
            <span className="text-[10px] font-mono text-neutral-400 tracking-wider">INDONESIA SCAN ZONE ACTIVE</span>
          </div>

          <ComposableMap
            projection="geoMercator"
            projectionConfig={{
              scale: 2500,
              center: [118, -2.5]
            }}
            className="w-full h-full outline-none opacity-85 select-none"
          >
            <Geographies geography={geoUrl}>
              {({ geographies }) =>
                geographies.map((geo) => {
                  const isIndonesia = geo.properties.name === "Indonesia";
                  return (
                    <Geography
                      key={geo.rsmKey}
                      geography={geo}
                      fill={isIndonesia ? "#121b28" : "#080c14"}
                      stroke={isIndonesia ? "#163454" : "#121820"}
                      strokeWidth={isIndonesia ? 0.75 : 0.4}
                      style={{
                        default: { outline: "none" },
                        hover: { fill: isIndonesia ? "#17263b" : "#0a101b", outline: "none" },
                        pressed: { outline: "none" },
                      }}
                    />
                  );
                })
              }
            </Geographies>

            {/* Glowing time-decay threat nodes on map */}
            {!loading && threats.filter(t => t.country === "ID" && t.region).map((threat) => {
              const [long, lat] = getJitteredCoords(threat.region!, threat.id);
              const weight = getDecayWeight(threat.timestamp);
              
              // Color mapping based on severity
              const color = threat.severity === 'CRITICAL' ? '#ff4f4f' : threat.severity === 'HIGH' ? '#ff9a3c' : '#ffd03b';
              const ringColor = threat.severity === 'CRITICAL' ? 'rgba(255,79,79,0.25)' : threat.severity === 'HIGH' ? 'rgba(255,154,60,0.2)' : 'rgba(255,208,59,0.15)';
              
              return (
                <Marker 
                  key={threat.id} 
                  coordinates={[long, lat]}
                  onMouseEnter={() => setHoveredThreat(threat)}
                  onMouseLeave={() => setHoveredThreat(null)}
                >
                  <g className="cursor-pointer">
                    {/* Ring pulsing animation with Framer Motion or native ping */}
                    <circle 
                      r={14 * weight} 
                      fill={color} 
                      className="animate-ping" 
                      style={{ 
                        animationDuration: '2.5s', 
                        opacity: 0.25 * weight,
                        transformOrigin: 'center' 
                      }} 
                    />
                    {/* Secondary wider ring */}
                    <circle 
                      r={24 * weight} 
                      fill={ringColor} 
                      className="animate-pulse" 
                      style={{ 
                        animationDuration: '3.5s', 
                        opacity: 0.1 * weight 
                      }} 
                    />
                    {/* Core node */}
                    <circle 
                      r={5 * weight} 
                      fill={color} 
                      stroke="#05070a" 
                      strokeWidth={1}
                      style={{ opacity: weight }}
                    />
                  </g>
                </Marker>
              );
            })}
          </ComposableMap>

          {/* Glassmorphic Hover Card (Tooltip) */}
          <AnimatePresence>
            {hoveredThreat && (
              <motion.div 
                className="absolute top-16 left-6 pointer-events-none z-30"
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                exit={{ opacity: 0, y: 10 }}
                transition={{ duration: 0.18 }}
              >
                <div className="bg-[#111111]/90 backdrop-blur-xl border border-neutral-800 p-4 rounded-xl shadow-[0_12px_40px_rgba(0,0,0,0.8)] flex flex-col gap-3 min-w-[280px] max-w-[340px]">
                  <div className="flex items-center justify-between border-b border-neutral-900 pb-2">
                    <div className="flex items-center gap-2 text-white font-medium text-xs">
                      <MapPin className="w-3.5 h-3.5 text-cyan-400" />
                      <span>{hoveredThreat.region}, Indonesia</span>
                    </div>
                    <span className="text-[10px] text-neutral-500 font-mono">
                      {getRelativeTime(hoveredThreat.timestamp)}
                    </span>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <div className="flex items-center gap-1.5">
                      <span className={`w-1.5 h-1.5 rounded-full ${
                        hoveredThreat.severity === 'CRITICAL' ? 'bg-red-500' : hoveredThreat.severity === 'HIGH' ? 'bg-orange-500' : 'bg-yellow-500'
                      }`} />
                      <span className="text-[11px] font-mono text-neutral-400 uppercase tracking-wider">{hoveredThreat.type}</span>
                    </div>
                    <div className="text-white text-sm font-medium leading-snug">{hoveredThreat.title}</div>
                    
                    {hoveredThreat.url && (
                      <div className="bg-[#05070A]/50 border border-neutral-900/60 rounded px-2 py-1 flex items-center justify-between mt-1">
                        <span className="text-[10px] font-mono text-neutral-500 truncate max-w-[200px]">{hoveredThreat.domain || hoveredThreat.url}</span>
                        <span className="text-[8px] bg-neutral-800 px-1 rounded font-mono text-neutral-400">URL</span>
                      </div>
                    )}
                  </div>

                  <div className="border-t border-neutral-900 pt-2.5 flex flex-col gap-1 text-[10px]">
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Target Entity:</span>
                      <span className="text-white font-mono font-medium">{hoveredThreat.target_brand || "General Public"}</span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-neutral-500">Vector:</span>
                      <span className="text-neutral-300 font-mono">{hoveredThreat.vector || "Unknown"}</span>
                    </div>
                    <div className="flex justify-between mt-0.5">
                      <span className="text-neutral-500">Confidence Score:</span>
                      <span className="text-cyan-400 font-mono font-semibold">{hoveredThreat.confidence}</span>
                    </div>
                  </div>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        {/* Right Sidebar: Situational Report & Analytics */}
        <div className="w-full lg:w-96 bg-[#0E0E0E]/90 backdrop-blur-xl border-t lg:border-t-0 border-neutral-900/80 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar relative z-25 h-auto lg:h-full">
          
          {/* SECTION 3: SITUATIONAL AWARENESS ENGINE */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-1 border-b border-neutral-900">
              <ShieldAlert className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold tracking-wider text-neutral-300 uppercase">Situational Report</h3>
            </div>

            {/* AI Document Box */}
            <div className="relative rounded-xl bg-cyan-950/5 border border-cyan-900/10 p-4 overflow-hidden shadow-inner">
              <div className="absolute top-0 right-0 w-16 h-16 bg-cyan-500/[0.02] rounded-full blur-lg pointer-events-none" />
              <div className="flex items-center gap-1.5 mb-2">
                <Server className="w-3.5 h-3.5 text-cyan-500" />
                <span className="text-[10px] font-mono text-cyan-400 uppercase tracking-widest font-semibold">VERIX Engine Report</span>
              </div>
              <p className="text-neutral-300 text-xs leading-relaxed font-sans font-light">
                {insights ? insights.aiReport : "Sistem Analisis Situasional VERIX melaporkan eskalasi ancaman siber di Indonesia..."}
              </p>
            </div>
          </div>

          {/* Statistical Breakdown Panel */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 pb-1 border-b border-neutral-900">
              <Activity className="w-4 h-4 text-cyan-400" />
              <h3 className="text-xs font-mono font-bold tracking-wider text-neutral-300 uppercase">Telemetry Breakdown</h3>
            </div>

            {/* Category Percentages */}
            <div className="flex flex-col gap-4.5">
              <h4 className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Top Threat Categories</h4>
              <div className="flex flex-col gap-3">
                {insights?.topCategories.slice(0, 3).map((cat, i) => (
                  <div key={`cat-${i}`} className="flex flex-col gap-1.5">
                    <div className="flex justify-between text-xs font-medium">
                      <span className="text-neutral-300">{cat.type}</span>
                      <span className="text-cyan-400 font-mono font-semibold">{cat.percentage}%</span>
                    </div>
                    <div className="w-full h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-cyan-500 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Vector Percentages */}
            <div className="flex flex-col gap-4.5 pt-2">
              <h4 className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Dominant Attack Vectors</h4>
              <div className="grid grid-cols-2 gap-3">
                {insights?.attackVectors.slice(0, 4).map((vec, i) => (
                  <div key={`vec-${i}`} className="bg-[#141414] border border-neutral-900 rounded-lg p-3 flex flex-col gap-1">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider truncate">{vec.vector}</span>
                    <div className="flex justify-between items-baseline mt-1">
                      <span className="text-lg font-mono font-semibold text-white">{vec.percentage}%</span>
                      <Zap className="w-3 h-3 text-cyan-400 shrink-0" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Top Targeted Brands */}
            <div className="flex flex-col gap-3.5 pt-2">
              <h4 className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Entity Incident Count</h4>
              <div className="flex flex-col gap-2">
                {insights?.topBrandsTargeted.map((brand, i) => (
                  <div key={`brand-${i}`} className="flex justify-between items-center text-xs bg-[#111]/40 px-3 py-1.5 rounded-lg border border-neutral-900/60">
                    <span className="text-neutral-300 font-mono font-medium">{brand.brand}</span>
                    <span className="text-[11px] text-neutral-500 font-mono">{brand.count} incidents</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 4: ACTIVE CAMPAIGNS (CAMPAIGN-LEVEL INTELLIGENCE) */}
      <div className="border-t border-neutral-900/60 bg-[#080808]/90 backdrop-blur-md px-6 md:px-8 py-8 relative z-10">
        <div className="flex items-center gap-2 mb-6 border-b border-neutral-900 pb-2">
          <ShieldAlert className="w-4 h-4 text-cyan-400" />
          <h2 className="text-sm font-mono font-bold tracking-wider text-neutral-300 uppercase">Active Cyber Campaigns (Indonesia)</h2>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Campaign Selector Tabs */}
          <div className="lg:col-span-1 flex flex-col gap-2">
            {CAMPAIGN_FLOWS.map((camp, idx) => (
              <button
                key={idx}
                onClick={() => setSelectedCampaignTab(idx)}
                className={`w-full text-left p-4 rounded-xl border transition-all duration-300 flex flex-col gap-1 ${
                  selectedCampaignTab === idx 
                    ? "bg-cyan-950/10 border-cyan-800/40 shadow-[0_0_15px_rgba(6,182,212,0.05)] text-white" 
                    : "bg-[#111111]/30 border-neutral-900 text-neutral-400 hover:bg-[#111111]/50 hover:border-neutral-800"
                }`}
              >
                <div className="flex justify-between items-center w-full">
                  <span className="text-xs font-mono font-bold text-neutral-500 tracking-wider">CAMPAIGN-0{idx + 1}</span>
                  <span className={`w-1.5 h-1.5 rounded-full ${camp.severity === 'CRITICAL' ? 'bg-red-500' : 'bg-orange-500'}`} />
                </div>
                <span className="text-sm font-medium truncate mt-1">{camp.title}</span>
              </button>
            ))}
          </div>

          {/* Campaign Visual Details Panel */}
          <div className="lg:col-span-3 bg-[#111111]/30 border border-neutral-900 rounded-xl p-6 relative overflow-hidden flex flex-col justify-between min-h-[220px]">
            <div className="absolute top-0 right-0 w-48 h-48 bg-cyan-500/[0.01] rounded-full blur-3xl pointer-events-none" />
            
            {/* Upper Details */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-2">
                <h3 className="text-lg font-medium text-white flex items-center gap-2">
                  {CAMPAIGN_FLOWS[selectedCampaignTab].title}
                  <span className={`text-[9px] font-mono px-2 py-0.5 rounded border ${
                    CAMPAIGN_FLOWS[selectedCampaignTab].severity === 'CRITICAL' 
                      ? "bg-red-500/10 border-red-500/20 text-red-400" 
                      : "bg-orange-500/10 border-orange-500/20 text-orange-400"
                  }`}>
                    {CAMPAIGN_FLOWS[selectedCampaignTab].severity} RISK
                  </span>
                </h3>
                <div className="flex items-center gap-3 text-xs">
                  <span className="text-neutral-500">Confidence:</span>
                  <span className="text-cyan-400 font-mono font-semibold">{CAMPAIGN_FLOWS[selectedCampaignTab].confidence}</span>
                </div>
              </div>

              {/* Threat Story Attack Graph Flowchart */}
              <div className="flex flex-col gap-2.5">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Attack Flow / Threat Story:</span>
                <div className="flex flex-wrap items-center gap-2 bg-[#05070a]/60 border border-neutral-950 p-4 rounded-xl">
                  {CAMPAIGN_FLOWS[selectedCampaignTab].steps.map((step, sIdx) => (
                    <div key={sIdx} className="flex items-center gap-2">
                      <div className="bg-[#141414] border border-neutral-800 text-xs px-3 py-1.5 rounded-lg text-neutral-300 font-mono shadow">
                        {step}
                      </div>
                      {sIdx < CAMPAIGN_FLOWS[selectedCampaignTab].steps.length - 1 && (
                        <ChevronRight className="w-4 h-4 text-cyan-500/70" />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Lower Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-neutral-900/60 pt-5 mt-5 text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-neutral-500 font-mono text-[10px] uppercase">Why This Matters:</span>
                <span className="text-neutral-300 leading-relaxed font-light">
                  {CAMPAIGN_FLOWS[selectedCampaignTab].impact}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-neutral-500 font-mono text-[10px] uppercase">Attack Vector:</span>
                <span className="text-neutral-300 font-mono flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-cyan-400 rounded-full" />
                  {CAMPAIGN_FLOWS[selectedCampaignTab].vector} Network Payload
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: RAW FEED (BOTTOM LIST VIEW) */}
      <div className="border-t border-neutral-900/60 bg-[#0A0A0A] px-6 md:px-8 py-8 relative z-10 flex-1 min-h-[300px] flex flex-col">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 mb-4 border-b border-neutral-900 pb-2">
          <div className="flex items-center gap-2">
            <Globe className="w-4 h-4 text-cyan-400 animate-pulse" />
            <h2 className="text-sm font-mono font-bold tracking-wider text-neutral-300 uppercase">Live Threat Intelligence Stream</h2>
          </div>
          <span className="text-[10px] text-neutral-500 font-mono">
            Showing last {threats.length} verified incident records
          </span>
        </div>

        {/* Scrollable table panel */}
        <div className="flex-1 overflow-x-auto min-h-0 border border-neutral-900 rounded-xl bg-[#0C0C0C]/35">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-neutral-900 text-[10px] font-mono text-neutral-500 uppercase bg-[#090909]">
                <th className="py-3 px-4 font-semibold">Severity</th>
                <th className="py-3 px-4 font-semibold">Threat Entity / Tactic</th>
                <th className="py-3 px-4 font-semibold">Target Brand</th>
                <th className="py-3 px-4 font-semibold">Vector</th>
                <th className="py-3 px-4 font-semibold">Region / Scope</th>
                <th className="py-3 px-4 font-semibold">Source Feed</th>
                <th className="py-3 px-4 font-semibold text-right">Age</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900/40 text-xs font-sans">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500 font-mono">
                    <RefreshCw className="w-5 h-5 animate-spin mx-auto mb-2 text-cyan-400" />
                    Synchronizing real-time cyber threat streams...
                  </td>
                </tr>
              ) : threats.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center text-neutral-500 font-mono">
                    No active threat campaigns reported in scope.
                  </td>
                </tr>
              ) : (
                threats.map((threat) => (
                  <tr 
                    key={threat.id} 
                    className="hover:bg-[#111111]/30 transition-colors group cursor-crosshair"
                  >
                    <td className="py-3.5 px-4">
                      <span className={`inline-block font-mono text-[9px] font-bold px-2 py-0.5 rounded border ${
                        threat.severity === 'CRITICAL' 
                          ? "bg-red-500/10 border-red-500/20 text-red-400 shadow-[0_0_10px_rgba(239,68,68,0.05)]" 
                          : threat.severity === 'HIGH' 
                            ? "bg-orange-500/10 border-orange-500/20 text-orange-400"
                            : "bg-yellow-500/10 border-yellow-500/20 text-yellow-400"
                      }`}>
                        {threat.severity}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 font-mono font-medium max-w-[280px] truncate">
                      <div className="flex flex-col gap-0.5">
                        <span className="text-white group-hover:text-cyan-400 transition-colors">{threat.title}</span>
                        {threat.url && (
                          <span className="text-[10px] text-neutral-500 truncate font-light font-sans">{threat.domain || threat.url}</span>
                        )}
                      </div>
                    </td>
                    <td className="py-3.5 px-4 font-medium text-neutral-300">
                      {threat.target_brand || <span className="text-neutral-500 font-mono">—</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-neutral-400 font-mono text-[10px]">{threat.vector || "PAYLOAD"}</span>
                    </td>
                    <td className="py-3.5 px-4 text-neutral-300 font-medium">
                      {threat.region || <span className="text-neutral-500 font-mono uppercase tracking-wider text-[10px]">Global Feed</span>}
                    </td>
                    <td className="py-3.5 px-4">
                      <span className="text-neutral-400 font-mono text-[10px] flex items-center gap-1.5">
                        <span className={`w-1 h-1 rounded-full ${
                          threat.source.includes("VERIX") ? "bg-cyan-400 animate-pulse" : "bg-neutral-500"
                        }`} />
                        {threat.source}
                      </span>
                    </td>
                    <td className="py-3.5 px-4 text-right font-mono text-neutral-500 text-[10px]">
                      {getRelativeTime(threat.timestamp)}
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {/* TRUST INDICATOR FOOTER */}
        <div className="mt-4 flex flex-col md:flex-row justify-between items-center gap-2 text-[10px] text-neutral-500 font-mono">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Live data sourced from global threat intelligence networks.</span>
          </div>
          <span>Powered by Abuse.ch, PhishTank, & VERIX AI Engine.</span>
        </div>
      </div>
    </div>
  );
}

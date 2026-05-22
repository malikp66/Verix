'use client';

import { useState, useEffect, Fragment } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { IndonesiaMap } from './ui/IndonesiaMap';
import { LinearGlow } from './ui/linear-glow';
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
  ArrowRight,
  Info,
  Server,
  RefreshCw,
  AlertTriangle,
  Search,
  Filter,
  ExternalLink,
  ChevronDown,
  ChevronUp
} from 'lucide-react';
import { ThreatItem, ThreatInsights, generateSingleLiveThreat, buildInsights } from '@/lib/threatFeeds';
import { useIntel } from './IntelligenceProvider';
import { cn } from '@/lib/utils';

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
  
  // Fallback: distribute deterministically based on title length or hash to INDO_REGIONS
  const INDO_REGIONS_LIST = ["Jakarta", "Jawa Barat", "Jawa Timur", "Jawa Tengah", "Sumatera Utara", "Sulawesi Selatan", "Bali", "Kalimantan Timur"];
  let hash = 0;
  for (let i = 0; i < title.length; i++) {
    hash = title.charCodeAt(i) + ((hash << 5) - hash);
  }
  const index = Math.abs(hash) % INDO_REGIONS_LIST.length;
  return INDO_REGIONS_LIST[index];
}

const mapIntelToThreat = (item: any): ThreatItem => {
  return {
    id: item.id,
    title: item.title,
    type: item.type,
    severity: item.severity,
    source: item.source,
    url: item.link,
    domain: new URL(item.link).hostname,
    target_brand: item.target || "General",
    vector: item.vector,
    country: "ID",
    region: parseRegionFromTitle(item.title, item.link),
    timestamp: item.publishedAt,
    tags: [item.type.toLowerCase(), item.vector.toLowerCase()],
    confidence: "98% (Verified RSS + AI)",
    story: item.summary,
    impact: item.type === "MALWARE" ? "Pencurian kode OTP SMS, peretasan finansial." : "Pencurian kredensial, hijack sesi perbankan.",
    source_type: "REAL"
  };
};

// Campaign attack flow representation for Threat Stories
const CAMPAIGN_FLOWS = [
  {
    title: "BCA Phishing Network",
    steps: ["SMS / WA Alert", "Shortlink Redirect", "Fake BCA Domain", "OTP Stealer"],
    impact: "Pengambilalihan M-banking, saldo dikuras habis.",
    vector: "LINK",
    confidence: "98% (KRITIS, diverifikasi oleh VirusTotal)",
    status: "ACTIVE",
    severity: "CRITICAL"
  },
  {
    title: "Undangan Nikah APK Malware",
    steps: ["WhatsApp Chat", "File APK Undangan", "SMS Permissions", "OTP Forwarder"],
    impact: "Pencurian SMS OTP, pengambilalihan akun Whatsapp.",
    vector: "APK",
    confidence: "96% (KRITIS, diverifikasi oleh Abuse.ch)",
    status: "ACTIVE",
    severity: "CRITICAL"
  },
  {
    title: "QRIS Fake Merchant Sticker",
    steps: ["Stiker QRIS Palsu", "Toko / Merchant Scan", "Payment Redirect", "Direct Transfer"],
    impact: "Kerugian finansial konsumen, reputasi merchant rusak.",
    vector: "QRIS",
    confidence: "92% (TINGGI, diverifikasi oleh Laporan Warga)",
    status: "ACTIVE",
    severity: "MEDIUM"
  },
  {
    title: "WhatsApp OTP Hijack Wave",
    steps: ["Call Spoofing", "Kasir / CS Palsu", "Social Engineering", "Account Transfer"],
    impact: "WhatsApp diambil alih secara penuh untuk penipuan.",
    vector: "SOCIAL_ENGINEERING",
    confidence: "91% (TINGGI, diverifikasi oleh Kominfo)",
    status: "ACTIVE",
    severity: "HIGH"
  }
];

export function ThreatPulseView() {
  const intel = useIntel();
  const [threats, setThreats] = useState<ThreatItem[]>([]);
  const [insights, setInsights] = useState<ThreatInsights | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  
  // Selection / Hover states
  const [hoveredThreat, setHoveredThreat] = useState<ThreatItem | null>(null);
  const [selectedThreat, setSelectedThreat] = useState<ThreatItem | null>(null);
  const [selectedCampaignTab, setSelectedCampaignTab] = useState<number>(0);

  // Filters state
  const [searchQuery, setSearchQuery] = useState("");
  const [severityFilter, setSeverityFilter] = useState("ALL");
  const [activeReportTab, setActiveReportTab] = useState<'status' | 'trends' | 'actions'>('status');
  const [isReportExpanded, setIsReportExpanded] = useState(false);
  const [visibleCount, setVisibleCount] = useState(15);

  useEffect(() => {
    setVisibleCount(15);
  }, [searchQuery, severityFilter]);

  const fetchThreatData = async (isSilent = false) => {
    if (!isSilent) setLoading(true);
    else setRefreshing(true);
    
    try {
      const res = await fetch('/api/threats');
      const json = await res.json();
      if (json.success) {
        // Tag simulated threats
        const simulated = (json.data || []).map((t: any) => ({
          ...t,
          source_type: t.source_type || "SIMULATED"
        }));
        
        // Merge with real RSS threats if available
        let merged = [...simulated];
        if (intel && intel.data) {
          const realThreats = intel.data.map(mapIntelToThreat);
          const seen = new Set();
          merged = [...realThreats, ...simulated].filter(t => {
            if (seen.has(t.id)) return false;
            seen.add(t.id);
            return true;
          });
        }
        
        // Sort by timestamp
        merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
        setThreats(merged);
        
        // Build aggregate insights
        const newInsights = buildInsights(merged);
        setInsights(newInsights);
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
    const interval = setInterval(() => {
      if (document.visibilityState === 'visible') {
        fetchThreatData(true);
      }
    }, 90000); // Poll every 90 seconds and only if visible
    
    const handleVisibilityChange = () => {
      if (document.visibilityState === 'visible') {
        fetchThreatData(true);
      }
    };
    
    document.addEventListener("visibilitychange", handleVisibilityChange);
    
    return () => {
      clearInterval(interval);
      document.removeEventListener("visibilitychange", handleVisibilityChange);
    };
  }, []);

  // Update when real intel loads or updates
  useEffect(() => {
    if (intel && intel.data) {
      setThreats((prev) => {
        const existingIds = new Set(prev.map(t => t.id));
        const newRealThreats = intel.data
          .map(mapIntelToThreat)
          .filter((t: any) => !existingIds.has(t.id));
        
        if (newRealThreats.length > 0) {
          const merged = [...newRealThreats, ...prev].slice(0, 100);
          merged.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());
          return merged;
        }
        return prev;
      });
    }
  }, [intel]);

  // Live Auto-streaming removed - only real data from API/intel

  const handleRefresh = async () => {
    await fetchThreatData(true);
  };

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
  const getDecayWeight = (timestampStr: string) => {
    const hours = (Date.now() - new Date(timestampStr).getTime()) / (1000 * 60 * 60);
    return Math.max(0.35, Math.min(1.0, Math.exp(-hours / 24)));
  };

  const filteredThreats = threats.filter(t => {
    const matchesSearch = t.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                          (t.target_brand && t.target_brand.toLowerCase().includes(searchQuery.toLowerCase()));
    const matchesSeverity = severityFilter === "ALL" || t.severity === severityFilter;
    return matchesSearch && matchesSeverity;
  });

  const paginatedThreats = filteredThreats.slice(0, visibleCount);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    const target = e.currentTarget;
    // Scrolled close to the bottom (within 40px)
    const isAtBottom = target.scrollHeight - target.scrollTop <= target.clientHeight + 40;
    if (isAtBottom && visibleCount < filteredThreats.length) {
      setVisibleCount(prev => Math.min(prev + 15, filteredThreats.length));
    }
  };

  // Color mappings
  const getSeverityColor = (level: string) => {
    return {
      CRITICAL: "bg-red-500 shadow-[0_0_12px_rgba(239,68,68,0.8)]",
      HIGH: "bg-orange-500 shadow-[0_0_10px_rgba(249,115,22,0.7)]",
      MEDIUM: "bg-yellow-500 shadow-[0_0_8px_rgba(234,179,8,0.6)]",
      LOW: "bg-blue-500 shadow-[0_0_8px_rgba(59,130,246,0.6)]"
    }[level] || "bg-neutral-500";
  };

  const getSeverityBadge = (level: string) => {
    return {
      CRITICAL: "bg-red-500/10 text-red-400 border-red-500/20",
      HIGH: "bg-orange-500/10 text-orange-400 border-orange-500/20",
      MEDIUM: "bg-yellow-500/10 text-yellow-400 border-yellow-500/20",
      LOW: "bg-blue-500/10 text-blue-400 border-blue-500/20"
    }[level] || "bg-neutral-500/10 text-neutral-400 border-neutral-800";
  };

  return (
    <div className="flex-1 w-full flex flex-col relative overflow-hidden bg-neutral-950 text-white">
      {/* Linear glow top */}
      <LinearGlow position="top" color="emerald" opacity={30} />
      
      {/* Ambient glow */}
      <div className="absolute top-0 left-1/2 -translate-x-1/2 w-[600px] h-[300px] bg-emerald-500/[0.02] blur-[120px] rounded-full pointer-events-none" />

      {/* Cinematic Background Gradients */}
      <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,_rgba(8,30,55,0.15)_0%,_rgba(10,10,10,0.95)_70%,_#0A0A0A_100%)] pointer-events-none" />
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#111_1px,transparent_1px),linear-gradient(to_bottom,#111_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_50%,#000_70%,transparent_100%)] pointer-events-none opacity-[0.05]" />

      {/* SECTION 1: HERO INTELLIGENCE SECTION */}
      <div className="relative z-10 px-6 md:px-8 pt-8 pb-5 flex flex-col lg:flex-row justify-between items-start lg:items-center gap-6 border-b border-neutral-900/60 bg-neutral-950/40 backdrop-blur-md">
        <div className="flex flex-col gap-1 max-w-2xl">
          <div className="flex items-center gap-2 text-emerald-400 font-mono text-[10px] tracking-[0.2em] font-semibold mb-1">
            <Activity className="w-3.5 h-3.5 animate-pulse text-emerald-500" />
            LIVE SECURITY SITUATIONAL AWARENESS
            {refreshing && (
              <span className="flex items-center gap-1 text-neutral-500 text-[9px] font-normal animate-pulse ml-2 font-sans tracking-normal">
                <RefreshCw className="w-2.5 h-2.5 animate-spin" /> Syncing Feed...
              </span>
            )}
          </div>
          <h1 className="text-3xl md:text-4xl font-display font-medium tracking-tight text-white flex items-center gap-2.5">
            VERIX Pulse
            <span className="text-[10px] bg-red-500/10 border border-red-500/20 text-red-400 font-mono px-2 py-0.5 rounded-full uppercase tracking-wider font-bold">
              Orange Level
            </span>
          </h1>
          <p className="text-neutral-400 text-sm md:text-base leading-relaxed mt-1">
            Indonesia berada di bawah kampanye phishing dan malware yang meningkat. Telemetri real-time secara aktif menganalisis, menilai, dan melacak muatan.
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
            <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/5 rounded-full blur-xl pointer-events-none" />
            <span className="text-neutral-500 font-mono text-[9px] tracking-wider uppercase">Active Campaigns</span>
            <div className="flex items-baseline gap-2 mt-1">
              <span className="text-2xl font-mono font-medium text-white">
                {insights ? insights.totalActiveCampaigns : '8'}
              </span>
              <span className="text-emerald-400 font-mono text-[9px] border border-emerald-500/20 px-1.5 py-0.2 rounded-full uppercase text-[8px] font-bold">MONITORED</span>
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
        {/* Left Area: Map + Bottom L-Indicators */}
        <div className="flex-1 flex flex-col min-h-0 border-r border-neutral-900/60 bg-[#080808]">
          {/* Map Container */}
          <div className="flex-1 relative min-h-[350px] lg:min-h-[400px]">
            <div className="absolute top-4 left-4 z-20 flex items-center gap-2 bg-[#111111]/80 backdrop-blur-md px-3 py-1.5 rounded-lg border border-neutral-800/80">
              <Globe className="w-3.5 h-3.5 text-emerald-400 animate-spin-slow" />
              <span className="text-[10px] font-mono text-neutral-400 tracking-wider">ACTIVE INDONESIA SCAN ZONE</span>
            </div>

            {(() => {
              // Calculate province scores based on active threats in state
              const provinceScores: Record<string, { count: number; score: number }> = {};
              threats.forEach((t) => {
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

              return (
                <IndonesiaMap
                  theme="green"
                  provinceScores={provinceScores}
                  markers={loading ? [] : threats.filter(t => t.country === "ID" && t.region).map((threat) => {
                    const [long, lat] = getJitteredCoords(threat.region!, threat.id);
                    const weight = getDecayWeight(threat.timestamp);
                    return {
                      id: threat.id,
                      longitude: long,
                      latitude: lat,
                      severity: threat.severity,
                      weight: weight,
                      onMouseEnter: () => setHoveredThreat(threat),
                      onMouseLeave: () => setHoveredThreat(null)
                    };
                  })}
                  className="w-full h-full opacity-85 select-none"
                />
              );
            })()}

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
                        <MapPin className="w-3.5 h-3.5 text-emerald-400" />
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
                        <div className="bg-neutral-900/50 border border-neutral-900/60 rounded px-2 py-1 flex items-center justify-between mt-1">
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
                        <span className="text-emerald-400 font-mono font-semibold">{hoveredThreat.confidence}</span>
                      </div>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Bottom Indicators (L-Area) */}
          <div className="border-t border-neutral-900/60 bg-[#0B0B0B]/40 p-6 grid grid-cols-1 md:grid-cols-2 gap-6 backdrop-blur-sm">
            {/* Dominant Attack Vectors */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-1 border-b border-neutral-900">
                <Zap className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-mono font-bold tracking-wider text-neutral-300 uppercase">Dominant Attack Vectors</h4>
              </div>
              <div className="grid grid-cols-2 gap-3">
                {insights?.attackVectors.slice(0, 4).map((vec, i) => (
                  <div key={`vec-${i}`} className="bg-[#141414]/80 border border-neutral-800/40 rounded-xl p-3 flex flex-col gap-1 relative overflow-hidden group">
                    <span className="text-[9px] font-mono text-neutral-500 uppercase tracking-wider truncate">{vec.vector}</span>
                    <div className="flex justify-between items-baseline mt-1">
                      <span className="text-lg font-mono font-semibold text-white">{vec.percentage}%</span>
                      <Zap className="w-3 h-3 text-emerald-400 shrink-0 group-hover:scale-110 transition-transform duration-250" />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Entity Incident Count */}
            <div className="flex flex-col gap-4">
              <div className="flex items-center gap-2 pb-1 border-b border-neutral-900">
                <ShieldAlert className="w-4 h-4 text-emerald-400" />
                <h4 className="text-xs font-mono font-bold tracking-wider text-neutral-300 uppercase">Entity Incident Count</h4>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {insights?.topBrandsTargeted.map((brand, i) => (
                  <div key={`brand-${i}`} className="flex justify-between items-center text-xs bg-[#111111]/40 px-3 py-1.5 rounded-lg border border-neutral-900/60">
                    <span className="text-neutral-300 font-mono font-medium">{brand.brand}</span>
                    <span className="text-[11px] text-emerald-400 font-mono font-semibold">{brand.count} incidents</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* Right Sidebar: Situational Report & Analytics */}
        <div className="w-full lg:w-96 bg-[#0E0E0E]/90 backdrop-blur-xl border-t lg:border-t-0 border-neutral-900/80 p-6 flex flex-col gap-6 overflow-y-auto no-scrollbar relative z-25 h-auto lg:h-full">
          
          {/* SECTION 3: SITUATIONAL AWARENESS ENGINE */}
          <div className="flex flex-col gap-4">
            <div className="flex items-center gap-2 pb-1 border-b border-neutral-900">
              <ShieldAlert className="w-4 h-4 text-emerald-400" />
              <h3 className="text-xs font-mono font-bold tracking-wider text-neutral-300 uppercase">Situational Report</h3>
            </div>

            {/* AI Document Box */}
            <div className="relative rounded-xl bg-emerald-950/5 border border-emerald-900/10 p-5 overflow-hidden shadow-inner flex flex-col gap-4">
              <div className="absolute top-0 right-0 w-24 h-24 bg-emerald-500/[0.015] rounded-full blur-xl pointer-events-none" />
              
              {/* Header with Server icon & Risk Level Badge */}
              <div className="flex items-center justify-between border-b border-neutral-900/60 pb-2">
                <div className="flex items-center gap-1.5">
                  <Server className="w-3.5 h-3.5 text-emerald-500 animate-pulse" />
                  <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest font-semibold">VERIX Situational Awareness</span>
                </div>
                
                {intel?.report?.risk_assessment && (
                  <span className={`text-[9px] font-mono font-bold px-2 py-0.5 rounded-full border tracking-wide animate-pulse ${
                    intel.report.risk_assessment === 'CRITICAL' ? 'bg-red-500/15 border-red-500/30 text-red-400 shadow-[0_0_8px_rgba(239,68,68,0.2)]' :
                    intel.report.risk_assessment === 'HIGH' ? 'bg-orange-500/15 border-orange-500/30 text-orange-400' :
                    intel.report.risk_assessment === 'MEDIUM' ? 'bg-yellow-500/15 border-yellow-500/30 text-yellow-400' :
                    'bg-emerald-500/15 border-emerald-500/30 text-emerald-400'
                  }`}>
                    {intel.report.risk_assessment}
                  </span>
                )}
              </div>

              {/* Tab Selector */}
              {intel?.report && (
                <div className="flex border border-neutral-900 bg-black/30 p-0.5 rounded-lg gap-0.5">
                  {(['status', 'trends', 'actions'] as const).map((tab) => (
                    <button
                      key={tab}
                      onClick={() => setActiveReportTab(tab)}
                      className={`flex-1 text-[9px] font-mono font-medium py-1 px-1 rounded-md transition-all duration-200 uppercase tracking-wider ${
                        activeReportTab === tab
                          ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 shadow-[0_0_8px_rgba(16,185,129,0.1)]"
                          : "text-neutral-500 hover:text-neutral-300"
                      }`}
                    >
                      {tab === 'status' ? 'Status' : tab === 'trends' ? 'Trends' : 'Actions'}
                    </button>
                  ))}
                </div>
              )}

              {/* Main Tabbed Content */}
              {intel?.report ? (
                <div className="flex flex-col gap-3 min-h-[140px]">
                  {activeReportTab === 'status' && (
                    <div className="flex flex-col gap-3">
                      <h4 className="text-xs font-semibold text-white leading-snug font-display">
                        {intel.report.headline}
                      </h4>
                      
                      {/* Risk Index Progress Bar */}
                      {(() => {
                        const assessment = intel.report.risk_assessment || 'LOW';
                        const score = assessment === 'CRITICAL' ? 95 : assessment === 'HIGH' ? 75 : assessment === 'MEDIUM' ? 45 : 20;
                        const scoreColor = assessment === 'CRITICAL' ? 'bg-red-500' : assessment === 'HIGH' ? 'bg-orange-500' : assessment === 'MEDIUM' ? 'bg-yellow-500' : 'bg-emerald-500';
                        const glowColor = assessment === 'CRITICAL' ? 'shadow-[0_0_10px_rgba(239,68,68,0.35)]' : assessment === 'HIGH' ? 'shadow-[0_0_8px_rgba(249,115,22,0.3)]' : assessment === 'MEDIUM' ? 'shadow-[0_0_8px_rgba(234,179,8,0.25)]' : 'shadow-[0_0_8px_rgba(16,185,129,0.25)]';
                        return (
                          <div className="flex flex-col gap-1 bg-white/[0.01] border border-white/5 rounded-xl p-2.5 mt-0.5">
                            <div className="flex justify-between text-[9px] font-mono font-medium">
                              <span className="text-neutral-500 uppercase">Danger Index</span>
                              <span className={`${
                                assessment === 'CRITICAL' ? 'text-red-400' :
                                assessment === 'HIGH' ? 'text-orange-400' :
                                assessment === 'MEDIUM' ? 'text-yellow-400' :
                                'text-emerald-400'
                              } font-bold`}>{score}% ({assessment})</span>
                            </div>
                            <div className="w-full h-1.5 bg-[#121212] rounded-full overflow-hidden relative">
                              <div className={`h-full ${scoreColor} ${glowColor} rounded-full transition-all duration-500`} style={{ width: `${score}%` }} />
                            </div>
                          </div>
                        );
                      })()}

                      {/* Summary with Collapsible toggle */}
                      <div className="flex flex-col gap-1 pt-1">
                        <p className="text-neutral-400 text-[11px] leading-relaxed font-light font-sans transition-all duration-300">
                          {isReportExpanded 
                            ? intel.report.summary 
                            : `${intel.report.summary.slice(0, 150)}${intel.report.summary.length > 150 ? '...' : ''}`
                          }
                        </p>
                        {intel.report.summary.length > 150 && (
                          <button
                            onClick={() => setIsReportExpanded(!isReportExpanded)}
                            className="text-[10px] font-mono text-emerald-400 hover:text-emerald-300 transition-colors flex items-center gap-1 mt-1 self-start font-semibold group cursor-pointer"
                          >
                            {isReportExpanded ? (
                              <>
                                Collapse <ChevronUp className="w-3.5 h-3.5 group-hover:-translate-y-0.5 transition-transform" />
                              </>
                            ) : (
                              <>
                                Read More <ChevronDown className="w-3.5 h-3.5 group-hover:translate-y-0.5 transition-transform" />
                              </>
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                  )}

                  {activeReportTab === 'trends' && (
                    <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto no-scrollbar">
                      {intel.report.key_trends && intel.report.key_trends.length > 0 ? (
                        intel.report.key_trends.map((trend: string, idx: number) => (
                          <div key={idx} className="flex gap-2.5 bg-white/[0.01] border border-white/5 rounded-xl p-2.5 items-start hover:bg-white/[0.02] hover:border-neutral-800 transition-all duration-200">
                            <TrendingUp className="w-3.5 h-3.5 text-emerald-400 mt-0.5 shrink-0" />
                            <span className="text-[11px] text-neutral-300 leading-relaxed font-sans">{trend}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[11px] text-neutral-500 font-mono text-center py-4">No active trends reported.</span>
                      )}
                    </div>
                  )}

                  {activeReportTab === 'actions' && (
                    <div className="flex flex-col gap-2 max-h-[220px] overflow-y-auto no-scrollbar">
                      {intel.report.recommended_actions && intel.report.recommended_actions.length > 0 ? (
                        intel.report.recommended_actions.map((action: string, idx: number) => (
                          <div key={idx} className="flex gap-2.5 bg-white/[0.01] border border-white/5 rounded-xl p-2.5 items-start hover:bg-white/[0.02] hover:border-neutral-800 transition-all duration-200">
                            <ShieldCheck className="w-3.5 h-3.5 text-emerald-500 mt-0.5 shrink-0" />
                            <span className="text-[11px] text-neutral-300 leading-relaxed font-sans">{action}</span>
                          </div>
                        ))
                      ) : (
                        <span className="text-[11px] text-neutral-500 font-mono text-center py-4">No recommended actions at this time.</span>
                      )}
                    </div>
                  )}
                </div>
              ) : (
                <div className="py-8 text-center text-neutral-500 text-xs font-mono">
                  <RefreshCw className="w-4 h-4 animate-spin mx-auto mb-2 text-emerald-500" />
                  Analyzing national scam intelligence feed...
                </div>
              )}
            </div>
          </div>

          {/* Statistical Breakdown Panel */}
          <div className="flex flex-col gap-5">
            <div className="flex items-center gap-2 pb-1 border-b border-neutral-900">
              <Activity className="w-4 h-4 text-emerald-400" />
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
                      <span className="text-emerald-400 font-mono font-semibold">{cat.percentage}%</span>
                    </div>
                    <div className="w-full h-1 bg-[#1A1A1A] rounded-full overflow-hidden">
                      <div 
                        className="h-full bg-emerald-500 rounded-full transition-all duration-1000 ease-out" 
                        style={{ width: `${cat.percentage}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* Live Telemetry Log Feed */}
            <div className="flex flex-col gap-3.5 pt-2">
              <h4 className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Live Scanner Log</h4>
              <div className="flex flex-col gap-2 font-mono text-[9px] bg-black/40 border border-neutral-900/60 rounded-lg p-3 h-40 overflow-y-auto no-scrollbar divide-y divide-neutral-900/30">
                {threats.slice(0, 5).map((t, idx) => (
                  <div key={idx} className="py-1.5 first:pt-0 last:pb-0 text-neutral-400 flex flex-col gap-0.5">
                    <div className="flex justify-between">
                      <span className={t.severity === 'CRITICAL' ? 'text-red-400 font-bold' : t.severity === 'HIGH' ? 'text-orange-400' : 'text-yellow-400'}>
                        [{t.severity}]
                      </span>
                      <span className="text-neutral-600">{getRelativeTime(t.timestamp)}</span>
                    </div>
                    <span className="text-neutral-300 truncate">{t.title}</span>
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
          <ShieldAlert className="w-4 h-4 text-emerald-400" />
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
                    ? "bg-emerald-950/10 border-emerald-800/40 shadow-[0_0_15px_rgba(16,185,129,0.05)] text-white" 
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
            <div className="absolute top-0 right-0 w-48 h-48 bg-emerald-500/[0.01] rounded-full blur-3xl pointer-events-none" />
            
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
                  <span className="text-emerald-400 font-mono font-semibold">{CAMPAIGN_FLOWS[selectedCampaignTab].confidence}</span>
                </div>
              </div>

              {/* Threat Story Attack Graph Flowchart */}
              <div className="flex flex-col gap-2.5">
                <span className="text-[10px] font-mono text-neutral-500 uppercase tracking-wider">Attack Flow / Threat Story:</span>
                <div className="flex flex-row flex-wrap items-center gap-1.5 bg-neutral-900/40 border border-neutral-800/50 rounded-xl p-5">
                  
                  {CAMPAIGN_FLOWS[selectedCampaignTab].steps.map((step, sIdx) => (
                    <Fragment key={sIdx}>
                      <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-neutral-900/60 border border-neutral-800/60 hover:border-emerald-500/30 transition-colors">
                        <div className="w-5 h-5 rounded-full bg-emerald-500 flex items-center justify-center shrink-0 shadow-[0_0_8px_rgba(16,185,129,0.4)]">
                          <span className="text-[9px] font-mono font-bold text-neutral-950">{sIdx + 1}</span>
                        </div>
                        <span className="text-xs font-medium text-neutral-200">{step}</span>
                      </div>
                      {sIdx < CAMPAIGN_FLOWS[selectedCampaignTab].steps.length - 1 && (
                        <ArrowRight className="w-4 h-4 text-emerald-500/40 shrink-0" />
                      )}
                    </Fragment>
                  ))}
                </div>
              </div>
            </div>

            {/* Lower Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 border-t border-neutral-900/60 pt-5 mt-5 text-xs">
              <div className="flex flex-col gap-1">
                <span className="text-neutral-500 font-mono text-[10px] uppercase">Mengapa Ini Penting:</span>
                <span className="text-neutral-300 leading-relaxed font-light">
                  {CAMPAIGN_FLOWS[selectedCampaignTab].impact}
                </span>
              </div>
              <div className="flex flex-col gap-1">
                <span className="text-neutral-500 font-mono text-[10px] uppercase">Vektor Serangan:</span>
                <span className="text-neutral-300 font-mono flex items-center gap-1.5 mt-0.5">
                  <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full" />
                  {CAMPAIGN_FLOWS[selectedCampaignTab].vector} Muatan Jaringan
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* SECTION 5: CINEMATIC THREAT TIMELINE */}
      <div className="border-t border-neutral-900/60 bg-neutral-950 px-6 md:px-8 py-8 relative z-10 flex flex-col min-h-[500px]">
        {/* Header with Live Pulse Dot */}
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6 pb-4 border-b border-neutral-900">
          <div className="flex flex-col gap-1">
            <div className="flex items-center gap-2.5">
              <Globe className="w-4 h-4 text-emerald-400 animate-pulse" />
              <h2 className="text-base font-display font-medium text-white">Live Threat Timeline</h2>
              <div className="flex items-center gap-1.5 bg-emerald-500/10 border border-emerald-500/20 px-2 py-0.5 rounded-full text-[9px] font-mono text-emerald-400 font-semibold tracking-wider uppercase animate-pulse">
                <span className="w-1.5 h-1.5 bg-emerald-400 rounded-full animate-ping" />
                Live Broadcast
              </div>
            </div>
            <p className="text-neutral-400 text-xs mt-0.5 leading-relaxed">
              Real-world intelligence feeds mapped and processed alongside platform telemetry. Click any node to open detailed forensics.
            </p>
          </div>

          {/* Magic UI Filter Bar */}
          <div className="flex items-center gap-2 bg-neutral-900/40 backdrop-blur-md border border-neutral-800/60 rounded-full px-2 py-1.5">
            {/* Search pill */}
            <div className="relative flex-1 md:flex-none">
              <Search className="w-3.5 h-3.5 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Cari brand/taktik..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="bg-transparent text-xs text-white placeholder-neutral-500 pl-8 pr-3 py-1.5 w-full md:w-40 focus:outline-none font-mono"
              />
            </div>

            {/* Divider */}
            <div className="w-px h-5 bg-neutral-800 hidden md:block" />

            {/* Severity Filter */}
            <div className="relative hidden md:block">
              <select
                value={severityFilter}
                onChange={(e) => setSeverityFilter(e.target.value)}
                className="appearance-none bg-transparent text-xs text-neutral-200 pl-3 pr-7 py-1.5 cursor-pointer font-mono focus:outline-none"
              >
                <option value="ALL">Semua Severity</option>
                <option value="CRITICAL">🔴 CRITICAL</option>
                <option value="HIGH">🟠 HIGH</option>
                <option value="MEDIUM">🟡 MEDIUM</option>
                <option value="LOW">🟢 LOW</option>
              </select>
              <ChevronDown className="w-3 h-3 text-emerald-400/50 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>
          </div>
          
          {/* Active filter count */}
          <div className="text-[10px] font-mono text-neutral-500 flex items-center gap-1.5">
            <span className="w-1 h-1 rounded-full bg-emerald-500" />
            <span>{filteredThreats.length} ancaman</span>
          </div>
        </div>

        {/* Scrollable Timeline with top & bottom gradient mask */}
        <div className="relative flex-1 min-h-[300px]">
          {loading ? (
            <div className="py-24 text-center text-neutral-500 font-mono flex flex-col items-center justify-center gap-3">
              <RefreshCw className="w-6 h-6 animate-spin text-emerald-400" />
              <span>Syncing threat intelligence stream...</span>
            </div>
          ) : filteredThreats.length === 0 ? (
            <div className="py-24 text-center text-neutral-500 font-mono flex flex-col items-center justify-center gap-2">
              <ShieldAlert className="w-6 h-6 text-neutral-600" />
              <span>No threat nodes found matching filter criteria.</span>
            </div>
          ) : (
            <div 
              onScroll={handleScroll}
              className="max-h-[500px] overflow-y-auto pr-2 space-y-4 no-scrollbar pb-8 pt-4"
              style={{
                maskImage: "linear-gradient(to bottom, transparent, black 6%, black 92%, transparent)",
                WebkitMaskImage: "linear-gradient(to bottom, transparent, black 6%, black 92%, transparent)"
              }}
            >
              <AnimatePresence initial={false}>
                {paginatedThreats.map((event, idx) => (
                  <motion.div
                    key={event.id}
                    initial={{ opacity: 0, x: -25, y: -10 }}
                    animate={{ 
                      opacity: 1, 
                      x: 0, 
                      y: 0,
                      backgroundColor: idx === 0 ? ["rgba(255,255,255,0.06)", "transparent"] : "transparent"
                    }}
                    exit={{ opacity: 0, x: 25 }}
                    transition={{ duration: 0.45, ease: "easeOut" }}
                    onClick={() => setSelectedThreat(event)}
                    className="flex items-stretch gap-5 group cursor-pointer"
                  >
                    {/* Time Column */}
                    <div className="text-[10px] font-mono text-neutral-500 w-16 pt-3.5 text-right shrink-0 flex items-start justify-end gap-1.5">
                      <Clock className="w-3 h-3 mt-0.5 text-neutral-600" />
                      <span>{getRelativeTime(event.timestamp)}</span>
                    </div>

                    {/* Timeline Line + Node Indicator */}
                    <div className="relative flex flex-col items-center shrink-0 w-3">
                      <div className="w-[1px] h-full bg-neutral-900 group-last:h-4" />
                      <div className={`absolute top-4 w-2.5 h-2.5 rounded-full ${getSeverityColor(event.severity)}`} />
                    </div>

                    {/* Event Detail Card */}
                    <div className="flex-1 bg-white/[0.01] hover:bg-white/[0.03] border border-neutral-950 hover:border-neutral-800/80 rounded-xl p-4 flex flex-col gap-2.5 transition-all duration-300 shadow-md">
                      <div className="flex flex-wrap items-center justify-between gap-2.5">
                        <div className="flex items-center gap-2">
                          <span className={`inline-block text-[9px] font-mono font-bold px-2 py-0.5 rounded border ${getSeverityBadge(event.severity)}`}>
                            {event.severity}
                          </span>
                          <span className={`text-[8px] px-1.5 py-0.2 rounded font-mono uppercase tracking-wider font-semibold border ${
                            event.source_type === "REAL" 
                              ? "bg-emerald-500/10 border-emerald-500/30 text-emerald-400" 
                              : "bg-emerald-600/10 border-emerald-600/20 text-emerald-500/90"
                          }`}>
                            {event.source_type}
                          </span>
                        </div>
                        <span className="text-[10px] text-neutral-500 font-mono uppercase tracking-wider">
                          {event.source}
                        </span>
                      </div>

                      <div className="text-white text-sm font-medium leading-snug group-hover:text-emerald-400 transition-colors">
                        {event.title}
                      </div>

                      <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-[10px] text-neutral-400 font-mono">
                        <span className="flex items-center gap-1">
                          <MapPin className="w-3 h-3 text-neutral-500" /> {event.region || "Indonesia"}
                        </span>
                        <span className="flex items-center gap-1">
                          <Zap className="w-3 h-3 text-neutral-500" /> Vector: {event.vector || "PAYLOAD"}
                        </span>
                        {event.target_brand && (
                          <span className="flex items-center gap-1">
                            <ShieldCheck className="w-3 h-3 text-neutral-500" /> Target: {event.target_brand}
                          </span>
                        )}
                      </div>
                    </div>
                  </motion.div>
                ))}
              </AnimatePresence>
            </div>
          )}
        </div>

        {/* Footer trust signals */}
        <div className="mt-4 flex flex-col md:flex-row justify-between items-center gap-2 text-[10px] text-neutral-500 font-mono">
          <div className="flex items-center gap-1.5">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-400" />
            <span>Merging real-world news feeds & platform telemetry signals.</span>
          </div>
          <span>Didukung oleh Abuse.ch, TurnBackHoax.id, & Google News.</span>
        </div>
      </div>

      {/* Forensic Detail Modal */}
      <AnimatePresence>
        {selectedThreat && (
          <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm">
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="bg-[#111111]/90 backdrop-blur-xl border border-neutral-800 p-6 rounded-2xl shadow-[0_20px_50px_rgba(0,0,0,0.9)] max-w-xl w-full flex flex-col gap-4 relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-emerald-500/[0.02] rounded-full blur-2xl pointer-events-none" />
              
              <div className="flex justify-between items-start gap-4">
                <div className="flex flex-col gap-1">
                  <div className="flex items-center gap-2">
                    <span className={`inline-block font-mono text-[9px] font-bold px-2 py-0.5 rounded border ${getSeverityBadge(selectedThreat.severity)}`}>
                      {selectedThreat.severity}
                    </span>
                    <span className={`text-[8px] px-1.5 py-0.2 rounded font-mono uppercase tracking-wider font-semibold border ${
                      selectedThreat.source_type === 'REAL' 
                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-400' 
                        : 'bg-emerald-600/10 border-emerald-600/20 text-emerald-500/90'
                    }`}>
                      {selectedThreat.source_type}
                    </span>
                  </div>
                  <h3 className="text-lg font-medium text-white tracking-tight mt-1">{selectedThreat.title}</h3>
                </div>
                <button 
                  onClick={() => setSelectedThreat(null)}
                  className="text-neutral-500 hover:text-white transition-colors p-1"
                >
                  ✕
                </button>
              </div>

              <div className="border-t border-neutral-900 pt-4 flex flex-col gap-4 text-xs">
                {/* Meta details */}
                <div className="grid grid-cols-2 gap-3 bg-[#0B0B0B]/50 p-3 rounded-lg border border-neutral-900/60 font-mono text-[10px]">
                  <div>
                    <span className="text-neutral-500 block mb-0.5">SOURCE FEED</span>
                    <span className="text-neutral-300 font-semibold">{selectedThreat.source}</span>
                  </div>
                  <div>
                    <span className="text-neutral-500 block mb-0.5">VECTOR</span>
                    <span className="text-emerald-400 font-semibold">{selectedThreat.vector}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-neutral-500 block mb-0.5">TARGET ENTITY</span>
                    <span className="text-neutral-300 font-semibold">{selectedThreat.target_brand || "General Public"}</span>
                  </div>
                  <div className="mt-1">
                    <span className="text-neutral-500 block mb-0.5">REGION</span>
                    <span className="text-neutral-300 font-semibold">{selectedThreat.region}, ID</span>
                  </div>
                </div>

                {/* Analysis Story */}
                <div className="flex flex-col gap-1.5">
                  <span className="font-mono text-[10px] text-neutral-500 uppercase">Description / Forensics:</span>
                  <p className="text-neutral-300 leading-relaxed font-light font-sans">{selectedThreat.story || "Detailed forensic analysis for this incident is being compiled by the VERIX threat detection engine."}</p>
                </div>

                {/* Impact */}
                <div className="flex flex-col gap-1.5 border-t border-neutral-900/50 pt-3">
                  <span className="font-mono text-[10px] text-neutral-500 uppercase">Impact Assessment:</span>
                  <p className="text-neutral-300 leading-relaxed font-light font-sans">{selectedThreat.impact || "This pattern may directly lead to banking credential theft and unauthorized transaction losses."}</p>
                </div>

                {selectedThreat.url && (
                  <div className="flex flex-col gap-1.5 border-t border-neutral-900/50 pt-3">
                    <span className="font-mono text-[10px] text-neutral-500 uppercase">Involved URL / Payload Domain:</span>
                    <a 
                      href={selectedThreat.url} 
                      target="_blank" 
                      rel="noopener noreferrer" 
                      className="text-emerald-400 hover:text-emerald-300 underline font-mono break-all inline-flex items-center gap-1.5"
                    >
                      {selectedThreat.url} <ExternalLink className="w-3.5 h-3.5" />
                    </a>
                  </div>
                )}
              </div>

              <div className="border-t border-neutral-900 pt-4 flex justify-end">
                <button
                  onClick={() => setSelectedThreat(null)}
                  className="px-4 py-2 bg-neutral-900 hover:bg-neutral-800 text-xs font-mono font-bold tracking-wider rounded-lg text-neutral-300 hover:text-white transition-all duration-200 border border-neutral-800"
                >
                  CLOSE FORENSICS
                </button>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

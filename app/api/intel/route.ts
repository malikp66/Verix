import { NextResponse } from 'next/server';

// In-memory cache for the pseudo-realtime backend strategy
// This allows low-cost, high-efficiency reads without hitting DB/AI constantly
let cachedIntel: any = null;
let lastFetched = 0;
const CACHE_DURATION = 5 * 60 * 1000; // 5 minutes

// Simulating batch summarization from various free sources
async function generateBatchIntelligence() {
  // In a production environment, this function would:
  // 1. Fetch from free APIs (Google Trends RSS, TurnBackHoax XML, NewsAPI)
  // 2. Combine the text
  // 3. Call Gemini once for batch summarization
  // 4. Store in Supabase / Redis
  
  return {
    tickerAlerts: [
       "🚨 Trend: Modus 'Salah Transfer' meningkat 42% hari ini di area Jabodetabek",
       "⚠ Intel: Phishing web pencurian kredensial menyerupai myBCA terdeteksi",
       "🛑 Node Aktif: Sistem perlindungan VERIX memblokir 1,294 URL berbahaya dalam 1 jam terakhir",
       "🔥 Awas: Malware APK berkedok 'Kurir Paket J&T' menyebar masif via pesan WhatsApp",
       "📡 Laporan Komunitas: Modus social engineering telepon CS palsu mengatasnamakan Shopee meningkat"
    ],
    dashboardAlerts: [
       { title: "Phishing BCA Mobile Clone", changePct: 42, type: "critical", time: "Baru saja", valueType: "threat" },
       { title: "APK Undangan Pernikahan", changePct: 15, type: "danger", time: "5m ago", valueType: "victims" },
       { title: "Voice Cloning Family Scam", changePct: 89, type: "warning", time: "12m ago", valueType: "new" },
       { title: "Fake QRIS Merchant", changePct: 12, type: "warning", time: "25m ago", valueType: "cases" }
    ],
    ecosystemStats: {
      virusTotal: 14592,
      safeBrowsing: 4102,
      geminiVision: 9341,
      turnBackHoax: 156,
      urlScan: 5120,
      newsApi: 2401
    },
    globalThreatsDetected: 12492,
    accountsSaved: 85230,
    threatPctChange: 14.5,
    lastSynced: new Date().toISOString()
  };
}

export async function GET() {
  const now = Date.now();
  
  // Cache Strategy: Only process expensive aggregation every 5 minutes
  if (!cachedIntel || now - lastFetched > CACHE_DURATION) {
    // Heavy cron-like tasks run here
    cachedIntel = await generateBatchIntelligence();
    lastFetched = now;
  } else {
    // Pseudo-realtime adjustments for frontend feeling alive
    // Only applying slight micro-jitter without hitting heavy APIS
    if (Math.random() > 0.5) {
        cachedIntel.ecosystemStats.virusTotal += Math.floor(Math.random() * 3);
        cachedIntel.ecosystemStats.geminiVision += Math.floor(Math.random() * 2);
        cachedIntel.ecosystemStats.urlScan += Math.floor(Math.random() * 2);
        cachedIntel.globalThreatsDetected += Math.floor(Math.random() * 2);
    }
  }

  return NextResponse.json(cachedIntel, {
    headers: {
      'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=60'
    }
  });
}

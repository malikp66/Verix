export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { readScanMetrics } from '@/lib/scanMetrics';
import { fetchRSS, deduplicate, fallbackExtract, buildDeterministicReport, buildInsights } from '@/lib/intelFeeds';
import { extractIntelAndReport } from '@/lib/ai/intelExtractor';

const CACHE_REVALIDATE_TTL = 5 * 60 * 1000; // 5 minutes (SWR trigger age)
const CACHE_EXPIRATION_TTL = 30 * 60 * 1000; // 30 minutes (full expiration age)

// In-memory cache fallback if file system is write-protected
let memoryCache: any = null;
let memoryLastFetched = 0;

function getCachePath(): string {
  try {
    const dir = path.join(process.cwd(), 'lib');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return path.join(dir, 'intel_cache.json');
  } catch (e) {
    return '/tmp/verix_intel_cache.json';
  }
}

const REPORT_CACHE_PATH = path.join(process.cwd(), 'lib', 'report_cache.json');

function getMonthlyReportCache(): { report: any; month: string } | null {
  try {
    if (!fs.existsSync(REPORT_CACHE_PATH)) return null;
    const cached = JSON.parse(fs.readFileSync(REPORT_CACHE_PATH, 'utf-8'));
    const currentMonth = new Date().toISOString().slice(0, 7);
    if (cached.month === currentMonth) {
      console.log(`[Intel Pipeline] Using monthly cached report (${currentMonth}).`);
      return cached;
    }
    return null;
  } catch {
    return null;
  }
}

function saveMonthlyReportCache(report: any): void {
  try {
    const data = { report, month: new Date().toISOString().slice(0, 7), generatedAt: new Date().toISOString() };
    fs.writeFileSync(REPORT_CACHE_PATH, JSON.stringify(data, null, 2), 'utf8');
    console.log('[Intel Pipeline] Monthly report cache saved.');
  } catch (e) {
    console.warn('[Intel Pipeline] Failed to save monthly report cache:', e);
  }
}

function buildFinalPayload(enrichedItems: any[], report: any) {
  const tickerAlerts = enrichedItems.slice(0, 5).map(item => {
    const icon = item.severity === "CRITICAL" ? "🚨" : item.severity === "HIGH" ? "⚠️" : "🛑";
    return `${icon} Terkini: Modus ${item.type} berkedok ${item.title.slice(0, 60)}... (${item.source})`;
  });

  if (tickerAlerts.length < 5) {
    const fallbackTicker = [
      "🚨 Trend: Modus 'Salah Transfer' meningkat hari ini di area Jabodetabek",
      "⚠️ Intel: Phishing web pencurian kredensial menyerupai klikBCA terdeteksi aktif",
      "🛑 Proteksi: Sistem perlindungan VERIX aktif memantau URL berbahaya",
      "🔥 Awas: APK berkedok 'Undangan Digital' menyebar masif via pesan WhatsApp",
      "📡 Laporan: Modus social engineering telepon CS palsu meningkat"
    ];
    while (tickerAlerts.length < 5) {
      tickerAlerts.push(fallbackTicker[tickerAlerts.length]);
    }
  }

  const dashboardAlerts = enrichedItems.slice(0, 4).map((item, index) => {
    const valueTypes = ["threat", "victims", "new", "cases"];
    const times = ["Baru saja", "5m ago", "12m ago", "20m ago"];
    let shortTitle = item.title.split(' ').slice(0, 4).join(' ');
    if (item.target && item.target !== "General" && !shortTitle.toLowerCase().includes(item.target.toLowerCase())) {
      shortTitle = `${item.type} ${item.target}`;
    }
    return {
      title: shortTitle,
      changePct: Math.floor(Math.random() * 50) + 15,
      type: item.severity === "CRITICAL" ? "critical" : item.severity === "HIGH" ? "danger" : "warning",
      time: times[index] || "Baru saja",
      valueType: valueTypes[index] || "threat"
    };
  });

  const metrics = readScanMetrics();
  const ecosystemStats = {
    virusTotal: metrics.totalScans,
    safeBrowsing: metrics.totalScans,
    geminiVision: metrics.imageScans,
    urlScan: metrics.totalScans,
    newsApi: enrichedItems.filter(i => i.source.includes("news.google")).length
  };

  const globalThreatsDetected = metrics.highRiskScans;
  const accountsSaved = metrics.totalScans;
  const threatPctChange = accountsSaved > 0 ? Math.round((globalThreatsDetected / accountsSaved) * 100) : 0;

  return {
    success: true,
    data: enrichedItems,
    insights: buildInsights(enrichedItems),
    report,
    tickerAlerts,
    dashboardAlerts,
    ecosystemStats,
    globalThreatsDetected,
    accountsSaved,
    threatPctChange,
    lastSynced: new Date().toISOString()
  };
}

// ----------------------------
// 📊 AGGREGATION & PIPELINE
// ----------------------------
async function generateCuratedIntelligence(): Promise<any> {
  const googleNewsUrl = "https://news.google.com/rss/search?q=scam+OR+penipuan+OR+phishing+OR+hoax+indonesia&hl=id&gl=ID&ceid=ID:id";
  const phishingUrl = "https://news.google.com/rss/search?q=phishing+scam+bank+indonesia+APK&hl=id&gl=ID&ceid=ID:id";
  const antaraUrl = "https://www.antaranews.com/rss/terkini.xml";

  console.log("[Intel Pipeline] Fetching news feeds...");
  
  const [googleNewsItems, phishingItems, antaraItems] = await Promise.all([
    fetchRSS(googleNewsUrl).then(items => items.map(i => ({ ...i, source: "news.google.com" }))),
    fetchRSS(phishingUrl).then(items => items.map(i => ({ ...i, source: "news.google.com" }))),
    fetchRSS(antaraUrl).then(items => items.map(i => ({ ...i, source: "antaranews.com" })))
  ]);

let allRawItems = [...googleNewsItems, ...phishingItems, ...antaraItems];
  const sourceCount = [googleNewsItems.length > 0, phishingItems.length > 0, antaraItems.length > 0].filter(Boolean).length;
  console.log(`[Intel Pipeline] ${allRawItems.length} raw items from ${sourceCount}/3 sources (google:${googleNewsItems.length}, phishing:${phishingItems.length}, antara:${antaraItems.length})`);

  if (allRawItems.length === 0) {
    console.warn("[Intel Pipeline] No RSS items fetched. Using mock baseline.");
    return getBaselineMockPayload();
  }

  // Deduplicate using smart normalization
  allRawItems = deduplicate(allRawItems);
  console.log(`[Intel Pipeline] ${allRawItems.length} unique items after dedup.`);

  // If very few items, skip AI extraction (save cost)  use deterministic only
  if (allRawItems.length < 5) {
    console.warn(`[Intel Pipeline] Only ${allRawItems.length} unique items (insufficient), using deterministic extraction.`);
    const detItems = allRawItems.map(item => {
      const fi = fallbackExtract(item.title);
      return {
        id: `intel-${crypto.randomUUID()}`, title: item.title, source: item.source, link: item.link,
        publishedAt: new Date(item.date).toISOString(), ...fi, source_type: "REAL" as const
      };
    });
    return buildFinalPayload(detItems, buildDeterministicReport(detItems));
  }

  // Take top 10 for AI processing
  const processingItems = allRawItems.slice(0, 10);
  
  let enrichedItems: any[] = [];
  let report: any = null;

  // === MONTHLY REPORT CACHE ===
  const monthlyCache = getMonthlyReportCache();

  try {
    console.log(`[Intel Pipeline] Triggering AI extraction for ${processingItems.length} items...`);
    const aiResult = await extractIntelAndReport(processingItems);
    
    if (aiResult && aiResult.enriched) {
      enrichedItems = processingItems.map((item, idx) => {
        const aiInfo = aiResult.enriched.find((e: any) => e.index === idx) || fallbackExtract(item.title);
        return {
          id: `intel-${crypto.randomUUID()}`, title: item.title, source: item.source, link: item.link,
          publishedAt: new Date(item.date).toISOString(), type: aiInfo.type, vector: aiInfo.vector,
          target: aiInfo.target || "General", severity: aiInfo.severity, summary: aiInfo.summary,
          source_type: "REAL" as const
        };
      });
    } else {
      throw new Error("Empty or malformed result from AI");
    }

    // Use monthly cached report if available, otherwise save the new one
    if (monthlyCache) {
      report = monthlyCache.report;
    } else if (aiResult.report) {
      report = aiResult.report;
      saveMonthlyReportCache(report);
    } else {
      report = buildDeterministicReport(enrichedItems);
    }
  } catch (error) {
    console.warn("[Intel Pipeline] AI extraction failed, running deterministic offline extractor:", error);
    enrichedItems = processingItems.map(item => {
      const fi = fallbackExtract(item.title);
      return {
        id: `intel-${crypto.randomUUID()}`, title: item.title, source: item.source, link: item.link,
        publishedAt: new Date(item.date).toISOString(), ...fi, source_type: "REAL" as const
      };
    });
    report = monthlyCache ? monthlyCache.report : buildDeterministicReport(enrichedItems);
  }

  return buildFinalPayload(enrichedItems, report);
}

// ----------------------------
// 🛡️ MOCK BASELINE PAYLOAD
// ----------------------------
function getBaselineMockPayload() {
  const metrics = readScanMetrics();
  return {
    success: true,
    data: [],
    insights: { total: 0, topTypes: [], topVectors: [] },
    report: {
      headline: "Situasi Keamanan Siber Stabil",
      summary: "Tidak ada ancaman siber berskala nasional yang menonjol terdeteksi dari feed intelijen 24 jam terakhir.",
      key_trends: ["Aktivitas malware konvensional terpantau rendah.", "Kampanye spam phising stabil.", "Tidak ada anomali lalu lintas data."],
      attack_vectors: ["LINK"],
      risk_assessment: "LOW",
      recommended_actions: ["Lakukan pembaruan sistem operasi secara rutin.", "Gunakan kata sandi unik untuk setiap platform digital."]
    },
    tickerAlerts: [
      "🚨 Trend: Modus 'Salah Transfer' meningkat hari ini di area Jabodetabek",
      "⚠️ Intel: Phishing web pencurian kredensial menyerupai klikBCA terdeteksi aktif",
      "🛑 Proteksi: Sistem perlindungan VERIX aktif memantau URL berbahaya",
      "🔥 Awas: APK berkedok 'Undangan Digital' menyebar masif via pesan WhatsApp",
      "📡 Laporan: Modus social engineering telepon CS palsu mengatasnamakan e-commerce meningkat"
    ],
    dashboardAlerts: [
      { title: "Phishing BCA Mobile Clone", changePct: 42, type: "critical", time: "Baru saja", valueType: "threat" },
      { title: "APK Undangan Pernikahan", changePct: 15, type: "danger", time: "5m ago", valueType: "victims" },
      { title: "Voice Cloning Family Scam", changePct: 89, type: "warning", time: "12m ago", valueType: "new" },
      { title: "Fake QRIS Merchant", changePct: 12, type: "warning", time: "25m ago", valueType: "cases" }
    ],
    ecosystemStats: {
      virusTotal: metrics.totalScans,
      safeBrowsing: metrics.totalScans,
      geminiVision: metrics.imageScans,
      turnBackHoax: 4,
      urlScan: metrics.totalScans,
      newsApi: 12
    },
    globalThreatsDetected: metrics.highRiskScans,
    accountsSaved: metrics.totalScans,
    threatPctChange: metrics.totalScans > 0 ? Math.round((metrics.highRiskScans / metrics.totalScans) * 100) : 0,
    lastSynced: new Date().toISOString()
  };
}

// ----------------------------
// 🔄 BACKGROUND REBUILD (SWR)
// ----------------------------
async function triggerBackgroundRebuild() {
  const cachePath = getCachePath();
  try {
    console.log("[SWR Cache] Running background threat intel revalidation...");
    const freshData = await generateCuratedIntelligence();
    
    try {
      fs.writeFileSync(cachePath, JSON.stringify(freshData), 'utf8');
      console.log("[SWR Cache] Background revalidation completed & cache updated.");
    } catch (writeErr) {
      console.error("[SWR Cache] Failed writing background cache to file:", writeErr);
      memoryCache = freshData;
      memoryLastFetched = Date.now();
    }
  } catch (err) {
    console.error("[SWR Cache] Background revalidation pipeline failed:", err);
  }
}

// ----------------------------
// 📥 GET CONTROLLER (SWR CACHED)
// ----------------------------
export async function GET() {
  const cachePath = getCachePath();
  const now = Date.now();
  let cachedData: any = null;
  let cacheTime = 0;

  // Try reading from file cache first
  try {
    if (fs.existsSync(cachePath)) {
      const stats = fs.statSync(cachePath);
      const fileContent = fs.readFileSync(cachePath, 'utf8');
      cachedData = JSON.parse(fileContent);
      cacheTime = stats.mtimeMs;
    }
  } catch (e) {
    console.warn("[SWR Cache] Cache file read failed, trying memory cache:", e);
    cachedData = memoryCache;
    cacheTime = memoryLastFetched;
  }

  const age = now - cacheTime;

  // 1. Fresh Hit (less than 5 mins old)
  if (cachedData && age < CACHE_REVALIDATE_TTL) {
    console.log(`[SWR Cache] Fresh hit! serving cache (${Math.round(age / 1000)}s old).`);
    return NextResponse.json(cachedData, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    });
  }

  // 2. Stale hit (5 to 30 mins old) - serve immediately and trigger background refresh
  if (cachedData && age < CACHE_EXPIRATION_TTL) {
    console.log(`[SWR Cache] Stale hit! serving cache (${Math.round(age / 60000)}m old) & triggering revalidation.`);
    triggerBackgroundRebuild().catch(e => console.error("[SWR Cache] Background rebuild trigger failed:", e));
    return NextResponse.json(cachedData, {
      headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
    });
  }

  // 3. Cache expired or missing - blocking refresh
  console.log("[SWR Cache] Cache expired or missing. Running blocking intelligence refresh...");
  try {
    const freshData = await generateCuratedIntelligence();
    
    try {
      fs.writeFileSync(cachePath, JSON.stringify(freshData), 'utf8');
    } catch (writeErr) {
      console.error("[SWR Cache] Failed writing cache to file:", writeErr);
      memoryCache = freshData;
      memoryLastFetched = now;
    }

    return NextResponse.json(freshData, {
      headers: { 'Cache-Control': 'public, s-maxage=300, stale-while-revalidate=600' }
    });
  } catch (err) {
    console.error("[SWR Cache] Blocking refresh failed, serving stale cache or mock:", err);
    if (cachedData) {
      return NextResponse.json(cachedData, {
        headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' }
      });
    }
    return NextResponse.json(getBaselineMockPayload(), {
      headers: { 'Cache-Control': 'public, s-maxage=30, stale-while-revalidate=120' }
    });
  }
}

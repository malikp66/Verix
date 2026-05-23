export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cacheGet, cacheSet } from '@/lib/redis';
import { readScanMetrics } from '@/lib/scanMetrics';
import { fetchRSS, fallbackExtract, buildDeterministicReport, buildInsights } from '@/lib/intelFeeds';
import { extractIntelAndReport } from '@/lib/ai/intelExtractor';
import { fetchAllSources, dedupByTitle } from '@/lib/newsApi/orchestrator';
import type { NormalizedItem } from '@/lib/newsApi/orchestrator';
import { scoreArticle } from '@/lib/newsApi/scoring';

const CACHE_REVALIDATE_TTL = 5 * 60 * 1000; // 5 minutes (SWR trigger age)
const CACHE_EXPIRATION_TTL = 30 * 60 * 1000; // 30 minutes (full expiration age)
const PAYLOAD_CACHE_KEY = 'intel:payload';

async function getMonthlyReportCache(): Promise<{ report: any; month: string } | null> {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const cached = await cacheGet<{ report: any; month: string }>(`intel:report:${currentMonth}`);
    if (cached && cached.month === currentMonth) {
      console.log(`[Intel Pipeline] Using monthly cached report (${currentMonth}).`);
      return cached;
    }
    return null;
  } catch {
    return null;
  }
}

async function saveMonthlyReportCache(report: any): Promise<void> {
  try {
    const month = new Date().toISOString().slice(0, 7);
    const data = { report, month, generatedAt: new Date().toISOString() };
    await cacheSet(`intel:report:${month}`, data, 31 * 24 * 3600);
    console.log('[Intel Pipeline] Monthly report cache saved.');
  } catch (e) {
    console.warn('[Intel Pipeline] Failed to save monthly report cache:', e);
  }
}

function buildCampaigns(items: any[]): { brand: string; type: string; count: number; severity: string }[] {
  const groups = new Map<string, { brand: string; type: string; count: number; severity: string }>();
  for (const item of items) {
    const target = item.target || "General";
    const type = item.type || "SCAM";
    const key = `${target}|${type}`;
    const existing = groups.get(key);
    if (existing) {
      existing.count++;
      const sevOrder = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
      if (sevOrder.indexOf(item.severity) > sevOrder.indexOf(existing.severity)) {
        existing.severity = item.severity;
      }
    } else {
      groups.set(key, { brand: target, type, count: 1, severity: item.severity || "LOW" });
    }
  }
  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
}

function buildRegionMap(items: any[]): { region: string; count: number; severity: string }[] {
  const groups = new Map<string, { region: string; count: number; severity: string }>();
  for (const item of items) {
    const region = item.region || "Indonesia";
    const existing = groups.get(region);
    if (existing) {
      existing.count++;
      const sevOrder = ["LOW", "MEDIUM", "HIGH", "CRITICAL"];
      if (sevOrder.indexOf(item.severity) > sevOrder.indexOf(existing.severity)) {
        existing.severity = item.severity;
      }
    } else {
      groups.set(region, { region, count: 1, severity: item.severity || "LOW" });
    }
  }
  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
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
    newsApi: enrichedItems.filter(i =>
      i.source && !i.source.includes("news.google") && !i.source.includes("antaranews")
    ).length
  };

  const globalThreatsDetected = metrics.highRiskScans;
  const accountsSaved = metrics.totalScans;
  const threatPctChange = accountsSaved > 0 ? Math.round((globalThreatsDetected / accountsSaved) * 100) : 0;

  const campaigns = buildCampaigns(enrichedItems);
  const region_map = buildRegionMap(enrichedItems);

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
    campaigns,
    threat_map: { regions: region_map },
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

  console.log("[Intel Pipeline] Fetching news feeds + News APIs...");

  // 1. Fetch news API articles (24h cached server-side)
  const newsApiItems = await fetchAllSources();

  // 2. Fetch RSS feeds
  const [googleNewsItems, phishingItems, antaraItems] = await Promise.all([
    fetchRSS(googleNewsUrl).then(items => items.map(i => ({ ...i, source: "news.google.com" }))),
    fetchRSS(phishingUrl).then(items => items.map(i => ({ ...i, source: "news.google.com" }))),
    fetchRSS(antaraUrl).then(items => items.map(i => ({ ...i, source: "antaranews.com" })))
  ]);

  // 3. Convert RSS items to NormalizedItem format with scoring
  const rssNormalized: NormalizedItem[] = [...googleNewsItems, ...phishingItems, ...antaraItems].map(item => {
    const { risk_score, severity } = scoreArticle(item.title, "", "");
    return {
      title: item.title,
      link: item.link,
      date: item.date,
      source: item.source,
      description: "",
      risk_score,
      severity,
    };
  });

  const sourceCount = [googleNewsItems.length > 0, phishingItems.length > 0, antaraItems.length > 0].filter(Boolean).length;
  console.log(`[Intel Pipeline] ${newsApiItems.length} news API items, ${rssNormalized.length} RSS items from ${sourceCount}/3 RSS sources`);

  // 4. Merge + dedup
  let allItems: NormalizedItem[] = [...newsApiItems, ...rssNormalized];
  if (allItems.length === 0) {
    console.warn("[Intel Pipeline] No items from any source. Using mock baseline.");
    return getBaselineMockPayload();
  }

  allItems = dedupByTitle(allItems) as NormalizedItem[];
  console.log(`[Intel Pipeline] ${allItems.length} unique items after dedup.`);

  // 5. If very few items, skip AI extraction (save cost) → use deterministic only
  if (allItems.length < 5) {
    console.warn(`[Intel Pipeline] Only ${allItems.length} unique items (insufficient), using deterministic extraction.`);
    const detItems = allItems.map(item => {
      const fi = fallbackExtract(item.title);
      return {
        id: `intel-${crypto.randomUUID()}`, title: item.title, source: item.source, link: item.link,
        publishedAt: new Date(item.date).toISOString(), ...fi, source_type: "REAL" as const,
        region: "", confidence: 50,
      };
    });
    return buildFinalPayload(detItems, buildDeterministicReport(detItems));
  }

  // 6. Take top 15 for AI processing (sorted by risk_score desc)
  const processingItems = allItems.sort((a, b) => b.risk_score - a.risk_score).slice(0, 15);
  
  let enrichedItems: any[] = [];
  let report: any = null;

  // === MONTHLY REPORT CACHE ===
  const monthlyCache = await getMonthlyReportCache();

  try {
    console.log(`[Intel Pipeline] Triggering AI extraction for ${processingItems.length} items...`);
    const aiResult = await extractIntelAndReport(processingItems);
    
    if (aiResult && aiResult.enriched) {
      enrichedItems = processingItems.map((item, idx) => {
        const aiInfo = aiResult.enriched[idx] || fallbackExtract(item.title);
        return {
          id: `intel-${crypto.randomUUID()}`, title: item.title, source: item.source, link: item.link,
          publishedAt: new Date(item.date).toISOString(), type: aiInfo.type, vector: aiInfo.vector,
          target: aiInfo.target || "General", severity: aiInfo.severity, summary: aiInfo.summary,
          region: aiInfo.region || "", confidence: typeof aiInfo.confidence === 'number' ? aiInfo.confidence : 50,
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
      await saveMonthlyReportCache(report);
    } else {
      report = buildDeterministicReport(enrichedItems);
    }
  } catch (error) {
    console.warn("[Intel Pipeline] AI extraction failed, running deterministic offline extractor:", error);
    enrichedItems = processingItems.map(item => {
      const fi = fallbackExtract(item.title);
      return {
        id: `intel-${crypto.randomUUID()}`, title: item.title, source: item.source, link: item.link,
        publishedAt: new Date(item.date).toISOString(), ...fi, source_type: "REAL" as const,
        region: "", confidence: 50
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
  try {
    console.log("[SWR Cache] Running background threat intel revalidation...");
    const freshData = await generateCuratedIntelligence();
    await cacheSet(PAYLOAD_CACHE_KEY, { fetchedAt: Date.now(), data: freshData }, Math.ceil(CACHE_EXPIRATION_TTL / 1000));
    console.log("[SWR Cache] Background revalidation completed & cache updated.");
  } catch (err) {
    console.error("[SWR Cache] Background revalidation pipeline failed:", err);
  }
}

// ----------------------------
// 📥 GET CONTROLLER (SWR CACHED)
// ----------------------------
export async function GET() {
  const now = Date.now();
  let cachedData: any = null;
  let cacheTime = 0;

  try {
    const cached = await cacheGet<{ fetchedAt: number; data: any }>(PAYLOAD_CACHE_KEY);
    if (cached) {
      cachedData = cached.data;
      cacheTime = cached.fetchedAt;
    }
  } catch (e) {
    console.warn("[SWR Cache] Redis read failed:", e);
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
    await cacheSet(PAYLOAD_CACHE_KEY, { fetchedAt: now, data: freshData }, Math.ceil(CACHE_EXPIRATION_TTL / 1000));

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

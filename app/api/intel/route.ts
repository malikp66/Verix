export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import crypto from 'crypto';
import { cacheGet, cacheSet, cacheZadd, cacheZrevrange, cacheZrevrangeWithScores, cacheZremrangeByRank, cacheZcard } from '@/lib/redis';
import { readScanMetrics } from '@/lib/scanMetrics';
import { fetchRSS, fallbackExtract, buildDeterministicReport, buildInsights } from '@/lib/intelFeeds';
import { extractIntelAndReport } from '@/lib/ai/intelExtractor';
import { fetchAllSources, dedupByTitle, normalizeText } from '@/lib/newsApi/orchestrator';
import type { NormalizedItem } from '@/lib/newsApi/orchestrator';
import { scoreArticle } from '@/lib/newsApi/scoring';

const NEWS_ARCHIVE_KEY = 'news:archive';
const CAMPAIGNS_CACHE_KEY = 'intel:campaigns';
const PIPELINE_LAST_RUN_KEY = 'intel:pipeline:last';
const MAX_ARCHIVE_SIZE = 500;
const PIPELINE_INTERVAL_MS = 5 * 60 * 1000;
const ITEM_TTL_SECONDS = 30 * 24 * 3600;

let pendingPipeline: Promise<void> | null = null;

// ─── Helpers ───

function hashTitle(title: string): string {
  return crypto.createHash('sha256').update(normalizeText(title).slice(0, 80)).digest('hex');
}

async function loadExistingHashes(): Promise<Set<string>> {
  const members = await cacheZrevrange(NEWS_ARCHIVE_KEY, 0, -1);
  return new Set(members);
}

// ─── Pipeline ───

async function runPipeline(): Promise<void> {
  const googleNewsUrl = "https://news.google.com/rss/search?q=scam+OR+penipuan+OR+phishing+OR+hoax+indonesia&hl=id&gl=ID&ceid=ID:id";
  const phishingUrl = "https://news.google.com/rss/search?q=phishing+scam+bank+indonesia+APK&hl=id&gl=ID&ceid=ID:id";
  const antaraUrl = "https://www.antaranews.com/rss/top-news.xml";

  console.log("[Intel Pipeline] Fetching news feeds + News APIs...");

  const newsApiItems = await fetchAllSources();

  const cyberKeywords = /scam|phish(ing)?|penipuan|fraud|malware|APK|QRIS|OTP|deepfake|siber|bobol|hack(er|ing)?|carding|rekening|kejahatan\s*digital|keamanan\s*siber|cyber\s*(crime|sec|fraud)|ransomware|social\s*engineering|phising|pencucian|skimming|spoofing|identity\s*theft|pencurian\s*data|bocor\s*data|pengelabuan|modus\s*baru|investasi\s*bodong|pinjol\s*ilegal|judol|slot\s*online|robot\s*trading/i;

  const [googleNewsItems, phishingItems, antaraItems] = await Promise.all([
    fetchRSS(googleNewsUrl).then(items => items.map(i => ({ ...i, source: "news.google.com" }))),
    fetchRSS(phishingUrl).then(items => items.map(i => ({ ...i, source: "news.google.com" }))),
    fetchRSS(antaraUrl).then(items =>
      items.map(i => ({ ...i, source: "antaranews.com" })).filter(item => cyberKeywords.test(item.title))
    )
  ]);

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

  let allItems: NormalizedItem[] = [...newsApiItems, ...rssNormalized];
  if (allItems.length === 0) {
    console.warn("[Intel Pipeline] No items from any source. Skipping pipeline.");
    return;
  }

  allItems = dedupByTitle(allItems) as NormalizedItem[];
  console.log(`[Intel Pipeline] ${allItems.length} unique items after dedup.`);

  const existingHashes = await loadExistingHashes();
  let newCount = 0;

  for (const item of allItems) {
    const h = hashTitle(item.title);
    if (existingHashes.has(h)) continue;

    const timestamp = item.date ? new Date(item.date).getTime() : Date.now();

    const enriched = fallbackExtract(item.title);
    const entry = {
      id: `intel-${crypto.randomUUID()}`,
      title: item.title,
      link: item.link,
      source: item.source,
      publishedAt: new Date(item.date).toISOString(),
      ...enriched,
      region: "",
      confidence: 50,
      source_type: "REAL" as const,
    };

    await cacheZadd(NEWS_ARCHIVE_KEY, timestamp, h);
    await cacheSet(`news:item:${h}`, entry, ITEM_TTL_SECONDS);
    existingHashes.add(h);
    newCount++;
  }

  if (newCount > 0) {
    const total = await cacheZcard(NEWS_ARCHIVE_KEY);
    if (total > MAX_ARCHIVE_SIZE) {
      await cacheZremrangeByRank(NEWS_ARCHIVE_KEY, 0, total - MAX_ARCHIVE_SIZE - 1);
    }
    console.log(`[Intel Pipeline] Added ${newCount} new items (archive: ${Math.min(total, MAX_ARCHIVE_SIZE)}).`);
  } else {
    console.log("[Intel Pipeline] No new items to add.");
  }

  // AI enrichment for top 20 newest items that haven't been enriched yet
  const allHashes = await cacheZrevrange(NEWS_ARCHIVE_KEY, 0, 19);
  const aiBatch: any[] = [];
  for (const h of allHashes) {
    const item = await cacheGet<any>(`news:item:${h}`);
    if (item) aiBatch.push(item);
  }

  if (aiBatch.length >= 5) {
    try {
      console.log(`[Intel Pipeline] Triggering AI enrichment for ${aiBatch.length} items...`);
      const aiResult = await extractIntelAndReport(aiBatch.map((item: any) => ({
        title: item.title,
        link: item.link,
        date: item.publishedAt,
        source: item.source,
        description: "",
      })));

      if (aiResult && aiResult.enriched) {
        for (let idx = 0; idx < aiBatch.length; idx++) {
          const aiInfo = aiResult.enriched[idx];
          if (aiInfo) {
            const h = allHashes[idx];
            aiBatch[idx] = {
              ...aiBatch[idx],
              type: aiInfo.type || aiBatch[idx].type,
              vector: aiInfo.vector || aiBatch[idx].vector,
              target: aiInfo.target || aiBatch[idx].target,
              severity: aiInfo.severity || aiBatch[idx].severity,
              summary: aiInfo.summary || aiBatch[idx].summary,
              region: aiInfo.region || aiBatch[idx].region,
              confidence: typeof aiInfo.confidence === 'number' ? aiInfo.confidence : aiBatch[idx].confidence,
            };
            await cacheSet(`news:item:${h}`, aiBatch[idx], ITEM_TTL_SECONDS);
          }
        }
        if (aiResult.report) {
          const currentMonth = new Date().toISOString().slice(0, 7);
          await cacheSet(`intel:report:${currentMonth}`, { report: aiResult.report, month: currentMonth }, 31 * 24 * 3600);
        }
        console.log(`[Intel Pipeline] AI enrichment completed for ${aiBatch.length} items.`);
      }
    } catch (error) {
      console.warn("[Intel Pipeline] AI enrichment failed (non-blocking):", error);
    }
  }

  // Rebuild campaigns cache
  await rebuildCampaignsCache();

  await cacheSet(PIPELINE_LAST_RUN_KEY, Date.now(), 3600);
  console.log("[Intel Pipeline] Pipeline completed.");
}

async function rebuildCampaignsCache(): Promise<void> {
  const allHashes = await cacheZrevrange(NEWS_ARCHIVE_KEY, 0, -1);
  const items: any[] = [];
  for (const h of allHashes) {
    const item = await cacheGet<any>(`news:item:${h}`);
    if (item) items.push(item);
  }

  const campaigns = buildCampaigns(items);
  const regionMap = buildRegionMap(items);
  const insights = buildInsights(items);
  const report = await getMonthlyReport() || buildDeterministicReport(items);

  await cacheSet(CAMPAIGNS_CACHE_KEY, { campaigns, region_map: { regions: regionMap }, insights, report }, 3600);
}

async function getMonthlyReport(): Promise<any | null> {
  try {
    const currentMonth = new Date().toISOString().slice(0, 7);
    const cached = await cacheGet<{ report: any; month: string }>(`intel:report:${currentMonth}`);
    if (cached && cached.month === currentMonth) return cached.report;
    return null;
  } catch { return null; }
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
      if (sevOrder.indexOf(item.severity) > sevOrder.indexOf(existing.severity)) existing.severity = item.severity;
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
      if (sevOrder.indexOf(item.severity) > sevOrder.indexOf(existing.severity)) existing.severity = item.severity;
    } else {
      groups.set(region, { region, count: 1, severity: item.severity || "LOW" });
    }
  }
  return Array.from(groups.values()).sort((a, b) => b.count - a.count);
}

// ─── GET Handler ───

export async function GET() {
  // 1. Read latest 100 items from sorted set
  const latest = await cacheZrevrangeWithScores(NEWS_ARCHIVE_KEY, 0, 99);
  const items: any[] = [];
  for (const { member: h } of latest) {
    const item = await cacheGet<any>(`news:item:${h}`);
    if (item) items.push(item);
  }

  // 2. Read campaigns cache
  let campaignsCache = await cacheGet<any>(CAMPAIGNS_CACHE_KEY);

  // 3. If archive is empty (first run), run pipeline blocking once
  if (items.length === 0) {
    console.log("[Intel Pipeline] Archive empty, running initial pipeline...");
    await runPipeline();
    const retry = await cacheZrevrangeWithScores(NEWS_ARCHIVE_KEY, 0, 99);
    for (const { member: h } of retry) {
      const item = await cacheGet<any>(`news:item:${h}`);
      if (item) items.push(item);
    }
    campaignsCache = await cacheGet<any>(CAMPAIGNS_CACHE_KEY);
  }

  // 4. Trigger background pipeline if >5 min since last run
  const lastRun = await cacheGet<number>(PIPELINE_LAST_RUN_KEY);
  if (!lastRun || Date.now() - lastRun > PIPELINE_INTERVAL_MS) {
    triggerBackgroundPipeline().catch(e => console.error("[Intel Pipeline] Background pipeline failed:", e));
  }

  // 5. Build payload
  const metrics = readScanMetrics();
  const tickerAlerts = items.slice(0, 5).map(item => {
    const icon = item.severity === "CRITICAL" ? "🚨" : item.severity === "HIGH" ? "⚠️" : "🛑";
    return `${icon} Terkini: Modus ${item.type} berkedok ${item.title.slice(0, 60)}... (${item.source})`;
  });

  const dashboardAlerts = items.slice(0, 4).map((item, index) => {
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

  const campaignsData = campaignsCache || { campaigns: [], region_map: { regions: [] }, insights: { total: 0, topTypes: [], topVectors: [] }, report: null };

  return NextResponse.json({
    success: true,
    data: items,
    insights: campaignsData.insights,
    report: campaignsData.report,
    tickerAlerts,
    dashboardAlerts,
    ecosystemStats: {
      virusTotal: metrics.totalScans,
      safeBrowsing: metrics.totalScans,
      geminiVision: metrics.imageScans,
      urlScan: metrics.totalScans,
      newsApi: items.filter(i => i.source && !i.source.includes("news.google") && !i.source.includes("antaranews")).length,
    },
    globalThreatsDetected: metrics.highRiskScans,
    accountsSaved: metrics.totalScans,
    threatPctChange: metrics.totalScans > 0 ? Math.round((metrics.highRiskScans / metrics.totalScans) * 100) : 0,
    campaigns: campaignsData.campaigns,
    threat_map: campaignsData.region_map,
    lastSynced: new Date().toISOString(),
  }, {
    headers: { 'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300' }
  });
}

async function triggerBackgroundPipeline() {
  if (pendingPipeline) {
    console.log("[Intel Pipeline] Reusing in-flight pipeline.");
    return pendingPipeline;
  }
  pendingPipeline = runPipeline();
  try {
    await pendingPipeline;
  } finally {
    pendingPipeline = null;
  }
}

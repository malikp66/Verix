export const dynamic = 'force-dynamic';

import { NextResponse } from 'next/server';
import { cacheGet, cacheZrevrangeWithScores } from '@/lib/redis';
import { readScanMetrics } from '@/lib/scanMetrics';
import { runPipeline, NEWS_ARCHIVE_KEY, CAMPAIGNS_CACHE_KEY } from '@/lib/intelPipeline';

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

  // 3. If archive is empty (first run), run pipeline blocking once to bootstrap
  if (items.length === 0) {
    console.log("[Intel Pipeline] Archive empty, running initial pipeline bootstrap...");
    await runPipeline();
    const retry = await cacheZrevrangeWithScores(NEWS_ARCHIVE_KEY, 0, 99);
    for (const { member: h } of retry) {
      const item = await cacheGet<any>(`news:item:${h}`);
      if (item) items.push(item);
    }
    campaignsCache = await cacheGet<any>(CAMPAIGNS_CACHE_KEY);
  }

  // 4. Build payload
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

  const campaignsData = campaignsCache || { 
    campaigns: [], 
    region_map: { regions: [] }, 
    insights: { total: 0, topTypes: [], topVectors: [] }, 
    report: null 
  };

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

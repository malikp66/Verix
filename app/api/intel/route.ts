import { NextResponse } from 'next/server';
import { GoogleGenAI, Type, Schema } from "@google/genai";
import fs from 'fs';
import path from 'path';
import { readScanMetrics } from '@/lib/scanMetrics';

const CACHE_DURATION = 30 * 60 * 1000; // 30 minutes cache

// In-memory fallback if file system is completely write-protected
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

// Simple regex-based RSS parser to avoid external dependencies
function parseRss(xml: string, limit = 8) {
  const items: { title: string; link: string; date: string }[] = [];
  const itemRegex = /<item>([\s\S]*?)<\/item>/g;
  let match;
  
  while ((match = itemRegex.exec(xml)) !== null && items.length < limit) {
    const content = match[1];
    
    // Extract title (handling CDATA if present)
    const titleMatch = content.match(/<title><!\[CDATA\[([\s\S]*?)\]\]><\/title>/) || content.match(/<title>([\s\S]*?)<\/title>/);
    const linkMatch = content.match(/<link>([\s\S]*?)<\/link>/);
    const dateMatch = content.match(/<pubDate>([\s\S]*?)<\/pubDate>/);
    
    if (titleMatch) {
      let title = titleMatch[1].trim();
      title = title.replace(/^<!\[CDATA\[/, '').replace(/\]\]>$/, '');
      
      items.push({
        title,
        link: linkMatch ? linkMatch[1].trim() : "",
        date: dateMatch ? dateMatch[1].trim() : ""
      });
    }
  }
  return items;
}

// Fetch Indonesian scam and hoax feeds in parallel
async function fetchNewsFeeds(): Promise<{ title: string; link: string; date: string }[]> {
  const googleNewsUrl = "https://news.google.com/rss/search?q=scam+OR+penipuan+OR+phishing+OR+hoax+indonesia&hl=id&gl=ID&ceid=ID:id";
  const turnBackHoaxUrl = "https://turnbackhoax.id/feed/";
  
  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), 5000); // 5 seconds fetch timeout

  try {
    const results = await Promise.allSettled([
      fetch(googleNewsUrl, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.text()),
      fetch(turnBackHoaxUrl, { signal: controller.signal, headers: { 'User-Agent': 'Mozilla/5.0' } }).then(r => r.text())
    ]);
    
    clearTimeout(timeout);
    
    const allItems: { title: string; link: string; date: string }[] = [];
    
    if (results[0].status === 'fulfilled') {
      allItems.push(...parseRss(results[0].value, 8));
    }
    if (results[1].status === 'fulfilled') {
      allItems.push(...parseRss(results[1].value, 8));
    }
    
    return allItems;
  } catch (err) {
    console.error("Failed to fetch RSS feeds:", err);
    return [];
  }
}

// Generate threat intelligence cache using Gemini 2.5 Flash
async function generateCuratedIntelligence() {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) {
    throw new Error("GEMINI_API_KEY is missing in env");
  }

  // 1. Fetch real news
  const newsList = await fetchNewsFeeds();
  
  if (newsList.length === 0) {
    console.warn("No RSS news items fetched. Using baseline intelligence.");
    return getBaselineMockPayload();
  }

  // 2. Synthesize using Gemini
  const ai = new GoogleGenAI({ apiKey });
  const prompt = `You are a cybersecurity threat intelligence aggregator.
Based on the following recent Indonesian scam, phishing, and hoax news articles, generate a unified real-time threat intelligence payload.
The output MUST be a JSON object matching this schema.

List exactly 5 tickerAlerts (must start with 🚨, ⚠️, or 🛑 and summarize the moduses found in the news in Indonesian, e.g. "🚨 Laporan: Modus penipuan online mengatasnamakan undian BRI Mobile marak").
List exactly 4 dashboardAlerts (short title of max 4 words in Indonesian, e.g. "Phishing BCA Mobile", "APK Undangan Nikah", "Voice Cloning Scam", "Fake QRIS Merchant"). 
Set changePct as a realistic threat level increase or volume percentage (between 10 and 95).
Set ecosystemStats with realistic count of simulated detections in our platform database.

News Articles:
${newsList.map(n => `- Title: ${n.title}\n  Published: ${n.date}`).join('\n')}
`;

  const schema: Schema = {
    type: Type.OBJECT,
    properties: {
      tickerAlerts: {
        type: Type.ARRAY,
        items: { type: Type.STRING },
        description: "List of 5 warning ticker alert strings, in Indonesian."
      },
      dashboardAlerts: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING },
            changePct: { type: Type.NUMBER },
            type: { type: Type.STRING, description: "One of: 'critical', 'danger', 'warning'" },
            time: { type: Type.STRING, description: "One of: 'Baru saja', '5m ago', '12m ago', '20m ago', '30m ago'" },
            valueType: { type: Type.STRING, description: "One of: 'threat', 'victims', 'new', 'cases'" }
          },
          required: ["title", "changePct", "type", "time", "valueType"]
        },
        description: "List of 4 dashboard scam alerts."
      },
      ecosystemStats: {
        type: Type.OBJECT,
        properties: {
          virusTotal: { type: Type.NUMBER },
          safeBrowsing: { type: Type.NUMBER },
          geminiVision: { type: Type.NUMBER },
          turnBackHoax: { type: Type.NUMBER },
          urlScan: { type: Type.NUMBER },
          newsApi: { type: Type.NUMBER }
        },
        required: ["virusTotal", "safeBrowsing", "geminiVision", "turnBackHoax", "urlScan", "newsApi"]
      },
      globalThreatsDetected: { type: Type.NUMBER },
      accountsSaved: { type: Type.NUMBER },
      threatPctChange: { type: Type.NUMBER }
    },
    required: [
      "tickerAlerts", "dashboardAlerts", "ecosystemStats", 
      "globalThreatsDetected", "accountsSaved", "threatPctChange"
    ]
  };

  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: [prompt],
      config: {
        responseMimeType: "application/json",
        responseSchema: schema
      }
    });

    const parsed = JSON.parse(response.text || "{}");
    parsed.lastSynced = new Date().toISOString();
    return parsed;
  } catch (error) {
    console.error("Gemini intelligence aggregation failed:", error);
    return getBaselineMockPayload();
  }
}

// Fallback baseline mock payload in case of errors
function getBaselineMockPayload() {
  const metrics = readScanMetrics();
  return {
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
      turnBackHoax: 0,
      urlScan: metrics.totalScans,
      newsApi: 0
    },
    globalThreatsDetected: metrics.highRiskScans,
    accountsSaved: metrics.totalScans,
    threatPctChange: metrics.totalScans > 0 ? Math.round((metrics.highRiskScans / metrics.totalScans) * 100) : 0,
    lastSynced: new Date().toISOString()
  };
}

export async function GET() {
  const cachePath = getCachePath();
  let data: any = null;
  let needRefresh = false;

  const now = Date.now();

  // Try to load from file cache
  try {
    if (fs.existsSync(cachePath)) {
      const stats = fs.statSync(cachePath);
      const age = now - stats.mtimeMs;
      
      if (age < CACHE_DURATION) {
        const fileContent = fs.readFileSync(cachePath, 'utf8');
        data = JSON.parse(fileContent);
      } else {
        needRefresh = true;
      }
    } else {
      needRefresh = true;
    }
  } catch (e) {
    console.error("Cache file read error, falling back to memory:", e);
    // Use memory cache fallback
    if (memoryCache && (now - memoryLastFetched < CACHE_DURATION)) {
      data = memoryCache;
    } else {
      needRefresh = true;
    }
  }

  // If cache is empty or expired, refresh it
  if (needRefresh || !data) {
    try {
      data = await generateCuratedIntelligence();
      
      // Save to file cache
      try {
        fs.writeFileSync(cachePath, JSON.stringify(data), 'utf8');
      } catch (writeErr) {
        console.error("Cache file write error:", writeErr);
        // Fallback to memory cache
        memoryCache = data;
        memoryLastFetched = now;
      }
    } catch (err) {
      console.error("Aggregating threat feed failed:", err);
      // Serve stale cache if available, else baseline mock
      if (fs.existsSync(cachePath)) {
        try {
          data = JSON.parse(fs.readFileSync(cachePath, 'utf8'));
        } catch (_) {
          data = getBaselineMockPayload();
        }
      } else {
        data = memoryCache || getBaselineMockPayload();
      }
    }
  }

  return NextResponse.json(data, {
    headers: {
      'Cache-Control': 'public, s-maxage=10, stale-while-revalidate=60'
    }
  });
}

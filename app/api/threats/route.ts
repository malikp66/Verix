export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { generateLocalThreats, buildInsights, ThreatItem } from "@/lib/threatFeeds";

// We keep a lightweight in-memory cache to prevent hitting global APIs too heavily
let globalCache: {
  threats: ThreatItem[];
  lastFetched: number;
} | null = null;

const CACHE_TTL = 3 * 60 * 1000; // 3 minutes cache

// Helper to safely fetch with a timeout
async function fetchWithTimeout(url: string, options = {}, timeout = 2500) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeout);
  try {
    const response = await fetch(url, {
      ...options,
      signal: controller.signal
    });
    clearTimeout(id);
    return response;
  } catch (error) {
    clearTimeout(id);
    throw error;
  }
}

// Fetch Abuse.ch URLhaus recent URLs
async function fetchRecentAbuseCh(): Promise<ThreatItem[]> {
  try {
    const res = await fetchWithTimeout("https://urlhaus.abuse.ch/downloads/json_recent/", {
      headers: { "User-Agent": "VERIX-ThreatPulse-Engine/1.0" },
      cache: 'no-store',
    }, 3000);
    
    if (!res.ok) return [];
    const data = await res.json();
    const urls = data.urls || [];
    
    return urls.slice(0, 15).map((item: any) => {
      let hostname = "malicious-host.net";
      try {
        hostname = new URL(item.url).hostname;
      } catch (_) {
        hostname = item.host || "malicious-host.net";
      }
      
      const isMalware = item.threat === "malware_download";
      return {
        id: `abusech-${item.id || Math.random().toString(36).substr(2, 9)}`,
        title: isMalware ? "Malware Payload Download" : "Credential Harvesting Phishing",
        type: isMalware ? "MALWARE" : "PHISHING",
        severity: isMalware ? "CRITICAL" : "HIGH",
        source: "Abuse.ch URLhaus",
        url: item.url,
        domain: hostname,
        target_brand: undefined, // To be filled/resolved later if matching Indonesian brands
        vector: isMalware ? "APK" : "LINK",
        country: "GLOBAL",
        timestamp: item.date_added ? new Date(item.date_added.replace(" UTC", "Z")).toISOString() : new Date().toISOString(),
        tags: item.tags || ["malware"],
        confidence: "95% (HIGH, verified by Abuse.ch)",
        story: `File host '${hostname}' detected actively serving malicious payloads. Source verified by threat intelligence community.`,
        impact: `Device hijacking, malware execution, or credential theft.`
      };
    });
  } catch (e) {
    console.error("URLhaus direct fetch failed, skipping URLhaus: ", e);
    return [];
  }
}

export async function GET() {
  const now = Date.now();
  let globalThreats: ThreatItem[] = [];

  // Check cache first to keep response times fast (<100ms)
  if (globalCache && now - globalCache.lastFetched < CACHE_TTL) {
    globalThreats = globalCache.threats;
  } else {
    try {
      console.log("[Threats API] Cache expired. Fetching Abuse.ch URLhaus...");
      const realUrls = await fetchRecentAbuseCh();
      globalThreats = realUrls.length > 0 ? realUrls : (globalCache?.threats || []);
      
      // Update cache even if it returned empty, to avoid spamming the API on every single request
      globalCache = {
        threats: globalThreats,
        lastFetched: now
      };
    } catch (e) {
      console.warn("Real-time threat feed fetch failed. Using stale cache or empty.", e);
      globalThreats = globalCache?.threats || [];
      globalCache = {
        threats: globalThreats,
        lastFetched: now // Prevent retries for CACHE_TTL
      };
    }
  }

  // Generate local Indonesian threat simulation data (always live-updating)
  const localThreats = generateLocalThreats();

  // Combine feeds
  const combinedThreats = [...localThreats, ...globalThreats];

  // Resolve brands on global threat feeds if possible
  const BRANDS = ["BCA", "BRI", "DANA", "OVO", "Tokopedia", "WhatsApp", "Shopee", "Gojek"];
  combinedThreats.forEach(t => {
    if (!t.target_brand && t.domain) {
      const domLower = t.domain.toLowerCase();
      const matched = BRANDS.find(b => domLower.includes(b.toLowerCase()));
      if (matched) {
        t.target_brand = matched;
        t.country = "ID"; // Re-attribute if matching local brands
        t.region = "Jakarta";
      }
    }
  });

  // Sort by latest timestamp (reverse chronological)
  combinedThreats.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  // Aggregate insights
  const insights = buildInsights(combinedThreats);

  return NextResponse.json({
    success: true,
    data: combinedThreats,
    insights
  }, {
    headers: {
      "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30"
    }
  });
}

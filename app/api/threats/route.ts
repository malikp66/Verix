export const dynamic = 'force-dynamic';

import { NextResponse } from "next/server";
import { buildInsights, ThreatItem } from "@/lib/threatFeeds";

let globalCache: {
  threats: ThreatItem[];
  lastFetched: number;
} | null = null;

const CACHE_TTL = 3 * 60 * 1000;

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
        target_brand: undefined,
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

async function enrichWithUrlScan(threats: ThreatItem[]): Promise<void> {
  const apiKey = process.env.URLSCAN_API_KEY;
  if (!apiKey || apiKey === "YOUR_URLSCAN_API_KEY" || apiKey.startsWith("YOUR_")) return;

  const results = await Promise.allSettled(
    threats.slice(0, 5).map(async (t) => {
      if (!t.url) return;
      const submitRes = await fetchWithTimeout("https://urlscan.io/api/v1/scan/", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "API-Key": apiKey,
        },
        body: JSON.stringify({ url: t.url, visibility: "public" }),
      }, 3000);
      if (!submitRes.ok) return;
      const submitData = await submitRes.json();
      const uuid = submitData.uuid;
      if (!uuid) return;

      await new Promise((r) => setTimeout(r, 2000));

      const resultRes = await fetchWithTimeout(`https://urlscan.io/api/v1/result/${uuid}/`, {
        headers: { "API-Key": apiKey },
      }, 3000);
      if (!resultRes.ok) return;
      const resultData = await resultRes.json();
      t.urlscan_screenshot = resultData?.task?.screenshotURL || resultData?.screenshot || undefined;
      t.urlscan_verdict = resultData?.verdict?.overall?.malicious ? "MALICIOUS" : resultData?.verdict?.overall?.benign ? "BENIGN" : "UNKNOWN";
    })
  );
}

async function enrichWithGoogleSafeBrowsing(threats: ThreatItem[]): Promise<void> {
  const apiKey = process.env.GOOGLE_SAFE_BROWSING_KEY;
  if (!apiKey || apiKey === "YOUR_GOOGLE_SAFE_BROWSING_KEY" || apiKey.startsWith("YOUR_")) return;

  const urls = threats.map(t => t.url).filter(Boolean) as string[];
  if (urls.length === 0) return;

  try {
    const res = await fetchWithTimeout(
      `https://safebrowsing.googleapis.com/v4/threatMatches:find?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          client: { clientId: "VERIX", clientVersion: "1.0.0" },
          threatInfo: {
            threatTypes: ["MALWARE", "SOCIAL_ENGINEERING", "UNWANTED_SOFTWARE", "POTENTIALLY_HARMFUL_APPLICATION"],
            platformTypes: ["ANY_PLATFORM"],
            threatEntryTypes: ["URL"],
            threats: urls.map((url) => ({ url })),
          },
        }),
      },
      3000
    );
    if (!res.ok) return;
    const data = await res.json();
    const matches: { threat: { url: string } }[] = data?.matches || [];
    const matchedUrls = new Set(matches.map((m: any) => m.threat?.url));
    threats.forEach((t) => {
      if (t.url && matchedUrls.has(t.url)) {
        t.gsb_match = true;
      }
    });
  } catch (e) {
    console.error("Google Safe Browsing enrichment failed:", e);
  }
}

async function fetchVirusTotalIndonesia(): Promise<ThreatItem[]> {
  const apiKey = process.env.VIRUSTOTAL_API_KEY;
  if (!apiKey || apiKey === "YOUR_VIRUSTOTAL_API_KEY" || apiKey.startsWith("YOUR_")) return [];

  try {
    const query = encodeURIComponent("(phishing OR malware) AND (bank OR indonesia OR bca OR bri OR dana OR ovo OR gojek OR tokopedia OR shopee)");
    const res = await fetchWithTimeout(
      `https://www.virustotal.com/api/v3/intelligence/search?query=${query}&limit=10`,
      { headers: { "x-apikey": apiKey, "Accept": "application/json" } },
      3000
    );
    if (!res.ok) return [];
    const data = await res.json();
    const hits = data?.data || [];
    return hits.map((item: any, i: number): ThreatItem => {
      const attrs = item.attributes || {};
      const url = attrs.url || item.id || "";
      let hostname = "unknown";
      try { hostname = new URL(url).hostname; } catch (_) {}
      return {
        id: `vt-${i}-${Date.now()}`,
        title: `VirusTotal: ${attrs.title || attrs.threat_classification?.suggested_threat_label || "Suspicious URL"}`,
        type: "PHISHING",
        severity: attrs.last_analysis_stats?.malicious > 5 ? "CRITICAL" : "HIGH",
        source: "VirusTotal Intelligence",
        url,
        domain: hostname,
        target_brand: undefined,
        vector: "LINK",
        country: "ID",
        timestamp: attrs.last_analysis_date ? new Date(attrs.last_analysis_date * 1000).toISOString() : new Date().toISOString(),
        tags: ["phishing", "malware"],
        confidence: `${Math.min(attrs.last_analysis_stats?.malicious || 5, 99)}% (VT detection)`,
        story: `URL terdeteksi oleh ${attrs.last_analysis_stats?.malicious || 0}/${attrs.last_analysis_stats?.total || 70} engine di VirusTotal sebagai berbahaya.`,
        impact: `Potensi pencurian kredensial perbankan Indonesia.`
      };
    });
  } catch (e) {
    console.error("VirusTotal fetch failed:", e);
    return [];
  }
}

async function fetchUrlScanIndonesia(): Promise<ThreatItem[]> {
  const apiKey = process.env.URLSCAN_API_KEY;
  if (!apiKey || apiKey === "YOUR_URLSCAN_API_KEY" || apiKey.startsWith("YOUR_")) return [];

  try {
    const query = encodeURIComponent("domain:* AND (phishing OR malware) AND (page.country:ID OR page.server:Indonesia)");
    const res = await fetchWithTimeout(
      `https://urlscan.io/api/v1/search/?q=${query}&size=10`,
      { headers: { "API-Key": apiKey } },
      3000
    );
    if (!res.ok) return [];
    const data = await res.json();
    const results = data?.results || [];
    return results.map((item: any, i: number): ThreatItem => {
      const page = item.page || {};
      const url = page.url || "";
      let hostname = "unknown";
      try { hostname = new URL(url).hostname; } catch (_) {}
      return {
        id: `urlscan-${i}-${Date.now()}`,
        title: `URLScan: ${page.title || hostname || "Suspicious page"}`,
        type: "PHISHING",
        severity: (item.score || 0) > 80 ? "CRITICAL" : "HIGH",
        source: "URLScan.io",
        url,
        domain: hostname,
        target_brand: undefined,
        vector: "LINK",
        country: "ID",
        timestamp: item.task?.time ? new Date(item.task.time).toISOString() : new Date().toISOString(),
        tags: ["phishing", "urlscan"],
        confidence: `${Math.min(item.score || 50, 99)}% (URLScan verdict)`,
        story: `URL terdeteksi oleh URLScan.io dengan skor ${item.score || 0}/100. ${page.ip ? `Server IP: ${page.ip}.` : ""}`,
        impact: `Potensi serangan phishing yang menargetkan pengguna Indonesia.`,
        urlscan_screenshot: item.screenshot || undefined,
        urlscan_verdict: (item.score || 0) > 50 ? "MALICIOUS" : "UNKNOWN",
      };
    });
  } catch (e) {
    console.error("URLScan.io fetch failed:", e);
    return [];
  }
}

const BRANDS = ["BCA", "BRI", "DANA", "OVO", "Tokopedia", "WhatsApp", "Shopee", "Gojek"];

function resolveBrands(threats: ThreatItem[]) {
  threats.forEach(t => {
    if (!t.target_brand && t.domain) {
      const domLower = t.domain.toLowerCase();
      const matched = BRANDS.find(b => domLower.includes(b.toLowerCase()));
      if (matched) {
        t.target_brand = matched;
        t.country = "ID";
        t.region = "Jakarta";
      }
    }
  });
}

export async function GET() {
  const now = Date.now();

  if (globalCache && now - globalCache.lastFetched < CACHE_TTL) {
    return NextResponse.json({
      success: true,
      data: globalCache.threats,
      insights: buildInsights(globalCache.threats)
    }, {
      headers: { "Cache-Control": "public, s-maxage=10, stale-while-revalidate=30" }
    });
  }

  console.log("[Threats API] Cache expired. Fetching all threat sources...");

  const [abuseCh, vtThreats, urlscanThreats] = await Promise.allSettled([
    fetchRecentAbuseCh(),
    fetchVirusTotalIndonesia(),
    fetchUrlScanIndonesia(),
  ]);

  let allThreats: ThreatItem[] = [];

  if (abuseCh.status === "fulfilled") allThreats.push(...abuseCh.value);
  else console.warn("Abuse.ch fetch failed:", abuseCh.reason);

  if (vtThreats.status === "fulfilled") allThreats.push(...vtThreats.value);
  else console.warn("VirusTotal fetch failed:", vtThreats.reason);

  if (urlscanThreats.status === "fulfilled") allThreats.push(...urlscanThreats.value);
  else console.warn("URLScan.io fetch failed:", urlscanThreats.reason);

  const unique = new Map<string, ThreatItem>();
  allThreats.forEach(t => {
    const key = t.domain || t.url || t.id;
    if (!unique.has(key)) unique.set(key, t);
  });
  allThreats = Array.from(unique.values());

  resolveBrands(allThreats);

  const abuseChThreats = allThreats.filter(t => t.source === "Abuse.ch URLhaus");
  const nonAbuseThreats = allThreats.filter(t => t.source !== "Abuse.ch URLhaus");

  if (abuseChThreats.length > 0) {
    await Promise.allSettled([
      enrichWithUrlScan(abuseChThreats),
      enrichWithGoogleSafeBrowsing(abuseChThreats),
    ]);
  }

  const combinedThreats = [...nonAbuseThreats, ...abuseChThreats];

  combinedThreats.sort((a, b) => new Date(b.timestamp).getTime() - new Date(a.timestamp).getTime());

  globalCache = {
    threats: combinedThreats,
    lastFetched: now
  };

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

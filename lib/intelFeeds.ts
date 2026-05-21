import crypto from "crypto";

export type IntelItem = {
  id: string;
  title: string;
  source: string;
  link: string;
  publishedAt: string;

  // AI structured (or fallback enriched)
  type: "PHISHING" | "MALWARE" | "SCAM" | "HOAX";
  vector: "LINK" | "APK" | "QRIS" | "SOCIAL_ENGINEERING";
  target?: string;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  summary: string;
  source_type: "REAL" | "SIMULATED";
};

export type IntelInsights = {
  total: number;
  topTypes: { type: string; count: number }[];
  topVectors: { vector: string; count: number }[];
};

export type SituationalReport = {
  headline: string;
  summary: string;
  key_trends: string[];
  attack_vectors: string[];
  risk_assessment: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  recommended_actions: string[];
};

// ----------------------------
// 📰 RSS PARSER (CDATA friendly)
// ----------------------------
export function parseRss(xml: string, limit = 8): { title: string; link: string; date: string }[] {
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

export async function fetchRSS(url: string): Promise<{ title: string; link: string; date: string }[]> {
  try {
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) VERIX RSS Feed Fetcher" }
    });
    if (!res.ok) throw new Error(`RSS fetch returned status ${res.status}`);
    const text = await res.text();
    return parseRss(text, 10);
  } catch (e) {
    console.error(`[RSS Fetcher] Failed for ${url}:`, e);
    return [];
  }
}

// ----------------------------
// 🧠 SMART DEDUP SYSTEM
// ----------------------------
export function normalizeTitle(title: string): string {
  return title
    .toLowerCase()
    .replace(/bank central asia|klikbca|klik bca/g, "bca")
    .replace(/bank rakyat indonesia|brimo|bri mo/g, "bri")
    .replace(/bank negara indonesia/g, "bni")
    .replace(/penipuan|scam|phishing|hoax/g, "phishing")
    .replace(/undangan pernikahan|undangan nikah/g, "undangan nikah")
    .replace(/tilang elektronik|tilang etle|surat tilang/g, "tilang etle")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export function deduplicate(items: any[]): any[] {
  const seen = new Set<string>();
  return items.filter(item => {
    const normalized = normalizeTitle(item.title);
    const key = crypto.createHash("sha256").update(normalized.slice(0, 80)).digest("hex");
    if (seen.has(key)) return false;
    seen.add(key);
    return true;
  });
}

// ----------------------------
// 🛡️ OFFLINE DETERMINISTIC FALLBACKS
// ----------------------------
export function fallbackExtract(title: string): Omit<IntelItem, "id" | "title" | "source" | "link" | "publishedAt" | "source_type"> {
  const lower = title.toLowerCase();
  
  let type: IntelItem["type"] = "SCAM";
  let vector: IntelItem["vector"] = "SOCIAL_ENGINEERING";
  let target = "General Public";
  let severity: IntelItem["severity"] = "MEDIUM";
  let summary = `Terdeteksi indikasi ancaman digital: "${title}". Harap tingkatkan kewaspadaan terhadap modus ini.`;

  // Type & Vector
  if (lower.includes("apk") || lower.includes("unduh aplikasi") || lower.includes(".apk")) {
    type = "MALWARE";
    vector = "APK";
    severity = "CRITICAL";
    summary = `Penyebaran file aplikasi berbahaya (.APK) terdeteksi. Modus ini mengelabui korban agar mengunduh aplikasi di luar store resmi untuk mencuri SMS OTP.`;
  } else if (lower.includes("link") || lower.includes("situs") || lower.includes("tautan") || lower.includes("web") || lower.includes("url")) {
    type = "PHISHING";
    vector = "LINK";
    severity = "HIGH";
    summary = `Link phishing palsu terdeteksi meniru domain resmi untuk memanen data pribadi, sandi, atau PIN transaksi korban.`;
  } else if (lower.includes("qris") || lower.includes("barcode") || lower.includes("qr code")) {
    type = "SCAM";
    vector = "QRIS";
    severity = "HIGH";
    summary = `Modus stiker QRIS palsu menargetkan merchant atau tempat umum untuk mengalihkan pembayaran ke rekening pelaku.`;
  } else if (lower.includes("hoax") || lower.includes("hoaks") || lower.includes("kabar bohong")) {
    type = "HOAX";
    vector = "SOCIAL_ENGINEERING";
    severity = "LOW";
    summary = `Informasi bohong (hoax) beredar masif di media sosial bertujuan menyebarkan disinformasi atau kepanikan di masyarakat.`;
  }

  // Target
  if (lower.includes("bca")) target = "BCA";
  else if (lower.includes("bri")) target = "BRI";
  else if (lower.includes("bni")) target = "BNI";
  else if (lower.includes("dana")) target = "DANA";
  else if (lower.includes("ovo")) target = "OVO";
  else if (lower.includes("whatsapp") || lower.includes(" wa ")) target = "WhatsApp";
  else if (lower.includes("tokopedia")) target = "Tokopedia";
  else if (lower.includes("shopee")) target = "Shopee";
  else if (lower.includes("gojek")) target = "Gojek";
  else if (lower.includes("bpjs")) target = "BPJS Kesehatan";

  return { type, vector, target, severity, summary };
}

export function buildDeterministicReport(items: IntelItem[]): SituationalReport {
  const total = items.length;
  
  // Calculate breakdown for trends
  const typeCounts: Record<string, number> = {};
  const vectorCounts: Record<string, number> = {};
  const targetCounts: Record<string, number> = {};
  
  items.forEach(item => {
    typeCounts[item.type] = (typeCounts[item.type] || 0) + 1;
    vectorCounts[item.vector] = (vectorCounts[item.vector] || 0) + 1;
    if (item.target) {
      targetCounts[item.target] = (targetCounts[item.target] || 0) + 1;
    }
  });

  const topType = Object.keys(typeCounts).reduce((a, b) => typeCounts[a] > typeCounts[b] ? a : b, "PHISHING");
  const topVector = Object.keys(vectorCounts).reduce((a, b) => vectorCounts[a] > vectorCounts[b] ? a : b, "LINK");
  const topTarget = Object.keys(targetCounts).reduce((a, b) => targetCounts[a] > targetCounts[b] ? a : b, "Nasabah Bank & e-Wallet");

  const keyTrends = [
    `Peningkatan aktivitas serangan siber berbasis ${topType} menargetkan pengguna di Indonesia.`,
    `Taktik utama menggunakan distribusi ${topVector} yang disebarkan melalui pesan berantai.`,
    `Merek populer seperti ${topTarget} menjadi target pemalsuan identitas (brand impersonation).`
  ];

  const recommendedActions = [
    "Selalu periksa ulang alamat URL situs web sebelum memasukkan kredensial login atau OTP.",
    "Jangan mengunduh atau menginstal file berformat .APK dari pesan instan tidak dikenal.",
    "Lakukan verifikasi stiker QRIS resmi di kasir sebelum menyelesaikan transaksi scan.",
    "Aktifkan fitur otentikasi dua faktor (2FA) di akun media sosial dan dompet digital."
  ];

  return {
    headline: `Laporan Ancaman Terkini: Dominasi Kampanye ${topType}`,
    summary: `Berdasarkan agregasi ${total} feed berita keamanan siber nasional terverifikasi, terjadi pergeseran tren di mana penyerang memanfaatkan taktik ${topVector} untuk mengelabui korban. Merek ${topTarget} terpantau mengalami intensitas impersonasi paling tinggi.`,
    key_trends: keyTrends,
    attack_vectors: Object.keys(vectorCounts),
    risk_assessment: total > 5 ? "HIGH" : total > 2 ? "MEDIUM" : "LOW",
    recommended_actions: recommendedActions
  };
}

// ----------------------------
// 📊 INSIGHTS
// ----------------------------
export function buildInsights(data: IntelItem[]): IntelInsights {
  const typeCount: Record<string, number> = {};
  const vectorCount: Record<string, number> = {};

  data.forEach(d => {
    typeCount[d.type] = (typeCount[d.type] || 0) + 1;
    vectorCount[d.vector] = (vectorCount[d.vector] || 0) + 1;
  });

  return {
    total: data.length,
    topTypes: Object.entries(typeCount).map(([type, count]) => ({ type, count })).sort((a,b) => b.count - a.count),
    topVectors: Object.entries(vectorCount).map(([vector, count]) => ({ vector, count })).sort((a,b) => b.count - a.count)
  };
}

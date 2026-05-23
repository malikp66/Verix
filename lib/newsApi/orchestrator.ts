import crypto from "crypto";
import { cacheGet, cacheSet } from "@/lib/redis";
import { NewsArticle } from "./types";
import { fetchGNews } from "./gnews";
import { fetchNewsApiOrg } from "./newsapi-org";
import { fetchEventRegistry } from "./eventregistry";
import { scoreArticle } from "./scoring";

const CACHE_KEY = "news_api:articles";
const CACHE_TTL_SECONDS = 24 * 3600; // 24 hours

type CacheData = {
  fetchedAt: string;
  articles: NewsArticle[];
};

async function getCached(): Promise<CacheData | null> {
  try {
    const parsed = await cacheGet<CacheData>(CACHE_KEY);
    if (parsed) {
      const age = Date.now() - new Date(parsed.fetchedAt).getTime();
      const ageHours = Math.round(age / 3600000);
      if (age < CACHE_TTL_SECONDS * 1000) {
        console.log(`[News API Cache] HIT — ${ageHours}h old, ${parsed.articles.length} articles`);
        return parsed;
      }
      console.log(`[News API Cache] STALE — ${ageHours}h old, refetching...`);
    }
    return null;
  } catch (e) {
    console.warn("[News API Cache] Read error:", e);
    return null;
  }
}

async function saveCache(articles: NewsArticle[]): Promise<void> {
  const data: CacheData = { fetchedAt: new Date().toISOString(), articles };
  await cacheSet(CACHE_KEY, data, CACHE_TTL_SECONDS);
  console.log(`[News API Cache] Saved ${articles.length} articles for 24h`);
}

// --- Levenshtein similarity ---
function levenshtein(a: string, b: string): number {
  const m = a.length, n = b.length;
  const dp: number[][] = Array.from({ length: m + 1 }, () => Array(n + 1).fill(0));
  for (let i = 0; i <= m; i++) dp[i][0] = i;
  for (let j = 0; j <= n; j++) dp[0][j] = j;
  for (let i = 1; i <= m; i++) {
    for (let j = 1; j <= n; j++) {
      dp[i][j] = a[i - 1] === b[j - 1]
        ? dp[i - 1][j - 1]
        : 1 + Math.min(dp[i - 1][j], dp[i][j - 1], dp[i - 1][j - 1]);
    }
  }
  return dp[m][n];
}

function similarity(a: string, b: string): number {
  const dist = levenshtein(a, b);
  const maxLen = Math.max(a.length, b.length);
  return maxLen === 0 ? 100 : ((maxLen - dist) / maxLen) * 100;
}

export function normalizeText(title: string): string {
  return title
    .toLowerCase()
    .replace(/bank central asia|klikbca|klik bca/g, "bca")
    .replace(/bank rakyat indonesia|brimo|bri mo/g, "bri")
    .replace(/bank negara indonesia/g, "bni")
    .replace(/penipuan|scam|phishing|hoax/g, "phishing")
    .replace(/[^a-z0-9 ]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

/**
 * Deduplicate an array of items that have a `title` property.
 * SHA-256 exact match + 85% Levenshtein similarity.
 */
export function dedupByTitle(items: { title: string }[]): { title: string }[] {
  const exactSeen = new Set<string>();
  const kept: { title: string }[] = [];

  for (const item of items) {
    const normalized = normalizeText(item.title);
    const hash = crypto.createHash("sha256").update(normalized.slice(0, 80)).digest("hex");

    if (exactSeen.has(hash)) continue;
    exactSeen.add(hash);

    let isDuplicate = false;
    for (const existing of kept) {
      const sim = similarity(normalized, normalizeText(existing.title));
      if (sim >= 85) {
        isDuplicate = true;
        break;
      }
    }
    if (isDuplicate) continue;

    kept.push(item);
  }

  return kept;
}

// --- Enhanced dedup: SHA-256 + 85% similarity ---
function enhancedDeduplicate(articles: NewsArticle[]): NewsArticle[] {
  const exactSeen = new Set<string>();
  const kept: NewsArticle[] = [];

  for (const article of articles) {
    const normalized = normalizeText(article.title);
    const hash = crypto.createHash("sha256").update(normalized.slice(0, 80)).digest("hex");

    // Stage 1: exact SHA-256 dedup
    if (exactSeen.has(hash)) continue;
    exactSeen.add(hash);

    // Stage 2: 85% similarity check against all kept articles
    let isDuplicate = false;
    for (const existing of kept) {
      const sim = similarity(normalized, normalizeText(existing.title));
      if (sim >= 85) {
        isDuplicate = true;
        break;
      }
    }
    if (isDuplicate) continue;

    kept.push(article);
  }

  return kept;
}

export type NormalizedItem = {
  title: string;
  link: string;
  date: string;
  source: string;
  description: string;
  risk_score: number;
  severity: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
};

/**
 * Fetch from all 3 news APIs, deduplicate, score, and normalize.
 * Results are cached for 24 hours server-side.
 * Returns normalized items compatible with the existing RSS pipeline.
 */
export async function fetchAllSources(): Promise<NormalizedItem[]> {
  // 1. Check 24h cache
  const cached = await getCached();
  if (cached) {
    return cached.articles.map(a => normalizeAndScore(a));
  }

  // 2. Fetch all 3 APIs in parallel
  console.log("[News API] Fetching all sources (24h cache expired)...");
  const [gnews, newsapi, eventreg] = await Promise.allSettled([
    fetchGNews(),
    fetchNewsApiOrg(),
    fetchEventRegistry(),
  ]);

  const allArticles: NewsArticle[] = [];

  if (gnews.status === "fulfilled") {
    console.log(`[News API] GNews: ${gnews.value.length} articles`);
    allArticles.push(...gnews.value);
  } else {
    console.warn("[News API] GNews failed:", gnews.reason);
  }

  if (newsapi.status === "fulfilled") {
    console.log(`[News API] NewsAPI.org: ${newsapi.value.length} articles`);
    allArticles.push(...newsapi.value);
  } else {
    console.warn("[News API] NewsAPI.org failed:", newsapi.reason);
  }

  if (eventreg.status === "fulfilled") {
    console.log(`[News API] EventRegistry: ${eventreg.value.length} articles`);
    allArticles.push(...eventreg.value);
  } else {
    console.warn("[News API] EventRegistry failed:", eventreg.reason);
  }

  if (allArticles.length === 0) {
    console.warn("[News API] No articles fetched from any source.");
    return [];
  }

  // 3. Enhanced dedup
  const deduped = enhancedDeduplicate(allArticles);
  console.log(`[News API] ${allArticles.length} raw → ${deduped.length} after dedup`);

  // 4. Cache for 24h
  await saveCache(deduped);

  // 5. Score and normalize
  return deduped.map(a => normalizeAndScore(a));
}

function normalizeAndScore(article: NewsArticle): NormalizedItem {
  const { risk_score, severity } = scoreArticle(article.title, article.description, article.content);

  return {
    title: article.title,
    link: article.sourceUrl,
    date: article.publishedAt,
    source: article.source,
    description: article.description,
    risk_score,
    severity,
  };
}

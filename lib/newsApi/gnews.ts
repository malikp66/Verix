import { NewsArticle, PRIMARY_QUERY } from "./types";

export async function fetchGNews(): Promise<NewsArticle[]> {
  const apiKey = process.env.GNEWS_API_KEY;
  if (!apiKey) {
    console.warn("[GNews] No API key found, skipping.");
    return [];
  }

  const url = `https://gnews.io/api/v4/search?q=${encodeURIComponent(PRIMARY_QUERY)}&lang=id&country=id&max=20&sortby=publishedAt&apikey=${apiKey}`;

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        headers: { "Accept": "application/json" },
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        console.warn(`[GNews] Attempt ${attempt}/3 failed: HTTP ${res.status}`);
        if (attempt === 3) break;
        await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }

      const data = await res.json();
      const articles = data.articles || [];

      return articles.map((a: any) => ({
        title: a.title || "",
        description: a.description || "",
        source: a.source?.name || "GNews",
        sourceUrl: a.url || "",
        publishedAt: a.publishedAt || new Date().toISOString(),
        content: a.content || a.description || "",
      }));
    } catch (e: any) {
      console.warn(`[GNews] Attempt ${attempt}/3 error:`, e?.message || e);
      if (attempt === 3) break;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  return [];
}

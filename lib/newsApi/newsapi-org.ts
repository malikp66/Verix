import { NewsArticle, PRIMARY_QUERY } from "./types";

export async function fetchNewsApiOrg(): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWSAPIORG;
  if (!apiKey) {
    console.warn("[NewsAPI.org] No API key found, skipping.");
    return [];
  }

  const indonesianSources = "kompas.com,detik.com,tribunnews.com,republika.co.id,tempo.co,sindonews.com,liputan6.com,merdeka.com,okezone.com,suara.com,bisnis.com,kontan.co.id,cnbcindonesia.com,cnnindonesia.com,jawapos.com,antaranews.com,mediaindonesia.com,beritasatu.com,viva.co.id";
  const url = `https://newsapi.org/v2/everything?q=${encodeURIComponent(PRIMARY_QUERY)}&sortBy=publishedAt&pageSize=20&language=id&domains=${indonesianSources}&apiKey=${apiKey}`;

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
        console.warn(`[NewsAPI.org] Attempt ${attempt}/3 failed: HTTP ${res.status}`);
        if (attempt === 3) break;
        await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }

      const data = await res.json();
      const articles = data.articles || [];

      return articles.map((a: any) => ({
        title: a.title || "",
        description: a.description || "",
        source: a.source?.name || "NewsAPI.org",
        sourceUrl: a.url || "",
        publishedAt: a.publishedAt || new Date().toISOString(),
        content: a.content || a.description || "",
      }));
    } catch (e: any) {
      console.warn(`[NewsAPI.org] Attempt ${attempt}/3 error:`, e?.message || e);
      if (attempt === 3) break;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  return [];
}

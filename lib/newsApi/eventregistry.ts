import { NewsArticle, PRIMARY_QUERY } from "./types";

export async function fetchEventRegistry(): Promise<NewsArticle[]> {
  const apiKey = process.env.NEWSAPIAI;
  if (!apiKey) {
    console.warn("[EventRegistry] No API key found, skipping.");
    return [];
  }

  const url = "https://newsapi.ai/api/v1/article/getArticles";
  const body = {
    action: "getArticles",
    keyword: PRIMARY_QUERY,
    articlesPage: 1,
    articlesCount: 50,
    articlesSortBy: "date",
    articlesSortByAsc: false,
    dataType: ["news", "blog"],
    forceMaxDataTimeWindow: "7",
    resultType: "articles",
    lang: "ind",
    sourceLocationUri: "http://en.wikipedia.org/wiki/Indonesia",
    apiKey,
  };

  for (let attempt = 1; attempt <= 3; attempt++) {
    try {
      const controller = new AbortController();
      const timeout = setTimeout(() => controller.abort(), 8000);

      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        signal: controller.signal,
      });
      clearTimeout(timeout);

      if (!res.ok) {
        console.warn(`[EventRegistry] Attempt ${attempt}/3 failed: HTTP ${res.status}`);
        if (attempt === 3) break;
        await new Promise(r => setTimeout(r, 1000 * attempt));
        continue;
      }

      const data = await res.json();
      const articles = data?.articles?.results || data?.articles || [];

      return articles.map((a: any) => ({
        title: a.title || a.titleTranslated || "",
        description: a.body || a.description || "",
        source: a.source?.title || a.source?.name || "EventRegistry",
        sourceUrl: a.url || a.sourceUrl || "",
        publishedAt: a.date || a.publishedAt || new Date().toISOString(),
        content: a.body || a.description || "",
      }));
    } catch (e: any) {
      console.warn(`[EventRegistry] Attempt ${attempt}/3 error:`, e?.message || e);
      if (attempt === 3) break;
      await new Promise(r => setTimeout(r, 1000 * attempt));
    }
  }

  return [];
}

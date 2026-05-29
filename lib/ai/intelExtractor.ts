import { GoogleGenAI, Type, Schema } from "@google/genai";

const OPENROUTER_MODELS = [
  "deepseek/deepseek-chat"
];

const DEEPSEEK_TIMEOUT_MS = 30_000;

// Definition of schema using standard Schema type from @google/genai
const INTEL_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    enriched: {
      type: Type.ARRAY,
      description: "Must contain exactly the same number of items as the input, preserving array order. Do NOT skip or merge items.",
      items: {
        type: Type.OBJECT,
        properties: {
          title: { type: Type.STRING, description: "The original title of the news item." },
          type: { type: Type.STRING, description: "One of: PHISHING, MALWARE, SCAM, HOAX, DEEPFAKE, QRIS_FRAUD." },
          vector: { type: Type.STRING, description: "One of: WhatsApp, SMS, APK, Website, Social Media." },
          target: { type: Type.STRING, description: "Target brand or audience, e.g. BCA, BRI, DANA, Tokopedia, WhatsApp, Shopee, Nasabah Bank." },
          region: { type: Type.STRING, description: "Geographic region: Jakarta, Indonesia, Global, or specific city." },
          severity: { type: Type.STRING, description: "One of: LOW, MEDIUM, HIGH, CRITICAL." },
          summary: { type: Type.STRING, description: "A concise 1-2 sentence description in Indonesian of the scam/phishing tactic." },
          confidence: { type: Type.NUMBER, description: "Confidence score 0-100 based on evidence strength." },
          published_at: { type: Type.STRING, description: "ISO date string of when the article was published." },
          source: { type: Type.STRING, description: "Source name of the article, e.g. GNews, Antara, Kompas." }
        },
        required: ["title", "type", "vector", "target", "region", "severity", "summary", "confidence", "published_at", "source"]
      }
    },
    report: {
      type: Type.OBJECT,
      properties: {
        headline: { type: Type.STRING, description: "A professional security situational report headline in Indonesian." },
        summary: { type: Type.STRING, description: "A detailed summary paragraph of the active cyber threat landscape in Indonesia." },
        key_trends: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Exactly 3 bullet points detailing key trends or clusters of attacks in Indonesian."
        },
        attack_vectors: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "The primary attack vectors active, e.g. WhatsApp, SMS, APK, Website, QRIS."
        },
        risk_assessment: { type: Type.STRING, description: "One of: LOW, MEDIUM, HIGH, CRITICAL." },
        recommended_actions: {
          type: Type.ARRAY,
          items: { type: Type.STRING },
          description: "Exactly 4 recommended actions in Indonesian for users/institutions."
        }
      },
      required: ["headline", "summary", "key_trends", "attack_vectors", "risk_assessment", "recommended_actions"]
    }
  },
  required: ["enriched", "report"]
};

function repairJSON(raw: string): string | null {
  let cleaned = raw.trim()
    .replace(/^```(?:json)?\s*\n?/gm, '')
    .replace(/\n?```$/gm, '')
    .trim();

  try { JSON.parse(cleaned); return cleaned; } catch {}

  let inString = false, escaped = false;
  let lastSignificant = "";
  const closeStack: string[] = [];
  let rootCloseIdx = -1;
  for (let i = 0; i < cleaned.length; i++) {
    const ch = cleaned[i];
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') { closeStack.push('}'); lastSignificant = "{"; }
    else if (ch === '}') { closeStack.pop(); lastSignificant = "}"; if (closeStack.length === 0) rootCloseIdx = i; }
    else if (ch === '[') { closeStack.push(']'); lastSignificant = "["; }
    else if (ch === ']') { closeStack.pop(); lastSignificant = "]"; }
    else if (ch === ':') { lastSignificant = ":"; }
    else if (ch === ',') { lastSignificant = ","; }
  }

  // If JSON is fully balanced but has trailing text, truncate at root-level }
  if (closeStack.length === 0 && rootCloseIdx > 0 && rootCloseIdx < cleaned.length - 1) {
    const truncated = cleaned.slice(0, rootCloseIdx + 1);
    try { JSON.parse(truncated); return truncated; } catch {}
  }

  let repaired = cleaned;
  if (inString) {
    repaired = repaired.replace(/\\[uU][0-9a-fA-F]{0,3}$/, '');
    repaired = repaired.replace(/\\$/, '');
    repaired += '"';
  } else if (lastSignificant === ":" || lastSignificant === "," || lastSignificant === "{" || lastSignificant === "[") {
    repaired += '""';
  }
  while (closeStack.length > 0) {
    repaired += closeStack.pop();
  }

  try { JSON.parse(repaired); return repaired; } catch { return null; }
}

function stripToFirstJson(raw: string): string {
  const firstBrace = raw.indexOf('{');
  if (firstBrace === -1) return raw;
  return raw.slice(firstBrace);
}

function safeParseAndValidate(rawContent: string, expectedLength: number) {
  const cleaned = rawContent
    .replace(/^```(?:json)?\s*\n?/gm, '')
    .replace(/\n?```$/gm, '')
    .trim();

  // Strip anything before first { and after last }
  const stripped = stripToFirstJson(cleaned);

  let parsed: any = null;
  try {
    parsed = JSON.parse(stripped);
  } catch (e) {
    console.warn("[AI Layer] JSON Parse failed, attempting repair:", e);
    console.log("[AI Layer] Raw response (first 300 chars):", stripped.slice(0, 300));
    const repaired = repairJSON(stripped);
    if (repaired) {
      try {
        parsed = JSON.parse(repaired);
        console.log("[AI Layer] JSON repaired successfully.");
      } catch {
        console.error("[AI Layer] JSON repair still invalid, trying last-brace truncation...");
      }
    } else {
      console.warn("[AI Layer] JSON repair returned null, trying last-brace truncation...");
    }
    // Last-resort safety net: truncate to the last complete '}' 
    if (!parsed) {
      const lastBrace = stripped.lastIndexOf('}');
      if (lastBrace > 0) {
        try {
          parsed = JSON.parse(stripped.slice(0, lastBrace + 1));
          console.log("[AI Layer] Recovered via last-brace truncation.");
        } catch {
          console.error("[AI Layer] Last-brace truncation also failed.");
          return null;
        }
      } else {
        return null;
      }
    }
  }

  if (!parsed?.enriched || !Array.isArray(parsed.enriched)) {
    console.warn("[AI Layer] Missing 'enriched' array  returning null.");
    return null;
  }
  if (!parsed?.report || typeof parsed.report !== 'object') {
    console.warn("[AI Layer] Missing 'report' object  returning null.");
    return null;
  }

  return parsed;
}

export async function extractIntelAndReport(
  items: { title: string; link: string; date: string }[]
): Promise<any | null> {
  if (items.length === 0) return null;

  const prompt = `You are a professional cyber threat intelligence analyst specializing in the Indonesian threat landscape.

Aggregated Raw News Articles:
${items.map((item, idx) => `[Item ${idx}]
Title: ${item.title}
Published: ${item.date}
Link: ${item.link}`).join('\n\n')}

Analyze all the news items above.
1. For EACH news item (item 0 to ${items.length - 1}), extract its type, vector, target brand, region, severity, confidence, summary, published_at, and source.
2. Formulate a unified situational cyber threat report for Indonesia based on the aggregated intelligence.

STRICT INSTRUCTIONS:
- You MUST return a single JSON object matching the defined schema structure.
- The 'enriched' array length MUST be exactly ${items.length}. Do NOT drop, skip, or group items together. Return items in the SAME ORDER as the input.
- For each enriched item, include the original title exactly as provided.
- confidence: 0-100 based on how many sources confirm or evidence strength.
- Output MUST be valid JSON, containing no comments or extra conversational text.`;

  // 1. Try Native Gemini SDK first (free tier, lowest cost)
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      console.log(`[AI Layer] Attempting extraction with Native Gemini SDK (free)`);
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [prompt],
        config: {
          responseMimeType: "application/json",
          responseSchema: INTEL_SCHEMA,
          temperature: 0.1,
          topP: 0.1,
          maxOutputTokens: 8192,
        }
      });

      const rawContent = response.text || "{}";
      console.log("[AI Layer] Gemini raw response (first 200 chars):", rawContent.slice(0, 200));
      const result = safeParseAndValidate(rawContent, items.length);
      if (result) {
        console.log(`[AI Layer] Successfully extracted intel using Native Gemini SDK (free)`);
        return result;
      }
      console.warn(`[AI Layer] Gemini returned null despite SDK success, continuing to fallback.`);
    } catch (e) {
      console.warn("[AI Layer] Native Gemini SDK failed, falling back to OpenRouter:", e);
    }
  }

  // 2. Fallback to OpenRouter Multi-Model Chain
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    const enrichedPrompt = `${prompt}\n\nIMPORTANT: Return ONLY valid JSON matching this structure:\n${JSON.stringify(INTEL_SCHEMA, null, 2)}`;
    
    for (const model of OPENROUTER_MODELS) {
      try {
        console.log(`[AI Layer] Attempting extraction with OpenRouter model: ${model}`);
        const controller = model === "deepseek/deepseek-chat" ? new AbortController() : undefined;
        const timer = controller ? setTimeout(() => controller.abort(), DEEPSEEK_TIMEOUT_MS) : undefined;
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
            "X-Title": "VERIX-Threat-Intel",
          },
          signal: controller?.signal,
          body: JSON.stringify({
            model: model,
            route: "fallback",
            messages: [{ role: "user", content: enrichedPrompt }],
            temperature: 0.1,
            top_p: 0.1,
            max_tokens: 8192,
            response_format: { type: "json_object" }
          }),
        });
        if (timer) clearTimeout(timer);

        if (!res.ok) {
          console.warn(`[OpenRouter] Model ${model} returned status: ${res.status}`);
          continue;
        }

        const data = await res.json();
        const rawContent = data.choices?.[0]?.message?.content || "{}";
        const result = safeParseAndValidate(rawContent, items.length);
        if (result) {
          console.log(`[AI Layer] Successfully extracted intel using OpenRouter model: ${model}`);
          return result;
        }
        console.warn(`[OpenRouter] Model ${model} returned null, trying next model.`);
      } catch (e) {
        console.warn(`[OpenRouter] Error using model ${model}:`, e);
        continue;
      }
    }
  }

  console.warn("[AI Layer] All AI providers failed. Falling back to offline extraction.");
  return null;
}

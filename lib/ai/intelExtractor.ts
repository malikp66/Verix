import { GoogleGenAI, Type, Schema } from "@google/genai";

const OPENROUTER_MODELS = [
  "google/gemini-2.5-flash",
  "deepseek/deepseek-chat"
];

// Definition of schema using standard Schema type from @google/genai
const INTEL_SCHEMA: Schema = {
  type: Type.OBJECT,
  properties: {
    enriched: {
      type: Type.ARRAY,
      description: "Must contain exactly the same number of items as the input, keeping the indices matched. Do NOT skip or merge items.",
      items: {
        type: Type.OBJECT,
        properties: {
          index: { type: Type.NUMBER, description: "The 0-based index of the input news item." },
          type: { type: Type.STRING, description: "One of: PHISHING, MALWARE, SCAM, HOAX." },
          vector: { type: Type.STRING, description: "One of: LINK, APK, QRIS, SOCIAL_ENGINEERING." },
          target: { type: Type.STRING, description: "Target brand or audience, e.g. BCA, BRI, DANA, Tokopedia, WhatsApp, Shopee, Nasabah Bank." },
          severity: { type: Type.STRING, description: "One of: LOW, MEDIUM, HIGH, CRITICAL." },
          summary: { type: Type.STRING, description: "A concise 1-2 sentence description in Indonesian of the scam/phishing tactic." }
        },
        required: ["index", "type", "vector", "target", "severity", "summary"]
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
          description: "The primary attack vectors active, e.g. LINK, APK, QRIS, SOCIAL_ENGINEERING."
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
  const cleaned = raw.trim()
    .replace(/^```(?:json)?\s*\n?/gm, '')
    .replace(/\n?```$/gm, '')
    .trim();

  try { JSON.parse(cleaned); return cleaned; } catch {}

  let openBraces = 0, openBrackets = 0, inString = false, escaped = false;
  for (const ch of cleaned) {
    if (escaped) { escaped = false; continue; }
    if (ch === '\\' && inString) { escaped = true; continue; }
    if (ch === '"') { inString = !inString; continue; }
    if (inString) continue;
    if (ch === '{') openBraces++;
    else if (ch === '}') openBraces--;
    else if (ch === '[') openBrackets++;
    else if (ch === ']') openBrackets--;
  }

  let repaired = cleaned;
  if (inString) repaired += '"';
  while (openBraces > 0) { repaired += '}'; openBraces--; }
  while (openBrackets > 0) { repaired += ']'; openBrackets--; }

  try { JSON.parse(repaired); return repaired; } catch { return null; }
}

function safeParseAndValidate(rawContent: string, expectedLength: number) {
  const cleaned = rawContent
    .replace(/^```(?:json)?\s*\n?/gm, '')
    .replace(/\n?```$/gm, '')
    .trim();

  let parsed: any = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.warn("[AI Layer] JSON Parse failed, attempting repair:", e);
    const repaired = repairJSON(cleaned);
    if (repaired) {
      try {
        parsed = JSON.parse(repaired);
        console.log("[AI Layer] JSON repaired successfully.");
      } catch {
        console.error("[AI Layer] JSON repair failed.");
        return null;
      }
    } else {
      console.error("[AI Layer] JSON repair failed.");
      return null;
    }
  }

  if (!parsed?.enriched || !Array.isArray(parsed.enriched)) {
    console.warn("[AI Layer] Missing 'enriched' array — returning null.");
    return null;
  }
  if (!parsed?.report || typeof parsed.report !== 'object') {
    console.warn("[AI Layer] Missing 'report' object — returning null.");
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
1. For EACH news item (index 0 to ${items.length - 1}), extract its type, vector, target brand, severity, and Indonesian summary.
2. Formulate a unified situational cyber threat report for Indonesia based on the aggregated intelligence.

STRICT INSTRUCTIONS:
- You MUST return a single JSON object matching the defined schema structure.
- The 'enriched' array length MUST be exactly ${items.length}. Do NOT drop, skip, or group items together.
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
          maxOutputTokens: 1500,
        }
      });

      const rawContent = response.text || "{}";
      const result = safeParseAndValidate(rawContent, items.length);
      console.log(`[AI Layer] Successfully extracted intel using Native Gemini SDK (free)`);
      return result;
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
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
            "X-Title": "VERIX-Threat-Intel",
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: enrichedPrompt }],
            temperature: 0.1,
            top_p: 0.1,
            max_tokens: 1500,
            response_format: { type: "json_object" }
          }),
        });

        if (!res.ok) {
          console.warn(`[OpenRouter] Model ${model} returned status: ${res.status}`);
          continue;
        }

        const data = await res.json();
        const rawContent = data.choices?.[0]?.message?.content || "{}";
        const result = safeParseAndValidate(rawContent, items.length);
        console.log(`[AI Layer] Successfully extracted intel using OpenRouter model: ${model}`);
        return result;
      } catch (e) {
        console.warn(`[OpenRouter] Error using model ${model}:`, e);
        continue;
      }
    }
  }

  console.warn("[AI Layer] All AI providers failed. Falling back to offline extraction.");
  return null;
}

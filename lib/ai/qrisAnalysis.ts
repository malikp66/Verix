import { GoogleGenAI } from "@google/genai";

const OPENROUTER_MODELS = [
  "deepseek/deepseek-chat"
];

const DEEPSEEK_TIMEOUT_MS = 15_000;

type QrisAiInput = {
  merchant: string;
  acquirer: string;
  city: string;
  risk_score: number;
  verdict: string;
  flagLabels: string[];
  reportCount: number;
};

type QrisAiOutput = {
  behavioral_analysis: string;
  recommended_actions: string[];
};

function safeParseQris(raw: string, modelName: string): QrisAiOutput | null {
  const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();
  let parsed: any = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
    let openBraces = 0, inString = false, escaped = false;
    for (const ch of cleaned) {
      if (escaped) { escaped = false; continue; }
      if (ch === '\\' && inString) { escaped = true; continue; }
      if (ch === '"') { inString = !inString; continue; }
      if (inString) continue;
      if (ch === '{') openBraces++;
      else if (ch === '}') openBraces--;
    }
    let repaired = cleaned;
    if (inString) repaired += '"';
    while (openBraces > 0) { repaired += '}'; openBraces--; }
    try { parsed = JSON.parse(repaired); } catch { return null; }
  }
  if (!parsed?.behavioral_analysis) return null;
  return {
    behavioral_analysis: parsed.behavioral_analysis,
    recommended_actions: Array.isArray(parsed.recommended_actions) ? parsed.recommended_actions : [],
  };
}

function buildQrisPrompt(input: QrisAiInput): string {
  return `Anda adalah asisten keamanan siber spesialis analisis QRIS palsu untuk Indonesia.

Data QRIS yang dianalisis:
- Merchant: ${input.merchant}
- Acquirer: ${input.acquirer}
- Kota: ${input.city}
- Skor Risiko: ${input.risk_score}/100
- Verdict: ${input.verdict}
- Flag keamanan: ${input.flagLabels.join(', ') || 'Tidak ada'}
- Jumlah laporan pengguna: ${input.reportCount}

Tugas Anda: Berikan analisis perilaku dalam Bahasa Indonesia yang natural dan mudah dipahami.
Jelaskan mengapa QRIS ini berisiko (atau aman) berdasarkan flag yang ditemukan.
Berikan rekomendasi tindakan yang spesifik untuk situasi ini.

Output JSON:
{
  "behavioral_analysis": "string (1-2 paragraf analisis dalam Bahasa Indonesia)",
  "recommended_actions": ["string array tindakan yang relevan"]
}

HANYA output JSON, tanpa markdown atau teks lain.`;
}

export async function enrichQrisAnalysis(input: QrisAiInput): Promise<QrisAiOutput | null> {
  // 1. Try Native Gemini SDK first
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [buildQrisPrompt(input)],
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
          maxOutputTokens: 800,
        }
      });
      const raw = response.text || "{}";
      const result = safeParseQris(raw, "native/gemini-2.5-flash");
      if (result) {
        console.log(`[QRIS AI] Enrichment complete using Gemini.`);
        return result;
      }
    } catch (e) {
      console.warn("[QRIS AI] Gemini failed, trying OpenRouter:", e);
    }
  }

  // 2. OpenRouter fallback
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    const enrichedPrompt = `${buildQrisPrompt(input)}\n\nIMPORTANT: Return ONLY valid JSON.`;
    for (const model of OPENROUTER_MODELS) {
      try {
        const controller = model === "deepseek/deepseek-chat" ? new AbortController() : undefined;
        const timer = controller ? setTimeout(() => controller.abort(), DEEPSEEK_TIMEOUT_MS) : undefined;
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.APP_URL || "https://verix.id",
            "X-Title": "VERIX QRIS Analysis",
          },
          signal: controller?.signal,
          body: JSON.stringify({
            model,
            route: "fallback",
            messages: [{ role: "user", content: enrichedPrompt }],
            temperature: 0.3,
            max_tokens: 800,
            response_format: { type: "json_object" },
          }),
        });
        if (timer) clearTimeout(timer);
        if (!res.ok) continue;
        const data = await res.json();
        const raw = data.choices?.[0]?.message?.content || "{}";
        const result = safeParseQris(raw, `openrouter/${model}`);
        if (result) {
          console.log(`[QRIS AI] Enrichment complete using OpenRouter: ${model}`);
          return result;
        }
      } catch (e) {
        console.warn(`[QRIS AI] OpenRouter model ${model} failed:`, e);
      }
    }
  }

  console.warn("[QRIS AI] All providers failed, keeping deterministic results.");
  return null;
}

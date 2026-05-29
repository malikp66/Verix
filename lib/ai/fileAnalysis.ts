import { GoogleGenAI } from "@google/genai";

const OPENROUTER_MODELS = [
  "deepseek/deepseek-chat"
];

const DEEPSEEK_TIMEOUT_MS = 15_000;

type FileAiInput = {
  file_name: string;
  verdict: string;
  malicious: number;
  suspicious: number;
  total: number;
};

type FileAiOutput = {
  behavioral_analysis: string;
  recommended_actions: string[];
};

function safeParseFile(raw: string, modelName: string): FileAiOutput | null {
  const cleaned = raw.replace(/```json\n?|```\n?/g, "").trim();
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

function buildFilePrompt(input: FileAiInput): string {
  const threatLevel = input.malicious > 0 ? "BERBAHAYA" :
    input.suspicious > 0 ? "MENURIGAKAN" : "BERSIH";
  return `Anda adalah asisten keamanan siber spesialis analisis file APK berbahaya untuk Indonesia.

Data file yang dianalisis oleh VirusTotal:
- Nama file: ${input.file_name}
- Verdict: ${input.verdict}
- Terdeteksi berbahaya: ${input.malicious}/${input.total} engine
- Terdeteksi mencurigakan: ${input.suspicious}/${input.total} engine
- Status: ${threatLevel}

Tugas Anda: Berikan analisis perilaku dalam Bahasa Indonesia yang natural dan mudah dipahami oleh pengguna awam.
Jelaskan apa arti hasil VirusTotal ini dan risiko yang mungkin ditimbulkan.
Beri rekomendasi tindakan yang jelas.

Output JSON:
{
  "behavioral_analysis": "string (1-2 paragraf analisis dalam Bahasa Indonesia)",
  "recommended_actions": ["string array tindakan yang relevan"]
}

HANYA output JSON, tanpa markdown atau teks lain.`;
}

export async function enrichFileAnalysis(input: FileAiInput): Promise<FileAiOutput | null> {
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [buildFilePrompt(input)],
        config: {
          responseMimeType: "application/json",
          temperature: 0.3,
          maxOutputTokens: 800,
        }
      });
      const raw = response.text || "{}";
      const result = safeParseFile(raw, "native/gemini-2.5-flash");
      if (result) {
        console.log(`[File AI] Enrichment complete using Gemini.`);
        return result;
      }
    } catch (e) {
      console.warn("[File AI] Gemini failed, trying OpenRouter:", e);
    }
  }

  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    const enrichedPrompt = `${buildFilePrompt(input)}\n\nIMPORTANT: Return ONLY valid JSON.`;
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
            "X-Title": "VERIX File Analysis",
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
        const result = safeParseFile(raw, `openrouter/${model}`);
        if (result) {
          console.log(`[File AI] Enrichment complete using OpenRouter: ${model}`);
          return result;
        }
      } catch (e) {
        console.warn(`[File AI] OpenRouter model ${model} failed:`, e);
      }
    }
  }

  console.warn("[File AI] All providers failed, keeping deterministic results.");
  return null;
}

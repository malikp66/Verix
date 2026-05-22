import { GoogleGenAI } from "@google/genai";
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';

const OPENROUTER_MODELS = [
  "google/gemini-2.5-flash",
  "deepseek/deepseek-chat"
];

const SCAN_CACHE_PATH = path.join(process.cwd(), 'lib', 'scan_cache.json');

function getScanCache(): Record<string, any> {
  try {
    if (!fs.existsSync(SCAN_CACHE_PATH)) return {};
    return JSON.parse(fs.readFileSync(SCAN_CACHE_PATH, 'utf-8'));
  } catch {
    return {};
  }
}

function saveScanCache(cache: Record<string, any>): void {
  try {
    const dir = path.dirname(SCAN_CACHE_PATH);
    if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
    fs.writeFileSync(SCAN_CACHE_PATH, JSON.stringify(cache, null, 2), 'utf8');
  } catch (e) {
    console.warn('[Scan Cache] Failed to save:', e);
  }
}

function hashInput(text: string, schema: any): string {
  return crypto.createHash('sha256').update(text + JSON.stringify(schema)).digest('hex');
}

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

function safeParseAndMerge(rawContent: string, modelName: string) {
  const cleaned = rawContent.replace(/```json\n?|\n?```/g, "").trim();

  let parsed: any = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.warn(`[AI Layer] JSON Parse failed for ${modelName}, attempting repair:`, e);
    const repaired = repairJSON(cleaned);
    if (repaired) {
      try {
        parsed = JSON.parse(repaired);
        console.log(`[AI Layer] JSON repaired successfully for ${modelName}.`);
      } catch {
        console.error(`[AI Layer] JSON repair failed for ${modelName}.`);
      }
    }
  }

  const safeOutput = {
    summary: parsed?.summary ?? "Analisis ringkas tidak tersedia.",
    behavioral_analysis: parsed?.behavioral_analysis ?? "Detail analisis tidak tersedia.",
    red_flags: Array.isArray(parsed?.red_flags) ? parsed.red_flags : [],
    manipulation_tactics: Array.isArray(parsed?.manipulation_tactics) ? parsed.manipulation_tactics : [],
    technical_indicators: Array.isArray(parsed?.technical_indicators) ? parsed.technical_indicators : [],
    recommended_actions: Array.isArray(parsed?.recommended_actions) ? parsed.recommended_actions : [],
    similar_patterns: Array.isArray(parsed?.similar_patterns) ? parsed.similar_patterns : [],
    confidence_level: ["LOW", "MEDIUM", "HIGH"].includes(parsed?.confidence_level) ? parsed.confidence_level : "LOW"
  };

  return { ...safeOutput, _ai_model_used: modelName };
}

export async function generateAIExplanation(prompt: string, schemaDefinition: any) {
  // === SCAN CACHE CHECK ===
  const cacheKey = hashInput(prompt, schemaDefinition);
  const scanCache = getScanCache();
  if (scanCache[cacheKey]) {
    console.log(`[AI Layer] Scan cache HIT. Returning cached explanation.`);
    return { ...scanCache[cacheKey], _from_cache: true };
  }

  // 1. Try Native Gemini SDK first (free tier, lowest cost)
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [prompt],
        config: {
          responseMimeType: "application/json",
          responseSchema: schemaDefinition,
          temperature: 0,
          topP: 0.1,
          maxOutputTokens: 1500,
        }
      });

      const rawContent = response.text || "{}";
      const finalOutput = safeParseAndMerge(rawContent, "native/gemini-2.5-flash");

      console.log(`[AI Layer] Successfully used native Gemini SDK (free).`);
      scanCache[cacheKey] = finalOutput;
      saveScanCache(scanCache);
      return finalOutput;

    } catch (e) {
      console.warn("[AI Layer] Native Gemini SDK failed, falling back to OpenRouter:", e);
    }
  }

  // 2. Fallback to OpenRouter Multi-Model Chain
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  
  if (openRouterKey) {
    const enrichedPrompt = `${prompt}\n\nIMPORTANT: You MUST return ONLY valid JSON matching this exact structure, no markdown formatting or text outside the JSON:\n${JSON.stringify(schemaDefinition, null, 2)}`;
    
    for (const model of OPENROUTER_MODELS) {
      try {
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.APP_URL || "http://localhost:3000",
            "X-Title": "VERIX",
          },
          body: JSON.stringify({
            model: model,
            messages: [{ role: "user", content: enrichedPrompt }],
            temperature: 0,
            top_p: 0.1,
            max_tokens: 1500,
            response_format: { type: "json_object" }
          }),
        });

        if (!res.ok) {
          console.warn(`[OpenRouter] Model ${model} failed with status: ${res.status}`);
          continue;
        }

        const data = await res.json();
        const rawContent = data.choices[0]?.message?.content || "{}";
        const finalOutput = safeParseAndMerge(rawContent, `openrouter/${model}`);
        
        console.log(`[AI Layer] Successfully used OpenRouter model: ${model}`);
        scanCache[cacheKey] = finalOutput;
        saveScanCache(scanCache);
        return finalOutput;
        
      } catch (e) {
        console.warn(`[OpenRouter] Error using model ${model}:`, e);
        continue;
      }
    }
  }

  console.warn("[AI Layer] All AI providers failed. Returning safe defaults.");
  return {
    summary: "Analisis ringkas tidak tersedia.",
    behavioral_analysis: "Detail analisis tidak tersedia.",
    red_flags: [],
    manipulation_tactics: [],
    technical_indicators: [],
    recommended_actions: [
      "Jangan klik tautan yang mencurigakan.",
      "Verifikasi pengirim melalui channel resmi.",
      "Laporkan konten mencurigakan ke pihak berwenang."
    ],
    similar_patterns: [],
    confidence_level: "LOW" as const,
    _ai_model_used: "none (all providers failed)"
  };
}

import { GoogleGenAI } from "@google/genai";

export type ExifTrace = {
  hasMetadata: boolean;
  software?: string;
  editingTraces: string[];
  suspicious: boolean;
  make?: string;
  model?: string;
  gpsLat?: number;
  gpsLon?: number;
};

type DeepfakeResult = {
  deepfake_score: number;
  confidence_level: "LOW" | "MEDIUM" | "HIGH";
  face_detected: boolean;
  detected_artifacts: string[];
  behavioral_analysis: string;
  red_flags: string[];
  manipulation_tactics: string[];
  recommended_actions: string[];
  similar_patterns: string[];
  summary: string;
  _ai_model_used: string;
  exif?: ExifTrace;
};

const DEEPFAKE_DEFAULTS: DeepfakeResult = {
  deepfake_score: 0,
  confidence_level: "LOW",
  face_detected: false,
  detected_artifacts: [],
  behavioral_analysis: "Analisis deepfake tidak tersedia saat ini.",
  red_flags: [],
  manipulation_tactics: [],
  recommended_actions: [
    "Jangan sebarkan foto tersebut sebelum terverifikasi.",
    "Hubungi orang yang difoto melalui jalur resmi.",
    "Laporkan ke pihak berwenang jika terbukti deepfake."
  ],
  similar_patterns: [],
  summary: "Analisis deepfake gagal diproses.",
  _ai_model_used: "none (all providers failed)"
};

function buildDeepfakePrompt(exifData?: ExifTrace): string {
  const exifSection = exifData ? `
EXIF / METADATA INSIGHTS (extracted from file):
${exifData.editingTraces.map(t => `- ${t}`).join('\n')}
${exifData.make ? `- Camera: ${exifData.make} ${exifData.model || ''}`.trim() : ''}
${exifData.software ? `- Software: ${exifData.software}` : ''}
${exifData.gpsLat && exifData.gpsLon ? `- GPS: ${exifData.gpsLat}, ${exifData.gpsLon}` : ''}
- Metadata suspicious: ${exifData.suspicious ? 'YES' : 'NO'}
` : '\nNO EXIF metadata available.\n';

  return `You are a forensic deepfake detection AI specializing in identifying AI-generated and manipulated facial images.

Your task is to analyze the provided image and return a STRICT JSON response.

IMPORTANT RULES:
- If the image contains a HUMAN FACE, prioritize detailed facial analysis.
- If NO face is detected, still analyze for general AI-generation artifacts.
- Base your analysis ONLY on visual evidence present in the image.
- DO NOT hallucinate artifacts or make claims without evidence.
- Be precise, analytical, and evidence-based.
- Use professional but clear Indonesian language.
- NEVER output anything outside valid JSON.

ANALYSIS FOCUS (prioritized):
1. FACE DETECTION: Is there a human face visible?
2. SKIN TEXTURE: Look for smooth/waxy appearance, missing pores, inconsistent texture.
3. EYE ANALYSIS: Check for unnatural reflections, mismatched iris patterns, missing eyelashes.
4. LIGHTING & SHADOWS: Look for inconsistent light sources, shadow mismatches.
5. HAIR DETAILS: Check for unnatural hair strands, missing flyaways, painting-like appearance.
6. BACKGROUND: Look for warping, smudging, or inconsistent perspective.
7. GAN ARTIFACTS: Check for grid patterns, repeating textures, frequency artifacts.
8. METADATA CUES: Consider if the image appears to have editing artifacts (if visible in pixels).
${exifSection}
OUTPUT FORMAT (STRICT JSON):
{
  "deepfake_score": number (0-100),
  "confidence_level": "LOW" | "MEDIUM" | "HIGH",
  "face_detected": boolean,
  "detected_artifacts": string[],
  "behavioral_analysis": string,
  "red_flags": string[],
  "manipulation_tactics": string[],
  "recommended_actions": string[],
  "similar_patterns": string[],
  "summary": string
}

FIELD DEFINITIONS:
- deepfake_score: 0-100. 0 = genuine, 100 = definitely AI-generated/manipulated.
- confidence_level: HIGH (strong evidence), MEDIUM (some indicators), LOW (ambiguous/insufficient).
- face_detected: true if a human face is visible in the image.
- detected_artifacts: Specific artifacts found (e.g. "GAN Signature", "Skin Texture Anomaly", "Eye Reflection Mismatch", "Lighting Inconsistency", "Hair Detail Loss").
- behavioral_analysis: Detailed analysis explaining WHAT was found and WHY it indicates deepfake or authenticity.
- red_flags: Specific visual anomalies detected.
- manipulation_tactics: Deepfake techniques suspected (e.g. "FaceSwap", "GAN Generation", "Audio-Visual Sync"  only if applicable).
- recommended_actions: Practical steps for the person at risk.
- similar_patterns: Common deepfake scenarios this resembles.
- summary: One-sentence verdict.`;
}

function safeParseDeepfake(raw: string, modelName: string): DeepfakeResult {
  const cleaned = raw.replace(/```json\n?|\n?```/g, "").trim();

  let parsed: any = null;
  try {
    parsed = JSON.parse(cleaned);
  } catch {
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
    try { parsed = JSON.parse(repaired); } catch { parsed = null; }
  }

  if (!parsed) return { ...DEEPFAKE_DEFAULTS, _ai_model_used: modelName };

  return {
    deepfake_score: typeof parsed.deepfake_score === 'number' ? Math.max(0, Math.min(100, parsed.deepfake_score)) : 0,
    confidence_level: ["LOW", "MEDIUM", "HIGH"].includes(parsed.confidence_level) ? parsed.confidence_level : "LOW",
    face_detected: !!parsed.face_detected,
    detected_artifacts: Array.isArray(parsed.detected_artifacts) ? parsed.detected_artifacts : [],
    behavioral_analysis: parsed.behavioral_analysis || DEEPFAKE_DEFAULTS.behavioral_analysis,
    red_flags: Array.isArray(parsed.red_flags) ? parsed.red_flags : [],
    manipulation_tactics: Array.isArray(parsed.manipulation_tactics) ? parsed.manipulation_tactics : [],
    recommended_actions: Array.isArray(parsed.recommended_actions) ? parsed.recommended_actions : DEEPFAKE_DEFAULTS.recommended_actions,
    similar_patterns: Array.isArray(parsed.similar_patterns) ? parsed.similar_patterns : [],
    summary: parsed.summary || DEEPFAKE_DEFAULTS.summary,
    _ai_model_used: modelName
  };
}

export async function analyzeDeepfake(imageBase64: string, exifData?: ExifTrace): Promise<DeepfakeResult> {
  const geminiKey = process.env.GEMINI_API_KEY;

  if (geminiKey) {
    try {
      const ai = new GoogleGenAI({ apiKey: geminiKey });
      const mimeType = imageBase64.includes("image/png") ? "image/png"
        : imageBase64.includes("image/webp") ? "image/webp"
        : imageBase64.includes("image/gif") ? "image/gif"
        : "image/jpeg";

      const base64Data = imageBase64.includes(",") ? imageBase64.split(",")[1] : imageBase64;

      const response = await ai.models.generateContent({
        model: "gemini-2.5-flash",
        contents: [
          buildDeepfakePrompt(exifData),
          {
            inlineData: {
              mimeType,
              data: base64Data
            }
          }
        ],
        config: {
          responseMimeType: "application/json",
          temperature: 0.1,
          topP: 0.1,
          maxOutputTokens: 2000,
        }
      });

      const rawContent = response.text || "{}";
      const result = safeParseDeepfake(rawContent, "native/gemini-2.5-flash");
      result.exif = exifData;
      console.log(`[Deepfake] Analysis complete. Score: ${result.deepfake_score}, Face: ${result.face_detected}`);
      return result;

    } catch (e) {
      console.warn("[Deepfake] Native Gemini SDK failed:", e);
    }
  }

  // OpenRouter fallback (Gemini failed or unavailable)
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  if (openRouterKey) {
    const visionModels = [
      "google/gemini-2.5-flash",
      "mistralai/pixtral-12b"
    ];

    for (const model of visionModels) {
      try {
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), 15_000);
        const fullImageUrl = imageBase64; // Already data:image/...;base64,...
        const res = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            "Authorization": `Bearer ${openRouterKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": process.env.APP_URL || "https://verix.id",
            "X-Title": "VERIX Deepfake Detection"
          },
          signal: controller.signal,
          body: JSON.stringify({
            model: model,
            messages: [{
              role: "user",
              content: [
                { type: "image_url", image_url: { url: fullImageUrl } },
                { type: "text", text: buildDeepfakePrompt(exifData) }
              ]
            }],
            temperature: 0.1,
            top_p: 0.1,
            max_tokens: 2000,
          })
        });
        clearTimeout(timer);

        if (res.ok) {
          const data = await res.json();
          const rawContent = data.choices?.[0]?.message?.content || "{}";
          const result = safeParseDeepfake(rawContent, `openrouter/${model}`);
          result.exif = exifData;
          console.log(`[Deepfake] OpenRouter fallback complete. Model: ${model}, Score: ${result.deepfake_score}, Face: ${result.face_detected}`);
          return result;
        } else {
          const errText = await res.text();
          console.warn(`[Deepfake] OpenRouter fallback HTTP error for model ${model}:`, res.status, errText);
        }
      } catch (e2) {
        console.warn(`[Deepfake] OpenRouter fallback model ${model} failed:`, e2);
      }
    }
  }

  return { ...DEEPFAKE_DEFAULTS, _ai_model_used: "none (all providers failed)", exif: exifData };
}

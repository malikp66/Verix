import { GoogleGenAI } from "@google/genai";

const OPENROUTER_MODELS = [
  "google/gemini-2.5-flash",
  "anthropic/claude-3-haiku",
  "openai/gpt-4o-mini"
];

function safeParseAndMerge(rawContent: string, modelName: string) {
  let parsed: any = null;
  try {
    // 1. JSON Guard (Strip markdown and parse)
    const cleaned = rawContent.replace(/```json\n?|\n?```/g, "").trim();
    parsed = JSON.parse(cleaned);
  } catch (e) {
    console.error(`[AI Layer] JSON Parse Guard failed for ${modelName}`, e);
    throw new Error("Invalid JSON from AI");
  }

  // 2. Safe Fallback Merge
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
  // 1. Try OpenRouter Multi-Model Fallback Chain
  const openRouterKey = process.env.OPENROUTER_API_KEY;
  
  if (openRouterKey) {
    // Inject schema definition into prompt since some OpenRouter models don't support strict JSON schemas via API yet
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
          continue; // Fallback to next model
        }

        const data = await res.json();
        const rawContent = data.choices[0]?.message?.content || "{}";
        const finalOutput = safeParseAndMerge(rawContent, `openrouter/${model}`);
        
        console.log(`[AI Layer] Successfully used OpenRouter model: ${model}`);
        return finalOutput;
        
      } catch (e) {
        console.warn(`[OpenRouter] Error using model ${model}:`, e);
        continue; // Fallback to next model
      }
    }
    console.warn("[AI Layer] All OpenRouter models failed. Falling back to native Gemini SDK.");
  }

  // 2. Fallback to Native Gemini SDK (if OpenRouter key missing or all OpenRouter models fail)
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
      
      console.log(`[AI Layer] Successfully used native Gemini SDK.`);
      return finalOutput;
      
    } catch (e) {
      console.error("[AI Layer] Native Gemini SDK failed:", e);
      throw new Error("All AI providers failed.");
    }
  }

  throw new Error("No AI API keys configured.");
}

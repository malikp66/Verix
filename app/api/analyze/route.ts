import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

export async function POST(req: NextRequest) {
  try {
    const { text, image } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key is missing" }, { status: 500 });
    }

    const ai = new GoogleGenAI({ apiKey });

    const prompt = `You are a Senior Cybersecurity Analyst and Behavioral Expert specializing in digital scams in Indonesia.
Analyze the provided input (text or image) to detect potential scams, phishing, social engineering, or manipulation tactics.
Provide a highly detailed, explainable intelligence report.
Focus on psychological manipulation (urgency, fake authority, emotional triggers).

${text ? `User Input Text: ${text}` : ""}`;

    const contents = [];
    if (image) {
      contents.push(image);
    }
    contents.push(prompt);

    const schema: Schema = {
      type: Type.OBJECT,
      properties: {
        severity_score: { type: Type.INTEGER, description: "A score from 0 to 100 indicating threat level" },
        risk_level: { type: Type.STRING, description: "One of: SAFE, LOW, MEDIUM, HIGH, CRITICAL" },
        manipulation_tactics: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "List of psychological manipulation tactics used (e.g., Urgency Pressure, Fake Authority)",
        },
        red_flags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Specific suspicious elements detected (e.g., APK attachment, Suspicious link)",
        },
        behavioral_analysis: {
            type: Type.STRING,
            description: "Detailed explanation of how the scam manipulates the victim. In Indonesian.",
        },
        recommended_actions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Immediate actions the user should take. In Indonesian.",
        },
        similar_pattern: {
            type: Type.STRING,
            description: "A known similar scam pattern in Indonesia (e.g., 'Mirip dengan APK Surat Tilang Web'). In Indonesian.",
        }
      },
      required: ["severity_score", "risk_level", "manipulation_tactics", "red_flags", "behavioral_analysis", "recommended_actions", "similar_pattern"]
    };

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents,
      config: {
        responseMimeType: "application/json",
        responseSchema: schema,
      }
    });

    const output = JSON.parse(response.text || "{}");
    return NextResponse.json(output);

  } catch (error: any) {
    console.error("Analyze API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

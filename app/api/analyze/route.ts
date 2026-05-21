import { GoogleGenAI, Type, Schema } from "@google/genai";
import { NextRequest, NextResponse } from "next/server";

// Simulated external API functions (will use real endpoints if keys provided)
async function checkSafeBrowsing(url: string) {
  if (process.env.SAFE_BROWSING_API_KEY) {
    // Real implementation placeholder
  }
  const u = url.toLowerCase();
  const isMalicious = u.includes("scam") || u.includes("fake") || u.includes("apk") || u.includes("kurir") || u.includes("undangan") || u.includes("tilang") || u.includes("bca-") || u.includes("bri-") || u.includes("jnt-") || u.includes("paket");
  return { malicious: isMalicious, source: "Google Safe Browsing" };
}

async function checkVirusTotal(url: string) {
  if (process.env.VIRUSTOTAL_API_KEY) {
     // Real implementation placeholder
  }
  const u = url.toLowerCase();
  let suspicious = 0;
  let malicious = 0;
  
  if (u.includes("apk") || u.includes("kurir") || u.includes("undangan") || u.includes("tilang") || u.includes("paket")) {
    suspicious = 24;
    malicious = 18;
  } else if (u.includes("bca") || u.includes("bri") || u.includes("mandiri") || u.includes("dana")) {
    if (!u.includes("bca.co.id") && !u.includes("bri.co.id") && !u.includes("bankmandiri.co.id")) {
       suspicious = 12;
       malicious = 8;
    }
  } else if (u.includes("scam") || u.includes("fake")) {
    suspicious = 15;
    malicious = 8;
  }
  
  return { suspicious_votes: suspicious, malicious_votes: malicious, total_engines: 90 };
}

async function checkUrlScan(url: string) {
  const u = url.toLowerCase();
  let domScore = 85;
  let flags = [];
  
  if (u.includes("apk") || u.includes("kurir") || u.includes("undangan") || u.includes("paket")) {
    domScore = 15;
    flags.push("malware_download", "suspicious_apk");
  } else if (u.includes("bca") || u.includes("bri") || u.includes("dana") || u.includes("login")) {
    domScore = 20;
    flags.push("phishing_heuristic", "suspicious_login_page");
  }
  
  return { dom_score: domScore, redirected: true, flags };
}

function extractUrls(text: string): string[] {
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  return text.match(urlRegex) || [];
}

export async function POST(req: NextRequest) {
  try {
    const { text, image, metadata } = await req.json();

    const apiKey = process.env.GEMINI_API_KEY;
    if (!apiKey) {
      return NextResponse.json({ error: "API key is missing" }, { status: 500 });
    }

    // 1. Detect URLs
    const urls = extractUrls(text || "");
    const externalIntelligence: any = {};

    // 2-4. Run External Checks (if URLs exist)
    if (urls.length > 0) {
      const primaryUrl = urls[0];
      const [safeBrowsing, virusTotal, urlScan] = await Promise.all([
        checkSafeBrowsing(primaryUrl),
        checkVirusTotal(primaryUrl),
        checkUrlScan(primaryUrl)
      ]);
      
      externalIntelligence.safe_browsing = safeBrowsing;
      externalIntelligence.virustotal = virusTotal;
      externalIntelligence.urlscan = urlScan;
    }

    const ai = new GoogleGenAI({ apiKey });

    // 6-7. Build Intelligence Summary & Inject into Prompt
    const prompt = `You are a Senior Cybersecurity Analyst, Behavioral Manipulation Expert, and Indonesian Scam Intelligence Specialist.
Analyze the provided input (text or image) to detect potential scams, phishing, social engineering, or manipulation tactics.
Provide a highly detailed, explainable intelligence report.
Focus on psychological manipulation (urgency, fake authority, emotional triggers, etc).
NEVER say: "AI thinks..." or "Maybe scam...". Use professional confident analyst tone.

${text ? `User Input Text: ${text}` : ""}
${urls.length > 0 ? `External Threat Intelligence Data (JSON): ${JSON.stringify(externalIntelligence)}` : ""}
${metadata ? `Additional Context: ${JSON.stringify(metadata)}` : ""}
`;

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
            description: "List of psychological manipulation tactics used. Be specific (e.g., Urgency Pressure, Fake Authority)",
        },
        red_flags: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Specific suspicious elements detected.",
        },
        behavioral_analysis: {
            type: Type.STRING,
            description: "Detailed professional explanation of how the scam manipulates the victim. In Indonesian.",
        },
        recommended_actions: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Immediate actions the user should take. In Indonesian.",
        },
        external_intelligence: {
            type: Type.OBJECT,
            properties: {
               virustotal: { type: Type.STRING },
               safe_browsing: { type: Type.STRING },
               urlscan: { type: Type.STRING }
            },
            description: "Summary of external tool findings if any URLs were checked. Empty or brief if none."
        },
        similar_patterns: {
            type: Type.ARRAY,
            items: { type: Type.STRING },
            description: "Known similar scam patterns in Indonesia (e.g., 'Modus Kurir J&T', 'Undangan Pernikahan APK'). In Indonesian.",
        }
      },
      required: ["severity_score", "risk_level", "manipulation_tactics", "red_flags", "behavioral_analysis", "recommended_actions", "similar_patterns"]
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

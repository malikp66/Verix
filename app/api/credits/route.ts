import { NextRequest, NextResponse } from "next/server";

// Simulating Upstash Redis rate limiter / DB for MVP
// In production, this data would be in Redis or synced to Firestore User document
const userCredits = new Map<string, { used: number, max: number, lastReset: number }>();

const LIMITS = {
  GUEST: 3,
  VERIFIED: 20,
  PREMIUM: 100
};

function getResetTime() {
  const now = new Date();
  now.setUTCHours(0, 0, 0, 0);
  return now.getTime();
}

export async function POST(req: NextRequest) {
  try {
    const { userId, tier = "GUEST", action = "consume" } = await req.json();
    
    // For IP-based guest tracking, we'd normally use req.headers.get('x-forwarded-for')
    // We'll use a simulated IP if no userId is provided
    const identifier = userId || req.headers.get("x-forwarded-for") || "anonymous_ip";
    
    const maxLimit = tier === "PREMIUM" ? LIMITS.PREMIUM : tier === "VERIFIED" ? LIMITS.VERIFIED : LIMITS.GUEST;
    
    let record = userCredits.get(identifier);
    const today = getResetTime();

    if (!record || record.lastReset < today) {
        record = { used: 0, max: maxLimit, lastReset: today };
    } else {
        // Adjust max if user upgraded
        if (record.max < maxLimit) {
            record.max = maxLimit;
        }
    }

    if (action === "consume") {
        if (record.used >= record.max) {
             return NextResponse.json({ 
                 error: "Quota Exceeded", 
                 used: record.used, 
                 max: record.max,
                 can_analyze: false
             }, { status: 429 });
        }
        record.used += 1;
        userCredits.set(identifier, record);
    } else {
        userCredits.set(identifier, record);
    }

    return NextResponse.json({
        success: true,
        used: record.used,
        max: record.max,
        remaining: record.max - record.used,
        tier,
        can_analyze: record.used < record.max
    });

  } catch (error: any) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
    const url = new URL(req.url);
    const userId = url.searchParams.get("userId") || req.headers.get("x-forwarded-for") || "anonymous_ip";
    const tier = url.searchParams.get("tier") || "GUEST";
    const maxLimit = tier === "PREMIUM" ? LIMITS.PREMIUM : tier === "VERIFIED" ? LIMITS.VERIFIED : LIMITS.GUEST;
    
    let record = userCredits.get(userId);
    const today = getResetTime();

    if (!record || record.lastReset < today) {
        record = { used: 0, max: maxLimit, lastReset: today };
    }

    return NextResponse.json({
         used: record.used,
         max: record.max,
         remaining: record.max - record.used,
         tier,
         can_analyze: record.used < record.max
    });
}

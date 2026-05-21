import { NextRequest, NextResponse } from "next/server";

// In a real environment with Firebase Admin SDK, we would save to Firestore here.
// Since we are using Firebase Client SDK which requires browser context for Auth,
// we will simulate the backend saving process and return a slug, to maintain the hybrid scalable architecture MVP.
// Alternatively, frontend can save directly to Firestore using client SDK after receiving the analysis result.

// Simulating Firestore report collection
const reportsDb = new Map();

export async function POST(req: NextRequest) {
  try {
    const { userId, analysisResult } = await req.json();

    // 1. Validate Payload
    if (!analysisResult || !analysisResult.severity_score) {
      return NextResponse.json({ error: "Invalid analysis result" }, { status: 400 });
    }

    // 2. Generate sharing slug
    const slugId = Math.random().toString(36).substring(2, 8);
    const slug = `abc${slugId}`; // e.g. abc123_random

    // 3. Save to "Database"
    const reportData = {
      id: slug,
      userId: userId || "guest",
      result: analysisResult,
      createdAt: new Date().toISOString(),
    };
    
    // Using in-memory map for the MVP
    reportsDb.set(slug, reportData);

    return NextResponse.json({
      success: true,
      slug,
      share_url: `/report/${slug}`,
      report: reportData
    });
  } catch (error: any) {
    console.error("Report Save API error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
}

export async function GET(req: NextRequest) {
   const url = new URL(req.url);
   const slug = url.searchParams.get("slug");
   if (!slug) {
       return NextResponse.json({ error: "Slug is required" }, { status: 400 });
   }

   const report = reportsDb.get(slug);
   if (!report) {
       return NextResponse.json({ error: "Report not found" }, { status: 404 });
   }

   return NextResponse.json(report);
}

import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    let userId = "guest";

    if (authHeader) {
      try {
        const token = authHeader.replace("Bearer ", "");
        const decoded = await adminAuth.verifyIdToken(token);
        userId = decoded.uid;
      } catch {}
    }

    const { analysisResult } = await req.json();

    if (!analysisResult || !analysisResult.severity_score) {
      return NextResponse.json({ error: "Invalid analysis result" }, { status: 400 });
    }

    const slugId = Math.random().toString(36).substring(2, 8);
    const slug = `abc${slugId}`;

    const db = adminDb();
    await db.collection("reports").doc(slug).set({
      id: slug,
      userId,
      result: analysisResult,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({
      success: true,
      slug,
      share_url: `/report/${slug}`,
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

   try {
     const db = adminDb();
     const snap = await db.collection("reports").doc(slug).get();

     if (!snap.exists) {
       return NextResponse.json({ error: "Report not found" }, { status: 404 });
     }

     return NextResponse.json(snap.data());
   } catch (error) {
     console.error("Report GET error:", error);
     return NextResponse.json({ error: "Failed to retrieve report" }, { status: 500 });
   }
}

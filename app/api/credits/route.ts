import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb } from "@/lib/firebase-admin";
import { FieldValue } from "firebase-admin/firestore";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ credits: 0, user: null });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = await adminAuth.verifyIdToken(token);
    const db = adminDb();
    const userRef = db.collection("users").doc(decoded.uid);
    const snap = await userRef.get();

    if (!snap.exists) {
      return NextResponse.json({ credits: 0, user: decoded.uid });
    }

    const data = snap.data() as { aiCredits?: number } | undefined;
    return NextResponse.json({ credits: data?.aiCredits ?? 0, user: decoded.uid });
  } catch (error) {
    console.error("Credits GET error:", error);
    return NextResponse.json({ credits: 0, user: null });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = await adminAuth.verifyIdToken(token);
    const { action, amount = 1 } = await req.json();

    const db = adminDb();
    const userRef = db.collection("users").doc(decoded.uid);

    if (action === "consume") {
      await userRef.update({
        aiCredits: FieldValue.increment(-amount),
      });
    } else if (action === "topup") {
      await userRef.update({
        aiCredits: FieldValue.increment(amount),
      });
    }

    const snap = await userRef.get();
    const data = snap.data();

    return NextResponse.json({ credits: data?.aiCredits ?? 0, user: decoded.uid });
  } catch (error) {
    console.error("Credits POST error:", error);
    return NextResponse.json({ error: "Failed to update credits" }, { status: 500 });
  }
}

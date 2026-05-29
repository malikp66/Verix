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
      await userRef.set({
        aiCredits: FieldValue.increment(-amount),
      }, { merge: true });
    } else if (action === "topup") {
      const { orderId } = await req.json();
      if (!orderId) {
        return NextResponse.json({ error: "orderId required for topup" }, { status: 400 });
      }

      const orderRef = db.collection("orders").doc(orderId);
      const orderSnap = await orderRef.get();

      if (!orderSnap.exists) {
        return NextResponse.json({ error: "Order not found" }, { status: 404 });
      }

      const orderData = orderSnap.data() as Record<string, unknown> | undefined;
      if (orderData?.processed) {
        const snap = await userRef.get();
        return NextResponse.json({ credits: snap.data()?.aiCredits ?? 0, user: decoded.uid });
      }
      if (orderData?.userId !== decoded.uid) {
        return NextResponse.json({ error: "Order does not belong to user" }, { status: 403 });
      }
      if (orderData?.credits !== amount) {
        return NextResponse.json({ error: "Credit amount mismatch" }, { status: 400 });
      }

      await userRef.set({
        aiCredits: FieldValue.increment(amount),
      }, { merge: true });

      await orderRef.update({
        status: "settlement",
        processed: true,
        processedAt: new Date().toISOString(),
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

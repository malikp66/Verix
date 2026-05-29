import { NextRequest, NextResponse } from "next/server";
import { adminAuth, adminDb, adminRtdb } from "@/lib/firebase-admin";

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get("authorization");
    if (!authHeader) {
      return NextResponse.json({ credits: 0, user: null });
    }

    const token = authHeader.replace("Bearer ", "");
    const decoded = await adminAuth.verifyIdToken(token);
    
    const rtdb = adminRtdb();
    const creditRef = rtdb.ref(`users/${decoded.uid}/credits`);
    const snap = await creditRef.once('value');
    let credits = snap.val();

    if (credits === null) {
      // Fallback/Migration check: check Firestore
      const db = adminDb();
      const userRef = db.collection("users").doc(decoded.uid);
      const fsSnap = await userRef.get();
      credits = fsSnap.exists ? (fsSnap.data()?.aiCredits ?? 20) : 20;
      await creditRef.set(credits);
    }

    return NextResponse.json({ credits, user: decoded.uid });
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
    
    // Parse request body exactly once
    const body = await req.json();
    const { action, amount = 1, orderId } = body;

    const db = adminDb();
    const userRef = db.collection("users").doc(decoded.uid);
    const rtdb = adminRtdb();
    const creditRef = rtdb.ref(`users/${decoded.uid}/credits`);

    let finalCredits = 0;

    if (action === "consume") {
      await creditRef.transaction((current) => {
        const val = current !== null ? current : 20;
        finalCredits = Math.max(0, val - amount);
        return finalCredits;
      });

      // Update Firestore backup
      await userRef.set({
        aiCredits: finalCredits,
      }, { merge: true });

    } else if (action === "topup") {
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
        const rtdbSnap = await creditRef.once('value');
        return NextResponse.json({ credits: rtdbSnap.val() ?? 0, user: decoded.uid });
      }
      if (orderData?.userId !== decoded.uid) {
        return NextResponse.json({ error: "Order does not belong to user" }, { status: 403 });
      }
      if (orderData?.credits !== amount) {
        return NextResponse.json({ error: "Credit amount mismatch" }, { status: 400 });
      }

      await creditRef.transaction((current) => {
        const val = current !== null ? current : 20;
        finalCredits = val + amount;
        return finalCredits;
      });

      // Update Firestore backup
      await userRef.set({
        aiCredits: finalCredits,
      }, { merge: true });

      await orderRef.update({
        status: "settlement",
        processed: true,
        processedAt: new Date().toISOString(),
      });
    } else {
      const rtdbSnap = await creditRef.once('value');
      finalCredits = rtdbSnap.val() ?? 20;
    }

    return NextResponse.json({ credits: finalCredits, user: decoded.uid });
  } catch (error) {
    console.error("Credits POST error:", error);
    return NextResponse.json({ error: "Failed to update credits" }, { status: 500 });
  }
}


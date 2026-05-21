import { NextRequest, NextResponse } from "next/server";
import { adminDb } from "@/lib/firebase-admin";

// Midtrans notification webhook handler
// This endpoint is called by Midtrans servers when payment status changes
export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    
    const {
      transaction_status,
      order_id,
      custom_field1: userId,
      custom_field2: creditAmountStr,
      fraud_status,
      status_code,
    } = body;

    console.log(`[Midtrans Webhook] order=${order_id} status=${transaction_status} fraud=${fraud_status}`);

    // Determine if payment is successful
    const isSuccess =
      (transaction_status === "capture" && fraud_status === "accept") ||
      transaction_status === "settlement";

    if (!isSuccess) {
      // Log non-success statuses but return 200 so Midtrans doesn't retry
      console.log(`[Midtrans Webhook] Non-success status for ${order_id}: ${transaction_status}`);
      return NextResponse.json({ status: "noted", transaction_status });
    }

    const creditAmount = parseInt(creditAmountStr || "0", 10);

    if (!userId || creditAmount <= 0) {
      console.error(`[Midtrans Webhook] Missing userId or invalid credits for ${order_id}`);
      return NextResponse.json({ error: "Invalid custom fields" }, { status: 400 });
    }

    // Update Firestore user credits
    // NOTE: In production, use firebase-admin SDK for server-side Firestore access.
    // For MVP without firebase-admin configured, the frontend onSuccess callback 
    // handles credit fulfillment via the client-side useAICredits hook.
    
    if (adminDb) {
      try {
        const userRef = adminDb.collection("users").doc(userId);
        const snap = await userRef.get();
        const currentCredits = snap.exists ? (snap.data()?.aiCredits || 0) : 0;
        
        await userRef.set(
          { 
            aiCredits: currentCredits + creditAmount,
            lastTopUp: new Date().toISOString(),
            lastOrderId: order_id,
          },
          { merge: true }
        );

        console.log(`[Midtrans Webhook] ✅ Added ${creditAmount} credits to user ${userId}. New total: ${currentCredits + creditAmount}`);
      } catch (dbError) {
        console.error(`[Midtrans Webhook] Firestore update failed:`, dbError);
        // Still return 200 to prevent Midtrans retry — frontend fallback will handle
      }
    } else {
      console.log(`[Midtrans Webhook] firebase-admin not configured. Credits will be fulfilled via frontend callback.`);
    }

    return NextResponse.json({ 
      status: "ok", 
      credited: creditAmount, 
      userId,
      order_id 
    });
    
  } catch (error: any) {
    console.error("[Midtrans Webhook] Error:", error);
    // Return 200 even on error to prevent infinite retries from Midtrans
    return NextResponse.json({ error: error.message }, { status: 200 });
  }
}

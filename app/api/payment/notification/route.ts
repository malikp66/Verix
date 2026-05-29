import { NextRequest, NextResponse } from 'next/server';
import { adminDb, adminRtdb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';
import crypto from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const transactionStatus = body.transaction_status;
    const orderId = body.order_id as string;
    const fraudStatus = body.fraud_status;

    // Verify Midtrans signature
    if (!verifyMidtransSignature(body)) {
      console.warn(`Invalid signature for notification: ${orderId}`);
      return NextResponse.json({ status: 'invalid signature' }, { status: 400 });
    }

    const isSuccess =
      (transactionStatus === 'capture' && fraudStatus === 'accept') ||
      transactionStatus === 'settlement';

    if (isSuccess && orderId) {
      console.log(`Midtrans payment SUCCESS: ${orderId}`);

      try {
        const db = adminDb();
        const orderRef = db.collection('orders').doc(orderId);
        const orderSnap = await orderRef.get();

        if (orderSnap.exists) {
          const orderData = orderSnap.data() as { processed?: boolean; userId?: string; credits?: number } | undefined;

          if (!orderData) {
            console.warn(`Order ${orderId} has no data`);
            return NextResponse.json({ status: 'ok' });
          }

          if (orderData.processed) {
            console.log(`Order ${orderId} already processed, skipping.`);
            return NextResponse.json({ status: 'ok' });
          }

          const { userId, credits } = orderData;

          if (userId && credits) {
            const rtdb = adminRtdb();
            const creditRef = rtdb.ref(`users/${userId}/credits`);
            let finalCredits = 0;
            await creditRef.transaction((current) => {
              const val = current !== null ? current : 20;
              finalCredits = val + credits;
              return finalCredits;
            });

            await db.collection('users').doc(userId).set({
              aiCredits: finalCredits,
            }, { merge: true });
          }

          await orderRef.update({
            status: 'settlement',
            processed: true,
            processedAt: new Date().toISOString(),
          });

          console.log(`Credits ${credits} added to user ${userId} for order ${orderId}`);
        } else {
          console.warn(`Order ${orderId} not found in Firestore`);
        }
      } catch (err) {
        console.error('Failed to process payment notification:', err);
        return NextResponse.json({ status: 'retry' }, { status: 500 });
      }
    } else {
      console.log(`Midtrans notification: ${orderId} status=${transactionStatus}`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Midtrans notification error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}

function verifyMidtransSignature(body: Record<string, unknown>): boolean {
  const orderId = body.order_id as string;
  const statusCode = body.status_code as string;
  const grossAmount = body.gross_amount as string;
  const signatureKey = body.signature_key as string;
  const serverKey = process.env.MIDTRANS_SERVER_KEY ?? '';

  if (!orderId || !statusCode || !grossAmount || !signatureKey) {
    return false;
  }

  const hash = crypto
    .createHash('sha512')
    .update(orderId + statusCode + grossAmount + serverKey)
    .digest('hex');

  return hash === signatureKey;
}

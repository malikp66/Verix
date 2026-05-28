import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const transactionStatus = body.transaction_status;
    const orderId = body.order_id as string;
    const fraudStatus = body.fraud_status;

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

          // Idempotency: skip if already processed
          if (orderData.processed) {
            console.log(`Order ${orderId} already processed, skipping.`);
            return NextResponse.json({ status: 'ok' });
          }

          const { userId, credits } = orderData;

          if (userId && credits) {
            await db.collection('users').doc(userId).set({
              aiCredits: FieldValue.increment(credits),
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

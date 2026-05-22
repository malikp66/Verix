import { NextRequest, NextResponse } from 'next/server';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    const transactionStatus = body.transaction_status;
    const orderId = body.order_id as string;
    const fraudStatus = body.fraud_status;

    const isSuccess =
      (transactionStatus === 'capture' && fraudStatus === 'accept') ||
      transactionStatus === 'settlement';

    if (isSuccess) {
      console.log(`Midtrans payment SUCCESS: ${orderId}`);
    } else {
      console.log(`Midtrans notification: ${orderId} status=${transactionStatus}`);
    }

    return NextResponse.json({ status: 'ok' });
  } catch (error) {
    console.error('Midtrans notification error:', error);
    return NextResponse.json({ status: 'error' }, { status: 500 });
  }
}

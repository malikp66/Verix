import { NextRequest, NextResponse } from 'next/server';
import { adminDb } from '@/lib/firebase-admin';

const PRICING: Record<string, { credits: number; price: number; label: string }> = {
  starter: { credits: 10, price: 10000, label: '10 AI Credits' },
  popular: { credits: 50, price: 45000, label: '50 AI Credits (Best Value)' },
  pro: { credits: 100, price: 80000, label: '100 AI Credits (Hemat 20%)' },
};

const MIDTRANS_API = (process.env.MIDTRANS_IS_PRODUCTION === 'true' || process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true')
  ? 'https://app.midtrans.com/snap/v1/transactions'
  : 'https://app.sandbox.midtrans.com/snap/v1/transactions';

const SERVER_KEY = process.env.MIDTRANS_SERVER_KEY ?? '';

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { tier, userEmail, userName, userId } = body as {
      tier: string;
      userEmail: string;
      userName?: string;
      userId?: string;
    };

    const pkg = PRICING[tier];
    if (!pkg) {
      return NextResponse.json(
        { error: 'Invalid tier. Choose: starter, popular, or pro.' },
        { status: 400 }
      );
    }

    if (!SERVER_KEY) {
      return NextResponse.json(
        { error: 'Midtrans server key not configured.' },
        { status: 500 }
      );
    }

    const orderId = `VERIX-${Date.now()}-${Math.random().toString(36).substring(2, 6).toUpperCase()}`;

    // Store order mapping in Firestore for webhook
    if (userId) {
      try {
        const db = adminDb();
        await db.collection('orders').doc(orderId).set({
          userId,
          tier,
          credits: pkg.credits,
          price: pkg.price,
          status: 'pending',
          createdAt: new Date().toISOString(),
        });
      } catch (err) {
        console.error('Failed to store order in Firestore:', err);
      }
    }

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: pkg.price,
      },
      credit_card: { secure: true },
      customer_details: {
        first_name: userName || userEmail?.split('@')[0] || 'User',
        email: userEmail || undefined,
      },
      item_details: [
        {
          id: tier,
          price: pkg.price,
          quantity: 1,
          name: pkg.label,
          category: 'AI Credits',
        },
      ],
      custom_field1: userId || '',
      custom_field2: String(pkg.credits),
    };

    const auth = Buffer.from(`${SERVER_KEY}:`).toString('base64');

    const response = await fetch(MIDTRANS_API, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Accept: 'application/json',
        Authorization: `Basic ${auth}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error('Midtrans API error:', data);
      return NextResponse.json(
        { error: data.error_messages?.[0] || 'Payment gateway error' },
        { status: response.status }
      );
    }

    return NextResponse.json({
      snapToken: data.token,
      redirectUrl: data.redirect_url,
      orderId,
    });
  } catch (error) {
    console.error('Create transaction error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

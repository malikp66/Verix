import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';
import { FieldValue } from 'firebase-admin/firestore';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    await adminAuth.verifyIdToken(token);

    const { searchParams } = new URL(req.url);
    const merchant = searchParams.get('merchant');
    if (!merchant) return NextResponse.json({ error: 'merchant required' }, { status: 400 });

    const db = adminDb();
    const snap = await db.collection('qris-blacklist').doc(merchant.toLowerCase().trim()).get();

    if (!snap.exists) return NextResponse.json({ reports: 0 });

    return NextResponse.json({ reports: snap.data()?.reports || 0 });
  } catch (error) {
    console.error('QRIS report GET error:', error);
    return NextResponse.json({ reports: 0 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    await adminAuth.verifyIdToken(token);

    const { merchant } = await req.json();
    if (!merchant) return NextResponse.json({ error: 'merchant required' }, { status: 400 });

    const key = merchant.toLowerCase().trim();
    const db = adminDb();
    const ref = db.collection('qris-blacklist').doc(key);
    const snap = await ref.get();

    if (snap.exists) {
      await ref.update({
        reports: FieldValue.increment(1),
        lastReportedAt: new Date().toISOString(),
      });
    } else {
      await ref.set({
        name: merchant.trim(),
        reports: 1,
        flagged: true,
        createdAt: new Date().toISOString(),
        lastReportedAt: new Date().toISOString(),
      });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('QRIS report POST error:', error);
    return NextResponse.json({ error: 'Failed to report' }, { status: 500 });
  }
}

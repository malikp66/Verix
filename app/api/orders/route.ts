import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const token = authHeader.replace('Bearer ', '');
    const decoded = await adminAuth.verifyIdToken(token);

    const db = adminDb();
    const snap = await db
      .collection('orders')
      .where('userId', '==', decoded.uid)
      .limit(50)
      .get();

    const orders = snap.docs
      .map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }))
      .sort((a: Record<string, unknown>, b: Record<string, unknown>) => {
        const dateA = typeof a.createdAt === 'string' ? a.createdAt : '';
        const dateB = typeof b.createdAt === 'string' ? b.createdAt : '';
        return dateB.localeCompare(dateA);
      });

    return NextResponse.json({ orders });
  } catch (error) {
    console.error('Orders GET error:', error);
    return NextResponse.json({ orders: [] });
  }
}


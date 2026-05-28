import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb } from '@/lib/firebase-admin';

export async function GET(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    await adminAuth.verifyIdToken(token);

    const { searchParams } = new URL(req.url);
    const docId = searchParams.get('docId');
    if (!docId) return NextResponse.json({ error: 'docId required' }, { status: 400 });

    const db = adminDb();
    const snap = await db.collection('scans').doc(docId).get();

    if (!snap.exists) return NextResponse.json({ cached: false });

    return NextResponse.json({ cached: true, result: snap.data() });
  } catch (error) {
    console.error('Scans GET error:', error);
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }
}

export async function POST(req: NextRequest) {
  try {
    const authHeader = req.headers.get('authorization');
    if (!authHeader) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const token = authHeader.replace('Bearer ', '');
    const decoded = await adminAuth.verifyIdToken(token);

    const { docId, result, input } = await req.json();
    if (!docId) return NextResponse.json({ error: 'docId required' }, { status: 400 });

    const db = adminDb();
    await db.collection('scans').doc(docId).set({
      result,
      input,
      userId: decoded.uid,
      createdAt: new Date().toISOString(),
    });

    return NextResponse.json({ saved: true });
  } catch (error) {
    console.error('Scans POST error:', error);
    return NextResponse.json({ error: 'Failed to save scan' }, { status: 500 });
  }
}

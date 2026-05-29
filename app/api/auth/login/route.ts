import { NextRequest, NextResponse } from 'next/server';
import { adminAuth, adminDb, adminRtdb } from '@/lib/firebase-admin';

export async function POST(req: NextRequest) {
  try {
    const { token } = await req.json();
    if (!token) {
      return NextResponse.json({ error: 'No token provided' }, { status: 401 });
    }

    const decoded = await adminAuth.verifyIdToken(token);
    const { uid, email, name, picture } = decoded;

    const db = adminDb();
    const userRef = db.collection('users').doc(uid);
    const snap = await userRef.get();

    let creditsToSet = 20;

    if (!snap.exists) {
      await userRef.set({
        email: email || '',
        displayName: name || '',
        photoURL: picture || '',
        aiCredits: 20,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      });
    } else {
      const data = snap.data();
      creditsToSet = data?.aiCredits ?? 20;
    }

    // Sync credits to RTDB for real-time tracking if not set
    const rtdb = adminRtdb();
    const creditRef = rtdb.ref(`users/${uid}/credits`);
    const rtdbSnap = await creditRef.once('value');
    if (rtdbSnap.val() === null) {
      await creditRef.set(creditsToSet);
    }

    return NextResponse.json({ uid, email, name, picture });
  } catch (error: any) {
    console.error('Auth login error:', error);
    return NextResponse.json({ error: error.message || 'Invalid token' }, { status: 401 });
  }
}

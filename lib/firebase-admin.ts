// Firebase Admin SDK stub for server-side operations
// For MVP, the webhook falls back to frontend-based credit fulfillment.
// To enable server-side credit updates:
// 1. Install: bun add firebase-admin
// 2. Set FIREBASE_ADMIN_PROJECT_ID, FIREBASE_ADMIN_CLIENT_EMAIL, FIREBASE_ADMIN_PRIVATE_KEY in .env
// 3. Uncomment the initialization code below

/*
import { initializeApp, cert, getApps } from 'firebase-admin/app';
import { getFirestore } from 'firebase-admin/firestore';

if (!getApps().length) {
  initializeApp({
    credential: cert({
      projectId: process.env.FIREBASE_ADMIN_PROJECT_ID,
      clientEmail: process.env.FIREBASE_ADMIN_CLIENT_EMAIL,
      privateKey: process.env.FIREBASE_ADMIN_PRIVATE_KEY?.replace(/\\n/g, '\n'),
    }),
  });
}

export const adminDb = getFirestore();
*/

// Stub export — webhook will skip Firestore update and rely on frontend callback
export const adminDb: any = null;

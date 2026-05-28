import admin from 'firebase-admin';
import { getFirestore } from 'firebase-admin/firestore';
import { getAuth } from 'firebase-admin/auth';

const serviceAccount = JSON.parse(process.env.FIREBASE_SERVICE_ACCOUNT_KEY!);

if (!admin.apps.length) {
  admin.initializeApp({
    credential: admin.credential.cert(serviceAccount),
  });
}

const DATABASE_ID = 'ai-studio-a3eb4718-a74c-46ae-98f6-3ac935199508';

export { admin };
export const adminAuth = getAuth();
export function adminDb() {
  return getFirestore(DATABASE_ID);
}

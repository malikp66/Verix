import admin from 'firebase-admin';
import { getFirestore, Firestore } from 'firebase-admin/firestore';
import { getAuth, Auth } from 'firebase-admin/auth';
import { getDatabase, Database } from 'firebase-admin/database';

const DATABASE_ID = 'ai-studio-a3eb4718-a74c-46ae-98f6-3ac935199508';

function initAdmin() {
  if (!admin.apps.length) {
    const key = process.env.FIREBASE_SERVICE_ACCOUNT_KEY;
    if (!key) {
      console.warn("WARNING: FIREBASE_SERVICE_ACCOUNT_KEY is not defined. Firebase Admin might fail at runtime if database or auth calls are made.");
      return;
    }

    try {
      let cleanedKey = key.trim();
      if (cleanedKey.startsWith("'") && cleanedKey.endsWith("'")) {
        cleanedKey = cleanedKey.slice(1, -1);
      } else if (cleanedKey.startsWith('"') && cleanedKey.endsWith('"')) {
        cleanedKey = cleanedKey.slice(1, -1);
      }

      // Safe JSON parsing for private keys with literal newlines in .env
      cleanedKey = cleanedKey.replace(
        /("private_key"\s*:\s*")([\s\S]*?)(")/g,
        (match, p1, p2, p3) => {
          return p1 + p2.replace(/\r/g, '').replace(/\n/g, '\\n') + p3;
        }
      );

      const serviceAccount = JSON.parse(cleanedKey);

      if (serviceAccount.private_key) {
        serviceAccount.private_key = serviceAccount.private_key.replace(/\\n/g, '\n');
      }

      admin.initializeApp({
        credential: admin.credential.cert(serviceAccount),
        databaseURL: "https://juaravibecoding-496905-default-rtdb.asia-southeast1.firebasedatabase.app/"
      });
    } catch (e) {
      console.error("Failed to parse FIREBASE_SERVICE_ACCOUNT_KEY or initialize firebase-admin:", e);
    }
  }
}

export { admin };

// Proxy for adminAuth to lazily initialize and retrieve Auth service, avoiding crash during build-time
export const adminAuth: Auth = new Proxy({} as Auth, {
  get(target, prop, receiver) {
    initAdmin();
    let auth: Auth;
    try {
      auth = getAuth();
    } catch (e) {
      console.warn("getAuth() failed, returning a dummy proxy (expected during build time if credentials are missing).");
      return new Proxy(() => {}, {
        get(t, p) {
          if (p === 'verifyIdToken') {
            return () => Promise.resolve({ uid: 'dummy-uid' });
          }
          return () => Promise.resolve({});
        }
      }) as unknown as Auth;
    }
    const value = Reflect.get(auth, prop);
    if (typeof value === 'function') {
      return value.bind(auth);
    }
    return value;
  }
});

export function adminDb(): Firestore {
  initAdmin();
  try {
    return getFirestore(DATABASE_ID);
  } catch (e) {
    console.warn("getFirestore() failed. Returning a dummy db reference (expected during build time if credentials are missing).");
    return new Proxy({} as any, {
      get(target, prop) {
        return () => ({
          collection: () => ({
            doc: () => ({
              get: () => Promise.resolve({ exists: false, data: () => null }),
              set: () => Promise.resolve(),
              update: () => Promise.resolve(),
            })
          })
        });
      }
    }) as unknown as Firestore;
  }
}

export function adminRtdb(): Database {
  initAdmin();
  try {
    return getDatabase();
  } catch (e) {
    console.warn("getDatabase() failed. Returning a dummy database reference.");
    const dummyRef = {
      once: () => Promise.resolve({ val: () => null }),
      set: () => Promise.resolve(),
      update: () => Promise.resolve(),
      transaction: (cb: any) => {
        if (typeof cb === 'function') {
          cb(20);
        }
        return Promise.resolve();
      },
    };
    return new Proxy({} as any, {
      get(target, prop) {
        if (prop === 'ref') {
          return () => dummyRef;
        }
        return () => dummyRef;
      }
    }) as unknown as Database;
  }
}



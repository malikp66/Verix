import { adminDb, adminRtdb } from '../lib/firebase-admin';

async function queryUsers() {
  try {
    console.log("=== FIRESTORE USERS ===");
    const db = adminDb();
    const usersSnap = await db.collection('users').get();
    console.log(`Found ${usersSnap.size} users in Firestore.`);
    usersSnap.forEach(doc => {
      console.log(`- UID: ${doc.id}, Email: ${doc.data().email}, aiCredits: ${doc.data().aiCredits}`);
    });

    console.log("\n=== RTDB USERS ===");
    const rtdb = adminRtdb();
    const rtdbSnap = await rtdb.ref('users').once('value');
    const rtdbVal = rtdbSnap.val();
    if (!rtdbVal) {
      console.log("No users found in Realtime Database.");
    } else {
      console.log(`Found ${Object.keys(rtdbVal).length} users in RTDB:`);
      for (const [uid, userData] of Object.entries(rtdbVal)) {
        console.log(`- UID: ${uid}, Data:`, userData);
      }
    }
  } catch (e) {
    console.error("Query failed:", e);
  }
}

queryUsers();

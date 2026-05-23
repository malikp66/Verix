import { db } from "@/lib/firebase";
import { doc, getDoc, setDoc, updateDoc, increment } from "firebase/firestore";

export async function getReportCount(merchantName: string): Promise<number> {
  try {
    const ref = doc(db, "qris-blacklist", merchantName.toLowerCase().trim());
    const snap = await getDoc(ref);
    if (!snap.exists()) return 0;
    return snap.data().reports || 0;
  } catch {
    return 0;
  }
}

export async function incrementReport(merchantName: string): Promise<void> {
  try {
    const ref = doc(db, "qris-blacklist", merchantName.toLowerCase().trim());
    const snap = await getDoc(ref);
    if (snap.exists()) {
      await updateDoc(ref, {
        reports: increment(1),
        lastReportedAt: new Date().toISOString(),
      });
    } else {
      await setDoc(ref, {
        name: merchantName.trim(),
        reports: 1,
        flagged: true,
        createdAt: new Date().toISOString(),
        lastReportedAt: new Date().toISOString(),
      });
    }
  } catch (e) {
    console.warn("[QRIS Store] Failed to increment report:", e);
  }
}

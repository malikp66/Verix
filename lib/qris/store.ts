import { adminDb } from "@/lib/firebase-admin";

export async function getReportCount(merchantName: string): Promise<number> {
  try {
    const db = adminDb();
    const snap = await db.collection("qris-blacklist").doc(merchantName).get();
    return snap.data()?.count ?? 0;
  } catch (e) {
    console.error("[QRIS Store] Failed to get report count:", e);
    return 0;
  }
}

export async function incrementReport(merchantName: string): Promise<void> {
  try {
    const res = await fetch("/api/qris/report", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ merchant: merchantName }),
    });
    if (!res.ok) {
      console.warn("[QRIS Store] Failed to increment report:", await res.text());
    }
  } catch (e) {
    console.warn("[QRIS Store] Failed to increment report:", e);
  }
}

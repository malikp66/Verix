import { auth } from "@/lib/firebase";

async function getToken(): Promise<string | null> {
  if (!auth.currentUser) return null;
  try {
    return await auth.currentUser.getIdToken();
  } catch {
    return null;
  }
}

export async function getReportCount(merchantName: string): Promise<number> {
  try {
    const token = await getToken();
    if (!token) return 0;

    const res = await fetch(`/api/qris/report?merchant=${encodeURIComponent(merchantName)}`, {
      headers: { authorization: `Bearer ${token}` },
    });

    if (!res.ok) return 0;
    const data = await res.json();
    return data.reports || 0;
  } catch {
    return 0;
  }
}

export async function incrementReport(merchantName: string): Promise<void> {
  try {
    const token = await getToken();
    if (!token) return;

    await fetch('/api/qris/report', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        authorization: `Bearer ${token}`,
      },
      body: JSON.stringify({ merchant: merchantName }),
    });
  } catch (e) {
    console.warn("[QRIS Store] Failed to increment report:", e);
  }
}

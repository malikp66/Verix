import { NextRequest, NextResponse } from "next/server";

// Simulating aggregated trends from cron jobs / database
export async function GET(req: NextRequest) {
  // In a real system, this reads from an aggregated view in Supabase or Firestore
  const trends = [
    { rank: 1, name: "APK Undangan Pernikahan", category: "Malware", growth: "+340%", severity: "CRITICAL" },
    { rank: 2, name: "QRIS Merchant Palsu", category: "Fraud", growth: "+125%", severity: "HIGH" },
    { rank: 3, name: "Voice Cloning Keluarga", category: "Social Engineering", growth: "+89%", severity: "HIGH" },
    { rank: 4, name: "Salah Transfer Pinjol", category: "Scam", growth: "+42%", severity: "MEDIUM" },
    { rank: 5, name: "Phishing Web Bank", category: "Phishing", growth: "+15%", severity: "CRITICAL" },
  ];

  return NextResponse.json({
    updated_at: new Date().toISOString(),
    trends
  }, {
    headers: {
      'Cache-Control': 'public, s-maxage=60, stale-while-revalidate=300'
    }
  });
}

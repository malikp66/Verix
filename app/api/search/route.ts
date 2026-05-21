import { NextRequest, NextResponse } from "next/server";

// Simulating a backend search over stored threat intel or past reports
export async function GET(req: NextRequest) {
  const url = new URL(req.url);
  const query = url.searchParams.get("q");

  if (!query) {
    return NextResponse.json({ error: "Query parameter 'q' is required" }, { status: 400 });
  }

  // Simulated search results
  // In production, this would query Algolia, Typesense, or Firestore
  const simDb = [
    { id: "1", title: "APK Kurir J&T Palsu", type: "Malware", severity: "CRITICAL", date: "2023-11-20" },
    { id: "2", title: "Phishing BCA Mobile Clone", type: "Phishing", severity: "HIGH", date: "2023-11-19" },
    { id: "3", title: "Penipuan QRIS Warung", type: "Fraud", severity: "MEDIUM", date: "2023-11-18" },
    { id: "4", title: "Surat Tilang WhatsApp", type: "Malware", severity: "CRITICAL", date: "2023-11-17" },
  ];

  const results = simDb.filter(item => 
      item.title.toLowerCase().includes(query.toLowerCase()) || 
      item.type.toLowerCase().includes(query.toLowerCase())
  );

  return NextResponse.json({
    query,
    count: results.length,
    results
  });
}

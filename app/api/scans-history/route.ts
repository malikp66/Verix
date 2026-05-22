import { NextResponse } from 'next/server';

const VIRUSTOTAL_API_KEY = process.env.VIRUSTOTAL_API_KEY;
const URLSCAN_API_KEY = process.env.URLSCAN_API_KEY;

export const dynamic = 'force-dynamic';

export async function GET() {
  const scans: Array<{
    id: string;
    url: string;
    risk: string;
    score: number;
    date: string;
    type: string;
    reasons: string[];
    source: string;
  }> = [];

  // 1. VirusTotal recent detections (if key available)
  if (VIRUSTOTAL_API_KEY && VIRUSTOTAL_API_KEY !== 'YOUR_VIRUSTOTAL_API_KEY') {
    try {
      const res = await fetch(
        'https://www.virustotal.com/api/v3/intelligence/search?query=ls:1d+positives:5+&limit=10',
        { headers: { 'x-apikey': VIRUSTOTAL_API_KEY }, next: { revalidate: 300 } }
      );
      if (res.ok) {
        const data = await res.json();
        const items = data.data || [];
        items.slice(0, 5).forEach((item: any, idx: number) => {
          const attrs = item.attributes || {};
          const positives = attrs.last_analysis_stats?.malicious || 0;
          const total = attrs.last_analysis_stats?.harmless || 0 + positives + (attrs.last_analysis_stats?.suspicious || 0);
          scans.push({
            id: `vt-${idx}`,
            url: attrs.url || 'unknown',
            risk: positives >= 10 ? 'CRITICAL' : positives >= 5 ? 'HIGH' : 'MEDIUM',
            score: Math.min(95, positives * 5 + 20),
            date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
            type: attrs.type_description || 'Malicious URL',
            reasons: [`${positives}/${total} engines detected malicious`, attrs.title || 'No title'],
            source: 'VirusTotal',
          });
        });
      }
    } catch (e) {
      console.warn('[Scans History] VirusTotal fetch failed:', e);
    }
  }

  // 2. Abuse.ch URLhaus recent
  try {
    const res = await fetch('https://urlhaus.abuse.ch/downloads/json_recent/', {
      headers: { 'User-Agent': 'Mozilla/5.0 VERIX-ScanHistory/1.0' },
      cache: 'no-store',
    });
    if (res.ok) {
      const data = await res.json();
      const urls = (data.urls || []).slice(0, 5);
      urls.forEach((item: any, idx: number) => {
        const isMalware = item.threat === 'malware_download';
        scans.push({
          id: `abuse-${idx}`,
          url: item.url,
          risk: isMalware ? 'CRITICAL' : 'HIGH',
          score: isMalware ? 92 : 78,
          date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
          type: isMalware ? 'Malware Host' : 'Phishing Site',
          reasons: [isMalware ? 'Malware payload delivery active' : 'Credential harvesting detected', `Status: ${item.url_status || 'unknown'}`],
          source: 'Abuse.ch',
        });
      });
    }
  } catch (e) {
    console.warn('[Scans History] URLhaus fetch failed:', e);
  }

  // 3. URLScan recent (if key available)
  if (URLSCAN_API_KEY && URLSCAN_API_KEY !== 'YOUR_URLSCAN_API_KEY') {
    try {
      const res = await fetch(
        'https://urlscan.io/api/v1/search/?q=task.time:>now-1d AND page.domain:*.id AND verdicts.malicious:true',
        { headers: { 'API-Key': URLSCAN_API_KEY }, next: { revalidate: 300 } }
      );
      if (res.ok) {
        const data = await res.json();
        const results = (data.results || []).slice(0, 3);
        results.forEach((item: any, idx: number) => {
          const page = item.page || {};
          scans.push({
            id: `urlscan-${idx}`,
            url: page.url || 'unknown',
            risk: 'HIGH',
            score: 75,
            date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
            type: 'Malicious Page',
            reasons: ['URLScan malicious verdict', `Domain: ${page.domain || 'unknown'}`],
            source: 'URLScan',
          });
        });
      }
    } catch (e) {
      console.warn('[Scans History] URLScan fetch failed:', e);
    }
  }

  // 4. Fallback if no data
  if (scans.length === 0) {
    scans.push({
      id: 'fallback-1',
      url: 'bca-login-secure.xyz',
      risk: 'HIGH',
      score: 72,
      date: new Date().toLocaleDateString('id-ID', { day: 'numeric', month: 'short' }),
      type: 'Phishing BCA',
      reasons: ['Impersonasi Merek BCA', 'TLD Mencurigakan (.xyz)'],
      source: 'Fallback',
    });
  }

  // Sort by risk level
  const riskOrder = { CRITICAL: 0, HIGH: 1, MEDIUM: 2, LOW: 3 };
  scans.sort((a, b) => riskOrder[a.risk as keyof typeof riskOrder] - riskOrder[b.risk as keyof typeof riskOrder]);

  return NextResponse.json({ scans });
}

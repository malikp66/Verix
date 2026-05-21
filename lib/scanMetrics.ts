import fs from 'fs';
import path from 'path';

export interface ScanMetrics {
  totalScans: number;
  imageScans: number;
  highRiskScans: number; // score >= 60
  lastUpdated: string;
}

function getMetricsPath(): string {
  try {
    const dir = path.join(process.cwd(), 'lib');
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
    }
    return path.join(dir, 'scan_metrics.json');
  } catch (e) {
    return '/tmp/verix_scan_metrics.json';
  }
}

export function readScanMetrics(): ScanMetrics {
  const metricsPath = getMetricsPath();
  try {
    if (fs.existsSync(metricsPath)) {
      const raw = fs.readFileSync(metricsPath, 'utf8');
      return JSON.parse(raw);
    }
  } catch (e) {
    console.error('Failed to read scan metrics:', e);
  }
  return { totalScans: 0, imageScans: 0, highRiskScans: 0, lastUpdated: new Date().toISOString() };
}

export function recordScanEvent(hasImage: boolean, threatScore: number): void {
  const metrics = readScanMetrics();
  metrics.totalScans += 1;
  if (hasImage) metrics.imageScans += 1;
  if (threatScore >= 60) metrics.highRiskScans += 1;
  metrics.lastUpdated = new Date().toISOString();

  const metricsPath = getMetricsPath();
  try {
    fs.writeFileSync(metricsPath, JSON.stringify(metrics), 'utf8');
  } catch (e) {
    console.error('Failed to write scan metrics:', e);
  }
}

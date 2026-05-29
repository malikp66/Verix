export const dynamic = 'force-dynamic';

import { NextRequest, NextResponse } from 'next/server';
import { runPipeline } from '@/lib/intelPipeline';

export async function GET(request: NextRequest) {
  // 1. Get client credentials (either query param or Bearer header)
  const { searchParams } = new URL(request.url);
  const querySecret = searchParams.get('secret');

  const authHeader = request.headers.get('authorization');
  let headerSecret = null;
  if (authHeader && authHeader.toLowerCase().startsWith('bearer ')) {
    headerSecret = authHeader.substring(7).trim();
  }

  const clientSecret = querySecret || headerSecret;

  // 2. Resolve target secret from environment
  const targetSecret = process.env.CRON_SECRET;

  if (!targetSecret) {
    console.error("[Intel Cron] CRON_SECRET is not configured in the environment variables.");
    return NextResponse.json({ success: false, error: 'Cron secret is not configured' }, { status: 500 });
  }

  if (!clientSecret || clientSecret !== targetSecret) {
    console.warn("[Intel Cron] Unauthorized cron trigger attempt.");
    return NextResponse.json({ success: false, error: 'Unauthorized' }, { status: 401 });
  }

  try {
    console.log("[Intel Cron] Authorized trigger received. Executing pipeline...");
    // Run pipeline (acquires distributed lock inside to prevent concurrent runs)
    await runPipeline();
    return NextResponse.json({ success: true, message: 'Pipeline execution finished' });
  } catch (error: any) {
    console.error("[Intel Cron] Pipeline execution error:", error);
    return NextResponse.json({ success: false, error: error.message || 'Pipeline execution failed' }, { status: 500 });
  }
}

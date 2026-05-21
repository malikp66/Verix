import { NextResponse } from 'next/server';
import { getWhatsAppClientStatus } from '@/lib/whatsapp/client';

/**
 * GET handler to query the current connection state of the WhatsApp bot daemon.
 */
export async function GET() {
  try {
    const status = getWhatsAppClientStatus();
    return NextResponse.json(status);
  } catch (error: any) {
    return NextResponse.json(
      { error: error.message || 'Failed to retrieve WhatsApp bot client status' },
      { status: 500 }
    );
  }
}

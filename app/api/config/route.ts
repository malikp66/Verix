import { NextResponse } from 'next/server';

export async function GET() {
  const clientKey = process.env.NEXT_PUBLIC_MIDTRANS_CLIENT_KEY || '';
  const isProduction = 
    process.env.MIDTRANS_IS_PRODUCTION === 'true' || 
    process.env.NEXT_PUBLIC_MIDTRANS_IS_PRODUCTION === 'true' || 
    (clientKey !== '' && !clientKey.startsWith('SB-'));

  return NextResponse.json({
    clientKey,
    isProduction,
  });
}

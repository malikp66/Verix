import { NextRequest, NextResponse } from "next/server";

const MIDTRANS_SERVER_KEY = process.env.MIDTRANS_SERVER_KEY || "";
const IS_PRODUCTION = process.env.MIDTRANS_ENV === "production";

const MIDTRANS_API_URL = IS_PRODUCTION
  ? "https://app.midtrans.com/snap/v1/transactions"
  : "https://app.sandbox.midtrans.com/snap/v1/transactions";

const TIERS: Record<string, { credits: number; price: number; label: string }> = {
  starter: { credits: 10, price: 10000, label: "Starter Pack — 10 Credits" },
  popular: { credits: 50, price: 45000, label: "Popular Pack — 50 Credits" },
  pro:     { credits: 100, price: 80000, label: "Pro Pack — 100 Credits" },
};

export async function POST(req: NextRequest) {
  try {
    const { tier, userId, userEmail } = await req.json();

    if (!MIDTRANS_SERVER_KEY) {
      return NextResponse.json(
        { error: "Payment service not configured. Please set MIDTRANS_SERVER_KEY." },
        { status: 503 }
      );
    }

    if (!userId) {
      return NextResponse.json(
        { error: "Login required to purchase credits." },
        { status: 401 }
      );
    }

    const selectedTier = TIERS[tier];
    if (!selectedTier) {
      return NextResponse.json(
        { error: `Invalid tier: ${tier}. Use: starter, popular, or pro.` },
        { status: 400 }
      );
    }

    const orderId = `VERIX-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;

    const payload = {
      transaction_details: {
        order_id: orderId,
        gross_amount: selectedTier.price,
      },
      item_details: [
        {
          id: `credit-${tier}`,
          price: selectedTier.price,
          quantity: 1,
          name: selectedTier.label,
        },
      ],
      customer_details: {
        email: userEmail || "guest@verix.id",
        first_name: userEmail?.split("@")[0] || "VERIX User",
      },
      custom_field1: userId,
      custom_field2: selectedTier.credits.toString(),
      custom_field3: tier,
    };

    const authString = Buffer.from(`${MIDTRANS_SERVER_KEY}:`).toString("base64");

    const response = await fetch(MIDTRANS_API_URL, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Accept: "application/json",
        Authorization: `Basic ${authString}`,
      },
      body: JSON.stringify(payload),
    });

    const data = await response.json();

    if (!response.ok) {
      console.error("Midtrans API error:", data);
      return NextResponse.json(
        { error: "Failed to create payment transaction.", details: data },
        { status: response.status }
      );
    }

    return NextResponse.json({
      success: true,
      snapToken: data.token,
      redirectUrl: data.redirect_url,
      orderId,
      credits: selectedTier.credits,
      price: selectedTier.price,
    });
  } catch (error: any) {
    console.error("Payment creation error:", error);
    return NextResponse.json(
      { error: error.message || "Internal server error" },
      { status: 500 }
    );
  }
}

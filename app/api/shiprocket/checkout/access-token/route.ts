import { NextRequest, NextResponse } from "next/server";
import { generateCheckoutAccessToken, getShiprocketVariantId } from "@/lib/services/shiprocket-checkout";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);

    if (!body || !Array.isArray(body.items) || body.items.length === 0) {
      return NextResponse.json(
        { success: false, error: "Cart items are required to initiate checkout." },
        { status: 400 }
      );
    }

    const formattedItems = body.items.map((item: any) => ({
      variant_id: getShiprocketVariantId(item.merchandiseId || item.variantId || item.id),
      quantity: Math.max(1, Number(item.quantity) || 1),
    }));

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://boutiiquevastraa.com";
    const redirectUrl = body.redirectUrl || `${siteUrl}/checkout/success`;

    const res = await generateCheckoutAccessToken({
      items: formattedItems,
      redirectUrl,
    });

    if (!res.success || !res.token) {
      return NextResponse.json(
        { success: false, error: res.error || "Failed to generate checkout access token." },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      token: res.token,
      orderId: res.orderId,
      expiresAt: res.expiresAt,
    });
  } catch (err: any) {
    console.error("[API Shiprocket Access Token Error]:", err.message);
    return NextResponse.json(
      { success: false, error: err.message || "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { PhonePeService } from "@/lib/services/phonepe";
import { orders } from "@/lib/data-store";

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body?.orderId) {
      return NextResponse.json({ error: "Order ID is required" }, { status: 400 });
    }

    const allOrders = await orders.all();
    const order = allOrders.find((o: any) => o.id === body.orderId);
    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://boutiiquevastraa.com";
    const merchantTxnId = PhonePeService.generateTransactionId(order.orderNumber);
    const amountInINR = parseFloat(order.totalPrice?.amount || "0");

    order.merchantTransactionId = merchantTxnId;
    order.paymentAmount = amountInINR;
    order.paymentEvents = order.paymentEvents || [];
    order.paymentEvents.push({
      event: `Payment Request Initiated (${merchantTxnId})`,
      timestamp: new Date().toISOString(),
    });

    await orders.save(allOrders);

    const initiateRes = await PhonePeService.initiatePayment({
      merchantTransactionId: merchantTxnId,
      amountInINR,
      redirectUrl: `${siteUrl}/api/payment/phonepe/status?transactionId=${merchantTxnId}`,
      callbackUrl: `${siteUrl}/api/payment/phonepe/callback`,
      customerPhone: order.phone,
      customerEmail: order.email,
    });

    return NextResponse.json({
      success: true,
      redirectUrl: initiateRes.redirectUrl,
      merchantTransactionId: merchantTxnId,
    });
  } catch (err: any) {
    console.error("[PhonePe Initiate API Error]:", err.message);
    return NextResponse.json({ error: err.message || "Payment initiation failed" }, { status: 500 });
  }
}

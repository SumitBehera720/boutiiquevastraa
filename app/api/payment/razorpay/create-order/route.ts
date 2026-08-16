import { NextRequest, NextResponse } from "next/server";
import { RazorpayService } from "@/lib/services/razorpay";
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

    const amountInINR = parseFloat(order.totalPrice?.amount || "0");
    const receiptId = `order_${order.orderNumber}`;

    // Create Razorpay order
    const rzpOrder = await RazorpayService.createOrder(amountInINR, receiptId);

    // Persist Razorpay order id on our order record
    order.razorpayOrderId = rzpOrder.id;
    order.paymentAmount = amountInINR;
    order.paymentEvents = order.paymentEvents || [];
    order.paymentEvents.push({
      event: `Razorpay Order Created (${rzpOrder.id})`,
      timestamp: new Date().toISOString(),
    });

    await orders.save(allOrders);

    return NextResponse.json({
      success: true,
      razorpayOrderId: rzpOrder.id,
      amount: rzpOrder.amount,       // in paise
      currency: rzpOrder.currency,
      keyId: process.env.RAZORPAY_KEY_ID || "",
    });
  } catch (err: any) {
    console.error("[Razorpay Create Order Error]:", err.message);
    return NextResponse.json({ error: err.message || "Failed to create Razorpay order" }, { status: 500 });
  }
}

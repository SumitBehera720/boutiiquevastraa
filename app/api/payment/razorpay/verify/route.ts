import { NextRequest, NextResponse } from "next/server";
import { RazorpayService } from "@/lib/services/razorpay";
import { ShiprocketService } from "@/lib/services/shiprocket";
import { orders, products } from "@/lib/data-store";
import { sendOrderConfirmationEmail } from "@/lib/services/email";

async function restoreInventoryForOrder(order: any) {
  try {
    const lineItems = order.lineItems || order.items || [];
    if (!lineItems.length) return;

    const allProducts = await products.all();
    let changed = false;
    for (const line of lineItems) {
      const lookupId = line.merchandiseId || line.id;
      const product = allProducts.find((p: any) =>
        p.id === lookupId ||
        p.variants?.edges?.some((e: any) => e.node.id === lookupId)
      );
      if (!product) continue;

      const qty = parseInt(line.quantity) || 1;
      if (product.inventory !== null && product.inventory !== undefined) {
        product.inventory = Number(product.inventory) + qty;
        product.availableForSale = true;
        changed = true;
      }
    }
    if (changed) {
      await products.save(allProducts);
      console.log(`[Inventory Restored] Order #${order.orderNumber}: ${lineItems.length} items returned to stock.`);
    }
  } catch (err: any) {
    console.error(`[Inventory Restore Error] Order #${order.orderNumber}:`, err.message);
  }
}

/**
 * POST /api/payment/razorpay/verify
 *
 * Called from the client after the Razorpay checkout popup succeeds.
 * Verifies the HMAC signature, marks the order PAID, sends email, books shipment.
 */
export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
    }

    const { orderId, razorpay_order_id, razorpay_payment_id, razorpay_signature } = body;

    if (!orderId || !razorpay_order_id || !razorpay_payment_id || !razorpay_signature) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Verify HMAC signature
    const isValid = RazorpayService.verifySignature({
      razorpay_order_id,
      razorpay_payment_id,
      razorpay_signature,
    });

    if (!isValid) {
      console.warn("[Razorpay Verify] Invalid signature for order:", orderId);
      return NextResponse.json({ error: "Invalid payment signature" }, { status: 400 });
    }

    const allOrders = await orders.all();
    const order = allOrders.find((o: any) => o.id === orderId);

    if (!order) {
      return NextResponse.json({ error: "Order not found" }, { status: 404 });
    }

    // Idempotency check
    if (order.paymentStatus === "PAID") {
      return NextResponse.json({ success: true, message: "Order already paid", orderId: order.id });
    }

    // Mark order as PAID
    order.financialStatus = "PAID";
    order.paymentStatus = "PAID";
    order.razorpayPaymentId = razorpay_payment_id;
    order.razorpayOrderId = razorpay_order_id;
    order.paymentTime = new Date().toISOString();
    order.paymentUpdatedAt = new Date().toISOString();
    order.paymentEvents = order.paymentEvents || [];
    order.paymentEvents.push({
      event: `Payment Verified via Razorpay (${razorpay_payment_id})`,
      timestamp: new Date().toISOString(),
    });

    if (!order.emailSent) {
      order.emailSent = true;
      await orders.save(allOrders);
      try {
        await sendOrderConfirmationEmail(order);
      } catch (emailErr: any) {
        console.error(`[Razorpay Verify Email Error] Order #${order.orderNumber}:`, emailErr.message);
      }
    } else {
      await orders.save(allOrders);
    }

    // Auto-book Shiprocket shipment
    if (process.env.SHIPROCKET_AUTO_CREATE_SHIPMENT === "true" && !order.shipmentId) {
      try {
        await ShiprocketService.bookShipmentForOrder(order.id);
      } catch (err: any) {
        console.error(`[Razorpay Verify Shipment Error] Order #${order.orderNumber}:`, err.message);
      }
    }

    return NextResponse.json({ success: true, orderId: order.id, orderNumber: order.orderNumber });
  } catch (err: any) {
    console.error("[Razorpay Verify Error]:", err.message);
    return NextResponse.json({ error: err.message || "Verification failed" }, { status: 500 });
  }
}

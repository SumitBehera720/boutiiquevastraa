import { NextRequest, NextResponse } from "next/server";
import { PhonePeService } from "@/lib/services/phonepe";
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

async function findOrderByTxn(merchantTxnId: string) {
  const allOrders = await orders.all();
  return allOrders.find((o: any) => o.merchantTransactionId === merchantTxnId) || null;
}

async function verifyAndUpdateOrder(merchantTxnId: string, eventLabel: string) {
  const allOrders = await orders.all();
  const order = allOrders.find((o: any) => o.merchantTransactionId === merchantTxnId);
  if (!order || order.paymentStatus === "PAID") return null;

  const statusCheck = await PhonePeService.verifyStatus(merchantTxnId);
  order.paymentResponse = statusCheck.rawResponse;
  order.paymentUpdatedAt = new Date().toISOString();

  if (statusCheck.paymentState === "SUCCESS") {
    order.financialStatus = "PAID";
    order.paymentStatus = "PAID";
    order.phonepeTransactionId = statusCheck.phonepeTransactionId || order.phonepeTransactionId;
    order.paymentTime = new Date().toISOString();
    order.paymentEvents = order.paymentEvents || [];
    order.paymentEvents.push({ event: eventLabel, timestamp: new Date().toISOString() });

    if (!order.emailSent) {
      order.emailSent = true;
      await orders.save(allOrders);
      try {
        await sendOrderConfirmationEmail(order);
      } catch (emailErr: any) {
        console.error(`[PhonePe Webhook Email Error] Order #${order.orderNumber}:`, emailErr.message);
      }
    } else {
      await orders.save(allOrders);
    }

    if (process.env.SHIPROCKET_AUTO_CREATE_SHIPMENT === "true" && !order.shipmentId) {
      try {
        await ShiprocketService.bookShipmentForOrder(order.id);
      } catch (err: any) {
        console.error(`[PhonePe Webhook Async Shipment Error] Order #${order.orderNumber}:`, err.message);
      }
    }
    return "SUCCESS";
  }

  order.financialStatus = "PENDING";
  order.paymentStatus = "FAILED";
  order.paymentError = `Payment status: ${statusCheck.code}`;
  order.paymentEvents = order.paymentEvents || [];
  order.paymentEvents.push({ event: `${eventLabel} (${statusCheck.code})`, timestamp: new Date().toISOString() });

  // Restore inventory since payment failed
  await restoreInventoryForOrder(order);

  await orders.save(allOrders);
  return "FAILED";
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json().catch(() => null);
    if (!body) {
      return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
    }

    // ─── V1 Path: Legacy Base64 response (X-VERIFY) ────────────────────
    if (body.response && typeof body.response === "string") {
      const saltKey = process.env.PHONEPE_SALT_KEY || "";
      const saltIndex = process.env.PHONEPE_SALT_INDEX || "1";
      const xVerify = req.headers.get("x-verify") || "";

      const isValidSignature = PhonePeService.verifyCallbackSignature(body.response, xVerify, saltKey, saltIndex);
      if (!isValidSignature) {
        console.warn("[PhonePe Webhook V1] Invalid signature");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }

      let decodedPayload: any = null;
      try {
        decodedPayload = JSON.parse(Buffer.from(body.response, "base64").toString("utf-8"));
      } catch {
        return NextResponse.json({ error: "Invalid Base64 payload" }, { status: 400 });
      }

      const merchantTxnId = decodedPayload.data?.merchantTransactionId;
      if (!merchantTxnId) {
        return NextResponse.json({ error: "Missing merchantTransactionId" }, { status: 400 });
      }

      const order = await findOrderByTxn(merchantTxnId);
      if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
      if (order.paymentStatus === "PAID") {
        return NextResponse.json({ success: true, message: "Order already paid" });
      }

      await verifyAndUpdateOrder(merchantTxnId, "Payment Verified via Webhook V1");
      return NextResponse.json({ success: true });
    }

    // ─── V2 Path: Plain JSON callback (Authorization: SHA256) ──────────
    const authHeader = req.headers.get("authorization") || "";
    const webhookUser = process.env.PHONEPE_WEBHOOK_USERNAME || "";
    const webhookPass = process.env.PHONEPE_WEBHOOK_PASSWORD || "";

    if (webhookUser && webhookPass) {
      const isValid = PhonePeService.verifyWebhookV2(authHeader, webhookUser, webhookPass);
      if (!isValid) {
        console.warn("[PhonePe Webhook V2] Invalid Authorization header");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    } else {
      console.warn("[PhonePe Webhook V2] No webhook credentials configured — skipping verification.");
    }

    const payload = body.payload || body;
    const merchantTxnId = payload.merchantOrderId || body.merchantOrderId || payload.data?.merchantTransactionId;
    if (!merchantTxnId) {
      return NextResponse.json({ error: "Missing merchantOrderId" }, { status: 400 });
    }

    const order = await findOrderByTxn(merchantTxnId);
    if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
    if (order.paymentStatus === "PAID") {
      return NextResponse.json({ success: true, message: "Order already paid" });
    }

    await verifyAndUpdateOrder(merchantTxnId, "Payment Verified via Webhook V2");
    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[PhonePe Webhook Error]:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

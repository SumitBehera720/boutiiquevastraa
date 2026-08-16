import { NextRequest, NextResponse } from "next/server";
import { orders } from "@/lib/data-store";

export async function POST(req: NextRequest) {
  try {
    // 1. Webhook Authentication
    const token = process.env.SHIPROCKET_WEBHOOK_TOKEN;
    if (token) {
      const apiKey = req.headers.get("x-api-key") || req.nextUrl.searchParams.get("token");
      if (apiKey !== token) {
        console.warn("[Shiprocket Webhook] Unauthorized request received.");
        return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
      }
    }

    const payload = await req.json().catch(() => null);
    if (!payload) {
      return NextResponse.json({ error: "Invalid payload" }, { status: 400 });
    }

    console.log("[Shiprocket Webhook] Payload received:", JSON.stringify(payload));

    const shipmentId = parseInt(payload.shipment_id || payload.shipmentId);
    const awb = payload.awb || payload.awb_code || payload.awbNumber;
    const currentStatus = payload.current_status || payload.status || payload.shipment_status;

    if (!shipmentId && !awb) {
      return NextResponse.json({ error: "Missing shipment_id or awb" }, { status: 400 });
    }

    const allOrders = await orders.all();
    const order = allOrders.find(
      (o: any) =>
        (shipmentId && o.shipmentId === shipmentId) ||
        (awb && o.awbNumber === awb)
    );

    if (!order) {
      console.warn(`[Shiprocket Webhook] No matching order found for Shipment ID: ${shipmentId}, AWB: ${awb}`);
      return NextResponse.json({ message: "Order not found in system" }, { status: 404 });
    }

    const oldShipmentStatus = order.shipmentStatus;

    // Update logistics statuses
    if (currentStatus) {
      order.shipmentStatus = currentStatus;

      // Map Shiprocket sub-status to high-level fulfillment status
      const statusUpper = String(currentStatus).toUpperCase();
      if (statusUpper.includes("DELIVERED")) {
        order.fulfillmentStatus = "DELIVERED";
      } else if (
        statusUpper.includes("SHIPPED") ||
        statusUpper.includes("OUT FOR DELIVERY") ||
        statusUpper.includes("IN TRANSIT") ||
        statusUpper.includes("PICKED UP")
      ) {
        order.fulfillmentStatus = "SHIPPED";
      } else if (statusUpper.includes("CANCELLED") || statusUpper.includes("RTO")) {
        order.fulfillmentStatus = "CANCELLED";
      }
    }

    order.shiprocketResponse = {
      ...(order.shiprocketResponse || {}),
      webhook_payload: payload,
    };
    order.shiprocketUpdatedAt = new Date().toISOString();
    order.shipmentLastSynced = new Date().toISOString();

    await orders.save(allOrders);
    console.log(`[Shiprocket Webhook] Successfully updated Order #VSTR-${order.orderNumber} status to: ${currentStatus}`);

    // Status update email trigger
    if (currentStatus) {
      const statusUpper = String(currentStatus).toUpperCase();
      const oldStatusUpper = String(oldShipmentStatus || "").toUpperCase();
      
      if (statusUpper !== oldStatusUpper) {
        let shouldSendEmail = false;
        let emailStatusLabel = "";
        
        if (statusUpper.includes("DELIVERED")) {
          shouldSendEmail = true;
          emailStatusLabel = "DELIVERED";
        } else if (statusUpper.includes("OUT FOR DELIVERY") || statusUpper.includes("OUT_FOR_DELIVERY")) {
          shouldSendEmail = true;
          emailStatusLabel = "OUT_FOR_DELIVERY";
        } else if (statusUpper.includes("SHIPPED") || statusUpper.includes("PICKED UP") || statusUpper.includes("IN TRANSIT")) {
          const wasAlreadyShipped = oldStatusUpper.includes("SHIPPED") || oldStatusUpper.includes("PICKED UP") || oldStatusUpper.includes("IN TRANSIT");
          if (!wasAlreadyShipped) {
            shouldSendEmail = true;
            emailStatusLabel = "SHIPPED";
          }
        } else if (statusUpper.includes("CANCELLED") || statusUpper.includes("RTO")) {
          shouldSendEmail = true;
          emailStatusLabel = "CANCELLED";
        }
        
        if (shouldSendEmail) {
          try {
            const { sendOrderStatusUpdateEmail } = await import("@/lib/services/email");
            const trackingDetails = {
              courier: payload.courier_name || order.courierName || "Shiprocket",
              awb: awb || order.awbNumber || "",
              link: awb ? `https://shiprocket.co/tracking/${awb}` : ""
            };
            await sendOrderStatusUpdateEmail(order, emailStatusLabel, trackingDetails);
          } catch (err: any) {
            console.error("[Shiprocket Webhook Email Trigger Error]:", err.message);
          }
        }
      }
    }

    return NextResponse.json({ success: true });
  } catch (err: any) {
    console.error("[Shiprocket Webhook Error]:", err.message);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

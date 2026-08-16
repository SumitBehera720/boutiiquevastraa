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

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const transactionId = searchParams.get("transactionId") || searchParams.get("id");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.get("host") || "boutiiquevastraa.com"}`;

  function redirect(path: string) {
    return NextResponse.redirect(new URL(path, siteUrl));
  }

  if (!transactionId) {
    return redirect("/checkout?error=Missing+Transaction+ID");
  }

  try {
    const allOrders = await orders.all();
    const order = allOrders.find((o: any) => o.merchantTransactionId === transactionId);

    if (!order) {
      return redirect("/checkout?error=Order+not+found");
    }

    if (order.paymentStatus === "PAID") {
      return redirect(`/checkout/success?orderId=${order.id}`);
    }

    const statusCheck = await PhonePeService.verifyStatus(transactionId);
    order.paymentResponse = statusCheck.rawResponse;
    order.paymentUpdatedAt = new Date().toISOString();

    if (statusCheck.paymentState === "SUCCESS") {
      order.financialStatus = "PAID";
      order.paymentStatus = "PAID";
      order.phonepeTransactionId = statusCheck.phonepeTransactionId || order.phonepeTransactionId;
      order.paymentTime = new Date().toISOString();
      order.paymentEvents = order.paymentEvents || [];
      order.paymentEvents.push({
        event: "Payment Verified via Return Redirect (SUCCESS)",
        timestamp: new Date().toISOString(),
      });

      if (!order.emailSent) {
        order.emailSent = true;
        await orders.save(allOrders);
        try {
          await sendOrderConfirmationEmail(order);
        } catch (emailErr: any) {
          console.error(`[PhonePe Return Email Error] Order #${order.orderNumber}:`, emailErr.message);
        }
      } else {
        await orders.save(allOrders);
      }

      if (process.env.SHIPROCKET_AUTO_CREATE_SHIPMENT === "true" && !order.shipmentId) {
        try {
          await ShiprocketService.bookShipmentForOrder(order.id);
        } catch (err: any) {
          console.error(`[PhonePe Return Async Shipment Error] Order #${order.orderNumber}:`, err.message);
        }
      }

      return redirect(`/checkout/success?orderId=${order.id}`);
    } else {
      order.financialStatus = "PENDING";
      order.paymentStatus = "FAILED";
      order.paymentError = `Payment status: ${statusCheck.code}`;
      order.paymentEvents = order.paymentEvents || [];
      order.paymentEvents.push({
        event: `Payment Verified via Return Redirect (${statusCheck.code})`,
        timestamp: new Date().toISOString(),
      });

      await restoreInventoryForOrder(order);
      await orders.save(allOrders);

      return redirect(`/checkout?error=Payment+was+not+completed+(${encodeURIComponent(statusCheck.code)})`);
    }
  } catch (err: any) {
    console.error("[PhonePe Return Status Error]:", err.message);
    return redirect("/checkout?error=Verification+error");
  }
}

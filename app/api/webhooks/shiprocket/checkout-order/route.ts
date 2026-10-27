import { NextRequest, NextResponse } from "next/server";
import { orders, products, generateId } from "@/lib/data-store";
import { sendOrderConfirmationEmail } from "@/lib/services/email";

export async function POST(req: NextRequest) {
  try {
    const payload = await req.json().catch(() => null);

    if (!payload) {
      return NextResponse.json({ error: "Invalid JSON payload" }, { status: 400 });
    }

    console.log("[Shiprocket Checkout Webhook] Received payload:", JSON.stringify(payload));

    const fastrrOrderId = payload.order_id || payload.fastrr_order_id || payload.id;
    const items = payload.cart_data?.items || payload.items || [];
    const status = (payload.status || "SUCCESS").toUpperCase();

    // Check if order already exists in our database
    const allOrders = await orders.all();
    const existing = allOrders.find(
      (o: any) => o.fastrrOrderId === fastrrOrderId || (fastrrOrderId && o.id === fastrrOrderId)
    );

    if (existing) {
      console.log(`[Shiprocket Checkout Webhook] Order ${fastrrOrderId} already processed.`);
      return NextResponse.json({ success: true, message: "Order already processed", orderNumber: existing.orderNumber });
    }

    const orderNumber = Math.floor(10000 + Math.random() * 89999);
    const orderId = generateId();

    const isPrepaid = payload.payment_type !== "CASH_ON_DELIVERY";
    const paymentMethod = isPrepaid ? "PREPAID (Fastrr)" : "COD (Fastrr)";
    const financialStatus = isPrepaid ? "PAID" : "UNPAID";

    // Deduct inventory for items
    const allProducts = await products.all();
    const lineItems: any[] = [];

    for (const item of items) {
      const vId = String(item.variant_id || item.id || "");
      const qty = parseInt(item.quantity) || 1;

      // Find matching product or variant
      const foundProduct = allProducts.find(
        (p: any) =>
          p.id === vId ||
          String(p.id).includes(vId) ||
          p.variants?.edges?.some((e: any) => String(e.node?.id).includes(vId))
      );

      const price = item.price || foundProduct?.priceRange?.minVariantPrice?.amount || "0";
      const title = item.name || item.title || foundProduct?.title || "Item";

      lineItems.push({
        id: vId,
        merchandiseId: vId,
        title,
        price: String(price),
        quantity: qty,
        image: foundProduct?.images?.edges?.[0]?.node?.url || "/images/saree.jpg",
      });

      if (foundProduct && foundProduct.inventory !== null && foundProduct.inventory !== undefined) {
        foundProduct.inventory = Math.max(0, Number(foundProduct.inventory) - qty);
        if (foundProduct.inventory === 0) {
          foundProduct.availableForSale = false;
        }
      }
    }
    await products.save(allProducts);

    const totalAmount = parseFloat(payload.total_amount_payable || payload.total_price || "0").toFixed(2);
    const customerName = `${payload.first_name || ""} ${payload.last_name || ""}`.trim() || payload.customer_name || "Customer";

    const order = {
      id: orderId,
      orderNumber,
      fastrrOrderId,
      customerName,
      email: payload.email || "",
      phone: payload.phone || payload.phone_number || "",
      customer: {
        name: customerName,
        firstName: payload.first_name || "",
        lastName: payload.last_name || "",
        phone: payload.phone || "",
        email: payload.email || "",
      },
      shippingAddress: payload.shipping_address || {
        address1: payload.address || "",
        city: payload.city || "",
        province: payload.state || "",
        zip: payload.pincode || "",
        country: payload.country || "India",
      },
      paymentMethod,
      lineItems,
      items: lineItems,
      totalPrice: { amount: totalAmount, currencyCode: "INR" },
      financialStatus,
      fulfillmentStatus: "UNFULFILLED",
      createdAt: new Date().toISOString(),
      processedAt: new Date().toISOString(),
      fastrrPayload: payload,
    };

    allOrders.push(order);
    await orders.save(allOrders);

    // Send confirmation email
    try {
      await sendOrderConfirmationEmail(order);
    } catch (err: any) {
      console.error(`[Email Error] Fastrr Order #${orderNumber}:`, err.message);
    }

    console.log(`[Shiprocket Checkout Webhook] Successfully created Order #VSTR-${orderNumber} from Fastrr.`);

    return NextResponse.json({
      success: true,
      orderId: order.id,
      orderNumber: order.orderNumber,
    });
  } catch (err: any) {
    console.error("[Shiprocket Checkout Webhook Error]:", err.message);
    return NextResponse.json({ error: err.message || "Internal server error" }, { status: 500 });
  }
}

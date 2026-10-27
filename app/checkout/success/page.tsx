import { serverGetOrders, serverGetOrder, serverGetAuthUser } from "@/lib/server-data";
import { cookies } from "next/headers";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ShoppingBag, Truck, Calendar, ArrowRight, PackageCheck, Clock, ShieldCheck } from "lucide-react";
import { Metadata } from "next";
import AutoRefreshOrder from "./AutoRefreshOrder";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export const metadata: Metadata = {
  title: "Order Confirmed | Boutiique Vastraa",
  description: "Thank you for your order at Boutiique Vastraa.",
};

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await searchParams;

  const getParam = (key: string): string => {
    const val = resolvedParams[key];
    if (Array.isArray(val)) return val[0] || "";
    return val ? String(val).trim() : "";
  };

  const orderId = getParam("orderId") || getParam("order_id") || getParam("id") || "";
  const orderNumberParam = getParam("number") || getParam("orderNumber") || getParam("order_number") || "";
  const shipmentId = getParam("shipment_id") || getParam("shiprocket_order_id") || "";
  const paymentId = getParam("payment_id") || getParam("razorpay_payment_id") || "";
  const transactionId = getParam("transactionId") || getParam("merchantTransactionId") || "";

  const primaryLookupKey = orderId || orderNumberParam || shipmentId || paymentId || transactionId;

  // 1. Attempt direct single-order lookup
  let order = primaryLookupKey ? await serverGetOrder(primaryLookupKey) : null;

  // 2. If not found by primary key, try secondary orderNumberParam
  if (!order && orderNumberParam && orderNumberParam !== primaryLookupKey) {
    order = await serverGetOrder(orderNumberParam);
  }

  // 3. Fallback to broad scan of orders with multiple identifier formats
  if (!order) {
    const orders = await serverGetOrders();
    const cleanNum = primaryLookupKey.replace(/[^0-9]/g, "");

    order = orders.find((o: any) => {
      if (!o) return false;
      if (primaryLookupKey && o.id === primaryLookupKey) return true;
      if (primaryLookupKey && String(o.orderNumber) === primaryLookupKey) return true;
      if (cleanNum && String(o.orderNumber) === cleanNum) return true;
      if (orderNumberParam && String(o.orderNumber) === orderNumberParam) return true;
      if (primaryLookupKey && o.razorpayOrderId === primaryLookupKey) return true;
      if (paymentId && (o.razorpayPaymentId === paymentId || o.razorpayOrderId === paymentId)) return true;
      if (transactionId && (o.merchantTransactionId === transactionId || o.phonepeTransactionId === transactionId)) return true;
      if (shipmentId && (String(o.shipmentId) === shipmentId || o.awbNumber === shipmentId)) return true;
      if (primaryLookupKey && `#VSTR-${o.orderNumber}`.toLowerCase() === primaryLookupKey.toLowerCase()) return true;
      return false;
    }) || null;

    // 4. Fallback: check if logged-in customer placed an order in the last 2 hours
    if (!order) {
      try {
        const cookieStore = await cookies();
        const customerToken = cookieStore.get("boutiique_vastraa_customer_token")?.value;
        if (customerToken) {
          const user = await serverGetAuthUser(customerToken);
          if (user?.email) {
            const twoHoursAgo = Date.now() - 2 * 60 * 60 * 1000;
            const recentOrder = orders.find((o: any) => {
              const orderEmail = (o.email || o.customer?.email || "").toLowerCase();
              const orderTime = new Date(o.createdAt || o.processedAt || 0).getTime();
              return orderEmail === user.email.toLowerCase() && orderTime > twoHoursAgo;
            });
            if (recentOrder) {
              order = recentOrder;
            }
          }
        }
      } catch {
        // Ignore cookie/session check errors
      }
    }
  }

  // Calculate estimated delivery
  const processedDate = new Date(order?.processedAt || order?.createdAt || new Date());
  const estMin = new Date(processedDate);
  estMin.setDate(processedDate.getDate() + 5);
  const estMax = new Date(processedDate);
  estMax.setDate(processedDate.getDate() + 7);
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  const estDeliveryStr = `${estMin.toLocaleDateString("en-US", options)} - ${estMax.toLocaleDateString("en-US", options)}`;

  // Display fields with safe fallbacks
  const displayOrderNumber = order?.orderNumber || orderNumberParam || (primaryLookupKey.replace(/[^0-9]/g, "") || "CONFIRMED");
  const customerName = order?.customerName || order?.customer?.name || `${order?.customer?.firstName || ""} ${order?.customer?.lastName || ""}`.trim() || "Valued Customer";
  const items = ((order?.lineItems || order?.items || order?.lines || []) as any[]);
  const shippingAddress = order?.shippingAddress || {};
  const totalAmountStr = order?.totalPrice?.amount ?? order?.total ?? order?.subtotal ?? "0.00";
  const totalAmountNum = parseFloat(String(totalAmountStr)) || 0;

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-16 px-4 md:px-6">
      <div className="container mx-auto max-w-3xl bg-white rounded-2xl shadow-sm border border-gray-100 p-8 md:p-12">
        
        {/* Success Header Banner */}
        <div className="text-center mb-10">
          <CheckCircle2 className="w-16 h-16 text-[#C9A84C] mx-auto mb-4 animate-scaleUp" />
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-maroonClr mb-3">
            Order Confirmed!
          </h1>
          <p className="text-neutral-600 text-sm md:text-base max-w-md mx-auto">
            Thank you, <span className="font-semibold text-gray-800">{customerName}</span>. Your order has been placed successfully and is being handcrafted by our weavers.
          </p>
        </div>

        {/* Order Quick Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-y border-gray-100 py-6 mb-8 text-center md:text-left">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest block">Order Number</span>
            <span className="font-mono text-gray-800 font-bold text-base">#VSTR-{displayOrderNumber}</span>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest block flex items-center justify-center md:justify-start gap-1">
              <Calendar className="w-3.5 h-3.5 text-goldClr" /> Est. Delivery
            </span>
            <span className="text-gray-800 font-semibold text-sm">{estDeliveryStr}</span>
          </div>
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest block flex items-center justify-center md:justify-start gap-1">
              <Truck className="w-3.5 h-3.5 text-goldClr" /> Shipping Method
            </span>
            <span className="text-gray-800 font-semibold text-sm">Free Express Shipping</span>
          </div>
        </div>

        {/* Order Details: If items are present */}
        {order && items.length > 0 ? (
          <div className="space-y-8">
            {/* Items Summary */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-4">Items Ordered</h3>
              <div className="space-y-4">
                {items.map((item: any, index: number) => {
                  const itemImg = item.image || item.images?.[0]?.url || item.images?.[0] || null;
                  const itemTitle = item.title || item.name || "Handcrafted Saree";
                  const itemVariant = item.variantTitle || item.variant?.title || "Standard";
                  const itemQty = item.quantity || 1;
                  const itemPrice = parseFloat(item.price || item.unitPrice || 0);

                  return (
                    <div key={index} className="flex gap-4 items-center">
                      <div className="w-12 h-16 bg-gray-50 relative rounded overflow-hidden border border-gray-100 flex-shrink-0">
                        {itemImg ? (
                          <Image
                            src={itemImg}
                            alt={itemTitle}
                            fill
                            className="object-cover"
                            sizes="48px"
                          />
                        ) : (
                          <div className="absolute inset-0 bg-maroonClr/5 flex items-center justify-center text-maroonClr/20 font-bold text-[10px]">
                            Saree
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 text-sm truncate">{itemTitle}</h4>
                        <p className="text-xs text-gray-500 font-medium">Variant: {itemVariant}</p>
                        <p className="text-xs text-gray-400">Quantity: {itemQty}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-800 text-sm">
                          {item.isGift ? (
                            <span className="text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded text-xs border border-green-100">FREE</span>
                          ) : (
                            `₹${itemPrice.toFixed(0)}`
                          )}
                        </span>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Calculations Table */}
            <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 space-y-3">
              <div className="flex justify-between text-sm text-gray-600 font-medium">
                <span>Subtotal</span>
                <span>₹{totalAmountNum.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm text-gray-600 font-medium">
                <span>Shipping</span>
                <span className="text-green-600 font-semibold uppercase tracking-wider text-xs">Free</span>
              </div>
              <div className="border-t border-gray-200 pt-3 flex justify-between items-center text-gray-800">
                <span className="font-bold uppercase tracking-wider text-xs">Total Paid</span>
                <span className="font-bold text-lg text-maroonClr">₹{totalAmountNum.toFixed(2)}</span>
              </div>
            </div>

            {/* Delivery Address Details */}
            <div>
              <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3">Delivery Address</h3>
              <div className="text-gray-600 text-sm bg-gray-50 rounded-xl p-6 border border-gray-100 space-y-1">
                <p className="font-semibold text-gray-800">{customerName}</p>
                {shippingAddress.address1 && <p>{shippingAddress.address1}</p>}
                {shippingAddress.address2 && <p>{shippingAddress.address2}</p>}
                {(shippingAddress.city || shippingAddress.province || shippingAddress.zip) && (
                  <p>
                    {[shippingAddress.city, shippingAddress.province, shippingAddress.zip].filter(Boolean).join(", ")}
                  </p>
                )}
                {shippingAddress.country && <p>{shippingAddress.country}</p>}
                {(order.phone || shippingAddress.phone) && (
                  <p className="pt-2 text-xs text-gray-500 font-medium">
                    Contact Phone: {order.phone || shippingAddress.phone}
                  </p>
                )}
              </div>
            </div>
          </div>
        ) : (
          /* Graceful, reassuring order processing overview when itemized record is syncing */
          <div className="space-y-6">
            <div className="bg-amber-50/60 border border-amber-200/70 rounded-xl p-6 space-y-3 text-neutral-700">
              <div className="flex items-center gap-2 text-amber-800 font-semibold text-sm">
                <Clock className="w-4 h-4 text-amber-600" />
                <span>Your order has been recorded and is syncing with our dispatch center</span>
              </div>
              <p className="text-xs leading-relaxed text-neutral-600">
                We have received your payment and order details. A formal invoice with tracking details has been dispatched to your email. Our master artisans are preparing your handloom sarees for dispatch.
              </p>
            </div>

            {/* Next Steps Progress Cards */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 pt-2">
              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-green-100 text-green-700 flex items-center justify-center mb-2">
                  <CheckCircle2 className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-gray-800 text-sm mb-1">1. Order Placed</h4>
                <p className="text-xs text-gray-500">Confirmed & verified by our system</p>
              </div>

              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-amber-100 text-amber-700 flex items-center justify-center mb-2">
                  <PackageCheck className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-gray-800 text-sm mb-1">2. Handcrafted</h4>
                <p className="text-xs text-gray-500">Rigorous 100% pure silk inspection</p>
              </div>

              <div className="p-4 rounded-xl border border-gray-100 bg-gray-50/50 flex flex-col items-center text-center">
                <div className="w-10 h-10 rounded-full bg-maroonClr/10 text-maroonClr flex items-center justify-center mb-2">
                  <ShieldCheck className="w-5 h-5" />
                </div>
                <h4 className="font-semibold text-gray-800 text-sm mb-1">3. Express Delivery</h4>
                <p className="text-xs text-gray-500">Shipped with live tracking link</p>
              </div>
            </div>

            <AutoRefreshOrder targetId={displayOrderNumber} />
          </div>
        )}

        {/* Action Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/products"
            className="w-full sm:w-auto bg-maroonClr text-white px-8 py-3.5 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-[#6A102A] transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" /> Continue Shopping
          </Link>
          
          <Link
            href={`/track-order?order_number=${encodeURIComponent(displayOrderNumber)}`}
            className="w-full sm:w-auto border border-maroonClr text-maroonClr px-8 py-3.5 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-maroonClr/5 transition-colors flex items-center justify-center gap-2"
          >
            Track Your Order <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}

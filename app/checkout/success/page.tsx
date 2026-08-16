import { serverGetOrders } from "@/lib/server-data";
import { notFound } from "next/navigation";
import Image from "next/image";
import Link from "next/link";
import { CheckCircle2, ShoppingBag, Truck, Calendar, ArrowRight } from "lucide-react";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Order Confirmed | Boutiique Vastraa",
  description: "Thank you for your order at Boutiique Vastraa.",
};

export default async function SuccessPage({
  searchParams,
}: {
  searchParams: Promise<{ orderId?: string }>;
}) {
  const resolvedSearchParams = await searchParams;
  const orderId = resolvedSearchParams.orderId || "";

  // Fetch order
  const orders = await serverGetOrders();
  const order = orders.find(o => o.id === orderId);

  if (!order) {
    notFound();
  }

  // Calculate estimated delivery: 5-7 days from processedAt
  const processedDate = new Date(order.processedAt || order.createdAt || new Date());
  const estMin = new Date(processedDate);
  estMin.setDate(processedDate.getDate() + 5);
  const estMax = new Date(processedDate);
  estMax.setDate(processedDate.getDate() + 7);

  const options: Intl.DateTimeFormatOptions = { month: 'short', day: 'numeric', year: 'numeric' };
  const estDeliveryStr = `${estMin.toLocaleDateString('en-US', options)} - ${estMax.toLocaleDateString('en-US', options)}`;

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
            Thank you, <span className="font-semibold text-gray-800">{order.customerName}</span>. Your order has been placed successfully and is being handcrafted by our weavers.
          </p>
        </div>

        {/* Order Quick Info Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 border-y border-gray-100 py-6 mb-8 text-center md:text-left">
          <div className="space-y-1">
            <span className="text-xs font-semibold text-gray-400 uppercase tracking-widest block">Order Number</span>
            <span className="font-mono text-gray-800 font-bold text-base">#VSTR-{order.orderNumber}</span>
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

        {/* Order Details */}
        <div className="space-y-8">
          
          {/* Items Summary */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-4">Items Ordered</h3>
            <div className="space-y-4">
              {((order.lineItems || order.items || []) as any[]).map((item: any, index: number) => (
                <div key={index} className="flex gap-4 items-center">
                  <div className="w-12 h-16 bg-gray-50 relative rounded overflow-hidden border border-gray-100 flex-shrink-0">
                    {item.image ? (
                      <Image
                        src={item.image}
                        alt={item.title}
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
                    <h4 className="font-semibold text-gray-800 text-sm truncate">{item.title}</h4>
                    <p className="text-xs text-gray-500 font-medium">Variant: {item.variantTitle}</p>
                    <p className="text-xs text-gray-400">Quantity: {item.quantity}</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-gray-800 text-sm">
                      {item.isGift ? (
                        <span className="text-green-600 font-bold bg-green-50 px-1.5 py-0.5 rounded text-xs border border-green-100">FREE</span>
                      ) : (
                        `₹${parseFloat(item.price).toFixed(0)}`
                      )}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* Calculations Table */}
          <div className="bg-gray-50 rounded-xl p-6 border border-gray-100 space-y-3">
            <div className="flex justify-between text-sm text-gray-600 font-medium">
              <span>Subtotal</span>
              <span>₹{parseFloat(order.totalPrice.amount).toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm text-gray-600 font-medium">
              <span>Shipping</span>
              <span className="text-green-600 font-semibold uppercase tracking-wider text-xs">Free</span>
            </div>
            <div className="border-t border-gray-200 pt-3 flex justify-between items-center text-gray-800">
              <span className="font-bold uppercase tracking-wider text-xs">Total Paid</span>
              <span className="font-bold text-lg text-maroonClr">₹{parseFloat(order.totalPrice.amount).toFixed(2)}</span>
            </div>
          </div>

          {/* Delivery Address Details */}
          <div>
            <h3 className="text-sm font-bold text-gray-800 uppercase tracking-widest mb-3">Delivery Address</h3>
            <div className="text-gray-600 text-sm bg-gray-50 rounded-xl p-6 border border-gray-100 space-y-1">
              <p className="font-semibold text-gray-800">{order.customerName}</p>
              <p>{order.shippingAddress.address1}</p>
              {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
              <p>{order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.zip}</p>
              <p>{order.shippingAddress.country}</p>
              <p className="pt-2 text-xs text-gray-500 font-medium">Contact Phone: {order.phone}</p>
            </div>
          </div>

        </div>

        {/* Action Buttons */}
        <div className="mt-12 flex flex-col sm:flex-row gap-4 justify-center items-center">
          <Link
            href="/products"
            className="w-full sm:w-auto bg-maroonClr text-white px-8 py-3.5 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-[#6A102A] transition-colors flex items-center justify-center gap-2 shadow-sm"
          >
            <ShoppingBag className="w-4 h-4" /> Continue Shopping
          </Link>
          
          <Link
            href="/track-order"
            className="w-full sm:w-auto border border-maroonClr text-maroonClr px-8 py-3.5 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-maroonClr/5 transition-colors flex items-center justify-center gap-2"
          >
            Track Your Order <ArrowRight className="w-4 h-4" />
          </Link>
        </div>

      </div>
    </div>
  );
}

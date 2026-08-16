"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { FileText, MapPin, Package, CheckCircle2, Clock, Truck } from "lucide-react";
import OrderInvoiceModal from "./OrderInvoiceModal";

export default function OrderHistory({ orders }: { orders: any[] }) {
  const [selectedInvoiceOrder, setSelectedInvoiceOrder] = useState<any | null>(null);

  if (!orders || orders.length === 0) {
    return (
      <div className="bg-white p-8 rounded-lg shadow-sm border border-gray-100 text-center">
        <h3 className="text-xl font-serif text-gray-800 mb-2">No Orders Yet</h3>
        <p className="text-gray-500 mb-6">You haven't placed any orders with us.</p>
        <Link 
          href="/collections/all"
          className="bg-primary text-white px-6 py-2 rounded text-sm font-bold uppercase tracking-wider hover:bg-[#6A102A] transition-colors inline-block"
        >
          Start Shopping
        </Link>
      </div>
    );
  }

  const getItemImage = (item: any): string => {
    if (typeof item.image === "string" && item.image.trim()) return item.image;
    if (item.image?.url) return item.image.url;
    if (item.variant?.image?.url) return item.variant.image.url;
    if (typeof item.variant?.image === "string" && item.variant.image.trim()) return item.variant.image;
    if (item.picture) return item.picture;
    if (item.featuredImage?.url) return item.featuredImage.url;
    return "/images/placeholder.jpg";
  };

  const getItemPrice = (item: any): number => {
    if (typeof item.price === "number") return item.price;
    if (typeof item.price === "string") return parseFloat(item.price) || 0;
    if (item.price?.amount) return parseFloat(item.price.amount) || 0;
    return 0;
  };

  const getItemVariant = (item: any): string => {
    if (item.variantTitle && item.variantTitle !== "Default Title") return item.variantTitle;
    if (Array.isArray(item.selectedOptions)) {
      const opts = item.selectedOptions.filter((o: any) => o.name !== "Title" && o.value !== "Default Title");
      if (opts.length > 0) return opts.map((o: any) => `${o.name}: ${o.value}`).join(", ");
    }
    return "";
  };

  const getLineItems = (order: any): any[] => {
    if (order.lineItems?.edges) return order.lineItems.edges.map((e: any) => e.node);
    if (Array.isArray(order.lineItems)) return order.lineItems;
    if (Array.isArray(order.items)) return order.items;
    if (Array.isArray(order.line_items)) return order.line_items;
    return [];
  };

  return (
    <div className="space-y-6">
      {orders.map((order) => {
        const items = getLineItems(order);
        const orderTotal = typeof order.totalPrice === "number"
          ? order.totalPrice
          : parseFloat(order.totalPrice?.amount || order.totalAmount || "0") || 0;

        const orderDate = order.processedAt || order.createdAt
          ? new Date(order.processedAt || order.createdAt).toLocaleDateString("en-IN", {
              day: "numeric",
              month: "short",
              year: "numeric"
            })
          : "N/A";

        const shippingAddr = order.shippingAddress;
        const addressSummary = shippingAddr
          ? [shippingAddr.address1, shippingAddr.city, shippingAddr.province || shippingAddr.state, shippingAddr.zip || shippingAddr.pincode].filter(Boolean).join(", ")
          : null;

        return (
          <div key={order.id} className="bg-white border border-gray-200 rounded-xl overflow-hidden shadow-sm hover:shadow-md transition-shadow">
            {/* Header */}
            <div className="bg-gray-50/80 px-6 py-4 border-b border-gray-200 flex flex-wrap justify-between items-center gap-4">
              <div className="flex flex-wrap items-center gap-6">
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Order Placed</p>
                  <p className="text-xs sm:text-sm font-semibold text-gray-800">{orderDate}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Total Paid</p>
                  <p className="text-xs sm:text-sm font-bold text-maroonClr">₹{orderTotal.toFixed(2)}</p>
                </div>
                <div>
                  <p className="text-[10px] text-gray-500 uppercase tracking-widest font-bold">Order Number</p>
                  <p className="text-xs sm:text-sm font-bold font-mono text-gray-900">#VSTR-{order.orderNumber || order.id}</p>
                </div>
              </div>

              {/* Status Badges & Invoice Button */}
              <div className="flex items-center gap-3">
                <div className="flex gap-2">
                  <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                    order.financialStatus === "PAID" 
                      ? "bg-green-50 text-green-700 border-green-200" 
                      : "bg-amber-50 text-amber-700 border-amber-200"
                  }`}>
                    {order.financialStatus || "UNPAID"}
                  </span>
                  <span className={`px-2.5 py-1 text-[11px] font-bold rounded-full border ${
                    order.fulfillmentStatus === "FULFILLED" || order.fulfillmentStatus === "DELIVERED"
                      ? "bg-blue-50 text-blue-700 border-blue-200" 
                      : "bg-gray-100 text-gray-700 border-gray-200"
                  }`}>
                    {order.fulfillmentStatus || "UNFULFILLED"}
                  </span>
                </div>

                <button
                  type="button"
                  onClick={() => setSelectedInvoiceOrder(order)}
                  className="bg-white border border-maroonClr/30 text-maroonClr hover:bg-maroonClr hover:text-white px-3 py-1.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5 shadow-sm"
                >
                  <FileText className="w-3.5 h-3.5" /> Invoice
                </button>
              </div>
            </div>

            {/* Content Body */}
            <div className="p-6 space-y-6">
              {/* Line Items */}
              <div className="divide-y divide-gray-100">
                {items.length === 0 ? (
                  <p className="text-xs text-gray-500 italic py-2">No item details recorded for this order.</p>
                ) : (
                  items.map((item: any, index: number) => {
                    const imgSrc = getItemImage(item);
                    const price = getItemPrice(item);
                    const qty = item.quantity || 1;
                    const variantText = getItemVariant(item);

                    return (
                      <div key={index} className="py-4 first:pt-0 last:pb-0 flex items-start gap-4">
                        <div className="relative w-16 h-20 bg-gray-50 rounded-lg border border-gray-200 overflow-hidden flex-shrink-0">
                          <Image 
                            src={imgSrc} 
                            alt={item.title || "Product"} 
                            fill 
                            className="object-cover"
                            sizes="64px"
                          />
                        </div>
                        <div className="flex-1 min-w-0">
                          <h4 className="font-semibold text-gray-900 text-sm line-clamp-2">{item.title || "Product Item"}</h4>
                          
                          {variantText && (
                            <span className="inline-block mt-1 bg-gray-100 text-gray-700 text-[10px] font-semibold px-2 py-0.5 rounded border border-gray-200">
                              {variantText}
                            </span>
                          )}

                          <div className="flex items-center gap-4 mt-2 text-xs text-gray-500">
                            <span>Qty: <strong className="text-gray-800 font-semibold">{qty}</strong></span>
                            {price > 0 && (
                              <span>Price: <strong className="text-gray-800 font-semibold">₹{price.toFixed(2)}</strong></span>
                            )}
                          </div>
                        </div>

                        {price > 0 && (
                          <div className="text-right flex-shrink-0">
                            <span className="text-sm font-bold text-gray-900 font-mono">
                              ₹{(price * qty).toFixed(2)}
                            </span>
                          </div>
                        )}
                      </div>
                    );
                  })
                )}
              </div>

              {/* Shipping summary footer */}
              {addressSummary && (
                <div className="border-t border-gray-100 pt-4 flex items-center gap-2 text-xs text-gray-500 bg-gray-50/50 p-3 rounded-lg">
                  <MapPin className="w-4 h-4 text-maroonClr flex-shrink-0" />
                  <span className="truncate"><strong>Ship to:</strong> {addressSummary}</span>
                </div>
              )}
            </div>
          </div>
        );
      })}

      {/* Invoice Modal */}
      {selectedInvoiceOrder && (
        <OrderInvoiceModal 
          order={selectedInvoiceOrder} 
          onClose={() => setSelectedInvoiceOrder(null)} 
        />
      )}
    </div>
  );
}

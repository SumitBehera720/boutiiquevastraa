"use client";

import { X, Printer, Download, CheckCircle2, ShieldCheck, Truck } from "lucide-react";

interface OrderInvoiceModalProps {
  order: any;
  onClose: () => void;
}

export default function OrderInvoiceModal({ order, onClose }: OrderInvoiceModalProps) {
  if (!order) return null;

  const handlePrint = () => {
    window.print();
  };

  const getLineItems = (ord: any): any[] => {
    if (ord.lineItems?.edges) return ord.lineItems.edges.map((e: any) => e.node);
    if (Array.isArray(ord.lineItems)) return ord.lineItems;
    if (Array.isArray(ord.items)) return ord.items;
    if (Array.isArray(ord.line_items)) return ord.line_items;
    return [];
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

  const items = getLineItems(order);
  const totalAmount = typeof order.totalPrice === "number"
    ? order.totalPrice
    : parseFloat(order.totalPrice?.amount || order.totalAmount || "0") || 0;

  const addr = order.shippingAddress || {};
  const formattedAddress = [
    addr.address1,
    addr.address2,
    addr.city,
    addr.province || addr.state,
    addr.zip || addr.pincode,
    addr.country || "India"
  ].filter(Boolean).join(", ");

  const orderDate = order.processedAt || order.createdAt 
    ? new Date(order.processedAt || order.createdAt).toLocaleDateString("en-IN", {
        year: "numeric",
        month: "long",
        day: "numeric"
      })
    : "N/A";

  return (
    <div className="fixed inset-0 z-[999999] bg-black/60 backdrop-blur-sm flex items-center justify-center p-3 sm:p-6 overflow-y-auto">
      {/* Container */}
      <div className="bg-white w-full max-w-3xl rounded-xl shadow-2xl border border-gray-200 overflow-hidden my-auto relative animate-fadeIn">
        {/* Modal Top Actions (Hidden when printing) */}
        <div className="bg-maroonClr px-6 py-4 flex items-center justify-between text-white print:hidden">
          <div className="flex items-center gap-2">
            <ShieldCheck className="w-5 h-5 text-amber-300" />
            <h3 className="font-serif font-bold text-lg">Official Tax Invoice</h3>
          </div>
          <div className="flex items-center gap-3">
            <button
              onClick={handlePrint}
              className="bg-white text-maroonClr hover:bg-amber-100 px-3 py-1.5 rounded text-xs font-bold uppercase tracking-wider flex items-center gap-1.5 transition-colors shadow-sm"
            >
              <Printer className="w-4 h-4" /> Print / Save PDF
            </button>
            <button
              onClick={onClose}
              className="p-1 hover:bg-white/20 rounded-full transition-colors text-white"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Printable Invoice Area */}
        <div className="p-6 sm:p-10 text-gray-800 space-y-6 printable-invoice">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start border-b border-gray-200 pb-6 gap-4">
            <div>
              <h1 className="text-2xl sm:text-3xl font-serif font-bold text-maroonClr tracking-wide">
                BOUTIIQUE VASTRAA
              </h1>
              <p className="text-xs text-gray-500 mt-1">Premium Ethnic & Traditional Wear</p>
              <p className="text-xs text-gray-500">Website: www.boutiiquevastraa.com</p>
              <p className="text-xs text-gray-500">Email: support@boutiiquevastraa.com</p>
            </div>
            <div className="text-left sm:text-right">
              <span className="inline-block bg-amber-100 text-maroonClr text-xs font-bold px-3 py-1 rounded uppercase tracking-widest mb-2 border border-amber-200">
                TAX INVOICE
              </span>
              <p className="text-sm font-bold text-gray-900">
                Invoice #: <span className="font-mono">VSTR-{order.orderNumber || order.id}</span>
              </p>
              <p className="text-xs text-gray-600">Date: {orderDate}</p>
              <p className="text-xs text-gray-600">
                Payment Method: <span className="font-semibold">
                  {String(order.paymentGateway || order.paymentMethod || "").toUpperCase().includes("COD") 
                    ? "Cash on Delivery (COD)" 
                    : "Online UPI/Card"}
                </span>
              </p>
            </div>
          </div>

          {/* Customer & Shipping Info */}
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 bg-gray-50 p-4 rounded-lg border border-gray-200 text-xs">
            <div>
              <h4 className="font-bold uppercase tracking-wider text-gray-700 mb-1 border-b pb-1">Billed To</h4>
              <p className="font-semibold text-gray-900">{order.customerName || order.customer?.name || "Customer"}</p>
              {order.email && <p className="text-gray-600">Email: {order.email}</p>}
              {order.phone && <p className="text-gray-600">Phone: {order.phone}</p>}
            </div>
            <div>
              <h4 className="font-bold uppercase tracking-wider text-gray-700 mb-1 border-b pb-1">Shipping Address</h4>
              <p className="font-semibold text-gray-900">{addr.name || order.customerName || "Customer"}</p>
              <p className="text-gray-600">{formattedAddress || "Standard Shipping Address"}</p>
            </div>
          </div>

          {/* Items Table */}
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="bg-gray-100 border-y border-gray-200 text-gray-700 font-bold uppercase tracking-wider">
                  <th className="p-3">#</th>
                  <th className="p-3">Item & Description</th>
                  <th className="p-3 text-center">Qty</th>
                  <th className="p-3 text-right">Price</th>
                  <th className="p-3 text-right">Total</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {items.map((item: any, idx: number) => {
                  const price = getItemPrice(item);
                  const qty = item.quantity || 1;
                  const itemTotal = price * qty;
                  const variantInfo = getItemVariant(item);

                  return (
                    <tr key={idx} className="hover:bg-gray-50/50">
                      <td className="p-3 font-mono text-gray-400">{idx + 1}</td>
                      <td className="p-3">
                        <p className="font-semibold text-gray-900 text-sm">{item.title || "Product Item"}</p>
                        {variantInfo && (
                          <span className="inline-block text-[10px] bg-gray-100 text-gray-600 font-medium px-2 py-0.5 rounded border border-gray-200 mt-1">
                            {variantInfo}
                          </span>
                        )}
                      </td>
                      <td className="p-3 text-center font-semibold text-gray-800">{qty}</td>
                      <td className="p-3 text-right font-mono text-gray-700">₹{price.toFixed(2)}</td>
                      <td className="p-3 text-right font-mono font-semibold text-gray-900">₹{itemTotal.toFixed(2)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>

          {/* Pricing Calculation Summary */}
          <div className="flex flex-col sm:flex-row justify-between items-start gap-4 border-t border-gray-200 pt-4">
            <div className="text-xs text-gray-500 space-y-1">
              <p className="flex items-center gap-1 font-medium text-green-700">
                <CheckCircle2 className="w-3.5 h-3.5" /> Inclusive of all applicable taxes
              </p>
              <p>For support or returns, visit boutiiquevastraa.com/contact</p>
            </div>
            <div className="w-full sm:w-64 bg-gray-50 p-4 rounded-lg border border-gray-200 text-xs space-y-2">
              <div className="flex justify-between text-gray-600">
                <span>Subtotal:</span>
                <span className="font-mono font-medium">₹{totalAmount.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-gray-600">
                <span>Shipping:</span>
                <span className="text-green-700 font-semibold uppercase text-[10px]">FREE</span>
              </div>
              {order.discount > 0 && (
                <div className="flex justify-between text-red-600 font-medium">
                  <span>Discount:</span>
                  <span className="font-mono">-₹{parseFloat(order.discount).toFixed(2)}</span>
                </div>
              )}
              <div className="border-t border-gray-300 pt-2 flex justify-between font-bold text-sm text-maroonClr">
                <span>Total Paid:</span>
                <span className="font-mono text-base">₹{totalAmount.toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Footer note */}
          <div className="text-center pt-6 border-t border-gray-100 text-[11px] text-gray-400">
            Thank you for shopping with Boutique Vastra!
          </div>
        </div>
      </div>
    </div>
  );
}

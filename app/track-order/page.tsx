"use client";

import { useState } from "react";
import { trackOrder } from "@/lib/api/checkout-client";
import { Search, MapPin, Package, Calendar, Truck, ArrowLeft, AlertCircle, CheckCircle2 } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

export default function TrackOrderPage() {
  const [orderNumber, setOrderNumber] = useState("");
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [order, setOrder] = useState<any>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!orderNumber || !email) {
      setError("Please fill in both order number and email address.");
      return;
    }
    
    setError("");
    setLoading(true);
    setOrder(null);

    try {
      const res = await trackOrder(orderNumber, email);
      if (res.success && res.order) {
        setOrder(res.order);
      } else {
        setError(res.error || "No order found matching details.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Helper to determine status steps
  const getStatusStep = (status: string) => {
    switch (status) {
      case "UNFULFILLED": return 1; // Placed & Processing
      case "FULFILLED": return 2;   // Processing complete
      case "SHIPPED": return 3;     // Shipped
      case "DELIVERED": return 4;   // Delivered
      case "CANCELLED": return -1;  // Cancelled
      default: return 1;
    }
  };

  const currentStep = order ? getStatusStep(order.fulfillmentStatus) : 0;

  return (
    <div className="min-h-screen bg-[#FDFBF7] py-12 px-4 md:px-6">
      <div className="container mx-auto max-w-3xl">
        
        {/* Header */}
        <div className="text-center mb-10">
          <h1 className="text-3xl md:text-4xl font-serif font-bold text-maroonClr mb-3">
            Track Your Order
          </h1>
          <p className="text-gray-600 text-sm md:text-base max-w-md mx-auto">
            Enter your order details below to check the real-time fulfillment and shipping status of your handcrafted sarees.
          </p>
        </div>

        {/* Tracking Search Form */}
        {!order && (
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 max-w-md mx-auto">
            {error && (
              <div className="mb-6 p-4 bg-red-50 border-l-4 border-red-500 text-red-700 text-sm rounded flex items-center gap-2">
                <AlertCircle className="w-5 h-5 flex-shrink-0" />
                <span>{error}</span>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Order Number</label>
                <input
                  type="text"
                  required
                  value={orderNumber}
                  onChange={(e) => setOrderNumber(e.target.value)}
                  placeholder="e.g. #VSTR-1001 or 1001"
                  className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-maroonClr focus:ring-1 focus:ring-maroonClr"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-gray-500 uppercase mb-1.5">Email Address</label>
                <input
                  type="email"
                  required
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="email@example.com"
                  className="w-full border border-gray-300 rounded px-4 py-2.5 text-sm focus:outline-none focus:border-maroonClr focus:ring-1 focus:ring-maroonClr"
                />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-maroonClr text-white py-3 rounded font-semibold text-sm hover:bg-[#6A102A] transition-colors flex items-center justify-center gap-2 shadow-sm disabled:bg-gray-400"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                    Tracking...
                  </>
                ) : (
                  <>
                    <Search className="w-4 h-4" /> Track Order
                  </>
                )}
              </button>
            </form>
          </div>
        )}

        {/* Tracking Details Display */}
        {order && (
          <div className="bg-white p-6 md:p-8 rounded-xl shadow-sm border border-gray-100 space-y-8 animate-fadeIn">
            
            {/* Header info */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-6 border-b border-gray-100">
              <div>
                <span className="text-xs font-bold text-goldClr uppercase tracking-widest block mb-1">Live Tracking</span>
                <h2 className="text-xl md:text-2xl font-serif font-bold text-gray-800">
                  Order #VSTR-{order.orderNumber}
                </h2>
              </div>
              <button
                onClick={() => {
                  setOrder(null);
                  setOrderNumber("");
                }}
                className="inline-flex items-center gap-2 text-xs font-bold text-gray-500 hover:text-maroonClr transition-colors border border-gray-200 hover:border-maroonClr/20 px-3 py-1.5 rounded-md"
              >
                <ArrowLeft className="w-3.5 h-3.5" /> Check Another Order
              </button>
            </div>

            {/* Stepper Status Bar */}
            {currentStep === -1 ? (
              <div className="bg-red-50 border-l-4 border-red-500 p-4 text-red-700 text-sm rounded flex items-center gap-2">
                <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
                <div>
                  <p className="font-bold">This order has been cancelled.</p>
                  <p className="text-xs">If you believe this was an error, please reach out to customer support.</p>
                </div>
              </div>
            ) : (
              <div className="py-6 px-2">
                <div className="relative flex items-center justify-between w-full">
                  {/* Background Line */}
                  <div className="absolute left-0 right-0 h-1 bg-gray-200 top-1/2 -translate-y-1/2 -z-10 rounded"></div>
                  
                  {/* Active Line Progress */}
                  <div 
                    className="absolute left-0 h-1 bg-maroonClr top-1/2 -translate-y-1/2 -z-10 rounded transition-all duration-500"
                    style={{ width: `${((currentStep - 1) / 3) * 100}%` }}
                  ></div>

                  {/* Step 1: Placed */}
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${currentStep >= 1 ? "bg-maroonClr text-white" : "bg-gray-200 text-gray-500"}`}>
                      {currentStep > 1 ? <CheckCircle2 className="w-5 h-5 text-white" /> : "1"}
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-gray-700 mt-2 uppercase tracking-wider block">Placed</span>
                  </div>

                  {/* Step 2: Processing */}
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${currentStep >= 2 ? "bg-maroonClr text-white" : "bg-gray-200 text-gray-500"}`}>
                      {currentStep > 2 ? <CheckCircle2 className="w-5 h-5 text-white" /> : "2"}
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-gray-700 mt-2 uppercase tracking-wider block">Processing</span>
                  </div>

                  {/* Step 3: Shipped */}
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${currentStep >= 3 ? "bg-maroonClr text-white" : "bg-gray-200 text-gray-500"}`}>
                      {currentStep > 3 ? <CheckCircle2 className="w-5 h-5 text-white" /> : "3"}
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-gray-700 mt-2 uppercase tracking-wider block">Shipped</span>
                  </div>

                  {/* Step 4: Delivered */}
                  <div className="flex flex-col items-center text-center">
                    <div className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${currentStep >= 4 ? "bg-maroonClr text-white" : "bg-gray-200 text-gray-500"}`}>
                      {currentStep >= 4 ? <CheckCircle2 className="w-5 h-5 text-white" /> : "4"}
                    </div>
                    <span className="text-[10px] md:text-xs font-semibold text-gray-700 mt-2 uppercase tracking-wider block">Delivered</span>
                  </div>
                </div>

                {/* Status Message */}
                <div className="mt-8 text-center bg-maroonClr/5 border border-maroonClr/10 rounded-lg p-4">
                  <p className="text-sm font-semibold text-maroonClr">
                    {order.fulfillmentStatus === "UNFULFILLED" && "Your order is received and has entered production. Standard weaving and inspection takes 2-3 business days."}
                    {order.fulfillmentStatus === "FULFILLED" && "Your order has passed custom handloom quality checks and is being packaged for shipment."}
                    {order.fulfillmentStatus === "SHIPPED" && "Your order is dispatched! It is currently in transit to your delivery destination."}
                    {order.fulfillmentStatus === "DELIVERED" && "Your order has been delivered successfully. We hope you love the handcrafted details!"}
                  </p>
                </div>
              </div>
            )}

            {/* Address & Items Detail Grid */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-8 pt-4 border-t border-gray-100">
              {/* Shipping Details */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <MapPin className="w-4 h-4 text-goldClr" /> Delivery Address
                </h3>
                <div className="text-sm text-gray-600 bg-gray-50 rounded-xl p-5 border border-gray-100 space-y-1">
                  <p className="font-semibold text-gray-800">{order.customerName}</p>
                  <p>{order.shippingAddress.address1}</p>
                  {order.shippingAddress.address2 && <p>{order.shippingAddress.address2}</p>}
                  <p>{order.shippingAddress.city}, {order.shippingAddress.province} {order.shippingAddress.zip}</p>
                  <p>{order.shippingAddress.country}</p>
                  <p className="pt-2 text-xs text-gray-400 font-medium">Contact: {order.phone}</p>
                </div>
              </div>

              {/* Items List */}
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-gray-400 uppercase tracking-widest flex items-center gap-1.5">
                  <Package className="w-4 h-4 text-goldClr" /> Items List
                </h3>
                <div className="space-y-3">
                  {(order.lineItems || order.items || []).map((item: any, idx: number) => (
                    <div key={idx} className="flex gap-3 items-center">
                      <div className="w-10 h-14 bg-gray-50 relative rounded overflow-hidden border border-gray-100 flex-shrink-0">
                        {item.image ? (
                          <Image src={item.image} alt={item.title} fill className="object-cover" sizes="40px" />
                        ) : (
                          <div className="absolute inset-0 bg-maroonClr/5 flex items-center justify-center text-maroonClr/20 text-[9px] font-bold">
                            Saree
                          </div>
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <h4 className="font-semibold text-gray-800 text-xs truncate">{item.title}</h4>
                        <p className="text-[10px] text-gray-400">Qty: {item.quantity} | {item.variantTitle}</p>
                      </div>
                      <div className="text-right">
                        <span className="font-bold text-gray-800 text-xs">₹{parseFloat(item.price).toFixed(0)}</span>
                      </div>
                    </div>
                  ))}
                  <div className="border-t border-gray-100 pt-2.5 flex justify-between items-center text-gray-800 font-bold text-sm">
                    <span className="uppercase tracking-wider text-[10px] text-gray-400">Total Price</span>
                    <span className="text-maroonClr">₹{parseFloat(order.totalPrice.amount).toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </div>

          </div>
        )}

      </div>
    </div>
  );
}

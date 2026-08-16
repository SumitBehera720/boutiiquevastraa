"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { 
  updateOrderStatusAction,
  createShipmentAction,
  assignAwbAction,
  schedulePickupAction,
  generateLabelAction,
  trackShipmentAction,
  verifyPaymentStatusAction,
} from "@/app/actions/adminOrders";
import { ArrowLeft, Printer, ShoppingBag, MapPin, Mail, Phone, Calendar, ShieldCheck, Truck, Clock, Sparkles, CreditCard, CheckCircle2, AlertCircle } from "lucide-react";

interface OrderDetailClientProps {
  order: any;
}

export default function OrderDetailClient({ order: initialOrder }: OrderDetailClientProps) {
  const [currentOrder, setCurrentOrder] = useState(initialOrder);
  const order = currentOrder; // alias for easy JSX binding

  const [fulfillmentStatus, setFulfillmentStatus] = useState(order.fulfillmentStatus);
  const [financialStatus, setFinancialStatus] = useState(order.financialStatus);
  const [updating, setUpdating] = useState(false);
  const [loadingShiprocket, setLoadingShiprocket] = useState<string | null>(null);
  const [verifyingPayment, setVerifyingPayment] = useState(false);

  const handleStatusChange = async (newStatus: any) => {
    setUpdating(true);
    try {
      const res = await updateOrderStatusAction(order.id, newStatus);
      if (res.success && res.order) {
        setCurrentOrder(res.order);
        setFulfillmentStatus(res.order.fulfillmentStatus);
        setFinancialStatus(res.order.financialStatus);
      } else {
        alert(res.error || "Failed to update status");
      }
    } catch (err) {
      console.error(err);
      alert("Error updating order status");
    } finally {
      setUpdating(false);
    }
  };

  const handlePrint = () => {
    window.print();
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "DELIVERED": return "bg-green-500/10 text-green-400 border-green-500/20";
      case "SHIPPED": return "bg-blue-500/10 text-blue-400 border-blue-500/20";
      case "FULFILLED": return "bg-purple-500/10 text-purple-400 border-purple-500/20";
      case "UNFULFILLED": return "bg-amber-500/10 text-amber-400 border-amber-500/20";
      case "CANCELLED": return "bg-red-500/10 text-red-400 border-red-500/20";
      default: return "bg-neutral-500/10 text-neutral-400 border-neutral-500/20";
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto printable-area">
      {/* Header back & Print */}
      <div className="flex items-center gap-4 justify-between pb-4 border-b border-neutral-850 print:hidden">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/orders"
            className="p-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-serif font-bold text-white flex items-center gap-2">
              Order #VSTR-{order.orderNumber}{" "}
              <Sparkles className="w-4 h-4 text-[#C9A84C]" />
            </h1>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold">
              Receipt & Fulfillment Management
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <button
            onClick={handlePrint}
            className="bg-neutral-950 border border-neutral-800 text-neutral-300 hover:text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2"
          >
            <Printer className="w-4 h-4 text-[#C9A84C]" /> Print Invoice
          </button>
        </div>
      </div>

      {/* Invoice Banner for Print mode (hidden on screen) */}
      <div className="hidden print:block border-b-2 border-neutral-200 pb-6 mb-6">
        <div className="flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-neutral-800">BOUTIIQUE VASTRAA</h1>
            <p className="text-xs text-neutral-500">Premium Handloom Sarees & Apparel</p>
            <p className="text-xs text-neutral-500">Kolkata, West Bengal, India</p>
          </div>
          <div className="text-right">
            <h2 className="text-xl font-bold text-neutral-800">INVOICE</h2>
            <p className="text-xs text-neutral-500">Order Ref: #VSTR-{order.orderNumber}</p>
            <p className="text-xs text-neutral-500">Date: {new Date(order.processedAt).toLocaleDateString()}</p>
          </div>
        </div>
      </div>

      {/* Main Grid */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left 2 Columns: Order summary and customer profile */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Block 1: Products table */}
          <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 print:bg-white print:border-none print:p-0 space-y-4">
            <h3 className="text-sm font-bold text-white print:text-neutral-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <ShoppingBag className="w-4 h-4 text-[#C9A84C] print:hidden" /> Purchased Items
            </h3>
            
            <div className="space-y-4">
              {(order.lineItems || order.items || []).map((item: any, idx: number) => (
                <div key={idx} className="flex gap-4 items-center justify-between py-2 border-b border-neutral-900 print:border-neutral-200">
                  <div className="flex gap-4 items-center">
                    <div className="w-12 h-16 bg-neutral-900 relative rounded overflow-hidden border border-neutral-850 flex-shrink-0 print:hidden">
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
                    <div>
                      <h4 className="font-semibold text-white print:text-neutral-800 text-sm">{item.title}</h4>
                      <p className="text-xs text-neutral-500 print:text-neutral-500 font-medium">Variant: {item.variantTitle}</p>
                      <p className="text-xs text-neutral-600 print:text-neutral-500">Quantity: {item.quantity}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <span className="font-mono font-bold text-white print:text-neutral-800 text-sm">
                      ₹{parseFloat(item.price).toFixed(0)}
                    </span>
                  </div>
                </div>
              ))}
            </div>

            {/* Subtotal table */}
            <div className="bg-neutral-900/40 print:bg-neutral-50 rounded-xl p-6 border border-neutral-850 print:border-neutral-100 space-y-3">
              <div className="flex justify-between text-xs font-bold text-neutral-400 print:text-neutral-600">
                <span>Subtotal</span>
                <span className="font-mono">₹{parseFloat(order.totalPrice?.amount ?? "0").toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-xs font-bold text-neutral-400 print:text-neutral-600">
                <span>Shipping</span>
                <span className="text-green-400 print:text-green-600">FREE EXPRESS</span>
              </div>
              <div className="border-t border-neutral-800 print:border-neutral-200 pt-3 flex justify-between items-center text-white print:text-neutral-850 font-bold">
                <span className="uppercase tracking-widest text-[10px]">Grand Total</span>
                <span className="text-lg text-maroonClr print:text-neutral-850 font-mono">₹{parseFloat(order.totalPrice?.amount ?? "0").toFixed(2)}</span>
              </div>
            </div>
          </div>

          {/* Block 2: Delivery Details */}
          <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 print:bg-white print:border-none print:p-0 space-y-4">
            <h3 className="text-sm font-bold text-white print:text-neutral-800 uppercase tracking-wider mb-2 flex items-center gap-2">
              <MapPin className="w-4 h-4 text-[#C9A84C] print:hidden" /> Delivery Address Details
            </h3>

            <div className="text-sm text-neutral-400 print:text-neutral-700 bg-neutral-900/30 print:bg-neutral-50 rounded-xl p-5 border border-neutral-850 print:border-neutral-100 space-y-1">
              <p className="font-bold text-white print:text-neutral-850 text-base">{order.customerName || "—"}</p>
              <p>{order.shippingAddress?.address1 || "—"}</p>
              {order.shippingAddress?.address2 && <p>{order.shippingAddress.address2}</p>}
              <p>{order.shippingAddress?.city || "—"}, {order.shippingAddress?.province || ""} {order.shippingAddress?.zip || ""}</p>
              <p>{order.shippingAddress?.country || "—"}</p>
            </div>
          </div>

        </div>

        {/* Right Column: Fulfillment Controls & Customer Contact */}
        <div className="space-y-6">
          
          {/* Block 1: Fulfillment Status Control */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-4 print:hidden">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest pb-2 border-b border-neutral-900">
              Fulfillment Control
            </h3>

            <div className="space-y-3">
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500 font-medium">Fulfillment Status</span>
                <span className={`px-2 py-0.5 border rounded text-[9px] font-bold uppercase tracking-wider ${getStatusColor(fulfillmentStatus)}`}>
                  {fulfillmentStatus}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-xs text-neutral-500 font-medium">Financial Status</span>
                <span className={`px-2 py-0.5 border rounded text-[9px] font-bold uppercase tracking-wider ${financialStatus === "PAID" ? "bg-green-500/10 text-green-400 border-green-500/20" : "bg-amber-500/10 text-amber-400 border-amber-500/20"}`}>
                  {financialStatus}
                </span>
              </div>

              <div className="pt-2 border-t border-neutral-900">
                <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Update Stage</label>
                <select
                  value={fulfillmentStatus}
                  disabled={updating}
                  onChange={(e) => handleStatusChange(e.target.value)}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-maroonClr disabled:opacity-50"
                >
                  <option value="UNFULFILLED">UNFULFILLED (PENDING)</option>
                  <option value="FULFILLED">FULFILLED (PACKAGED)</option>
                  <option value="SHIPPED">SHIPPED (IN TRANSIT)</option>
                  <option value="DELIVERED">DELIVERED</option>
                  <option value="CANCELLED">CANCELLED (REFUND)</option>
                </select>
              </div>
            </div>
          </div>

          {/* Payment Gateway Timeline Card */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-4 print:hidden">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest pb-2 border-b border-neutral-900 flex items-center justify-between">
              <span>Payment Gateway</span>
              <CreditCard className="w-4 h-4 text-goldClr" />
            </h3>

            <div className="space-y-3 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-medium">Gateway</span>
                <span className="font-semibold text-white uppercase tracking-wider">{order.paymentGateway || "COD"}</span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-medium">Payment Status</span>
                <span className={`px-2 py-0.5 border rounded text-[9px] font-bold uppercase tracking-wider ${
                  order.paymentStatus === "PAID" || financialStatus === "PAID"
                    ? "bg-green-500/10 text-green-400 border-green-500/20"
                    : order.paymentStatus === "FAILED"
                    ? "bg-red-500/10 text-red-400 border-red-500/20"
                    : "bg-amber-500/10 text-amber-400 border-amber-500/20"
                }`}>
                  {order.paymentStatus || financialStatus || "PENDING"}
                </span>
              </div>

              {order.merchantTransactionId && (
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 font-medium">Merchant Txn ID</span>
                  <span className="font-mono text-[10px] text-neutral-300 break-all">{order.merchantTransactionId}</span>
                </div>
              )}

              {order.phonepeTransactionId && (
                <div className="flex justify-between items-center">
                  <span className="text-neutral-500 font-medium">PhonePe Txn ID</span>
                  <span className="font-mono text-[10px] text-neutral-300 break-all">{order.phonepeTransactionId}</span>
                </div>
              )}

              {/* Event Logs Timeline */}
              {order.paymentEvents && order.paymentEvents.length > 0 && (
                <div className="pt-2 border-t border-neutral-900 space-y-2">
                  <span className="text-[10px] text-neutral-500 font-bold uppercase tracking-wider block">Audit Events Log</span>
                  <div className="space-y-1.5 max-h-36 overflow-y-auto pr-1">
                    {order.paymentEvents.map((evt: any, idx: number) => (
                      <div key={idx} className="flex gap-2 items-start text-[10px] text-neutral-400">
                        <CheckCircle2 className="w-3 h-3 text-goldClr flex-shrink-0 mt-0.5" />
                        <div>
                          <p className="text-neutral-200">{evt.event}</p>
                          <p className="text-[9px] text-neutral-600">
                            {evt.timestamp && !isNaN(new Date(evt.timestamp).getTime()) ? new Date(evt.timestamp).toLocaleString() : "N/A"}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* PhonePe Re-verify Button */}
              {order.paymentGateway === "PHONEPE" && (
                <div className="pt-2 border-t border-neutral-900">
                  <button
                    onClick={async () => {
                      setVerifyingPayment(true);
                      const res = await verifyPaymentStatusAction(order.id);
                      if (res.success && res.order) {
                        setCurrentOrder(res.order);
                        setFinancialStatus(res.order.financialStatus);
                        alert(`Verification completed. Payment Status: ${res.order.paymentStatus}`);
                      } else {
                        alert(res.error || "Failed to re-verify payment.");
                      }
                      setVerifyingPayment(false);
                    }}
                    disabled={verifyingPayment}
                    className="w-full bg-neutral-900 border border-neutral-800 hover:border-white text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {verifyingPayment ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Verifying...
                      </>
                    ) : (
                      "Re-verify PhonePe Payment"
                    )}
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Shiprocket Logistics Card */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-4 print:hidden">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest pb-2 border-b border-neutral-900 flex items-center justify-between">
              <span>Shiprocket Logistics</span>
              <Truck className="w-4 h-4 text-goldClr" />
            </h3>

            {order.shipmentError && (
              <div className="bg-red-500/10 border border-red-500/20 text-red-400 p-3 rounded-lg text-xs space-y-1">
                <p className="font-bold">Fulfillment Error:</p>
                <p className="font-mono text-[10px] break-all">{order.shipmentError}</p>
                {order.shipmentErrorAt && (
                  <p className="text-[9px] text-red-400/60">
                    Failed at: {new Date(order.shipmentErrorAt).toLocaleString()}
                  </p>
                )}
              </div>
            )}

            <div className="space-y-3 pt-1 text-xs">
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-medium">Shipment ID</span>
                <span className="font-mono text-white font-semibold">
                  {order.shipmentId || <span className="text-neutral-600 font-normal">Not Booked</span>}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-medium">AWB Number</span>
                <span className="font-mono text-white font-semibold">
                  {order.awbNumber || <span className="text-neutral-600 font-normal">Unassigned</span>}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-medium">Courier Partner</span>
                <span className="text-white font-semibold">
                  {order.courierName || <span className="text-neutral-600 font-normal">N/A</span>}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-medium">Shipment Status</span>
                <span className={`px-2 py-0.5 border rounded text-[9px] font-bold uppercase tracking-wider ${
                  order.shipmentStatus === "Delivered" 
                    ? "bg-green-500/10 text-green-400 border-green-500/20" 
                    : order.shipmentStatus 
                    ? "bg-blue-500/10 text-blue-400 border-blue-500/20" 
                    : "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
                }`}>
                  {order.shipmentStatus || "N/A"}
                </span>
              </div>
              <div className="flex justify-between items-center">
                <span className="text-neutral-500 font-medium">Pickup Status</span>
                <span className={`px-2 py-0.5 border rounded text-[9px] font-bold uppercase tracking-wider ${
                  order.pickupStatus === "Scheduled" 
                    ? "bg-purple-500/10 text-purple-400 border-purple-500/20" 
                    : "bg-neutral-500/10 text-neutral-400 border-neutral-500/20"
                }`}>
                  {order.pickupStatus || "Pending"}
                </span>
              </div>
              {order.shipmentLastSynced && (
                <div className="flex justify-between items-center text-[10px] text-neutral-600 pt-1 border-t border-neutral-900">
                  <span>Last Synced</span>
                  <span>{new Date(order.shipmentLastSynced).toLocaleString()}</span>
                </div>
              )}

              {/* Action Buttons */}
              <div className="pt-3 border-t border-neutral-900 space-y-2.5">
                {/* 1. Book Shipment */}
                {!order.shipmentId && (
                  <button
                    onClick={async () => {
                      setLoadingShiprocket("shipment");
                      const res = await createShipmentAction(order.id);
                      if (res.success && res.order) {
                        setCurrentOrder(res.order);
                      } else {
                        alert(res.error || "Failed to book shipment.");
                      }
                      setLoadingShiprocket(null);
                    }}
                    disabled={loadingShiprocket !== null}
                    className="w-full bg-[#8D0B41] hover:bg-[#6A102A] text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loadingShiprocket === "shipment" ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Booking...
                      </>
                    ) : (
                      "Book Shiprocket Shipment"
                    )}
                  </button>
                )}

                {/* 2. Assign AWB */}
                {order.shipmentId && !order.awbNumber && (
                  <button
                    onClick={async () => {
                      setLoadingShiprocket("awb");
                      const res = await assignAwbAction(order.id);
                      if (res.success && res.order) {
                        setCurrentOrder(res.order);
                      } else {
                        alert(res.error || "Failed to assign AWB.");
                      }
                      setLoadingShiprocket(null);
                    }}
                    disabled={loadingShiprocket !== null}
                    className="w-full bg-neutral-900 border border-neutral-800 hover:border-white text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loadingShiprocket === "awb" ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Assigning AWB...
                      </>
                    ) : (
                      "Assign AWB & Courier"
                    )}
                  </button>
                )}

                {/* 3. Schedule Pickup */}
                {order.awbNumber && order.pickupStatus !== "Scheduled" && (
                  <button
                    onClick={async () => {
                      setLoadingShiprocket("pickup");
                      const res = await schedulePickupAction(order.id);
                      if (res.success && res.order) {
                        setCurrentOrder(res.order);
                      } else {
                        alert(res.error || "Failed to schedule pickup.");
                      }
                      setLoadingShiprocket(null);
                    }}
                    disabled={loadingShiprocket !== null}
                    className="w-full bg-neutral-900 border border-neutral-800 hover:border-white text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loadingShiprocket === "pickup" ? (
                      <>
                        <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                        Scheduling...
                      </>
                    ) : (
                      "Schedule Package Pickup"
                    )}
                  </button>
                )}

                {/* 4. Labels & Invoices */}
                {order.shipmentId && (
                  <div className="grid grid-cols-2 gap-2">
                    <button
                      onClick={async () => {
                        setLoadingShiprocket("label");
                        const res = await generateLabelAction(order.id);
                        if (res.success && res.order) {
                          setCurrentOrder(res.order);
                          if (res.order.labelUrl) window.open(res.order.labelUrl, "_blank");
                        } else {
                          alert(res.error || "Failed to generate label.");
                        }
                        setLoadingShiprocket(null);
                      }}
                      disabled={loadingShiprocket !== null}
                      className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white py-2 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {loadingShiprocket === "label" ? "..." : order.labelUrl ? "Open Label" : "Get Label"}
                    </button>

                    <button
                      onClick={async () => {
                        setLoadingShiprocket("invoice");
                        const res = await generateLabelAction(order.id); // Generates label and invoice
                        if (res.success && res.order) {
                          setCurrentOrder(res.order);
                          if (res.order.invoiceUrl) window.open(res.order.invoiceUrl, "_blank");
                        } else {
                          alert(res.error || "Failed to generate invoice.");
                        }
                        setLoadingShiprocket(null);
                      }}
                      disabled={loadingShiprocket !== null}
                      className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-neutral-300 hover:text-white py-2 px-1 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-1.5 disabled:opacity-50"
                    >
                      {loadingShiprocket === "invoice" ? "..." : order.invoiceUrl ? "Open Invoice" : "Get Invoice"}
                    </button>
                  </div>
                )}

                {/* 5. Sync Tracking */}
                {order.awbNumber && (
                  <button
                    onClick={async () => {
                      setLoadingShiprocket("track");
                      const res = await trackShipmentAction(order.id);
                      if (res.success && res.order) {
                        setCurrentOrder(res.order);
                        setFulfillmentStatus(res.order.fulfillmentStatus);
                      } else {
                        alert(res.error || "Failed to sync tracking status.");
                      }
                      setLoadingShiprocket(null);
                    }}
                    disabled={loadingShiprocket !== null}
                    className="w-full bg-neutral-900 border border-[#C9A84C]/40 hover:border-[#C9A84C] text-[#C9A84C] hover:text-white py-2 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center justify-center gap-2 disabled:opacity-50"
                  >
                    {loadingShiprocket === "track" ? (
                      <>
                        <div className="w-3 h-3 border-2 border-[#C9A84C] border-t-transparent rounded-full animate-spin"></div>
                        Syncing...
                      </>
                    ) : (
                      "Sync Tracking Status"
                    )}
                  </button>
                )}
              </div>
            </div>
          </div>

          {/* Block 2: Customer Contact Info */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-4 print:bg-white print:border-none print:p-0">
            <h3 className="text-xs font-bold text-white print:text-neutral-800 uppercase tracking-widest pb-2 border-b border-neutral-900 print:border-neutral-200">
              Customer Contact
            </h3>
            
            <div className="space-y-3 pt-2 text-xs">
              <div className="flex items-center gap-2.5 text-neutral-400 print:text-neutral-700">
                <Mail className="w-4 h-4 text-goldClr flex-shrink-0 print:hidden" />
                <div>
                  <span className="text-[10px] text-neutral-500 block">Email Address</span>
                  <a href={`mailto:${order.email}`} className="font-semibold text-white print:text-neutral-850 hover:underline">{order.email}</a>
                </div>
              </div>
              
              <div className="flex items-center gap-2.5 text-neutral-400 print:text-neutral-700">
                <Phone className="w-4 h-4 text-goldClr flex-shrink-0 print:hidden" />
                <div>
                  <span className="text-[10px] text-neutral-500 block">Phone Number</span>
                  <a href={`tel:${order.phone}`} className="font-semibold text-white print:text-neutral-850 hover:underline">{order.phone}</a>
                </div>
              </div>

              <div className="flex items-center gap-2.5 text-neutral-400 print:text-neutral-700">
                <Calendar className="w-4 h-4 text-goldClr flex-shrink-0 print:hidden" />
                <div>
                  <span className="text-[10px] text-neutral-500 block">Processed Date</span>
                  <span className="font-semibold text-white print:text-neutral-850">
                    {order?.processedAt && !isNaN(new Date(order.processedAt).getTime())
                      ? new Date(order.processedAt).toLocaleString('en-IN', { dateStyle: 'medium', timeStyle: 'short' })
                      : "N/A"}
                  </span>
                </div>
              </div>
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

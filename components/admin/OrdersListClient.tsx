"use client";

import { useState } from "react";
import Link from "next/link";
import { updateOrderStatusAction } from "@/app/actions/adminOrders";
import { Search, Eye, Sparkles, CheckCircle2, ChevronRight, AlertCircle } from "lucide-react";

interface OrdersListClientProps {
  initialOrders: any[];
}

export default function OrdersListClient({ initialOrders }: OrdersListClientProps) {
  const [orders, setOrders] = useState(initialOrders);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleStatusChange = async (orderId: string, newStatus: any) => {
    setUpdatingId(orderId);
    setError("");

    try {
      const res = await updateOrderStatusAction(orderId, newStatus);
      if (res.success && res.order) {
        setOrders(orders.map(o => o.id === orderId ? res.order : o));
      } else {
        setError(res.error || "Failed to update order status.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setUpdatingId(null);
    }
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

  const filteredOrders = (orders || [])
    .filter(o => {
      if (!o) return false;
      const cleanSearch = search.toLowerCase();
      const orderNum = (o.orderNumber || o.id || "").toString();
      const name = (o.customerName || "").toLowerCase();
      const email = (o.email || "").toLowerCase();

      const matchesSearch = 
        orderNum.includes(cleanSearch) ||
        name.includes(cleanSearch) ||
        email.includes(cleanSearch);
      
      const matchesStatus = !statusFilter || o.fulfillmentStatus === statusFilter;

      return matchesSearch && matchesStatus;
    })
    .sort((a, b) => new Date(b.processedAt || 0).getTime() - new Date(a.processedAt || 0).getTime());

  return (
    <div className="space-y-6">
      
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            Orders Catalog <Sparkles className="w-4 h-4 text-[#C9A84C]" />
          </h1>
          <p className="text-xs text-neutral-400">Total recorded transactions: {filteredOrders.length}</p>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-900/50 text-red-400 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and search bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-neutral-950 p-4 rounded-xl border border-neutral-800 shadow-sm">
        <div className="relative col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by order #, customer name, email..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-maroonClr transition-all"
          />
        </div>
        
        <div>
          <select
            value={statusFilter}
            onChange={(e) => setStatusFilter(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-neutral-400 focus:outline-none focus:border-maroonClr"
          >
            <option value="">All Statuses</option>
            <option value="UNFULFILLED">Unfulfilled / Pending</option>
            <option value="FULFILLED">Ffulfilled / Packaged</option>
            <option value="SHIPPED">Shipped</option>
            <option value="DELIVERED">Delivered</option>
            <option value="CANCELLED">Cancelled</option>
          </select>
        </div>
      </div>

      {/* Orders table card */}
      <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-400">
            <thead className="bg-neutral-900 text-xs font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-800">
              <tr>
                <th className="py-3.5 px-4 w-24">Order #</th>
                <th className="py-3.5 px-4">Customer Details</th>
                <th className="py-3.5 px-4">Date Placed</th>
                <th className="py-3.5 px-4">Total Paid</th>
                <th className="py-3.5 px-4">Fulfillment Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {filteredOrders.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-600 font-medium">
                    No orders found matching filters.
                  </td>
                </tr>
              ) : (
                filteredOrders.map((o) => {
                  const total = parseFloat(o.totalPrice?.amount ?? "0").toFixed(2);
                  const date = new Date(o.processedAt ?? Date.now()).toLocaleDateString('en-IN', { 
                    month: 'short', 
                    day: 'numeric',
                    year: 'numeric'
                  });

                  return (
                    <tr key={o.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white text-xs">
                        #VSTR-{o.orderNumber}
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white">{o.customerName}</div>
                        <div className="text-[10px] text-neutral-500">{o.email}</div>
                      </td>
                      <td className="py-3 px-4 text-xs font-medium">{date}</td>
                      <td className="py-3 px-4 font-bold text-white font-mono">₹{parseFloat(total).toLocaleString('en-IN')}</td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <span className={`px-2 py-0.5 border rounded text-[9px] font-bold uppercase tracking-wider ${getStatusColor(o.fulfillmentStatus)}`}>
                            {o.fulfillmentStatus}
                          </span>
                        </div>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end items-center gap-3">
                          <select
                            value={o.fulfillmentStatus}
                            disabled={updatingId === o.id || o.fulfillmentStatus === "CANCELLED" || o.fulfillmentStatus === "DELIVERED"}
                            onChange={(e) => handleStatusChange(o.id, e.target.value)}
                            className="bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-[10px] text-neutral-300 font-bold focus:outline-none focus:border-maroonClr disabled:opacity-50"
                          >
                            <option value="UNFULFILLED">UNFULFILLED</option>
                            <option value="FULFILLED">FULFILLED</option>
                            <option value="SHIPPED">SHIPPED</option>
                            <option value="DELIVERED">DELIVERED</option>
                            <option value="CANCELLED">CANCEL</option>
                          </select>

                          <Link
                            href={`/admin/orders/${o.id}`}
                            className="p-1.5 bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-850 hover:border-neutral-700 rounded-md transition-all flex items-center gap-1 text-[10px] font-bold uppercase tracking-wider"
                            title="View Order Details"
                          >
                            <Eye className="w-3.5 h-3.5" /> Details
                          </Link>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

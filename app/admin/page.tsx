import { verifyAdminSession } from "@/app/actions/adminAuth";
import { redirect } from "next/navigation";
import { serverGetProducts, serverGetCollections, serverGetOrders, serverGetUsers } from "@/lib/server-data";
import { IndianRupee, ShoppingBag, Package, Users, AlertTriangle, ArrowRight, Sparkles, TrendingUp } from "lucide-react";
import Link from "next/link";

export default async function AdminDashboardPage() {
  // Security check
  const isLogged = await verifyAdminSession();
  if (!isLogged) {
    redirect("/account/login");
  }

  const [products, collections, orders, customers] = await Promise.all([
    serverGetProducts(),
    serverGetCollections(),
    serverGetOrders(),
    serverGetUsers(),
  ]);

  // Calculations
  const nonCancelledOrders = orders.filter(o => o.fulfillmentStatus !== "CANCELLED");
  
  const totalRevenue = nonCancelledOrders.reduce(
    (sum, o) => {
      const price = parseFloat(o.totalPrice?.amount || o.total || o.subtotal || "0");
      return sum + (isNaN(price) ? 0 : price);
    }, 
    0
  );

  const totalOrders = orders.length;
  const totalProducts = products.length;
  const totalCustomers = customers.length;

  const getOrderTime = (o: any) => {
    const raw = o.processedAt || o.createdAt || o.updatedAt;
    if (!raw) return 0;
    if (typeof raw === "number") return raw;
    if (raw instanceof Date) return raw.getTime();
    return new Date(raw).getTime() || 0;
  };

  // Recent Orders (last 5)
  const recentOrders = [...orders]
    .sort((a, b) => getOrderTime(b) - getOrderTime(a))
    .slice(0, 5);

  // Low stock products (inventory <= 5)
  const lowStockProducts = products
    .filter(p => p.inventory !== undefined && p.inventory <= 5)
    .slice(0, 5);

  // Order status distribution
  const statusCounts = orders.reduce((acc, o) => {
    acc[o.fulfillmentStatus] = (acc[o.fulfillmentStatus] || 0) + 1;
    return acc;
  }, {} as Record<string, number>);

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
    <div className="space-y-8">
      {/* Dashboard Top Header */}
      <div className="flex justify-between items-center pb-5 border-b border-neutral-800">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white flex items-center gap-2">
            Store Overview <Sparkles className="w-5 h-5 text-[#C9A84C]" />
          </h1>
          <p className="text-neutral-400 text-sm">Real-time health statistics for Boutiique Vastraa storefront.</p>
        </div>
        <div className="text-xs text-neutral-500 font-mono">
          Last sync: {new Date().toLocaleDateString('en-US', { hour: 'numeric', minute: 'numeric', second: 'numeric' })}
        </div>
      </div>

      {/* Analytics Grid Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        
        {/* Revenue */}
        <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Total Revenue</span>
            <span className="text-2xl font-bold font-mono text-white">₹{totalRevenue.toLocaleString('en-IN', { maximumFractionDigits: 0 })}</span>
            <p className="text-[10px] text-green-400 font-semibold flex items-center gap-1">
              <TrendingUp className="w-3.5 h-3.5" /> +12.4% this week
            </p>
          </div>
          <div className="w-12 h-12 bg-green-500/10 border border-green-500/20 rounded-xl flex items-center justify-center text-green-400">
            <IndianRupee className="w-5 h-5" />
          </div>
        </div>

        {/* Orders */}
        <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Total Orders</span>
            <span className="text-2xl font-bold font-mono text-white">{totalOrders}</span>
            <p className="text-[10px] text-neutral-500 font-medium">Customer checkouts recorded</p>
          </div>
          <div className="w-12 h-12 bg-amber-500/10 border border-amber-500/20 rounded-xl flex items-center justify-center text-amber-400">
            <ShoppingBag className="w-5 h-5" />
          </div>
        </div>

        {/* Products */}
        <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Total Products</span>
            <span className="text-2xl font-bold font-mono text-white">{totalProducts}</span>
            <p className="text-[10px] text-neutral-500 font-medium">Across {collections.length} catalog collections</p>
          </div>
          <div className="w-12 h-12 bg-purple-500/10 border border-purple-500/20 rounded-xl flex items-center justify-center text-purple-400">
            <Package className="w-5 h-5" />
          </div>
        </div>

        {/* Customers */}
        <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 shadow-sm flex items-center justify-between">
          <div className="space-y-1">
            <span className="text-xs font-bold text-neutral-500 uppercase tracking-wider block">Total Customers</span>
            <span className="text-2xl font-bold font-mono text-white">{totalCustomers}</span>
            <p className="text-[10px] text-neutral-500 font-medium">Registered customer base</p>
          </div>
          <div className="w-12 h-12 bg-blue-500/10 border border-blue-500/20 rounded-xl flex items-center justify-center text-blue-400">
            <Users className="w-5 h-5" />
          </div>
        </div>

      </div>

      {/* Main Layout Grid */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Recent Orders Table */}
        <div className="lg:col-span-2 bg-neutral-950 rounded-xl border border-neutral-800 p-6 space-y-4">
          <div className="flex justify-between items-center">
            <h3 className="text-lg font-serif font-bold text-white">Recent Orders</h3>
            <Link href="/admin/orders" className="text-xs font-semibold text-maroonClr hover:text-[#C9A84C] transition-colors flex items-center gap-1">
              View all orders <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-sm text-neutral-400">
              <thead className="bg-neutral-900 text-xs font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-800">
                <tr>
                  <th className="py-3 px-4">Order</th>
                  <th className="py-3 px-4">Customer</th>
                  <th className="py-3 px-4">Date</th>
                  <th className="py-3 px-4">Total</th>
                  <th className="py-3 px-4">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-900">
                {recentOrders.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="py-8 text-center text-neutral-600 font-medium">
                      No orders recorded yet.
                    </td>
                  </tr>
                ) : (
                  recentOrders.map((o) => (
                    <tr key={o.id} className="hover:bg-neutral-900/50 transition-colors">
                      <td className="py-3 px-4 font-mono font-bold text-white text-xs">
                        <Link href={`/admin/orders/${o.id}`} className="hover:text-[#C9A84C]">
                          #VSTR-{o.orderNumber}
                        </Link>
                      </td>
                      <td className="py-3 px-4 text-white font-medium">{o.customerName || "—"}</td>
                      <td className="py-3 px-4 text-xs">
                        {new Date(o.processedAt ?? Date.now()).toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}
                      </td>
                      <td className="py-3 px-4 font-bold text-white">₹{parseFloat(o.totalPrice?.amount ?? "0").toFixed(0)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-wider ${getStatusColor(o.fulfillmentStatus)}`}>
                          {o.fulfillmentStatus}
                        </span>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right Sidebar Alerts & Stats */}
        <div className="space-y-8">
          
          {/* Low Stock Alerts */}
          <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-6 space-y-4">
            <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
              <AlertTriangle className="w-5 h-5 text-amber-400" /> Low Stock Alerts
            </h3>
            
            <div className="space-y-3">
              {lowStockProducts.length === 0 ? (
                <p className="text-neutral-600 text-sm font-medium py-4 text-center">All products fully stocked!</p>
              ) : (
                lowStockProducts.map((p) => (
                  <div key={p.id} className="flex justify-between items-center p-3 bg-neutral-900/50 rounded-lg border border-neutral-850">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold text-white truncate">{p.title}</p>
                      <p className="text-[10px] text-neutral-500 font-medium">ID: {p.id.split('/').pop()}</p>
                    </div>
                    <div className="text-right">
                      <span className={`px-2.5 py-1 rounded text-xs font-bold font-mono ${p.inventory === 0 ? "bg-red-950 text-red-400 border border-red-900/50" : "bg-amber-950 text-amber-400 border border-amber-900/50"}`}>
                        {p.inventory} Left
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>

          {/* Fulfillment Status Progress bar */}
          <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-6 space-y-4">
            <h3 className="text-lg font-serif font-bold text-white">Order Status Metrics</h3>
            
            <div className="space-y-3 pt-2">
              {Object.keys(statusCounts).length === 0 ? (
                <p className="text-neutral-600 text-sm font-medium py-4 text-center">No order metrics available.</p>
              ) : (
                (Object.entries(statusCounts) as [string, number][]).map(([status, count]) => {
                  const pct = Math.round((count / orders.length) * 100);
                  
                  return (
                    <div key={status} className="space-y-1">
                      <div className="flex justify-between text-xs font-bold text-neutral-400">
                        <span className="uppercase tracking-wider">{status}</span>
                        <span>{count} ({pct}%)</span>
                      </div>
                      <div className="w-full bg-neutral-900 rounded-full h-1.5 overflow-hidden">
                        <div 
                          className={`h-1.5 rounded-full ${
                            status === 'DELIVERED' ? 'bg-green-500' :
                            status === 'SHIPPED' ? 'bg-blue-500' :
                            status === 'UNFULFILLED' ? 'bg-amber-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${pct}%` }}
                        ></div>
                      </div>
                    </div>
                  );
                })
              )}
            </div>
          </div>

        </div>

      </div>
    </div>
  );
}

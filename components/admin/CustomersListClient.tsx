"use client";

import { useState } from "react";
import { Search, Mail, Phone, Calendar, IndianRupee, UserCheck, Sparkles } from "lucide-react";

interface CustomersListClientProps {
  customers: any[];
  orders: any[];
}

export default function CustomersListClient({ customers, orders }: CustomersListClientProps) {
  const [search, setSearch] = useState("");

  // Compile customer statistics (LTV & orders count)
  const compiledCustomers = customers.map(c => {
    const customerOrders = orders.filter(o => o.customerId === c.id || o.email.toLowerCase() === c.email.toLowerCase());
    const nonCancelledOrders = customerOrders.filter(o => o.fulfillmentStatus !== "CANCELLED");
    
    const ltv = nonCancelledOrders.reduce((sum, o) => sum + parseFloat(o.totalPrice?.amount ?? "0"), 0);
    const orderCount = customerOrders.length;

    return {
      ...c,
      ltv,
      orderCount
    };
  });

  const filteredCustomers = compiledCustomers.filter(c => {
    if (!c) return false;
    const cleanSearch = search.toLowerCase();
    const fullName = `${c.firstName || ""} ${c.lastName || ""}`.toLowerCase();
    const email = (c.email || "").toLowerCase();
    const phone = c.phone || "";

    return (
      fullName.includes(cleanSearch) ||
      email.includes(cleanSearch) ||
      phone.includes(cleanSearch)
    );
  });

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            Customers Directory <Sparkles className="w-4 h-4 text-[#C9A84C]" />
          </h1>
          <p className="text-xs text-neutral-400">Total registered patrons: {filteredCustomers.length}</p>
        </div>
      </div>

      {/* Filter and search bar */}
      <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 shadow-sm relative">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
        <input
          type="text"
          placeholder="Search by customer name, email address, phone..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-maroonClr transition-all"
        />
      </div>

      {/* Customers table card */}
      <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-400">
            <thead className="bg-neutral-900 text-xs font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-800">
              <tr>
                <th className="py-3.5 px-4">Patron Name</th>
                <th className="py-3.5 px-4">Contact Info</th>
                <th className="py-3.5 px-4">Registration Date</th>
                <th className="py-3.5 px-4">Orders Placed</th>
                <th className="py-3.5 px-4 text-right">Lifetime Value (LTV)</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {filteredCustomers.length === 0 ? (
                <tr>
                  <td colSpan={5} className="py-12 text-center text-neutral-600 font-medium">
                    No customers registered yet.
                  </td>
                </tr>
              ) : (
                filteredCustomers.map((c) => {
                  const date = new Date(c.createdAt || Date.now()).toLocaleDateString('en-IN', {
                    month: 'short',
                    day: 'numeric',
                    year: 'numeric'
                  });

                  return (
                    <tr key={c.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-full bg-maroonClr/10 border border-maroonClr/20 flex items-center justify-center text-maroonClr font-bold text-xs uppercase">
                            {(c.firstName || "?")[0]}{(c.lastName || "")[0] || ""}
                          </div>
                          <div>
                            <div className="font-semibold text-white">{c.firstName} {c.lastName}</div>
                            <div className="text-[10px] text-neutral-500 font-mono">ID: {c.id.split('_').pop()}</div>
                          </div>
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-1.5 text-xs text-neutral-300">
                          <Mail className="w-3.5 h-3.5 text-neutral-500" />
                          <span>{c.email}</span>
                        </div>
                        {c.phone && (
                          <div className="flex items-center gap-1.5 text-[10px] text-neutral-500 mt-0.5">
                            <Phone className="w-3 h-3 text-neutral-600" />
                            <span>{c.phone}</span>
                          </div>
                        )}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium">{date}</td>
                      <td className="py-3 px-4">
                        <span className="px-2 py-0.5 bg-neutral-900 text-neutral-400 border border-neutral-800 rounded text-xs font-mono font-bold">
                          {c.orderCount} Orders
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right font-bold text-white font-mono">
                        ₹{c.ltv.toLocaleString('en-IN', { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
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

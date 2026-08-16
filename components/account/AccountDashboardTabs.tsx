"use client";

import { useState } from "react";
import { ShoppingBag, Heart } from "lucide-react";
import OrderHistory from "./OrderHistory";
import AccountWishlist from "./AccountWishlist";

interface AccountDashboardTabsProps {
  orders: any[];
}

export default function AccountDashboardTabs({ orders }: { orders: any[] }) {
  const [activeTab, setActiveTab] = useState<"orders" | "wishlist">("orders");

  return (
    <div className="flex-1 space-y-6">
      {/* Tab Switcher Headers */}
      <div className="flex border-b border-gray-200">
        <button
          onClick={() => setActiveTab("orders")}
          className={`pb-4 px-4 sm:px-6 font-serif text-base sm:text-lg font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === "orders"
              ? "border-maroonClr text-maroonClr"
              : "border-transparent text-gray-400 hover:text-maroonClr"
          }`}
        >
          <ShoppingBag className="w-4 h-4" />
          Order History ({orders.length})
        </button>
        <button
          onClick={() => setActiveTab("wishlist")}
          className={`pb-4 px-4 sm:px-6 font-serif text-base sm:text-lg font-bold border-b-2 flex items-center gap-2 transition-all ${
            activeTab === "wishlist"
              ? "border-maroonClr text-maroonClr"
              : "border-transparent text-gray-400 hover:text-maroonClr"
          }`}
        >
          <Heart className="w-4 h-4" />
          My Wishlist
        </button>
      </div>

      {/* Render active view */}
      <div className="pt-2 animate-fadeIn">
        {activeTab === "orders" ? (
          <OrderHistory orders={orders} />
        ) : (
          <AccountWishlist />
        )}
      </div>
    </div>
  );
}

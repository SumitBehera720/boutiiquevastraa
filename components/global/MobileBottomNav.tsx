"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { X } from "lucide-react";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const isCartOpen = useCartStore((s) => s.isCartOpen);
  const [isCheckoutState, setIsCheckoutState] = useState(false);
  const [moreOpen, setMoreOpen] = useState(false);

  useEffect(() => {
    const p = (pathname || "").toLowerCase();
    const winP = (typeof window !== "undefined" ? window.location.pathname : "").toLowerCase();
    setIsCheckoutState(p.includes("checkout") || winP.includes("checkout"));
  }, [pathname]);

  const rawPath = pathname || "";
  const path = rawPath.toLowerCase();
  const isLoginPage = path === "/account/login";
  const isAdminPage = path.startsWith("/admin");
  const winP = (typeof window !== "undefined" ? window.location.pathname : "").toLowerCase();
  const isCheckoutPage = isCheckoutState || path.includes("checkout") || winP.includes("checkout");

  if (isLoginPage || isAdminPage || isCheckoutPage || isCartOpen) return null;

  const isActive = (href: string) => path === href || path.startsWith(href + "/");

  const tabs = [
    {
      href: "/collections",
      label: "Collections",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6A2.25 2.25 0 016 3.75h2.25A2.25 2.25 0 0110.5 6v2.25a2.25 2.25 0 01-2.25 2.25H6a2.25 2.25 0 01-2.25-2.25V6zM3.75 15.75A2.25 2.25 0 016 13.5h2.25a2.25 2.25 0 012.25 2.25V18a2.25 2.25 0 01-2.25 2.25H6A2.25 2.25 0 013.75 18v-2.25zM13.5 6a2.25 2.25 0 012.25-2.25H18A2.25 2.25 0 0120.25 6v2.25A2.25 2.25 0 0118 10.5h-2.25A2.25 2.25 0 0113.5 8.25V6zM13.5 15.75a2.25 2.25 0 012.25-2.25H18a2.25 2.25 0 012.25 2.25V18A2.25 2.25 0 0118 20.25h-2.25A2.25 2.25 0 0113.5 18v-2.25z" />
        </svg>
      ),
    },
    {
      href: "/products?sort=best-selling",
      label: "Trending",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M15.59 14.37a6 6 0 01-5.84 7.38v-4.8m5.84-2.58a14.98 14.98 0 006.16-12.12A14.98 14.98 0 009.631 8.41m5.96 5.96a14.926 14.926 0 01-5.841 2.58m-.119-8.54a6 6 0 00-7.381 5.84h4.8m2.581-5.84a14.927 14.927 0 00-2.58 5.84m2.699 2.7c-.103.021-.207.041-.311.06a15.09 15.09 0 01-2.448-2.448 14.9 14.9 0 01.06-.312m-2.24 2.39a4.493 4.493 0 00-1.757 4.306 4.493 4.493 0 004.306-1.758M16.5 9a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
        </svg>
      ),
    },
    {
      href: "/wishlist",
      label: "Wishlist",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
        </svg>
      ),
    },
    {
      href: "/track-order",
      label: "Track",
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 18.75a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h6m-9 0H3.375a1.125 1.125 0 01-1.125-1.125V14.25m17.25 4.5a1.5 1.5 0 01-3 0m3 0a1.5 1.5 0 00-3 0m3 0h1.125c.621 0 1.129-.504 1.09-1.124a17.902 17.902 0 00-3.213-9.193 2.056 2.056 0 00-1.58-.86H14.25M16.5 18.75h-2.25m0-11.177v-.958c0-.568-.422-1.048-.987-1.106a48.554 48.554 0 00-10.026 0 1.106 1.106 0 00-.987 1.106v7.635m12-6.677v6.677m0 4.5v-4.5m0 0h-12" />
        </svg>
      ),
    },
    {
      label: "More",
      isMore: true,
      icon: (
        <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-5 h-5">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3.75 6.75h16.5M3.75 12h16.5m-16.5 5.25H12" />
        </svg>
      ),
    },
  ];

  const moreLinks = [
    { label: "Home", href: "/", icon: "🏠" },
    { label: "All Products", href: "/products", icon: "🛍️" },
    { label: "New Arrivals", href: "/products?sort=created-descending", icon: "✨" },
    { label: "Best Sellers", href: "/products?sort=best-selling", icon: "⭐" },
    { label: "Flash Sale", href: "/collections/sale", icon: "🔥" },
    { label: "My Account", href: "/account", icon: "👤" },
    { label: "Contact Us", href: "/contact-us", icon: "💬" },
    { label: "About Us", href: "/about-us", icon: "ℹ️" },
  ];

  return (
    <>
      {/* More overlay */}
      {moreOpen && (
        <div className="fixed inset-0 z-[60]" onClick={() => setMoreOpen(false)}>
          <div className="absolute inset-0 bg-black/50 backdrop-blur-sm" />
          <div
            className="absolute bottom-[57px] left-0 right-0 bg-white rounded-t-2xl shadow-2xl overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Handle */}
            <div className="flex justify-center pt-3 pb-1">
              <div className="w-10 h-1 bg-gray-200 rounded-full" />
            </div>
            {/* Header */}
            <div className="flex items-center justify-between px-4 py-2 border-b border-gray-100">
              <span className="font-kalnia text-maroonClr font-semibold text-base">Menu</span>
              <button
                onClick={() => setMoreOpen(false)}
                className="text-gray-400 hover:text-maroonClr transition-colors"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            {/* Links grid */}
            <div className="grid grid-cols-4 gap-1 p-3">
              {moreLinks.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  onClick={() => setMoreOpen(false)}
                  className={`flex flex-col items-center gap-1.5 py-3 rounded-xl transition-all ${
                    isActive(link.href) ? "bg-maroonClr/10" : "hover:bg-gray-50"
                  }`}
                >
                  <span className="text-2xl leading-none">{link.icon}</span>
                  <span className="text-[10px] font-medium text-gray-700 text-center leading-tight">
                    {link.label}
                  </span>
                </Link>
              ))}
            </div>
            {/* Bottom trust strip */}
            <div className="bg-maroonClr/5 border-t border-maroonClr/10 px-4 py-3 flex items-center justify-center gap-6">
              <span className="text-[10px] text-gray-500 font-medium">🚚 Free Shipping</span>
              <span className="text-[10px] text-gray-500 font-medium">🎁 Gift on ₹1,500+</span>
              <span className="text-[10px] text-gray-500 font-medium">↩ Easy Returns</span>
            </div>
          </div>
        </div>
      )}

      {/* Bottom bar */}
      <div className="bg-maroonClr fixed right-0 bottom-0 left-0 z-50 text-white shadow-[0_-2px_8px_rgba(0,0,0,0.15)] sm:hidden">
        <div className="grid w-full grid-cols-5">
          {tabs.map((tab, idx) => {
            if (tab.isMore) {
              return (
                <button
                  key={idx}
                  onClick={() => setMoreOpen(!moreOpen)}
                  className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 transition-all ${
                    moreOpen ? "bg-white/15" : "hover:bg-white/10"
                  }`}
                >
                  {tab.icon}
                  <span className="font-kalnia text-[9px] font-medium leading-none">{tab.label}</span>
                </button>
              );
            }
            const active = isActive(tab.href!);
            return (
              <Link
                key={idx}
                href={tab.href!}
                className={`flex flex-col items-center justify-center gap-0.5 py-2 px-1 transition-all relative ${
                  active ? "bg-white/15" : "hover:bg-white/10"
                }`}
              >
                {active && (
                  <span className="absolute top-0 left-1/2 -translate-x-1/2 w-8 h-0.5 bg-goldClr rounded-full" />
                )}
                {tab.icon}
                <span className="font-kalnia text-[9px] font-medium leading-none">{tab.label}</span>
              </Link>
            );
          })}
        </div>
      </div>
    </>
  );
}

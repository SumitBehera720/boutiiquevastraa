"use client";

import Link from "next/link";
import { Layers, User } from "lucide-react";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";
import { useCartStore } from "@/store/cartStore";

export default function MobileBottomNav() {
  const pathname = usePathname();
  const isCartOpen = useCartStore((s) => s.isCartOpen);
  const [isCheckoutState, setIsCheckoutState] = useState(false);

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

  if (isLoginPage || isAdminPage || isCheckoutPage || isCartOpen) {
    return null;
  }
  return (
    <div className="bg-maroonClr fixed right-0 bottom-0 left-0 z-50 text-white shadow-[0_-1px_2px_rgba(0,0,0,0.1)] duration-200 sm:hidden">
      <div className="grid w-full grid-cols-4 p-2">
        <Link href="/" className="flex flex-col items-center justify-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="m-auto text-white">
            <path d="M3 9l9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z" />
            <polyline points="9 22 9 12 15 12 15 22" />
          </svg>
          <span className="font-kalnia text-[10px] font-medium">Home</span>
        </Link>
        <Link href="/products" className="flex flex-col items-center justify-center gap-1">
          <svg xmlns="http://www.w3.org/2000/svg" width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" className="m-auto text-white">
            <path d="M20.59 13.41l-7.17 7.17a2 2 0 0 1-2.83 0L2 12V2h10l8.59 8.59a2 2 0 0 1 0 2.82z" />
            <line x1="7" y1="7" x2="7.01" y2="7" />
          </svg>
          <span className="font-kalnia text-[10px] font-medium">Products</span>
        </Link>
        <Link href="/account" className="flex flex-col items-center justify-center gap-1">
          <Layers className="m-auto h-6 w-6 text-white" aria-hidden="true" />
          <span className="font-kalnia text-[10px] font-medium">Orders</span>
        </Link>
        <Link href="/account" className="flex flex-col items-center justify-center gap-1">
          <User className="m-auto h-6 w-6 text-white" aria-hidden="true" />
          <span className="font-kalnia text-[10px] font-medium">Profile</span>
        </Link>
      </div>
    </div>
  );
}

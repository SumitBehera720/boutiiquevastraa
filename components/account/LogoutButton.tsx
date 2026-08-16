"use client";

import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import { logoutAction } from "@/app/actions/auth";

export default function LogoutButton() {
  const clearCart = useCartStore((state) => state.clearCart);
  const clearWishlist = useWishlistStore((state) => state.clearWishlist);

  const handleLogout = async (e: React.MouseEvent<HTMLButtonElement>) => {
    e.preventDefault();
    try {
      // Clear client-side stores to ensure session segregation
      clearCart();
      clearWishlist();
      
      // Perform server-side logout (removes cookie and session in DB)
      await logoutAction();
    } catch (err) {
      console.error("Failed to logout:", err);
    }
  };

  return (
    <button 
      onClick={handleLogout}
      type="button" 
      className="text-sm font-semibold text-gray-500 hover:text-red-600 underline transition-colors"
    >
      Log out
    </button>
  );
}

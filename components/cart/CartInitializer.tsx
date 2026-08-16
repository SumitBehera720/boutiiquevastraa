"use client";

import { useEffect, useState } from "react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import * as cartClient from "@/lib/api/cart-client";
import { getTokenFromCookie } from "@/lib/api/auth-client";

export default function CartInitializer() {
  const { cartId, setCart } = useCartStore();
  const { setWishlist } = useWishlistStore();
  const [syncedCartId, setSyncedCartId] = useState<string | null>(null);
  const [sessionInitialized, setSessionInitialized] = useState(false);

  useEffect(() => {
    async function initializeSession() {
      const token = getTokenFromCookie();
      if (token) {
        try {
          const res = await fetch("/api/auth/me", {
            headers: { Accept: "application/json" },
          });
          if (res.ok) {
            const data = await res.json();
            
            // 1. Restore Wishlist from user account
            if (data.wishlist && Array.isArray(data.wishlist)) {
              setWishlist(data.wishlist);
            }
            
            // 2. Restore Cart from user account
            if (data.cartId) {
              const cart = await cartClient.getCart(data.cartId);
              if (cart) {
                setCart(cart);
                setSyncedCartId(data.cartId);
              }
            }
          }
        } catch (err) {
          console.error("[CartInitializer] Failed to initialize session from account:", err);
        }
      }
      setSessionInitialized(true);
    }

    initializeSession();
  }, [setCart, setWishlist]);

  useEffect(() => {
    if (!sessionInitialized) return;
    if (!cartId) {
      setSyncedCartId(null);
      return;
    }

    // Only sync if we haven't synced this specific cartId in the current session
    if (cartId === syncedCartId) return;

    async function syncCart() {
      try {
        const cart = await cartClient.getCart(cartId!);
        if (cart) {
          setCart(cart);
          setSyncedCartId(cartId);
        } else {
          // If cart is not found on server (e.g. deleted or expired), clear local store cartId
          setCart({
            id: null,
            checkoutUrl: null,
            totalQuantity: 0,
            lines: [],
            subtotal: "0.00",
          });
          setSyncedCartId(null);
        }
      } catch (err) {
        console.error("[CartInitializer] Failed to sync cart with server:", err);
      }
    }

    syncCart();
  }, [cartId, syncedCartId, setCart, sessionInitialized]);

  return null;
}

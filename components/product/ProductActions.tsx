"use client";

import { useState } from "react";
import * as cartClient from "@/lib/api/cart-client";
import { useCartStore } from "@/store/cartStore";
import { getTokenFromCookie } from "@/lib/api/auth-client";
import NotifyMeModal from "./NotifyMeModal";

export default function ProductActions({ 
  variantId, 
  quantity, 
  availableForSale,
  selectedSize,
  productId,
  productTitle,
  productHandle
}: { 
  variantId: string; 
  quantity: number; 
  availableForSale: boolean;
  selectedSize?: string;
  productId: string;
  productTitle: string;
  productHandle: string;
}) {
  const [isAdding, setIsAdding] = useState(false);
  const [isBuying, setIsBuying] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const { cartId, setCart, openCart } = useCartStore();

  const requireAuth = () => {
    if (!getTokenFromCookie()) {
      window.location.href = "/account/login";
      return false;
    }
    return true;
  };

  const handleAddToCart = async () => {
    if (!availableForSale) return;
    if (!requireAuth()) return;
    setIsAdding(true);
    
    try {
      const cart = cartId
        ? await cartClient.addToCart(cartId, [{ merchandiseId: variantId, quantity, selectedSize }])
        : await cartClient.createCart([{ merchandiseId: variantId, quantity, selectedSize }]);
      setCart(cart);
      openCart();
    } catch (e: any) {
      alert(e.message || "Failed to add to cart");
    } finally {
      setIsAdding(false);
    }
  };

  const handleBuyNow = async () => {
    if (!availableForSale) return;
    if (!requireAuth()) return;
    setIsBuying(true);
    
    try {
      const cart = await cartClient.createCart([{ merchandiseId: variantId, quantity, selectedSize }]);
      window.location.href = `/checkout?cartId=${cart.id}`;
    } catch (e: any) {
      alert(e.message || "Failed to initiate checkout");
    } finally {
      setIsBuying(false);
    }
  };

  return (
    <div className="flex flex-row gap-3 w-full">
      {availableForSale ? (
        <>
          <button 
            onClick={handleAddToCart}
            disabled={isAdding || isBuying}
            className="flex-1 flex items-center justify-center bg-white border border-maroonClr text-maroonClr hover:bg-maroonClr hover:text-white transition-colors py-2 md:py-2.5 font-medium text-sm rounded disabled:opacity-50"
          >
            {isAdding ? "Adding..." : "Add to Cart"}
          </button>
          <button 
            onClick={handleBuyNow}
            disabled={isAdding || isBuying}
            className="flex-1 flex items-center justify-center bg-maroonClr border border-maroonClr text-white hover:bg-[#6A102A] transition-colors py-2 md:py-2.5 font-medium text-sm rounded disabled:opacity-50 shadow-sm"
          >
            {isBuying ? "Processing..." : "Buy Now"}
          </button>
        </>
      ) : (
        <button 
          onClick={() => setIsNotifyOpen(true)}
          className="w-full flex items-center justify-center bg-maroonClr border border-maroonClr text-white hover:bg-[#6A102A] transition-colors py-2.5 md:py-3 font-semibold text-sm rounded shadow-md"
        >
          Notify Me
        </button>
      )}

      <NotifyMeModal
        isOpen={isNotifyOpen}
        onClose={() => setIsNotifyOpen(false)}
        productId={productId}
        productTitle={productTitle}
        productHandle={productHandle}
      />
    </div>
  );
}

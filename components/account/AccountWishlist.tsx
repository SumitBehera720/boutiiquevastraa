"use client";

import { useWishlistStore } from "@/store/wishlistStore";
import { useCartStore } from "@/store/cartStore";
import * as cartClient from "@/lib/api/cart-client";
import { getTokenFromCookie } from "@/lib/api/auth-client";
import Link from "next/link";
import Image from "next/image";
import { Trash2, ShoppingBag, Heart, Loader2 } from "lucide-react";
import { useState } from "react";

export default function AccountWishlist() {
  const { items, removeItem } = useWishlistStore();
  const { cartId, setCart, openCart } = useCartStore();
  const [addingId, setAddingId] = useState<string | null>(null);

  const handleAddToCart = async (item: any) => {
    if (addingId) return;
    if (!getTokenFromCookie()) {
      window.location.href = "/account/login";
      return;
    }

    setAddingId(item.id);
    try {
      // Add the product (using item.id as merchandiseId) to cart
      const cart = cartId
        ? await cartClient.addToCart(cartId, [{ merchandiseId: item.id, quantity: 1 }])
        : await cartClient.createCart([{ merchandiseId: item.id, quantity: 1 }]);
      setCart(cart);
      openCart();
    } catch (err) {
      console.error("Failed to add wishlist item to cart:", err);
    } finally {
      setAddingId(null);
    }
  };

  if (items.length === 0) {
    return (
      <div className="py-16 text-center bg-white border border-gray-150 rounded-2xl p-8 max-w-lg mx-auto">
        <Heart className="w-12 h-12 text-gray-300 mx-auto mb-4" />
        <h3 className="font-serif text-lg font-bold text-gray-900 mb-2">Your wishlist is empty</h3>
        <p className="text-sm text-gray-500 mb-6 leading-relaxed font-sans">
          You haven't saved any items yet. Start exploring our collections to save your favorite products!
        </p>
        <Link
          href="/products"
          className="inline-block bg-maroonClr hover:bg-maroonClr/90 text-white px-6 py-2.5 rounded text-xs font-bold uppercase tracking-wider transition-all"
        >
          Discover Products
        </Link>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-3 gap-4">
      {items.map((item) => (
        <div 
          key={item.id} 
          className="group flex flex-col bg-white rounded-xl shadow-sm hover:shadow-md border border-gray-200 overflow-hidden transition-all duration-300 relative"
        >
          {/* Remove Button */}
          <button 
            onClick={() => removeItem(item.id)}
            className="absolute top-2 right-2 z-10 bg-white/90 p-1.5 rounded-full text-gray-400 hover:text-red-500 hover:bg-white shadow-sm transition-all"
            title="Remove from Wishlist"
          >
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          
          {/* Image */}
          <Link href={`/products/${item.handle}`} className="relative w-full aspect-[3/4] bg-gray-50 overflow-hidden block">
            {item.image ? (
              <Image
                src={item.image}
                alt={item.title}
                fill
                className="object-cover transition-transform duration-500 group-hover:scale-105"
                sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-gray-100 text-gray-400 text-xs">
                No Image
              </div>
            )}
          </Link>

          {/* Details */}
          <div className="p-3 flex flex-col flex-grow text-center">
            <Link href={`/products/${item.handle}`} className="block mb-1 flex-grow">
              <h4 className="text-xs font-semibold text-gray-800 hover:text-maroonClr transition-colors line-clamp-2 min-h-[32px]">
                {item.title}
              </h4>
            </Link>
            
            <div className="text-maroonClr font-bold text-sm mb-3">
              ₹{parseFloat(item.price).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 })}
            </div>

            {/* Add to Cart button */}
            <button
              onClick={() => handleAddToCart(item)}
              disabled={addingId !== null}
              className="w-full bg-[#EBE2CD]/80 hover:bg-[#EBE2CD] text-gray-800 disabled:opacity-50 py-2 rounded text-[11px] font-bold uppercase tracking-wider flex items-center justify-center gap-1.5 transition-all"
            >
              {addingId === item.id ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <ShoppingBag className="w-3.5 h-3.5" />
              )}
              {addingId === item.id ? "Adding..." : "Add to Cart"}
            </button>
          </div>
        </div>
      ))}
    </div>
  );
}

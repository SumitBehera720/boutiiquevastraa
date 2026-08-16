"use client";

import Image from "next/image";
import Link from "next/link";
import { Minus, Plus, Trash2, Gift } from "lucide-react";
import { useState } from "react";
import * as cartClient from "@/lib/api/cart-client";
import { useCartStore } from "@/store/cartStore";

export default function CartItem({ item }: { item: any }) {
  const [isUpdating, setIsUpdating] = useState(false);
  const { cartId, setCart, closeCart } = useCartStore();

  const handleUpdateQuantity = async (newQuantity: number) => {
    if (newQuantity < 1) return;
    setIsUpdating(true);
    try {
      const cart = await cartClient.updateCartLines(cartId!, [{ id: item.id, quantity: newQuantity }]);
      setCart(cart);
    } catch (e) {
      console.error("Failed to update quantity:", e);
    }
    setIsUpdating(false);
  };

  const handleRemove = async () => {
    setIsUpdating(true);
    try {
      const cart = await cartClient.removeFromCart(cartId!, [item.id]);
      setCart(cart);
    } catch (e) {
      console.error("Failed to remove item:", e);
    }
    setIsUpdating(false);
  };

  const merchandise = item.merchandise;
  const product = merchandise?.product;

  const title = product?.title || item.title || "Product";
  const handle = product?.handle || item.handle || "";
  const productUrl = handle ? `/products/${handle}` : "#";
  const imageUrl = merchandise?.image?.url || item.image || "";
  const imageAlt = merchandise?.image?.altText || title;
  const variantTitle = merchandise?.title || item.variantTitle || "";
  const price = item.isGift ? "0" : (merchandise?.price?.amount || item.price || "0");

  return (
    <div className={`flex gap-4 py-4 border-b border-gray-100 ${isUpdating ? 'opacity-50 pointer-events-none' : ''}`}>
      {/* Image */}
      {handle ? (
        <Link 
          href={productUrl} 
          onClick={closeCart}
          className="relative w-20 h-24 bg-gray-50 rounded overflow-hidden flex-shrink-0 border border-gray-200 hover:opacity-90 transition-opacity cursor-pointer group"
        >
          {imageUrl && (
            <Image 
              src={imageUrl} 
              alt={imageAlt} 
              fill 
              className="object-cover group-hover:scale-105 transition-transform" 
            />
          )}
        </Link>
      ) : (
        <div className="relative w-20 h-24 bg-gray-50 rounded overflow-hidden flex-shrink-0 border border-gray-200">
          {imageUrl && (
            <Image 
              src={imageUrl} 
              alt={imageAlt} 
              fill 
              className="object-cover" 
            />
          )}
        </div>
      )}

      {/* Details */}
      <div className="flex flex-col flex-1">
        <div className="flex justify-between items-start">
          {handle ? (
            <Link href={productUrl} onClick={closeCart}>
              <h4 className="text-sm font-semibold text-gray-800 line-clamp-2 hover:text-maroonClr transition-colors cursor-pointer">
                {title}
              </h4>
            </Link>
          ) : (
            <h4 className="text-sm font-semibold text-gray-800 line-clamp-2">
              {title}
            </h4>
          )}
          <button 
            onClick={handleRemove}
            className="text-gray-400 hover:text-red-500 transition-colors p-1"
          >
            <Trash2 className="w-4 h-4" />
          </button>
        </div>

        <div className="text-xs text-gray-500 mt-1 uppercase tracking-wider">
          {variantTitle !== "Default Title" && variantTitle}
        </div>

        <div className="mt-auto flex justify-between items-end">
          {/* Quantity Controls */}
          {item.isGift ? (
            <span className="text-xs text-green-600 font-bold bg-green-50 px-2.5 py-1.5 rounded border border-green-150 flex items-center gap-1.5">
              <Gift className="w-3.5 h-3.5 text-green-600 shrink-0" /> Free Gift
            </span>
          ) : (
            <div className="flex items-center border border-gray-300 rounded overflow-hidden w-24">
              <button 
                onClick={() => handleUpdateQuantity(item.quantity - 1)}
                disabled={item.quantity <= 1}
                className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors disabled:opacity-50"
              >
                <Minus className="w-3 h-3" />
              </button>
              <span className="flex-1 text-center text-sm font-medium">{item.quantity}</span>
              <button 
                onClick={() => handleUpdateQuantity(item.quantity + 1)}
                className="px-2 py-1 bg-gray-50 hover:bg-gray-100 text-gray-600 transition-colors"
              >
                <Plus className="w-3 h-3" />
              </button>
            </div>
          )}

          <div className="font-semibold text-primary">
            {item.isGift ? (
              <span className="text-green-600 font-bold uppercase tracking-wider text-xs bg-green-50 px-2 py-1.5 rounded">FREE</span>
            ) : (
              <>₹{parseFloat(price).toFixed(2)}</>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

"use client";

import { Heart } from "lucide-react";
import { useWishlistStore } from "@/store/wishlistStore";
import { getTokenFromCookie } from "@/lib/api/auth-client";

interface WishlistButtonProps {
  product: {
    id: string;
    handle: string;
    title: string;
    priceRange: { minVariantPrice: { amount: string } };
    images: { edges: { node: { url: string } }[] };
  };
  className?: string;
}

export default function WishlistButton({ product, className = "" }: WishlistButtonProps) {
  const { addItem, removeItem, isInWishlist } = useWishlistStore();
  const isWished = isInWishlist(product.id);

  const toggleWishlist = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();

    if (isWished) {
      removeItem(product.id);
    } else {
      if (!getTokenFromCookie()) {
        window.location.href = "/account/login";
        return;
      }
      let imgUrl = "/images/placeholder.jpg";
      if (Array.isArray(product.images)) {
        const raw = product.images[0];
        imgUrl = typeof raw === "string" ? raw : raw?.url || raw?.node?.url || imgUrl;
      } else if (product.images && Array.isArray((product.images as any).edges)) {
        imgUrl = (product.images as any).edges[0]?.node?.url || imgUrl;
      }
      addItem({
        id: product.id,
        handle: product.handle,
        title: product.title,
        price: product.priceRange.minVariantPrice.amount,
        image: imgUrl,
      });
    }
  };

  return (
    <button 
      onClick={toggleWishlist}
      className={`p-2 rounded-full transition-all duration-300 ${
        isWished 
          ? "bg-secondary text-white shadow-md" 
          : "bg-white/80 text-gray-500 hover:text-secondary hover:bg-white"
      } ${className}`}
      aria-label="Toggle Wishlist"
    >
      <Heart className={`w-5 h-5 ${isWished ? "fill-current" : ""}`} />
    </button>
  );
}

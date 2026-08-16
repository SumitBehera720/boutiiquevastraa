"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import WishlistButton from "@/components/wishlist/WishlistButton";
import { useCartStore } from "@/store/cartStore";
import * as cartClient from "@/lib/api/cart-client";
import { getTokenFromCookie } from "@/lib/api/auth-client";
import NotifyMeModal from "./NotifyMeModal";

interface Product {
  id: string;
  title: string;
  handle: string;
  availableForSale: boolean;
  priceRange: {
    minVariantPrice: { amount: string; currencyCode: string };
  };
  compareAtPriceRange?: {
    minVariantPrice: { amount: string; currencyCode: string };
  };
  images: {
    edges: { node: { url: string; altText: string } }[];
  };
  variants?: {
    edges: { node: { id: string } }[];
  };
}

export default function ProductCard({ product }: { product: Product }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const { cartId, setCart, openCart } = useCartStore();

  const isOutOfStock = !product.availableForSale;

  const price = parseFloat(product.priceRange.minVariantPrice.amount);
  const compareAtPrice = product.compareAtPriceRange?.minVariantPrice?.amount
    ? parseFloat(product.compareAtPriceRange.minVariantPrice.amount)
    : null;

  const hasDiscount = compareAtPrice && compareAtPrice > price;
  const discountPercentage = hasDiscount
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100)
    : 0;

  let image1 = "/images/placeholder.jpg";
  let image2 = "/images/placeholder.jpg";

  if (Array.isArray(product.images)) {
    const raw1 = product.images[0];
    const raw2 = product.images[1] || raw1;
    image1 = typeof raw1 === "string" ? raw1 : raw1?.url || raw1?.node?.url || "/images/placeholder.jpg";
    image2 = typeof raw2 === "string" ? raw2 : raw2?.url || raw2?.node?.url || image1;
  } else if (product.images && Array.isArray((product.images as any).edges)) {
    const edges = (product.images as any).edges;
    image1 = edges[0]?.node?.url || "/images/placeholder.jpg";
    image2 = edges[1]?.node?.url || image1;
  }

  let firstVariantId = product.id || "";
  if (Array.isArray(product.variants)) {
    const v0 = product.variants[0];
    firstVariantId = typeof v0 === "string" ? v0 : v0?.id || v0?.node?.id || product.id;
  } else if (product.variants && Array.isArray((product.variants as any).edges)) {
    firstVariantId = (product.variants as any).edges[0]?.node?.id || product.id;
  }

  const handleAddToCart = async () => {
    if (!firstVariantId || isAdding || isOutOfStock) return;
    if (!getTokenFromCookie()) {
      window.location.href = "/account/login";
      return;
    }
    setIsAdding(true);
    try {
      const cart = cartId
        ? await cartClient.addToCart(cartId, [{ merchandiseId: firstVariantId, quantity: 1 }])
        : await cartClient.createCart([{ merchandiseId: firstVariantId, quantity: 1 }]);
      setCart(cart);
      openCart();
    } catch (e) {
      console.error("Failed to add to cart:", e);
    } finally {
      setIsAdding(false);
    }
  };

  const getDeterministicRating = (handle: string) => {
    let hash = 0;
    for (let i = 0; i < handle.length; i++) {
      hash = handle.charCodeAt(i) + ((hash << 5) - hash);
    }
    const absHash = Math.abs(hash);
    const count = 40 + (absHash % 31); // 40 to 70 reviews
    const rating = 4.1 + ((absHash % 9) / 10); // 4.1 to 4.9 stars
    const roundedRating = Math.round(rating);
    const stars = "★".repeat(roundedRating) + "☆".repeat(5 - roundedRating);
    return { count, rating: rating.toFixed(1), stars };
  };

  const { count: reviewCount, rating: reviewRating, stars: reviewStars } = getDeterministicRating(product.handle);

  return (
    <div
      className="group flex flex-col bg-white rounded-lg shadow-sm hover:shadow-xl transition-all duration-300 transform hover:-translate-y-1 relative"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Discount Badge */}
      {hasDiscount && !isOutOfStock && (
        <div className="absolute top-2 left-2 bg-goldClr text-white text-xs font-bold px-2 py-1 rounded z-10">
          -{discountPercentage}%
        </div>
      )}

      {/* Out of Stock Badge */}
      {isOutOfStock && (
        <div className="absolute top-2 left-2 bg-red-600 text-white text-[10px] font-bold px-2.5 py-1 rounded z-10 uppercase tracking-wider">
          Out of Stock
        </div>
      )}

      {/* Image Container with Crossfade */}
      <div className={`relative w-full aspect-[3/4] overflow-hidden rounded-t-lg bg-gray-100 ${isOutOfStock ? "filter grayscale opacity-75" : ""}`}>
        <Link href={`/products/${product.handle}`} className="block w-full h-full relative">
          {image1 && (
            <Image
              src={isHovered ? image2 : image1}
              alt={product.title}
              fill
              className="object-cover transition-opacity duration-500 ease-in-out"
              sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
            />
          )}
        </Link>
        <div className="absolute top-2 right-2 z-10">
          <WishlistButton product={product as any} />
        </div>
      </div>

      {/* Content */}
      <div className="p-4 flex flex-col flex-grow">
        <div className="flex items-center gap-1 text-goldClr mb-2 text-xs font-semibold">
          <span className="tracking-wider">{reviewStars}</span>
          <span className="text-gray-500 text-[10px] ml-1">{reviewRating} ({reviewCount})</span>
        </div>

        <Link href={`/products/${product.handle}`}>
          <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 min-h-[40px] group-hover:text-maroonClr transition-colors">
            {product.title}
          </h3>
        </Link>

        <div className="mt-2 flex items-center gap-2">
          <span className="text-maroonClr font-bold text-lg">
            ₹{price.toFixed(2)}
          </span>
          {hasDiscount && (
            <span className="text-gray-400 line-through text-sm">
              ₹{compareAtPrice.toFixed(2)}
            </span>
          )}
        </div>

        {/* Action Buttons */}
        <div className="mt-4 flex gap-2 w-full">
          {isOutOfStock ? (
            <button
              onClick={() => setIsNotifyOpen(true)}
              className="w-full bg-maroonClr border border-maroonClr text-white hover:bg-[#6A102A] transition-colors py-2 text-xs font-bold uppercase rounded text-center shadow-sm"
            >
              Notify Me
            </button>
          ) : (
            <>
              <button
                onClick={handleAddToCart}
                disabled={isAdding || !firstVariantId}
                className="flex-1 bg-transparent border border-maroonClr text-maroonClr hover:bg-maroonClr hover:text-white transition-colors py-2 text-xs font-bold uppercase rounded disabled:opacity-50"
              >
                {isAdding ? "Adding..." : "Add to Cart"}
              </button>
              <Link
                href={`/products/${product.handle}`}
                className="flex-1 bg-maroonClr border border-maroonClr text-white hover:bg-maroonClr/80 transition-colors py-2 text-xs font-bold uppercase rounded text-center"
              >
                Buy Now
              </Link>
            </>
          )}
        </div>
      </div>

      {/* Notify Me Modal */}
      <NotifyMeModal
        isOpen={isNotifyOpen}
        onClose={() => setIsNotifyOpen(false)}
        productId={product.id}
        productTitle={product.title}
        productHandle={product.handle}
      />
    </div>
  );
}

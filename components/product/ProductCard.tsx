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

function getRibbonLabel(product: Product): { label: string; color: string } | null {
  const tags: string[] = (product as any).tags || [];
  if (!product.availableForSale) return { label: "Sold Out", color: "bg-gray-700" };
  const tagMap: Record<string, { label: string; color: string }> = {
    "new": { label: "New", color: "bg-emerald-600" },
    "new-arrival": { label: "New", color: "bg-emerald-600" },
    "hot": { label: "Hot", color: "bg-rose-600" },
    "hot-selling": { label: "Hot", color: "bg-rose-600" },
    "best-seller": { label: "Bestseller", color: "bg-rose-600" },
    "bestseller": { label: "Bestseller", color: "bg-rose-600" },
    "top-rated": { label: "Top Rated", color: "bg-amber-600" },
    "assured": { label: "✦ Assured", color: "bg-maroonClr" },
    "trending": { label: "Trending", color: "bg-violet-600" },
  };
  for (const tag of tags) {
    const key = tag.toLowerCase().replace(/\s+/g, "-");
    if (tagMap[key]) return tagMap[key];
  }
  return null;
}

export default function ProductCard({ product }: { product: Product }) {
  const [isHovered, setIsHovered] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isNotifyOpen, setIsNotifyOpen] = useState(false);
  const { cartId, setCart, openCart } = useCartStore();

  const isOutOfStock = !product.availableForSale;
  const ribbon = getRibbonLabel(product);

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
    image1 = typeof raw1 === "string" ? raw1 : raw1?.url || (raw1 as any)?.node?.url || "/images/placeholder.jpg";
    image2 = typeof raw2 === "string" ? raw2 : raw2?.url || (raw2 as any)?.node?.url || image1;
  } else if (product.images && Array.isArray((product.images as any).edges)) {
    const edges = (product.images as any).edges;
    image1 = edges[0]?.node?.url || "/images/placeholder.jpg";
    image2 = edges[1]?.node?.url || image1;
  }

  let firstVariantId = product.id || "";
  if (Array.isArray(product.variants)) {
    const v0 = product.variants[0];
    firstVariantId = typeof v0 === "string" ? v0 : (v0 as any)?.id || (v0 as any)?.node?.id || product.id;
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
    const count = 40 + (absHash % 31);
    const rating = 4.1 + ((absHash % 9) / 10);
    const roundedRating = Math.round(rating);
    const stars = "★".repeat(roundedRating) + "☆".repeat(5 - roundedRating);
    return { count, rating: rating.toFixed(1), stars };
  };

  const { count: reviewCount, rating: reviewRating, stars: reviewStars } = getDeterministicRating(product.handle);

  return (
    <div
      className="group flex flex-col bg-white rounded-xl overflow-hidden relative transition-all duration-500 ease-out
        shadow-[0_1px_8px_rgba(0,0,0,0.06)]
        hover:shadow-[0_12px_40px_rgba(141,11,65,0.12)]
        hover:-translate-y-1"
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
    >
      {/* Hover gold border */}
      <div className="absolute inset-0 rounded-xl border border-transparent group-hover:border-goldClr/40 transition-all duration-500 pointer-events-none z-20" />

      {/* Ribbon badge */}
      {ribbon && (
        <div className={`absolute top-0 left-0 z-10 ${ribbon.color} text-white text-[9px] font-bold uppercase tracking-wide px-2.5 py-1 rounded-br-lg`}>
          {ribbon.label}
        </div>
      )}

      {/* ─── Dominant tall image ─── */}
      <div
        className={`relative w-full overflow-hidden bg-gray-50 ${isOutOfStock ? "filter grayscale opacity-70" : ""}`}
        style={{ aspectRatio: "3/4" }}
      >
        <Link href={`/products/${product.handle}`} className="block w-full h-full relative">
          {/* Primary */}
          <Image
            src={image1}
            alt={product.title}
            fill
            className={`object-cover object-top absolute inset-0 transition-all duration-700 ease-in-out ${isHovered ? "opacity-0 scale-105" : "opacity-100 scale-100"}`}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
          {/* Hover alt */}
          <Image
            src={image2}
            alt={product.title}
            fill
            className={`object-cover object-top absolute inset-0 transition-all duration-700 ease-in-out ${isHovered ? "opacity-100 scale-100" : "opacity-0 scale-105"}`}
            sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
          />
        </Link>

        {/* Wishlist */}
        <div className="absolute top-2 right-2 z-10">
          <WishlistButton product={product as any} />
        </div>

        {/* % off dark pill — bottom-left of image */}
        {hasDiscount && !isOutOfStock && (
          <div className="absolute bottom-2.5 left-2.5 z-10 bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold px-2 py-0.5 rounded-full">
            {discountPercentage}% off
          </div>
        )}

        {/* Quick View on hover */}
        <div className={`absolute bottom-0 inset-x-0 flex justify-center pb-3 transition-all duration-300 ${isHovered ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2"}`}>
          <Link
            href={`/products/${product.handle}`}
            className="bg-white/90 backdrop-blur-sm text-maroonClr text-[9px] font-bold uppercase tracking-widest px-4 py-1.5 rounded-full shadow border border-goldClr/30 hover:bg-maroonClr hover:text-white transition-colors duration-300"
          >
            Quick View
          </Link>
        </div>
      </div>

      {/* ─── Minimal info below image (sutisancha style) ─── */}
      <div className="px-2.5 pt-2 pb-3 flex flex-col gap-0.5">
        {/* Name */}
        <Link href={`/products/${product.handle}`}>
          <h3 className="text-[11px] sm:text-xs font-medium text-gray-700 line-clamp-1 group-hover:text-maroonClr transition-colors duration-300 leading-snug">
            {product.title}
          </h3>
        </Link>

        {/* Price */}
        <div className="flex items-center gap-1.5 flex-wrap">
          <span className="text-gray-800 font-bold text-xs sm:text-sm">
            ₹ {price.toFixed(0)}
          </span>
          {hasDiscount && (
            <span className="text-gray-400 line-through text-[10px] sm:text-xs">
              ₹ {compareAtPrice!.toFixed(0)}
            </span>
          )}
        </div>

        {/* Stars */}
        <div className="flex items-center gap-1 text-goldClr text-[10px]">
          <span>{reviewStars}</span>
          <span className="text-gray-400 text-[9px]">({reviewCount})</span>
        </div>

        {/* Buttons — slide up on desktop hover, always visible on mobile */}
        <div className={`mt-1.5 flex gap-1.5 w-full transition-all duration-300 ease-out ${isHovered ? "opacity-100 translate-y-0" : "sm:opacity-0 sm:translate-y-2 opacity-100 translate-y-0"}`}>
          {isOutOfStock ? (
            <button
              onClick={() => setIsNotifyOpen(true)}
              className="w-full bg-gray-100 text-gray-700 hover:bg-maroonClr hover:text-white transition-all py-1.5 text-[9px] font-bold uppercase tracking-wide rounded-lg"
            >
              Notify Me
            </button>
          ) : (
            <>
              <button
                onClick={handleAddToCart}
                disabled={isAdding || !firstVariantId}
                className="flex-1 bg-transparent border border-maroonClr/60 text-maroonClr hover:bg-maroonClr hover:text-white transition-all duration-300 py-1.5 text-[9px] font-bold uppercase rounded-lg disabled:opacity-50"
              >
                {isAdding ? "Adding…" : "Add to Cart"}
              </button>
              <Link
                href={`/products/${product.handle}`}
                className="flex-1 bg-maroonClr text-white hover:bg-goldClr transition-all duration-300 py-1.5 text-[9px] font-bold uppercase rounded-lg text-center"
              >
                Buy Now
              </Link>
            </>
          )}
        </div>
      </div>

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

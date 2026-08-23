"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { useCartStore } from "@/store/cartStore";
import * as cartClient from "@/lib/api/cart-client";

interface ReelProduct {
  title: string;
  price: string;
  compareAtPrice?: string;
  discountBadge?: string;
  image: string;
  thumbnails: string[];
  handle: string;
  id: string;
}

interface Reel {
  id: string;
  thumbnail: string;
  videoUrl?: string;
  views: string;
  title: string;
  likes: string;
  shares: string;
  product: ReelProduct;
}

const REELS: Reel[] = [
  {
    id: "reel1",
    thumbnail: "/images/client-1.jpg",
    views: "59K",
    likes: "124",
    shares: "211",
    title: "Color Block Linen Cotton Saree - Festive Special",
    product: {
      id: "gid://shopify/Product/15158668132716",
      title: "Color Block Linen Cotton Saree - Festive Special",
      price: "₹ 1,999",
      compareAtPrice: "₹ 3,899",
      discountBadge: "49% off",
      image: "/images/client-1.jpg",
      thumbnails: ["/images/client-1.jpg", "/images/client-2.jpg", "/images/client-3.jpg"],
      handle: "woven-kanjivaram-silk-blend-saree-pink"
    }
  },
  {
    id: "reel2",
    thumbnail: "/images/client-2.jpg",
    views: "90K",
    likes: "342",
    shares: "189",
    title: "The Luxe Gleam Tissue Cotton Saree",
    product: {
      id: "gid://shopify/Product/15158668132716",
      title: "The Luxe Gleam Tissue Cotton Saree",
      price: "₹ 1,920",
      compareAtPrice: "₹ 3,819",
      discountBadge: "50% off",
      image: "/images/client-2.jpg",
      thumbnails: ["/images/client-2.jpg", "/images/client-4.jpg", "/images/client-1.jpg"],
      handle: "woven-kanjivaram-silk-blend-saree-pink"
    }
  },
  {
    id: "reel3",
    thumbnail: "/images/client-3.jpg",
    views: "35K",
    likes: "408",
    shares: "276",
    title: "Premium Tissue Saree Accented With Sequin",
    product: {
      id: "gid://shopify/Product/15158668132716",
      title: "Premium Tissue Saree Accented With Sequin",
      price: "₹ 1,790",
      compareAtPrice: "₹ 2,690",
      discountBadge: "33% off",
      image: "/images/client-3.jpg",
      thumbnails: ["/images/client-3.jpg", "/images/client-5.jpg", "/images/client-2.jpg"],
      handle: "woven-kanjivaram-silk-blend-saree-pink"
    }
  },
  {
    id: "reel4",
    thumbnail: "/images/client-4.jpg",
    views: "68K",
    likes: "89",
    shares: "52",
    title: "Blush Breeze Mul Cotton Saree",
    product: {
      id: "gid://shopify/Product/15158668132716",
      title: "Blush Breeze Mul Cotton Saree",
      price: "₹ 1,889",
      compareAtPrice: "₹ 2,989",
      discountBadge: "37% off",
      image: "/images/client-4.jpg",
      thumbnails: ["/images/client-4.jpg", "/images/client-1.jpg", "/images/client-3.jpg"],
      handle: "woven-kanjivaram-silk-blend-saree-pink"
    }
  },
  {
    id: "reel5",
    thumbnail: "/images/client-5.jpg",
    views: "1L",
    likes: "215",
    shares: "143",
    title: "Mul Tones – Vibrant Checks Edition Saree",
    product: {
      id: "gid://shopify/Product/15158668132716",
      title: "Mul Tones – Vibrant Checks Edition Saree",
      price: "₹ 1,685",
      compareAtPrice: "₹ 2,885",
      discountBadge: "42% off",
      image: "/images/client-5.jpg",
      thumbnails: ["/images/client-5.jpg", "/images/client-3.jpg", "/images/client-4.jpg"],
      handle: "woven-kanjivaram-silk-blend-saree-pink"
    }
  },
  {
    id: "reel6",
    thumbnail: "/images/client-1.jpg",
    views: "34K",
    likes: "178",
    shares: "95",
    title: "Threads Of Joy - Multicolor Mul Cotton Magic",
    product: {
      id: "gid://shopify/Product/15158668132716",
      title: "Threads Of Joy - Multicolor Mul Cotton Magic",
      price: "₹ 1,798",
      compareAtPrice: "₹ 2,898",
      discountBadge: "38% off",
      image: "/images/client-1.jpg",
      thumbnails: ["/images/client-1.jpg", "/images/client-4.jpg", "/images/client-2.jpg"],
      handle: "woven-kanjivaram-silk-blend-saree-pink"
    }
  },
  {
    id: "reel7",
    thumbnail: "/images/client-2.jpg",
    views: "49K",
    likes: "230",
    shares: "112",
    title: "Lustrous Golden Border Festive Drape",
    product: {
      id: "gid://shopify/Product/15158668132716",
      title: "Lustrous Golden Border Festive Drape",
      price: "₹ 1,999",
      compareAtPrice: "₹ 3,899",
      discountBadge: "49% off",
      image: "/images/client-2.jpg",
      thumbnails: ["/images/client-2.jpg", "/images/client-3.jpg", "/images/client-5.jpg"],
      handle: "woven-kanjivaram-silk-blend-saree-pink"
    }
  }
];

export default function ReelsSlider({ reels }: { reels?: any[] }) {
  const [activeReelIdx, setActiveReelIdx] = useState<number | null>(null);
  const [showShopDrawer, setShowShopDrawer] = useState(false);
  const [isAdding, setIsAdding] = useState(false);
  const [isMuted, setIsMuted] = useState(false);
  const [liked, setLiked] = useState<Record<string, boolean>>({});
  const { cartId, setCart, openCart, totalQuantity } = useCartStore();
  const stripRef = useRef<HTMLDivElement>(null);
  const videoRef = useRef<HTMLVideoElement>(null);

  const displayReels = (reels && reels.length > 0)
    ? reels.map((r, i) => {
        const videoUrl = r.videoUrl || r.video || r.mediaUrl || "";
        const thumbnail = r.thumbnail || r.image || (videoUrl ? "" : "/images/client-1.jpg");
        return {
          id: r.id || `reel_${i}`,
          videoUrl,
          thumbnail: thumbnail || "/images/client-1.jpg",
          views: r.views || "50K",
          likes: r.likes || "120",
          shares: r.shares || "85",
          title: r.title || "Festive Handloom Drape",
          product: {
            id: r.productId || "gid://shopify/Product/15158668132716",
            title: r.title || "Festive Handloom Drape",
            price: r.price || "₹ 1,999",
            compareAtPrice: r.compareAtPrice || "₹ 3,899",
            discountBadge: r.discountBadge || "49% off",
            image: thumbnail || "/images/client-1.jpg",
            thumbnails: [thumbnail || "/images/client-1.jpg", "/images/client-2.jpg", "/images/client-3.jpg"],
            handle: r.productHandle || "woven-kanjivaram-silk-blend-saree-pink",
          }
        };
      })
    : REELS;

  const activeReel = activeReelIdx !== null ? displayReels[activeReelIdx] : null;

  // Sync mute state to video element
  useEffect(() => {
    if (videoRef.current) {
      videoRef.current.muted = isMuted;
    }
  }, [isMuted, activeReelIdx]);

  // Lock body scroll when modal is active
  useEffect(() => {
    document.body.style.overflow = activeReelIdx !== null ? "hidden" : "unset";
    return () => { document.body.style.overflow = "unset"; };
  }, [activeReelIdx]);

  const scrollStripLeft = () => {
    if (stripRef.current) {
      stripRef.current.scrollBy({ left: -360, behavior: "smooth" });
    }
  };

  const scrollStripRight = () => {
    if (stripRef.current) {
      stripRef.current.scrollBy({ left: 360, behavior: "smooth" });
    }
  };

  const handleNextReel = () => {
    if (activeReelIdx !== null) {
      setActiveReelIdx((activeReelIdx + 1) % displayReels.length);
      setShowShopDrawer(false);
    }
  };

  const handlePrevReel = () => {
    if (activeReelIdx !== null) {
      setActiveReelIdx((activeReelIdx - 1 + displayReels.length) % displayReels.length);
      setShowShopDrawer(false);
    }
  };

  const handleAddToCart = async (product: ReelProduct) => {
    setIsAdding(true);
    try {
      const resCart = cartId
        ? await cartClient.addToCart(cartId, [{ merchandiseId: product.id, quantity: 1 }])
        : await cartClient.createCart([{ merchandiseId: product.id, quantity: 1 }]);
      setCart(resCart);
      openCart();
    } catch (e) {
      console.error("Failed to add to cart:", e);
    } finally {
      setIsAdding(false);
    }
  };

  const prevIdx = activeReelIdx !== null ? (activeReelIdx - 1 + displayReels.length) % displayReels.length : 0;
  const nextIdx = activeReelIdx !== null ? (activeReelIdx + 1) % displayReels.length : 0;

  return (
    <section className="py-8 sm:py-12 bg-[#FFFDF9] overflow-hidden w-full">
      {/* ─── CENTERED TITLE ─── */}
      <div className="text-center mb-6 sm:mb-10 px-4">
        <h2 className="font-kalnia text-maroonClr text-2xl sm:text-3xl md:text-4xl font-medium tracking-wide">
          See it. Love it. Own it.
        </h2>
      </div>

      {/* ─── FULL-WIDTH EDGE-TO-EDGE CAROUSEL STRIP WITH ARROW CONTROLS (Matching Screenshot) ─── */}
      <div className="relative w-full px-2 sm:px-6">
        
        {/* Left Carousel Arrow Button */}
        <button
          onClick={scrollStripLeft}
          className="hidden md:flex absolute left-2 sm:left-4 top-[40%] -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/75 backdrop-blur-md text-white items-center justify-center transition-all shadow-xl hover:scale-105 cursor-pointer border border-white/20"
          aria-label="Scroll Left"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5" />
          </svg>
        </button>

        {/* Right Carousel Arrow Button */}
        <button
          onClick={scrollStripRight}
          className="hidden md:flex absolute right-2 sm:right-4 top-[40%] -translate-y-1/2 z-20 w-11 h-11 rounded-full bg-black/40 hover:bg-black/75 backdrop-blur-md text-white items-center justify-center transition-all shadow-xl hover:scale-105 cursor-pointer border border-white/20"
          aria-label="Scroll Right"
        >
          <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
            <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5" />
          </svg>
        </button>

        {/* Full Viewport Width Strip Container */}
        <div
          ref={stripRef}
          className="flex gap-4 sm:gap-5 overflow-x-auto pb-4 hideScrollbar snap-x snap-mandatory justify-start w-full scroll-smooth px-2 sm:px-4"
        >
          {displayReels.map((reel, idx) => (
            <div
              key={reel.id}
              onClick={() => { setActiveReelIdx(idx); setShowShopDrawer(false); }}
              className="flex-shrink-0 w-[200px] min-[480px]:w-[240px] sm:w-[270px] md:w-[285px] lg:w-[295px] snap-start group cursor-pointer flex flex-col"
            >
              {/* Image Container — Tall 9:16 aspect ratio like Instagram Reel */}
              <div className="relative w-full aspect-[9/16] rounded-2xl overflow-hidden border border-gray-200/80 shadow-md group-hover:shadow-xl group-hover:border-goldClr/50 transition-all duration-300 bg-black">
                {reel.videoUrl ? (
                  <video
                    src={reel.videoUrl}
                    autoPlay
                    loop
                    muted
                    playsInline
                    className="w-full h-full object-cover object-center group-hover:scale-105 transition-transform duration-700"
                  />
                ) : (
                  <Image
                    src={reel.thumbnail}
                    alt={reel.title}
                    fill
                    unoptimized
                    className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
                    sizes="(max-width: 640px) 55vw, (max-width: 1024px) 30vw, 20vw"
                  />
                )}

                {/* Views Badge Top-Left — Dark Pill with Eye Icon */}
                <div className="absolute top-3 left-3 z-10 bg-black/65 backdrop-blur-md text-white text-[11px] sm:text-xs font-bold px-2.5 py-1 rounded-md flex items-center gap-1.5 shadow">
                  <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.2" className="w-3.5 h-3.5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M1 8s3-5 7-5 7 5 7 5-3 5-7 5S1 8 1 8z"/>
                    <circle cx="8" cy="8" r="1.5"/>
                  </svg>
                  {reel.views}
                </div>
              </div>

              {/* Product Info BELOW the Card Image */}
              <div className="pt-3 px-0.5 flex flex-col gap-1 text-left">
                <p className="text-xs sm:text-sm font-normal text-gray-800 line-clamp-1 group-hover:text-maroonClr transition-colors leading-snug">
                  {reel.product.title}
                </p>
                <div className="flex items-center gap-2 font-bold text-xs sm:text-sm text-gray-900">
                  <span>{reel.product.price}</span>
                  {reel.product.compareAtPrice && (
                    <span className="text-gray-400 line-through text-xs font-normal">
                      {reel.product.compareAtPrice}
                    </span>
                  )}
                </div>
                {reel.product.discountBadge && (
                  <div className="mt-0.5">
                    <span className="inline-block bg-black text-white text-[10px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">
                      {reel.product.discountBadge}
                    </span>
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* ───────────────────────────────────────────────────────────── */}
      {/* VIDEO REEL MODAL — Sutisancha Shop Now Popup Flow             */}
      {/* ───────────────────────────────────────────────────────────── */}
      {activeReelIdx !== null && activeReel && (
        <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/85 backdrop-blur-md transition-all duration-300">

          {/* Close button top-right of screen */}
          <button
            onClick={() => setActiveReelIdx(null)}
            className="absolute top-6 right-8 z-[150] text-white/80 hover:text-white transition-colors"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-7 h-7">
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12"/>
            </svg>
          </button>

          {/* ── LEFT SIDE PEEK CARD ── */}
          <div className="hidden lg:block absolute left-[calc(50%-360px)] top-1/2 -translate-y-1/2 z-10">
            <div
              onClick={handlePrevReel}
              className="relative w-[240px] sm:w-[260px] aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer group opacity-85 hover:opacity-100 transition-all duration-300 shadow-2xl border border-white/10 bg-black"
            >
              {displayReels[prevIdx]?.videoUrl ? (
                <video
                  src={displayReels[prevIdx].videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <Image
                  src={displayReels[prevIdx]?.thumbnail || "/images/client-1.jpg"}
                  alt="previous reel"
                  fill
                  unoptimized
                  className="object-cover object-center"
                />
              )}
              <div className="absolute inset-0 bg-black/35 group-hover:bg-black/10 transition-colors" />
            </div>
          </div>

          {/* ── LEFT NAVIGATION ARROW ── */}
          <button
            onClick={handlePrevReel}
            className="hidden lg:flex absolute left-[calc(50%-270px)] top-1/2 -translate-y-1/2 z-[40] w-12 h-12 rounded-full bg-white text-gray-900 items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
            </svg>
          </button>

          {/* ── MAIN CENTER ACTIVE VIDEO CARD ── */}
          <div
            className="relative z-30 w-full max-w-[340px] min-[480px]:max-w-[370px] sm:max-w-[390px] aspect-[9/16] max-h-[85vh] rounded-2xl overflow-hidden shadow-[0_25px_60px_rgba(0,0,0,0.7)] border border-white/20 bg-black flex flex-col justify-between"
          >
            {/* Background Video / Reel Fill */}
            <div className="absolute inset-0 z-0 bg-black">
              {activeReel.videoUrl ? (
                <video
                  ref={videoRef}
                  src={activeReel.videoUrl}
                  autoPlay
                  loop
                  playsInline
                  muted={isMuted}
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <Image
                  src={activeReel.thumbnail}
                  alt={activeReel.title}
                  fill
                  unoptimized
                  className="object-cover object-center"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-transparent to-black/30 pointer-events-none" />
            </div>

            {/* TOP BAR: Mute Button */}
            <div className="relative z-20 p-4 flex items-center justify-end">
              <button
                onClick={() => setIsMuted(!isMuted)}
                className="w-9 h-9 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center hover:bg-black/60 transition-colors"
              >
                {isMuted ? (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M17.25 9.75L19.5 12m0 0l2.25 2.25M19.5 12l2.25-2.25M19.5 12l-2.25 2.25M10.5 6L6.75 9.75H3.75a.75.75 0 00-.75.75v3c0 .414.336.75.75.75h3L10.5 18V6z"/>
                  </svg>
                ) : (
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M19.114 5.636a9 9 0 010 12.728M16.463 8.287a5.25 5.25 0 010 7.426M10.5 6L6.75 9.75H3.75a.75.75 0 00-.75.75v3c0 .414.336.75.75.75h3L10.5 18V6z"/>
                  </svg>
                )}
              </button>
            </div>

            {/* RIGHT SIDE ACTIONS: Heart + Share */}
            <div className="absolute right-3.5 bottom-28 z-20 flex flex-col items-center gap-6">
              {/* Heart */}
              <button
                onClick={() => setLiked(l => ({ ...l, [activeReel.id]: !l[activeReel.id] }))}
                className="flex flex-col items-center gap-1 group"
              >
                <span className={`w-10 h-10 rounded-full bg-black/40 backdrop-blur-md flex items-center justify-center transition-transform duration-200 group-hover:scale-110 ${liked[activeReel.id] ? "text-red-500" : "text-white"}`}>
                  <svg viewBox="0 0 24 24" fill={liked[activeReel.id] ? "currentColor" : "none"} stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z"/>
                  </svg>
                </span>
                <span className="text-white text-[11px] font-semibold drop-shadow-md">
                  {liked[activeReel.id] ? String(parseInt(activeReel.likes) + 1) : activeReel.likes}
                </span>
              </button>

              {/* Share */}
              <button className="flex flex-col items-center gap-1 group">
                <span className="w-10 h-10 rounded-full bg-black/40 backdrop-blur-md text-white flex items-center justify-center transition-transform duration-200 group-hover:scale-110">
                  <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-5 h-5">
                    <path strokeLinecap="round" strokeLinejoin="round" d="M7.217 10.907a2.25 2.25 0 100 2.186m0-2.186c.18.324.283.696.283 1.093s-.103.77-.283 1.093m0-2.186l9.566-5.314m-9.566 7.5l9.566 5.314m0 0a2.25 2.25 0 103.935 2.186 2.25 2.25 0 00-3.935-2.186zm0-12.814a2.25 2.25 0 103.933-2.185 2.25 2.25 0 00-3.933 2.185z"/>
                  </svg>
                </span>
                <span className="text-white text-[11px] font-semibold drop-shadow-md">{activeReel.shares}</span>
              </button>
            </div>

            {/* ── BOTTOM PRODUCT BAR ── */}
            <div className="relative z-20 p-3.5">
              {!showShopDrawer ? (
                <div
                  onClick={() => setShowShopDrawer(true)}
                  className="bg-white/95 backdrop-blur-md rounded-xl p-2 flex items-center gap-3 shadow-2xl cursor-pointer hover:bg-white transition-colors group"
                >
                  {/* Thumbnail Image */}
                  <div className="relative w-12 h-16 rounded-md overflow-hidden bg-gray-100 flex-shrink-0 border border-gray-200">
                    <Image src={activeReel.product.image} alt={activeReel.product.title} fill unoptimized className="object-cover object-top" />
                  </div>

                  {/* Title & Pricing */}
                  <div className="flex-1 min-w-0 text-left">
                    <p className="text-[11px] font-semibold text-gray-900 group-hover:text-maroonClr transition-colors truncate leading-tight mb-1">
                      {activeReel.product.title}
                    </p>
                    <div className="flex items-center gap-1.5">
                      <span className="text-gray-900 font-extrabold text-xs">{activeReel.product.price}</span>
                      {activeReel.product.compareAtPrice && (
                        <span className="text-gray-400 line-through text-[10px]">{activeReel.product.compareAtPrice}</span>
                      )}
                    </div>
                  </div>

                  {/* Dark ADD TO CART Button */}
                  <button
                    onClick={(e) => { e.stopPropagation(); handleAddToCart(activeReel.product); }}
                    disabled={isAdding}
                    className="bg-black hover:bg-gray-800 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-2.5 rounded-lg flex-shrink-0 transition-colors shadow-md active:scale-95"
                  >
                    {isAdding ? "Adding…" : "ADD TO CART"}
                  </button>
                </div>
              ) : (
                /* ── EXACT SUTISANCHA "SHOP NOW" POPUP MODAL ── */
                <div className="bg-white rounded-2xl shadow-2xl p-4 animate-slideUp text-left border border-gray-100">
                  
                  {/* Header: SHOP NOW centered + Close X button */}
                  <div className="flex items-center justify-between mb-3 relative">
                    <span className="w-full text-center font-bold text-gray-900 text-base tracking-wider uppercase font-sans">
                      SHOP NOW
                    </span>
                    <button
                      onClick={() => setShowShopDrawer(false)}
                      className="absolute right-0 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-800 p-1"
                    >
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12 4L4 12M4 4l8 8"/>
                      </svg>
                    </button>
                  </div>

                  {/* 3 Thumbnail Images Grid */}
                  <div className="grid grid-cols-3 gap-2 mb-3">
                    {activeReel.product.thumbnails.map((thumb, i) => (
                      <Link
                        key={i}
                        href={`/products/${activeReel.product.handle}`}
                        onClick={() => setActiveReelIdx(null)}
                        className="relative aspect-[3/4] rounded-xl overflow-hidden bg-gray-50 border border-gray-200 group/img hover:border-black transition-all"
                      >
                        <Image src={thumb} alt="Look thumbnail" fill unoptimized className="object-cover object-top group-hover/img:scale-105 transition-transform duration-500" />
                      </Link>
                    ))}
                  </div>

                  {/* Product Title + External Link Icon ↗ */}
                  <div className="flex items-start justify-between gap-2 mb-1.5">
                    <Link
                      href={`/products/${activeReel.product.handle}`}
                      onClick={() => setActiveReelIdx(null)}
                      className="font-medium text-gray-900 text-xs leading-snug line-clamp-2 hover:text-maroonClr transition-colors flex-1"
                    >
                      {activeReel.product.title}
                    </Link>
                    <Link
                      href={`/products/${activeReel.product.handle}`}
                      onClick={() => setActiveReelIdx(null)}
                      className="text-gray-400 hover:text-gray-800 flex-shrink-0 pt-0.5"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M13.5 6H5.25A2.25 2.25 0 003 8.25v10.5A2.25 2.25 0 005.25 21h10.5A2.25 2.25 0 0018 18.75V10.5m-10.5 6L21 3m0 0h-5.25M21 3v5.25" />
                      </svg>
                    </Link>
                  </div>

                  {/* Pricing Row */}
                  <div className="flex items-center gap-2 mb-4">
                    {activeReel.product.compareAtPrice && (
                      <span className="text-gray-400 line-through text-xs font-normal">
                        {activeReel.product.compareAtPrice}
                      </span>
                    )}
                    <span className="text-gray-900 font-extrabold text-sm sm:text-base">
                      {activeReel.product.price}
                    </span>
                    {activeReel.product.discountBadge && (
                      <span className="bg-black text-white text-[9px] font-bold px-2 py-0.5 rounded-sm uppercase tracking-wide">
                        {activeReel.product.discountBadge}
                      </span>
                    )}
                  </div>

                  {/* Action Buttons Row */}
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleAddToCart(activeReel.product)}
                      disabled={isAdding}
                      className="flex-1 bg-black hover:bg-gray-800 text-white font-bold text-[10px] sm:text-xs uppercase py-2.5 rounded-lg transition-colors shadow-md active:scale-95"
                    >
                      {isAdding ? "Adding…" : "ADD TO CART"}
                    </button>

                    <Link
                      href={`/products/${activeReel.product.handle}`}
                      onClick={() => setActiveReelIdx(null)}
                      className="flex-1 bg-white hover:bg-gray-50 border border-black text-black font-bold text-[10px] sm:text-xs uppercase py-2.5 rounded-lg text-center transition-colors shadow-sm active:scale-95"
                    >
                      BUY NOW
                    </Link>

                    <button
                      onClick={openCart}
                      className="relative w-9 h-9 rounded-lg border border-gray-200 bg-gray-50 hover:bg-gray-100 flex items-center justify-center text-gray-800 flex-shrink-0"
                    >
                      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="w-4 h-4">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 10.5V6a3.75 3.75 0 10-7.5 0v4.5m11.356-1.993l1.263 12c.07.665-.45 1.243-1.119 1.243H4.25a1.125 1.125 0 01-1.12-1.243l1.264-12A1.125 1.125 0 015.513 7.5h12.974c.576 0 1.059.435 1.119 1.007z" />
                      </svg>
                      {totalQuantity > 0 && (
                        <span className="absolute -top-1.5 -right-1.5 bg-black text-white text-[8px] font-bold w-4 h-4 rounded-full flex items-center justify-center">
                          {totalQuantity}
                        </span>
                      )}
                    </button>
                  </div>

                </div>
              )}
            </div>

          </div>

          {/* ── RIGHT NAVIGATION ARROW ── */}
          <button
            onClick={handleNextReel}
            className="hidden lg:flex absolute right-[calc(50%-270px)] top-1/2 -translate-y-1/2 z-[40] w-12 h-12 rounded-full bg-white text-gray-900 items-center justify-center shadow-2xl hover:scale-110 transition-transform cursor-pointer"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
            </svg>
          </button>

          {/* ── RIGHT SIDE PEEK CARD ── */}
          <div className="hidden lg:block absolute right-[calc(50%-360px)] top-1/2 -translate-y-1/2 z-10">
            <div
              onClick={handleNextReel}
              className="relative w-[240px] sm:w-[260px] aspect-[9/16] rounded-2xl overflow-hidden cursor-pointer group opacity-85 hover:opacity-100 transition-all duration-300 shadow-2xl border border-white/10 bg-black"
            >
              {displayReels[nextIdx]?.videoUrl ? (
                <video
                  src={displayReels[nextIdx].videoUrl}
                  autoPlay
                  loop
                  muted
                  playsInline
                  className="w-full h-full object-cover object-center"
                />
              ) : (
                <Image
                  src={displayReels[nextIdx]?.thumbnail || "/images/client-1.jpg"}
                  alt="next reel"
                  fill
                  unoptimized
                  className="object-cover object-center"
                />
              )}
              <div className="absolute inset-0 bg-black/35 group-hover:bg-black/10 transition-colors" />
            </div>
          </div>

          {/* Mobile navigation swipe arrows */}
          <button
            onClick={handlePrevReel}
            className="lg:hidden absolute left-3 top-1/2 -translate-y-1/2 z-[50] w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15.75 19.5L8.25 12l7.5-7.5"/>
            </svg>
          </button>
          <button
            onClick={handleNextReel}
            className="lg:hidden absolute right-3 top-1/2 -translate-y-1/2 z-[50] w-10 h-10 rounded-full bg-white/20 backdrop-blur-md text-white flex items-center justify-center"
          >
            <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-6 h-6">
              <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 4.5l7.5 7.5-7.5 7.5"/>
            </svg>
          </button>

        </div>
      )}
    </section>
  );
}

"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface Collection {
  id: string;
  title: string;
  handle: string;
  image?: { url: string; altText?: string } | null;
}

const DEFAULT_SIX_BOXES = [
  { title: "New Arrivals", handle: "new-arrivals", image: "/images/client-1.jpg" },
  { title: "Festive Edit", handle: "festive", image: "/images/client-2.jpg" },
  { title: "Flash Sale", handle: "sale", image: "/images/client-3.jpg", discountBadge: "40% FLAT OFF" },
  { title: "Loom Aura", handle: "loom-aura", image: "/images/client-4.jpg" },
  { title: "Shipped with Love", handle: "best-sellers", image: "/images/care.jpg" },
  { title: "Best Sellers", handle: "best-sellers", image: "/images/client-5.jpg" },
];

export default function CollectionsSlider({ collections, items, title }: { collections?: Collection[]; items?: any[]; title?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Use admin items, provided collections, or default 6 boxes
  const displayItems = (items && items.length > 0)
    ? items.map((it) => ({
        title: it.title || it.customTitle,
        handle: it.handle || it.collectionHandle || "saree",
        image: it.image || it.customImage || "/images/client-1.jpg",
        discountBadge: it.discountBadge,
      }))
    : (collections && collections.length >= 6)
      ? collections.slice(0, 6).map((c, i) => ({
          title: c.title,
          handle: c.handle,
          image: c.image?.url || DEFAULT_SIX_BOXES[i % DEFAULT_SIX_BOXES.length].image,
          discountBadge: i === 2 ? "40% FLAT OFF" : undefined,
        }))
      : DEFAULT_SIX_BOXES;

  return (
    <section className="w-full py-8 sm:py-12 bg-[#FAF4EC] border-y border-[#EBE2CD]/60 overflow-hidden">
      <div ref={ref} className="w-full max-w-[1440px] mx-auto px-3 sm:px-6 md:px-8">
        
        {/* Header Title (optional or matching) */}
        {title && (
          <div className={`text-center mb-6 sm:mb-8 transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
            <span className="text-goldClr text-[11px] font-bold uppercase tracking-widest block mb-1">
              ✥ Handcrafted Luxury ✥
            </span>
            <h2 className="font-kalnia text-maroonClr text-2xl sm:text-3xl font-medium">
              {title}
            </h2>
          </div>
        )}

        {/* ── 6-BOX CATEGORY STRIP (Reference Image 1) ── */}
        <div className="w-full flex items-center justify-start lg:justify-center gap-3 sm:gap-5 md:gap-8 overflow-x-auto pb-4 pt-1 hideScrollbar snap-x snap-mandatory px-1">
          {displayItems.map((item, idx) => (
            <Link
              key={idx}
              href={`/collections/${item.handle}`}
              className="flex-shrink-0 snap-start group flex flex-col items-center cursor-pointer transition-all duration-300"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(16px)",
                transitionDelay: `${idx * 60}ms`,
              }}
            >
              {/* Box Image Container: Clean rounded card (NO border) */}
              <div className="relative w-[115px] h-[115px] min-[420px]:w-[130px] min-[420px]:h-[130px] sm:w-[155px] sm:h-[155px] md:w-[170px] md:h-[170px] lg:w-[180px] lg:h-[180px] rounded-[22px] sm:rounded-[28px] overflow-hidden shadow-sm group-hover:shadow-lg group-hover:scale-105 transition-all duration-300 bg-creamClr">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  unoptimized
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-110"
                  sizes="(max-width: 640px) 130px, 180px"
                />
                
                {/* Subtle vignette/gradient overlay */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/40 via-transparent to-transparent opacity-60 group-hover:opacity-40 transition-opacity" />

                {/* Optional Discount Overlay Badge (e.g. Flash Sale "40% FLAT OFF") */}
                {item.discountBadge && (
                  <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/35 backdrop-blur-[1px]">
                    <span className="text-[#FFD700] text-xs sm:text-sm font-extrabold tracking-tight drop-shadow-md text-center leading-tight">
                      40%
                    </span>
                    <span className="text-[#FFD700] text-[10px] sm:text-xs font-bold tracking-wider uppercase text-center drop-shadow">
                      FLAT OFF
                    </span>
                  </div>
                )}
              </div>

              {/* Title Below Box */}
              <span className="font-sans font-bold text-xs sm:text-sm md:text-[15px] text-gray-900 mt-2.5 sm:mt-3 text-center tracking-tight group-hover:text-[#9E3E28] transition-colors leading-tight">
                {item.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


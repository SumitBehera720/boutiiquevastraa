"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface TrendingItem {
  title: string;
  handle: string;
  image: string;
}

const TRENDING_ITEMS: TrendingItem[] = [
  { title: "Mul Diaries", handle: "mul-diaries", image: "/images/client-1.jpg" },
  { title: "Linen Luxe", handle: "linen", image: "/images/client-2.jpg" },
  { title: "Tissue Tales", handle: "tissuetales", image: "/images/client-3.jpg" },
  { title: "Weave Heritage", handle: "loom-aura", image: "/images/client-4.jpg" },
  { title: "Cloud Cotton", handle: "cotton", image: "/images/client-5.jpg" },
];

export default function TrendingCollectionsGrid({ items, title }: { items?: TrendingItem[]; title?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  const displayItems = (items && items.length > 0) ? items : TRENDING_ITEMS;

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section className="w-full py-10 sm:py-14 bg-[#FAF4EC] overflow-hidden">
      
      {/* 12-Petal Scalloped Flower Frame ClipPath */}
      <svg width="0" height="0" className="absolute top-0 left-0">
        <defs>
          <clipPath id="flower-scallop-card-clip" clipPathUnits="objectBoundingBox">
            <path d="
              M 0.5,0.02
              C 0.57,0.02 0.62,0.06 0.68,0.05
              C 0.74,0.04 0.79,0.09 0.84,0.11
              C 0.89,0.13 0.93,0.19 0.96,0.24
              C 0.99,0.29 0.97,0.36 0.98,0.42
              C 0.99,0.48 0.99,0.52 0.98,0.58
              C 0.97,0.64 0.99,0.71 0.96,0.76
              C 0.93,0.81 0.89,0.87 0.84,0.89
              C 0.79,0.91 0.74,0.96 0.68,0.95
              C 0.62,0.94 0.57,0.98 0.5,0.98
              C 0.43,0.98 0.38,0.94 0.32,0.95
              C 0.26,0.96 0.21,0.91 0.16,0.89
              C 0.11,0.87 0.07,0.81 0.04,0.76
              C 0.01,0.71 0.03,0.64 0.02,0.58
              C 0.01,0.52 0.01,0.48 0.02,0.42
              C 0.03,0.36 0.01,0.29 0.04,0.24
              C 0.07,0.19 0.11,0.13 0.16,0.11
              C 0.21,0.09 0.26,0.04 0.32,0.05
              C 0.38,0.06 0.43,0.02 0.5,0.02 Z
            " />
          </clipPath>
        </defs>
      </svg>

      <div ref={ref} className="w-full max-w-[1440px] mx-auto px-4 sm:px-6 md:px-8">
        
        {/* Header Title */}
        <div className={`text-center mb-7 sm:mb-9 transition-all duration-700 ease-out ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <span className="text-goldClr text-[11px] font-bold uppercase tracking-widest block mb-1">
            ✦ Handpicked Festive Collections ✦
          </span>
          <h2 className="font-kalnia text-maroonClr text-2xl sm:text-3xl md:text-4xl font-medium tracking-wide uppercase">
            {title || "TOP TRENDING COLLECTIONS"}
          </h2>
          <div className="w-16 h-0.5 bg-[#C9A84C] mx-auto mt-2.5 rounded-full" />
        </div>

        {/* 5 Scalloped Cards Row (Exact 220px * 275px size, NO outer borders) */}
        <div className="w-full flex items-center justify-start lg:justify-center gap-4 sm:gap-6 md:gap-7 overflow-x-auto pb-6 pt-1 hideScrollbar snap-x snap-mandatory px-2">
          {displayItems.map((item, idx) => (
            <Link
              key={idx}
              href={`/collections/${item.handle}`}
              className="flex-shrink-0 snap-start group flex flex-col items-center cursor-pointer transition-all duration-300"
              style={{
                opacity: visible ? 1 : 0,
                transform: visible ? "translateY(0)" : "translateY(16px)",
                transitionDelay: `${idx * 70}ms`,
              }}
            >
              {/* Card Container: Exact 220px * 275px, clean scalloped clip, NO outer border */}
              <div 
                className="relative w-[170px] h-[212px] sm:w-[200px] sm:h-[250px] md:w-[220px] md:h-[275px] shadow-sm group-hover:shadow-xl group-hover:scale-105 transition-all duration-500 bg-creamClr"
                style={{ clipPath: "url(#flower-scallop-card-clip)" }}
              >
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  unoptimized
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-110"
                  sizes="220px"
                />

                {/* Dark gradient overlay at bottom for text readability */}
                <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/15 to-transparent z-10" />

                {/* Title Overlay inside bottom of card */}
                <div className="absolute bottom-4 inset-x-2 text-center z-20">
                  <h3 className="font-kalnia text-white text-base sm:text-lg md:text-xl font-medium drop-shadow-md group-hover:text-[#FFD700] transition-colors leading-tight">
                    {item.title}
                  </h3>
                </div>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


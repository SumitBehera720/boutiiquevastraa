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
    <section className="w-full py-10 sm:py-14 bg-white overflow-hidden">
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

        {/* 5 Simple Cards Row (Exact 220px * 275px size, simple rounded, no pattern) */}
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
              {/* Card Container: Clean rounded box (NO shadows, NO border, NO gradient overlay for 100% clean PNG blend) */}
              <div className="relative w-[170px] h-[212px] sm:w-[200px] sm:h-[250px] md:w-[220px] md:h-[275px] rounded-2xl overflow-hidden group-hover:scale-105 transition-transform duration-500 bg-white">
                <Image
                  src={item.image}
                  alt={item.title}
                  fill
                  unoptimized
                  className="object-cover object-top transition-transform duration-700 group-hover:scale-110"
                  sizes="220px"
                />
              </div>

              {/* Title Below Image */}
              <span className="font-sans font-bold text-xs sm:text-sm md:text-base text-gray-900 mt-2.5 sm:mt-3 text-center tracking-tight group-hover:text-[#9E3E28] transition-colors leading-tight">
                {item.title}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}


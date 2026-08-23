"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface PromoBanner {
  imageUrl: string;
  title?: string;
  subtitle?: string;
  link?: string;
  buttonText?: string;
}

const DEFAULT_BANNERS: PromoBanner[] = [
  {
    imageUrl: "/images/banner-1773659037696-747582281.webp",
    title: "New Arrivals",
    subtitle: "Fresh styles just dropped",
    link: "/products?sort=created-descending",
    buttonText: "Shop Now",
  },
  {
    imageUrl: "/images/banner-1773659047206-859638957.webp",
    title: "Best Sellers",
    subtitle: "Loved by thousands",
    link: "/products?sort=best-selling",
    buttonText: "Explore",
  },
];

export default function PromoBannerGrid({ banners }: { banners?: PromoBanner[] }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const items = (banners && banners.length > 0) ? banners : DEFAULT_BANNERS;

  return (
    <section ref={ref} className="py-8 sm:py-12 md:py-16 px-4 md:px-6 max-w-7xl mx-auto">
      <div className={`grid gap-4 sm:gap-6 ${items.length === 2 ? "grid-cols-1 sm:grid-cols-2" : "grid-cols-1 sm:grid-cols-2 lg:grid-cols-3"}`}>
        {items.map((banner, idx) => (
          <Link
            key={idx}
            href={banner.link || "/products"}
            className={`group relative overflow-hidden rounded-2xl bg-gray-100 aspect-[4/3] sm:aspect-[3/2] block transition-all duration-700 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
            }`}
            style={{ transitionDelay: `${idx * 120}ms` }}
          >
            {/* Background image */}
            <Image
              src={banner.imageUrl}
              alt={banner.title || "Promo banner"}
              fill
              unoptimized
              className="object-cover object-center transition-transform duration-700 group-hover:scale-105"
              sizes="(max-width: 640px) 100vw, (max-width: 1024px) 50vw, 33vw"
            />
            {/* Gradient overlay */}
            <div className="absolute inset-0 bg-gradient-to-t from-black/65 via-black/20 to-transparent" />
            {/* Content */}
            <div className="absolute inset-0 flex flex-col justify-end p-5 sm:p-6">
              {banner.title && (
                <h3 className="font-kalnia text-white text-xl sm:text-2xl font-medium leading-tight drop-shadow-md">
                  {banner.title}
                </h3>
              )}
              {banner.subtitle && (
                <p className="text-white/80 text-xs sm:text-sm mt-1 mb-3 leading-relaxed">
                  {banner.subtitle}
                </p>
              )}
              <span className="inline-flex self-start items-center gap-1.5 bg-goldClr text-maroonClr text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-full group-hover:bg-white transition-colors">
                {banner.buttonText || "Shop Now"}
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.33 8h9.34M8.67 4.67L12 8l-3.33 3.33" />
                </svg>
              </span>
            </div>
          </Link>
        ))}
      </div>
    </section>
  );
}

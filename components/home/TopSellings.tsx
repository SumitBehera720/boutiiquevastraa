"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import { useEffect, useRef, useState } from "react";
import ProductCard from "@/components/product/ProductCard";

interface Product {
  id: string;
  title: string;
  handle: string;
  availableForSale: boolean;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  compareAtPriceRange?: { minVariantPrice: { amount: string; currencyCode: string } };
  images: { edges: { node: { url: string; altText: string } }[] };
}

export default function TopSellings({ products, title, subtitle }: { products: Product[]; title?: string; subtitle?: string }) {
  const headingRef = useRef<HTMLDivElement>(null);
  const gridRef = useRef<HTMLDivElement>(null);
  const [headingVisible, setHeadingVisible] = useState(false);
  const [gridVisible, setGridVisible] = useState(false);

  useEffect(() => {
    const obs1 = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setHeadingVisible(true); obs1.disconnect(); } }, { threshold: 0.2 });
    const obs2 = new IntersectionObserver(([e]) => { if (e.isIntersecting) { setGridVisible(true); obs2.disconnect(); } }, { threshold: 0.05 });
    if (headingRef.current) obs1.observe(headingRef.current);
    if (gridRef.current) obs2.observe(gridRef.current);
    return () => { obs1.disconnect(); obs2.disconnect(); };
  }, []);

  return (
    <section className="relative overflow-hidden">
      {/* Background texture */}
      <div className="absolute inset-0 -z-10 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='60' height='60' viewBox='0 0 60 60'%3E%3Cpath d='M30 0 L60 30 L30 60 L0 30 Z' fill='none' stroke='%23C9A84C' stroke-width='0.4' stroke-opacity='0.06'/%3E%3C/svg%3E")`,
          backgroundSize: "60px 60px"
        }}
      />

      <div className="relative py-8 sm:py-12 md:py-16 lg:py-20">
        {/* Rangoli decoration */}
        <Image
          alt="rangoli-2"
          width={500}
          height={500}
          className="absolute right-1/2 bottom-0 -z-10 h-32 translate-x-1/2 rotate-180 object-contain opacity-40 sm:h-52"
          src="/images/rangoli-2.png"
          loading="lazy"
        />

        {/* Section heading with scroll reveal */}
        <div
          ref={headingRef}
          className={`mx-auto max-w-2xl space-y-2 text-center transition-all duration-700 ease-out ${
            headingVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <h3 className="font-kalnia text-maroonClr text-2xl font-medium sm:text-3xl md:text-4xl">
            {title || "Top-Sellings"}
          </h3>
          <p className="text-xs text-neutral-600 md:text-sm">
            {subtitle || "Wrap yourself in timeless beauty with our exquisite saree collection. Each drape is crafted to celebrate grace, tradition, and modern charm."}
          </p>
          {/* Animated gold underline */}
          <div className="flex justify-center pt-1">
            <div
              className={`h-0.5 bg-gradient-to-r from-transparent via-goldClr to-transparent transition-all duration-700 delay-300 ${
                headingVisible ? "w-24 opacity-100" : "w-0 opacity-0"
              }`}
            />
          </div>
        </div>

        {/* Product cards with staggered scroll reveal */}
        <div className="mt-8 sm:mt-12 px-4" ref={gridRef}>
          <div className="flex gap-4 overflow-x-auto hideScrollbar pb-4">
            {products.map((product, idx) => (
              <div
                key={product.id}
                className={`flex-shrink-0 w-[200px] sm:w-[240px] transition-all duration-600 ease-out`}
                style={{
                  opacity: gridVisible ? 1 : 0,
                  transform: gridVisible ? "translateY(0)" : "translateY(28px)",
                  transitionDelay: `${Math.min(idx * 60, 480)}ms`,
                }}
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        <div className={`mt-4 text-center sm:mt-6 transition-all duration-700 delay-500 ${headingVisible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"}`}>
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 text-sm font-bold bg-maroonClr hover:bg-goldClr text-white h-9 px-6 py-2 rounded-full transition-all duration-300 shadow-sm hover:shadow-md hover:-translate-y-0.5"
          >
            View all
            <ChevronRight className="w-4 h-4" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

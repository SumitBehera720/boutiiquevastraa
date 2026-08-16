"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";
import { useState } from "react";

interface Product {
  id: string;
  title: string;
  handle: string;
  availableForSale: boolean;
  priceRange: { minVariantPrice: { amount: string; currencyCode: string } };
  compareAtPriceRange?: { minVariantPrice: { amount: string; currencyCode: string } };
  images: { edges: { node: { url: string; altText: string } }[] };
}

interface TabData {
  label: string;
  image?: string;
  products: Product[];
}

export default function PerfectSareeTabs({ tabs, title, subtitle }: { tabs: TabData[]; title?: string; subtitle?: string }) {
  const [activeTab, setActiveTab] = useState(0);

  if (!tabs || tabs.length === 0) return null;

  return (
    <section>
      <div className="relative py-8 sm:py-12 md:py-16 lg:py-20">
        {/* Rangoli decoration */}
        <Image
          alt="rangoli-3"
          width={500}
          height={500}
          className="absolute top-0 left-0 -z-10 w-fit scale-x-[-1] rotate-180 object-contain opacity-40 sm:h-56 h-44"
          src="/images/rangoli-3.png"
          loading="lazy"
        />

        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <h4 className="font-kalnia text-maroonClr text-2xl font-medium sm:text-3xl md:text-4xl">
            {title || "Find Your Perfect Saree"}
          </h4>
          <p className="text-xs text-neutral-800 md:text-base">
            {subtitle || "Discover elegance woven into every drape."}
          </p>
        </div>

        <div className="mt-6 flex w-full flex-col gap-6 md:mt-10">
          {/* Tab Bar */}
          <div className="inline-flex items-center bg-maroonClr hideScrollbar mx-auto mb-4 h-10 w-[95%] justify-start gap-1 overflow-x-auto rounded-full p-1 sm:h-12 sm:gap-2">
            {tabs.map((tab, i) => (
              <button
                key={tab.label}
                onClick={() => setActiveTab(i)}
                className={`inline-flex items-center justify-center whitespace-nowrap rounded-full pr-4 pl-1.5 py-1 text-xs sm:text-sm font-medium transition-all gap-2 flex-shrink-0 ${
                  activeTab === i
                    ? "bg-goldClr text-white shadow-sm"
                    : "text-white/90 hover:text-white hover:bg-white/10"
                }`}
              >
                {tab.image && (
                  <div className="relative w-6 h-6 sm:w-8 sm:h-8 rounded-full overflow-hidden flex-shrink-0 bg-white">
                    <Image src={tab.image} alt={tab.label} fill className="object-cover" />
                  </div>
                )}
                <span>{tab.label}</span>
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="px-4">
            <div className="flex gap-4 overflow-x-auto hideScrollbar pb-4">
              {tabs[activeTab]?.products.map((product) => (
                <div key={product.id} className="flex-shrink-0 w-[220px] sm:w-[250px]">
                  <ProductCard product={product} />
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}

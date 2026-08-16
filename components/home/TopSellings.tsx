"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";
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
  return (
    <section>
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

        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <h3 className="font-kalnia text-maroonClr text-2xl font-medium sm:text-3xl md:text-4xl">
            {title || "Top-Sellings"}
          </h3>
          <p className="text-xs text-neutral-800 md:text-base">
            {subtitle || "Wrap yourself in timeless beauty with our exquisite saree collection. Each drape is crafted to celebrate grace, tradition, and modern charm."}
          </p>
        </div>

        <div className="mt-8 sm:mt-12 px-4">
          <div className="flex gap-4 overflow-x-auto hideScrollbar pb-4">
            {products.map((product) => (
              <div key={product.id} className="flex-shrink-0 w-[220px] sm:w-[250px]">
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>

        <div className="mt-4 text-center sm:mt-6">
          <Link
            href="/products"
            className="inline-flex items-center justify-center gap-2 text-sm font-medium bg-maroonClr hover:bg-maroonClr/80 text-white h-9 px-4 py-2 rounded-full transition-all"
          >
            View all
            <ChevronRight className="text-2xl" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

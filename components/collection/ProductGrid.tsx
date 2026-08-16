"use client";

import ProductCard from "@/components/product/ProductCard";

export default function ProductGrid({ products }: { products: any[] }) {
  if (!products || products.length === 0) {
    return (
      <div className="w-full py-16 flex flex-col items-center justify-center bg-[#FFFDF9] rounded-xl border border-dashed border-[#C9A84C]/40 p-8 shadow-sm">
        <h3 className="text-2xl font-kalnia text-maroonClr font-bold mb-3 tracking-wide">Coming Soon</h3>
        <p className="text-gray-600 text-sm font-light max-w-sm text-center leading-relaxed">
          Our new collections are on their way. Stay tuned for exciting additions to this category!
        </p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
      {products.map((edge: any) => (
        <ProductCard key={edge.node.id} product={edge.node} />
      ))}
    </div>
  );
}

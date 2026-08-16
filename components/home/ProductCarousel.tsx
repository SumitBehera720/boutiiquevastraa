"use client";

import ProductCard from '../product/ProductCard';

interface ProductCarouselProps {
  title: string;
  products: any[];
}

export default function ProductCarousel({ title, products }: ProductCarouselProps) {
  if (!products || products.length === 0) return null;

  return (
    <section className="py-12 bg-white">
      <div className="container mx-auto px-4">
        {title && (
          <h2 className="text-2xl md:text-3xl font-serif text-maroonClr font-bold text-center mb-8">
            {title}
          </h2>
        )}
        
        {/* Horizontal scroll container with custom scrollbar, perfectly responsive */}
        <div className="relative px-2">
          <div className="flex gap-6 overflow-x-auto pb-6 scrollbar-thin scrollbar-thumb-maroonClr scroll-smooth snap-x snap-mandatory">
            {products.map((product) => (
              <div 
                key={product.id} 
                className="w-[280px] sm:w-[320px] flex-shrink-0 snap-start"
              >
                <ProductCard product={product} />
              </div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

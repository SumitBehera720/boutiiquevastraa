"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface FabricItem {
  id: string;
  name: string;
  origin: string;
  description: string;
  features: string[];
  image: string;
  handle: string;
}

const FABRICS: FabricItem[] = [
  {
    id: "silk",
    name: "Banarasi Silk",
    origin: "Varanasi, Uttar Pradesh",
    description: "Famed for its rich gold and silver brocade (Zari) work, hand-woven from high-grade pure mulberry silk threads.",
    features: ["Intricate Floral Weaves", "Metallic Luster", "Royal Heritage Design"],
    image: "/images/banner-1773659037696-747582281.webp",
    handle: "silk"
  },
  {
    id: "cotton",
    name: "Bengal Mul Cotton",
    origin: "Dhaka & Hooghly Looms",
    description: "Incredibly light, sheer, and breathable combed cotton weave, designed for ultimate hot-weather comfort.",
    features: ["Lightweight & Airy", "Eco-Friendly Organic Dye", "Feathery Soft Touch"],
    image: "/images/client-1.jpg",
    handle: "cotton"
  },
  {
    id: "linen",
    name: "Linen Zari Blend",
    origin: "Bhagalpur, Bihar",
    description: "Coarse flax-spun organic linen fibers blended with delicate gold-dipped silver zari borders for a contemporary look.",
    features: ["Rustic Slub Texture", "Subtle Zari Borders", "Drape Versatility"],
    image: "/images/client-3.jpg",
    handle: "linen"
  },
  {
    id: "organza",
    name: "Handcrafted Organza",
    origin: "Surat, Gujarat",
    description: "Sheer, stiff-finished silk fabric woven with thin filament fibers, perfect for structured drapes and modern styling.",
    features: ["Structured Silhouette", "Glass-Like Transparency", "Light Pastel Bases"],
    image: "/images/client-2.jpg",
    handle: "saree"
  }
];

export default function FabricLibrary() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="py-6 sm:py-14 md:py-16 bg-pattern-jaal overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* Section Header */}
        <div className="text-center max-w-2xl mx-auto mb-12 sm:mb-16">
          <span className="text-goldClr text-[11px] font-bold uppercase tracking-widest block mb-3">
            ✥ The Weaver's Swatch Book ✥
          </span>
          <h2 className="font-kalnia text-maroonClr text-3xl sm:text-4xl md:text-5xl font-medium mb-4">
            Our Fabric Library
          </h2>
          <p className="text-gray-600 text-sm sm:text-base">
            Every thread has a lineage. Discover the heritage, origin, and distinct weave details of our signature materials.
          </p>
          <div className="w-16 h-0.5 bg-goldClr/40 mx-auto mt-4" />
        </div>

        {/* Swatches Grid */}
        <div className="grid grid-cols-2 sm:grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-8">
          {FABRICS.map((fabric, idx) => (
            <div
              key={fabric.id}
              className={`h-[260px] sm:h-[380px] lg:h-[420px] group perspective-1000 transition-all duration-1000 ease-out ${
                visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-16"
              }`}
              style={{ transitionDelay: `${idx * 150}ms` }}
            >
              {/* Card Inner Container */}
              <div className="relative w-full h-full transform-style-3d transition-transform duration-700 ease-in-out group-hover:rotate-y-180 cursor-pointer shadow-lg rounded-2xl">
                
                {/* FRONT: Swatch Image */}
                <div className="absolute inset-0 w-full h-full backface-hidden rounded-2xl overflow-hidden border border-goldClr/20">
                  <Image
                    src={fabric.image}
                    alt={fabric.name}
                    fill
                    unoptimized
                    className="object-cover object-center group-hover:scale-105 transition-transform duration-700"
                    sizes="(max-width: 768px) 100vw, 25vw"
                  />
                  {/* Subtle vignette over image */}
                  <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent" />
                  
                  {/* Fabric Name & Origin */}
                  <div className="absolute bottom-6 left-6 right-6">
                    <span className="text-goldClr text-[10px] font-bold uppercase tracking-widest block mb-1">
                      {fabric.origin}
                    </span>
                    <h3 className="font-kalnia text-white text-xl font-medium">
                      {fabric.name}
                    </h3>
                    <span className="inline-flex items-center gap-1 text-white/80 text-[11px] mt-2 group-hover:text-goldClr transition-colors">
                      Flip to explore
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 animate-pulse">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M12.67 8H3.33M8 12.67L12.67 8 8 3.33" />
                      </svg>
                    </span>
                  </div>
                </div>

                {/* BACK: Detailed Description */}
                <div className="absolute inset-0 w-full h-full backface-hidden rotate-y-180 bg-maroonClr border border-goldClr rounded-2xl p-6 flex flex-col justify-between overflow-hidden shadow-2xl">
                  {/* Mandala vector background in maroon */}
                  <div className="absolute inset-0 opacity-5 pointer-events-none bg-pattern-bandhani" />

                  {/* Header */}
                  <div className="relative z-10">
                    <span className="text-goldClr text-[10px] font-bold uppercase tracking-widest block mb-1 border-b border-goldClr/20 pb-2">
                      {fabric.origin}
                    </span>
                    <h3 className="font-kalnia text-white text-2xl font-medium mt-3 mb-4">
                      {fabric.name}
                    </h3>
                    <p className="text-white/80 text-xs sm:text-sm leading-relaxed mb-5">
                      {fabric.description}
                    </p>

                    {/* Features list */}
                    <div className="space-y-2">
                      <p className="text-goldClr text-[10px] font-bold uppercase tracking-wider">Key Attributes</p>
                      {fabric.features.map((feat, fIdx) => (
                        <div key={fIdx} className="flex items-center gap-2 text-white/90 text-xs">
                          <span className="text-goldClr font-bold">✥</span>
                          <span>{feat}</span>
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* CTA Button */}
                  <div className="relative z-10 pt-4 border-t border-goldClr/20">
                    <Link
                      href={`/collections/${fabric.handle}`}
                      className="w-full inline-flex items-center justify-center gap-2 bg-goldClr hover:bg-white text-maroonClr font-bold text-xs uppercase tracking-wider py-3 rounded-xl transition-all duration-300"
                    >
                      Shop Collection
                      <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                        <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 6h7M6.5 3.5L9 6l-2.5 2.5" />
                      </svg>
                    </Link>
                  </div>
                </div>

              </div>
            </div>
          ))}
        </div>

      </div>
    </section>
  );
}

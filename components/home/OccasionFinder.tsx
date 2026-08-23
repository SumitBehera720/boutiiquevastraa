"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect, useRef } from "react";
import { Crown, Flame, Feather, Sparkles } from "lucide-react";

interface OccasionOption {
  id: string;
  name: string;
  subtitle: string;
  icon: React.ReactNode;
  products: {
    id: string;
    title: string;
    price: string;
    comparePrice?: string;
    image: string;
    tag: string;
    handle: string;
  }[];
}

const OCCASIONS: OccasionOption[] = [
  {
    id: "bridal",
    name: "Weddings & Bridal",
    subtitle: "Heavy Zari Banarasi & Regal Kanjivaram Silks",
    icon: <Crown className="w-4 h-4 text-goldClr" />,
    products: [
      {
        id: "o1",
        title: "Royal Crimson Banarasi Zari Silk Saree",
        price: "₹ 3,499",
        comparePrice: "₹ 5,999",
        image: "/images/client-1.jpg",
        tag: "Heritage Silk",
        handle: "saree"
      },
      {
        id: "o2",
        title: "Golden Opulence Tissue Silk Saree",
        price: "₹ 2,899",
        comparePrice: "₹ 4,499",
        image: "/images/client-2.jpg",
        tag: "Zari Border",
        handle: "saree"
      },
      {
        id: "o3",
        title: "Classic Maroon Kanjivaram Brocade Saree",
        price: "₹ 3,899",
        comparePrice: "₹ 6,299",
        image: "/images/client-5.jpg",
        tag: "Bridal Special",
        handle: "saree"
      }
    ]
  },
  {
    id: "festive",
    name: "Festive & Puja",
    subtitle: "Vibrant Chanderi, Jamdani & Pure Tissue Weaves",
    icon: <Flame className="w-4 h-4 text-amber-500" />,
    products: [
      {
        id: "o4",
        title: "Indigo Premium Mul Cotton Saree with Tassels",
        price: "₹ 1,249",
        comparePrice: "₹ 1,999",
        image: "/images/client-2.jpg",
        tag: "Mul Cotton",
        handle: "cotton"
      },
      {
        id: "o5",
        title: "Loom-Lush Linen Zari Border Saree",
        price: "₹ 1,499",
        comparePrice: "₹ 2,499",
        image: "/images/client-3.jpg",
        tag: "Pure Linen",
        handle: "linen"
      },
      {
        id: "o6",
        title: "Hand-Woven Organza Zari Saree",
        price: "₹ 1,749",
        comparePrice: "₹ 2,999",
        image: "/images/client-4.jpg",
        tag: "Organza",
        handle: "saree"
      }
    ]
  },
  {
    id: "casual",
    name: "Workwear & Daily",
    subtitle: "Breathable Mul Diariez & Soft Cloud Cottons",
    icon: <Feather className="w-4 h-4 text-emerald-600" />,
    products: [
      {
        id: "o7",
        title: "Earthy Linen Weave Saree",
        price: "₹ 1,299",
        comparePrice: "₹ 1,899",
        image: "/images/client-5.jpg",
        tag: "Daily Comfort",
        handle: "linen"
      },
      {
        id: "o8",
        title: "Pastel Cloud Mul Cotton Drape",
        price: "₹ 1,199",
        comparePrice: "₹ 1,699",
        image: "/images/client-1.jpg",
        tag: "Featherlight",
        handle: "cotton"
      },
      {
        id: "o9",
        title: "Block Printed Bengal Mul Saree",
        price: "₹ 1,349",
        comparePrice: "₹ 1,999",
        image: "/images/client-3.jpg",
        tag: "Artisanal",
        handle: "cotton"
      }
    ]
  },
  {
    id: "party",
    name: "Cocktail & Evenings",
    subtitle: "Modern Sequined Borders & Shimmering Tissues",
    icon: <Sparkles className="w-4 h-4 text-violet-500" />,
    products: [
      {
        id: "o10",
        title: "Shimmer Tissue Accent Cocktail Saree",
        price: "₹ 1,990",
        comparePrice: "₹ 3,299",
        image: "/images/client-4.jpg",
        tag: "Evening Glam",
        handle: "saree"
      },
      {
        id: "o11",
        title: "Midnight Indigo Zari Fusion Saree",
        price: "₹ 1,849",
        comparePrice: "₹ 2,999",
        image: "/images/client-2.jpg",
        tag: "Modern Fit",
        handle: "saree"
      },
      {
        id: "o12",
        title: "Sequined Organza Evening Drape",
        price: "₹ 2,199",
        comparePrice: "₹ 3,499",
        image: "/images/client-1.jpg",
        tag: "Party Edit",
        handle: "saree"
      }
    ]
  }
];

export default function OccasionFinder() {
  const [activeTab, setActiveTab] = useState("bridal");
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const currentOccasion = OCCASIONS.find(o => o.id === activeTab) || OCCASIONS[0];

  return (
    <section 
      ref={ref}
      className="py-10 sm:py-16 overflow-hidden relative"
      style={{ background: "linear-gradient(135deg, #fdf8f0 0%, #faf3e6 100%)" }}
    >
      {/* Background motif */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-30"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='100' height='100' viewBox='0 0 100 100'%3E%3Cpath d='M50 0 C60 25, 75 40, 100 50 C75 60, 60 75, 50 100 C40 75, 25 60, 0 50 C25 40, 40 25, 50 0 Z' fill='none' stroke='%23C9A84C' stroke-width='0.6'/%3E%3C/svg%3E")`,
          backgroundSize: "100px 100px"
        }}
      />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">

        {/* Section Header */}
        <div className={`text-center mb-8 sm:mb-12 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <span className="text-goldClr text-[11px] font-bold uppercase tracking-[0.3em] block mb-2">
            ✥ Interactive Drape Finder ✥
          </span>
          <h2 className="font-kalnia text-maroonClr text-2xl sm:text-4xl font-medium">
            Shop By Occasion
          </h2>
          <p className="text-gray-600 text-xs sm:text-sm mt-2 max-w-md mx-auto">
            Find the exact drape woven for your moment. Select an occasion to view tailored recommendations.
          </p>
        </div>

        {/* Occasion Selection Tabs with Lucide Icons */}
        <div className="flex flex-wrap gap-2.5 sm:gap-4 justify-center mb-8 sm:mb-12">
          {OCCASIONS.map((occ) => {
            const isActive = occ.id === activeTab;
            return (
              <button
                key={occ.id}
                onClick={() => setActiveTab(occ.id)}
                className={`flex items-center gap-2 px-4 sm:px-6 py-2.5 sm:py-3 rounded-full text-xs sm:text-sm font-semibold transition-all duration-300 shadow-sm ${
                  isActive
                    ? "bg-maroonClr text-white shadow-md border-goldClr border"
                    : "bg-white/80 hover:bg-white text-gray-700 border border-gray-200/80 hover:border-goldClr/40"
                }`}
              >
                {occ.icon}
                <span>{occ.name}</span>
              </button>
            );
          })}
        </div>

        {/* Active Occasion Products Grid */}
        <div className="bg-white/70 backdrop-blur-sm border border-goldClr/20 rounded-2xl p-4 sm:p-8 shadow-[0_8px_30px_rgba(0,0,0,0.04)]">
          <div className="text-center mb-6">
            <h3 className="font-kalnia text-maroonClr text-lg sm:text-xl font-medium">
              {currentOccasion.name} Edition
            </h3>
            <p className="text-goldClr text-xs font-semibold mt-0.5">
              {currentOccasion.subtitle}
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
            {currentOccasion.products.map((p) => (
              <Link
                key={p.id}
                href={`/collections/${p.handle}`}
                className="group bg-white rounded-xl overflow-hidden border border-gray-100 hover:border-goldClr/40 shadow-sm hover:shadow-xl transition-all duration-400 flex flex-col"
              >
                <div className="relative aspect-[3/4] w-full overflow-hidden bg-gray-50">
                  <Image
                    src={p.image}
                    alt={p.title}
                    fill
                    unoptimized
                    className="object-cover object-top transition-transform duration-700 group-hover:scale-105"
                  />
                  <span className="absolute top-2.5 left-2.5 bg-black/70 backdrop-blur-sm text-white text-[9px] font-bold uppercase tracking-wider px-2.5 py-1 rounded-full">
                    {p.tag}
                  </span>
                </div>
                <div className="p-3.5 flex flex-col gap-1 text-left">
                  <h4 className="font-semibold text-gray-800 text-xs line-clamp-1 group-hover:text-maroonClr transition-colors">
                    {p.title}
                  </h4>
                  <div className="flex items-center gap-2">
                    <span className="text-maroonClr font-extrabold text-sm">{p.price}</span>
                    {p.comparePrice && (
                      <span className="text-gray-400 line-through text-xs">{p.comparePrice}</span>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {/* CTA */}
          <div className="mt-8 text-center">
            <Link
              href={`/collections/${currentOccasion.products[0]?.handle || "saree"}`}
              className="inline-flex items-center gap-2 bg-maroonClr hover:bg-goldClr text-white text-xs font-bold uppercase tracking-wider px-6 py-3 rounded-full transition-all duration-300 shadow-md"
            >
              Explore Full {currentOccasion.name} Collection →
            </Link>
          </div>
        </div>

      </div>
    </section>
  );
}

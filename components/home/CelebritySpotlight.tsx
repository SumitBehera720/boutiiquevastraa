"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface PolaroidItem {
  id: string;
  image: string;
  title: string;
  location: string;
  angle: string;
  price: string;
  handle: string;
}

const LOOKS: PolaroidItem[] = [
  {
    id: "look1",
    image: "/images/client-2.jpg",
    title: "Crimson Festive Silk",
    location: "Styled in Varanasi",
    angle: "-rotate-[2.5deg]",
    price: "₹1,899",
    handle: "saree"
  },
  {
    id: "look2",
    image: "/images/client-4.jpg",
    title: "Indigo Mul Cotton",
    location: "Styled in Bengal",
    angle: "rotate-[3deg] translate-y-3 sm:translate-y-6",
    price: "₹1,249",
    handle: "cotton"
  },
  {
    id: "look3",
    image: "/images/client-5.jpg",
    title: "Earthy Linen Weave",
    location: "Styled in Bhagalpur",
    angle: "-rotate-[1.5deg] translate-y-1 sm:translate-y-2",
    price: "₹1,499",
    handle: "linen"
  }
];

// Animated spinning gold circular stamp
function GoldSeal({ className }: { className?: string }) {
  return (
    <div className={`relative ${className}`} aria-hidden="true">
      {/* Outer rotating ring with text */}
      <svg
        viewBox="0 0 120 120"
        className="w-full h-full animate-spin-slow text-goldClr"
        fill="none"
      >
        <defs>
          <path
            id="seal-circle"
            d="M 60,60 m -45,0 a 45,45 0 1,1 90,0 a 45,45 0 1,1 -90,0"
          />
        </defs>
        {/* Circle border */}
        <circle cx="60" cy="60" r="56" stroke="currentColor" strokeWidth="1" strokeOpacity="0.4" strokeDasharray="4 3" />
        <circle cx="60" cy="60" r="50" stroke="currentColor" strokeWidth="0.5" strokeOpacity="0.3" />
        {/* Circular text */}
        <text className="text-[8px]" fill="currentColor" fillOpacity="0.6" fontSize="7.5" fontWeight="bold" letterSpacing="3">
          <textPath href="#seal-circle">
            BOUTIIQUE VASTRAA ✦ HANDLOOM CERTIFIED ✦ SINCE 2016 ✦
          </textPath>
        </text>
      </svg>
      {/* Center emblem */}
      <div className="absolute inset-0 flex items-center justify-center">
        <div className="text-center">
          <div className="w-8 h-8 mx-auto mb-0.5">
            <svg viewBox="0 0 32 32" fill="currentColor" className="text-goldClr/70">
              <path d="M16 2 L18.5 10 L27 10 L20.5 15 L23 23 L16 18 L9 23 L11.5 15 L5 10 L13.5 10 Z" />
            </svg>
          </div>
          <span className="text-goldClr/70 text-[7px] font-bold uppercase tracking-widest block">Pure</span>
          <span className="text-goldClr/70 text-[7px] font-bold uppercase tracking-widest block">Handloom</span>
        </div>
      </div>
    </div>
  );
}

interface CelebritySpotlightProps {
  title?: string;
  subtitle?: string;
  items?: PolaroidItem[];
}

export default function CelebritySpotlight({
  title = "Styled by You, Crafted by Us",
  subtitle = "Real women. Real drapes. Stories that inspire.",
  items
}: CelebritySpotlightProps) {
  const looksList = items && items.length > 0 ? items : LOOKS;
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [hoveredIdx, setHoveredIdx] = useState<number | null>(null);

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
    <section
      ref={ref}
      className="relative py-8 sm:py-16 overflow-hidden"
      style={{ background: "linear-gradient(160deg, #fdf8f0 0%, #faf4e8 50%, #fdf8f0 100%)" }}
    >
      {/* Faint repeating rangoli / lotus pattern background watermark */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='80' height='80' viewBox='0 0 80 80'%3E%3Cg fill='none' stroke='%23C9A84C' stroke-opacity='0.06' stroke-width='0.8'%3E%3Cellipse cx='40' cy='40' rx='22' ry='10'/%3E%3Cellipse cx='40' cy='40' rx='10' ry='22'/%3E%3Cellipse cx='40' cy='40' rx='22' ry='10' transform='rotate(45 40 40)'/%3E%3Cellipse cx='40' cy='40' rx='22' ry='10' transform='rotate(-45 40 40)'/%3E%3Ccircle cx='40' cy='40' r='4'/%3E%3C/g%3E%3C/svg%3E")`,
          backgroundSize: "80px 80px",
        }}
      />

      {/* Spinning gold seal — top right decorative */}
      <div className="absolute top-4 right-4 sm:top-8 sm:right-8 w-20 h-20 sm:w-28 sm:h-28 pointer-events-none opacity-80">
        <GoldSeal />
      </div>

      {/* Gold leaf corner bottom-left */}
      <div className="absolute bottom-6 left-4 pointer-events-none opacity-20">
        <svg viewBox="0 0 60 80" fill="none" className="w-10 h-14 text-goldClr">
          <path d="M30 75 Q30 40 5 15 M30 55 Q40 40 55 35 M30 35 Q15 25 10 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
        </svg>
      </div>

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">

        {/* Section Header */}
        <div className={`text-center mb-6 sm:mb-10 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <span className="text-goldClr text-[11px] font-bold uppercase tracking-widest block mb-1">
            ✥ Spotlight Stealers ✥
          </span>
          <h2 className="font-kalnia text-maroonClr text-2xl sm:text-4xl font-medium">
            {title}
          </h2>
          <p className="text-gray-500 text-xs sm:text-sm mt-2 max-w-sm mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Main layout: Polaroid Grid + Side Info */}
        <div className="flex flex-col sm:flex-row items-center gap-8 sm:gap-12 lg:gap-16">

          {/* Polaroid Collage */}
          <div className={`w-full sm:w-3/5 flex justify-center py-2 transition-all duration-1000 ease-out ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"}`}>
            <div className="grid grid-cols-3 gap-2 sm:gap-5 max-w-[320px] sm:max-w-[460px] relative">
              {looksList.map((look, idx) => (
                <Link
                  key={look.id}
                  href={`/collections/${look.handle}`}
                  className={`bg-white p-2 sm:p-3 pb-5 sm:pb-8 rounded-lg shadow-[0_8px_28px_rgb(0,0,0,0.08)] border border-gray-100/80 transition-all duration-500 ease-out cursor-pointer select-none
                    ${look.angle}
                    ${hoveredIdx === idx ? "rotate-0 scale-110 shadow-[0_20px_50px_rgba(141,11,65,0.15)] z-20" : "z-10"}
                    ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-12"}
                  `}
                  style={{ transitionDelay: `${idx * 120}ms` }}
                  onMouseEnter={() => setHoveredIdx(idx)}
                  onMouseLeave={() => setHoveredIdx(null)}
                >
                  {/* Image */}
                  <div className="relative aspect-[3/4] w-full rounded overflow-hidden bg-gray-50 border border-gray-100">
                    <Image
                      src={look.image}
                      alt={look.title}
                      fill
                      unoptimized
                      className={`object-cover object-center transition-transform duration-700 ${hoveredIdx === idx ? "scale-110" : "scale-100"}`}
                      sizes="(max-width: 640px) 30vw, 18vw"
                    />
                    {/* Gold shimmer on hover */}
                    {hoveredIdx === idx && (
                      <div className="absolute inset-0 border-2 border-goldClr/50 rounded pointer-events-none" />
                    )}
                  </div>
                  {/* Caption */}
                  <div className="mt-2 sm:mt-3 text-center">
                    <p className="font-kalnia text-maroonClr text-[9px] sm:text-[11px] font-semibold italic leading-tight">
                      &ldquo;{look.title}&rdquo;
                    </p>
                    <span className="text-goldClr text-[8px] sm:text-[9px] font-bold uppercase tracking-wider block mt-1">
                      {look.location}
                    </span>
                  </div>
                </Link>
              ))}
            </div>
          </div>

          {/* Right: Info card + look list */}
          <div className={`hidden sm:flex flex-col w-full sm:w-2/5 gap-4 transition-all duration-1000 ease-out delay-300 ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"}`}>

            <div className="bg-white/80 backdrop-blur-sm border border-goldClr/20 rounded-2xl p-5 shadow-[0_4px_20px_rgba(0,0,0,0.05)]">
              <span className="text-goldClr text-[10px] font-bold uppercase tracking-widest block mb-3">
                Featured Styles
              </span>
              <div className="space-y-3">
                {LOOKS.map((look, idx) => (
                  <Link
                    key={look.id}
                    href={`/collections/${look.handle}`}
                    className="flex items-center gap-3 p-2.5 rounded-xl hover:bg-creamClr transition-all duration-300 border border-transparent hover:border-goldClr/20 group"
                  >
                    <div className="relative w-9 h-12 rounded overflow-hidden bg-gray-50 flex-shrink-0 border border-gray-100">
                      <Image src={look.image} alt={look.title} fill unoptimized className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="font-semibold text-gray-800 text-xs group-hover:text-maroonClr transition-colors truncate">{look.title}</p>
                      <p className="text-maroonClr font-bold text-[11px] mt-0.5">{look.price}</p>
                    </div>
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3 ml-auto flex-shrink-0 text-gray-300 group-hover:text-maroonClr transition-all duration-300 group-hover:translate-x-0.5">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 9l3-3-3-3" />
                    </svg>
                  </Link>
                ))}
              </div>
            </div>

            <Link
              href="/collections/saree"
              className="w-full text-center text-xs font-bold uppercase tracking-wider text-maroonClr border border-maroonClr hover:bg-maroonClr hover:text-white py-3 rounded-full transition-all duration-300"
            >
              Shop The Look →
            </Link>

          </div>

        </div>

        {/* Mobile: compact CTA */}
        <div className="mt-4 text-center sm:hidden">
          <Link
            href="/collections/saree"
            className="inline-flex items-center gap-2 text-xs font-bold uppercase tracking-wider text-maroonClr border border-maroonClr hover:bg-maroonClr hover:text-white px-6 py-2.5 rounded-full transition-all duration-300"
          >
            Shop These Styles →
          </Link>
        </div>

      </div>
    </section>
  );
}

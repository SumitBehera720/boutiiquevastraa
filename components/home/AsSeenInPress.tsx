"use client";

import { useEffect, useRef, useState } from "react";

const PRESS_ITEMS = [
  {
    publication: "VOGUE INDIA",
    quote: "Boutiique Vastraa is redefining accessible luxury in handloom sarees with unmatched weaver craftsmanship.",
    tag: "Fashion Feature"
  },
  {
    publication: "HARPER'S BAZAAR",
    quote: "Every drape tells a story of centuries-old looms transformed into modern royal silhouettes.",
    tag: "Luxury Heritage"
  },
  {
    publication: "WEDDINGSUTRA",
    quote: "The go-to label for festive trousseaus and timeless bridal weaves crafted from pure organic silks.",
    tag: "Bridal Pick"
  },
  {
    publication: "FEMINA INDIA",
    quote: "Light as air, rich as tradition. Boutiique Vastraa makes everyday drapery feel exceptionally royal.",
    tag: "Style Edit"
  }
];

export default function AsSeenInPress() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Auto-switch press quotes
  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => {
      setActiveIdx(prev => (prev + 1) % PRESS_ITEMS.length);
    }, 4000);
    return () => clearInterval(t);
  }, [visible]);

  const active = PRESS_ITEMS[activeIdx];

  return (
    <section 
      ref={ref}
      className="py-10 sm:py-14 bg-[#1a0a12] text-white border-y border-goldClr/20 relative overflow-hidden"
    >
      {/* Background gold thread lines */}
      <div className="absolute inset-0 pointer-events-none opacity-5">
        <div className="absolute top-0 bottom-0 left-1/4 w-px bg-goldClr" />
        <div className="absolute top-0 bottom-0 right-1/4 w-px bg-goldClr" />
        <div className="absolute top-1/2 left-0 right-0 h-px bg-goldClr" />
      </div>

      <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10">

        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-8">
          <span className="text-goldClr text-[10px] sm:text-[11px] font-bold uppercase tracking-[0.3em] block mb-1">
            ✥ Media Recognition ✥
          </span>
          <h3 className="font-kalnia text-white text-lg sm:text-2xl font-medium">
            As Featured In
          </h3>
        </div>

        {/* Publications Logos / Names Bar */}
        <div className="flex flex-wrap items-center justify-center gap-6 sm:gap-12 md:gap-16 border-b border-goldClr/20 pb-6 mb-6">
          {PRESS_ITEMS.map((item, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`font-kalnia text-sm sm:text-lg font-bold tracking-widest uppercase transition-all duration-300 ${
                idx === activeIdx
                  ? "text-goldClr scale-110 underline underline-offset-8 decoration-goldClr/50"
                  : "text-white/40 hover:text-white/80"
              }`}
            >
              {item.publication}
            </button>
          ))}
        </div>

        {/* Active Press Quote Box */}
        <div className="max-w-2xl mx-auto text-center min-h-[90px]">
          <span className="inline-block bg-goldClr/15 text-goldClr border border-goldClr/30 text-[9px] font-bold uppercase tracking-wider px-3 py-1 rounded-full mb-3">
            {active.tag}
          </span>
          <p className="font-kalnia text-white/90 text-sm sm:text-lg italic leading-relaxed">
            &ldquo;{active.quote}&rdquo;
          </p>
          <span className="text-goldClr/70 text-xs font-semibold block mt-2 tracking-wider">
            — {active.publication}
          </span>
        </div>

        {/* Pagination Dots */}
        <div className="flex justify-center gap-2 mt-6">
          {PRESS_ITEMS.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setActiveIdx(idx)}
              className={`h-1.5 rounded-full transition-all duration-300 ${
                idx === activeIdx ? "w-6 bg-goldClr" : "w-1.5 bg-white/30"
              }`}
            />
          ))}
        </div>

      </div>
    </section>
  );
}

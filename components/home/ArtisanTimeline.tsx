"use client";

import Image from "next/image";
import { useEffect, useRef, useState } from "react";

interface Artisan {
  id: string;
  name: string;
  craft: string;
  region: string;
  story: string;
  image: string;
  tag: string;
  years: string;
  specialty: string;
}

const ARTISANS: Artisan[] = [
  {
    id: "a1",
    name: "Ramkali Devi",
    craft: "Spinner of Heritage Threads",
    region: "Varanasi, Uttar Pradesh",
    story: "For 38 years, Ramkali has hand-spun raw silk and mulberry yarns on a wooden charkha. Her fingers intuitively sense the tension, producing thread so even that machines cannot replicate it.",
    image: "/images/banner-1773659037696-747582281.webp",
    tag: "Thread Spinning",
    years: "38 yrs",
    specialty: "Mulberry Silk"
  },
  {
    id: "a2",
    name: "Rabindra Biswas",
    craft: "Master of the Warp & Weft",
    region: "Murshidabad, West Bengal",
    story: "Rabindra inherited his loom at age 14 from his grandfather. Today he leads a cluster of 12 weavers in Murshidabad creating signature jamdani weaves that take upto 7 days per saree.",
    image: "/images/client-4.jpg",
    tag: "Jamdani Weaving",
    years: "42 yrs",
    specialty: "Jamdani & Zari"
  },
  {
    id: "a3",
    name: "Leela Patnaik",
    craft: "Organic Dye Artist",
    region: "Sambalpur, Odisha",
    story: "Leela's dye garden grows madder, turmeric, and indigo. She transforms raw yarn into rich hues using sun-drying, mineral fixatives, and generations-old recipes passed down by her mother.",
    image: "/images/client-5.jpg",
    tag: "Natural Dyeing",
    years: "25 yrs",
    specialty: "Botanical Pigments"
  },
];

interface ArtisanTimelineProps {
  title?: string;
  subtitle?: string;
  items?: Artisan[];
}

export default function ArtisanTimeline({
  title = "Artisans & Weavers",
  subtitle = "Behind every drape is a master weaver. Meet the artisans preserving centuries of India's textile heritage.",
  items
}: ArtisanTimelineProps) {
  const list = items && items.length > 0 ? items : ARTISANS;
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [activeIdx, setActiveIdx] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.08 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Auto-cycle artisans
  useEffect(() => {
    if (!visible) return;
    const t = setInterval(() => {
      setActiveIdx((p) => (p + 1) % list.length);
    }, 4500);
    return () => clearInterval(t);
  }, [visible, list.length]);

  const active = list[activeIdx % list.length] || list[0];

  return (
    <section
      ref={ref}
      className="relative py-10 sm:py-16 overflow-hidden"
      style={{
        background: "linear-gradient(135deg, #1a0a12 0%, #2d0f1e 40%, #1a0a12 100%)"
      }}
    >
      {/* Animated background loom thread pattern */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden opacity-[0.07]">
        {/* Horizontal loom threads */}
        {[...Array(12)].map((_, i) => (
          <div
            key={`h-${i}`}
            className="absolute left-0 right-0 h-px bg-goldClr"
            style={{ top: `${(i + 1) * 8}%`, animationDelay: `${i * 0.3}s` }}
          />
        ))}
        {/* Vertical warp threads */}
        {[...Array(16)].map((_, i) => (
          <div
            key={`v-${i}`}
            className="absolute top-0 bottom-0 w-px bg-goldClr"
            style={{ left: `${(i + 1) * 6}%` }}
          />
        ))}
      </div>

      {/* Floating decorative circles */}
      <div className="absolute -top-24 -right-24 w-72 h-72 rounded-full border border-goldClr/10 pointer-events-none" />
      <div className="absolute -bottom-16 -left-16 w-48 h-48 rounded-full border border-goldClr/10 pointer-events-none" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full border border-goldClr/5 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">

        {/* Section Header */}
        <div className={`text-center mb-8 sm:mb-14 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <span className="text-goldClr text-[11px] font-bold uppercase tracking-[0.3em] block mb-2">
            ✥ The Hands Behind Every Thread ✥
          </span>
          <h2 className="font-kalnia text-white text-2xl sm:text-4xl md:text-5xl font-medium leading-tight">
            {title}
          </h2>
          <p className="text-white/60 text-xs sm:text-sm mt-2.5 max-w-lg mx-auto">
            {subtitle}
          </p>
        </div>

        {/* Main Layout */}
        <div className="flex flex-col lg:flex-row gap-6 lg:gap-12 items-center">

          {/* LEFT: Large Image Panel */}
          <div className={`w-full lg:w-1/2 transition-all duration-1000 ease-out ${visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"}`}>
            <div className="relative aspect-[4/5] max-h-[460px] lg:max-h-none w-full rounded-2xl overflow-hidden border border-goldClr/25 shadow-[0_20px_60px_rgba(0,0,0,0.5)]">
              {ARTISANS.map((a, idx) => (
                <div
                  key={a.id}
                  className={`absolute inset-0 transition-all duration-700 ease-in-out ${idx === activeIdx ? "opacity-100 scale-100" : "opacity-0 scale-105"}`}
                >
                  <Image
                    src={a.image}
                    alt={a.name}
                    fill
                    unoptimized
                    className="object-cover object-center"
                    sizes="(max-width: 1024px) 100vw, 50vw"
                  />
                  <div className="absolute inset-0 bg-gradient-to-t from-black/75 via-black/20 to-transparent" />
                </div>
              ))}

              {/* Bottom info overlay on image */}
              <div className="absolute bottom-0 left-0 right-0 p-5 sm:p-6 z-10">
                <span className="inline-block bg-goldClr text-[#1a0a12] text-[9px] sm:text-[10px] font-extrabold uppercase tracking-wider px-2.5 py-1 rounded-full mb-2">
                  {active.tag}
                </span>
                <h3 className="font-kalnia text-white text-xl sm:text-2xl font-medium">{active.name}</h3>
                <p className="text-white/70 text-xs mt-0.5">{active.region} · {active.years} of craft</p>
              </div>

              {/* Gold corner ornament */}
              <div className="absolute top-4 right-4 z-10">
                <svg viewBox="0 0 40 40" fill="none" className="w-8 h-8 text-goldClr/60">
                  <circle cx="20" cy="20" r="18" stroke="currentColor" strokeWidth="1" />
                  <path d="M20 6 L22 14 L20 12 L18 14 Z" fill="currentColor" opacity="0.6" />
                  <path d="M20 34 L22 26 L20 28 L18 26 Z" fill="currentColor" opacity="0.6" />
                  <path d="M6 20 L14 22 L12 20 L14 18 Z" fill="currentColor" opacity="0.6" />
                  <path d="M34 20 L26 22 L28 20 L26 18 Z" fill="currentColor" opacity="0.6" />
                </svg>
              </div>
            </div>

            {/* Artisan selector dots */}
            <div className="flex justify-center gap-2.5 mt-4">
              {ARTISANS.map((_, idx) => (
                <button
                  key={idx}
                  onClick={() => setActiveIdx(idx)}
                  className={`transition-all duration-300 rounded-full ${
                    idx === activeIdx
                      ? "w-6 h-2 bg-goldClr"
                      : "w-2 h-2 bg-white/25 hover:bg-white/50"
                  }`}
                />
              ))}
            </div>
          </div>

          {/* RIGHT: Story Cards */}
          <div className={`w-full lg:w-1/2 transition-all duration-1000 ease-out delay-200 ${visible ? "opacity-100 translate-x-0" : "opacity-0 translate-x-12"}`}>

            {/* Active story */}
            <div className="bg-white/5 backdrop-blur-sm border border-goldClr/20 rounded-2xl p-6 sm:p-8 mb-4">
              <span className="text-goldClr text-[10px] font-bold uppercase tracking-widest block mb-3">
                ✥ Artisan Story ✥
              </span>
              <h3 className="font-kalnia text-white text-xl sm:text-2xl font-medium mb-1">{active.name}</h3>
              <p className="text-goldClr/80 text-xs mb-4">{active.craft}</p>
              <p className="text-white/65 text-sm sm:text-base leading-relaxed mb-5">
                "{active.story}"
              </p>
              <div className="flex items-center gap-3 flex-wrap">
                <span className="text-[10px] font-bold text-goldClr border border-goldClr/30 px-3 py-1 rounded-full">
                  {active.specialty}
                </span>
                <span className="text-[10px] font-bold text-white/60 border border-white/15 px-3 py-1 rounded-full">
                  {active.region}
                </span>
                <span className="text-[10px] font-bold text-white/60 border border-white/15 px-3 py-1 rounded-full">
                  {active.years} Experience
                </span>
              </div>
            </div>

            {/* Other artisan cards as compact list */}
            <div className="space-y-2.5">
              {ARTISANS.map((a, idx) => {
                if (idx === activeIdx) return null;
                return (
                  <button
                    key={a.id}
                    onClick={() => setActiveIdx(idx)}
                    className="w-full flex items-center gap-4 p-3.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:border-goldClr/40 transition-all duration-300 text-left group"
                  >
                    <div className="relative w-10 h-10 rounded-full overflow-hidden flex-shrink-0 border border-goldClr/30">
                      <Image src={a.image} alt={a.name} fill unoptimized className="object-cover" />
                    </div>
                    <div className="min-w-0">
                      <p className="text-white text-xs font-semibold group-hover:text-goldClr transition-colors truncate">{a.name}</p>
                      <p className="text-white/40 text-[10px] truncate">{a.craft}</p>
                    </div>
                    <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="w-3 h-3 text-goldClr/40 group-hover:text-goldClr ml-auto flex-shrink-0 transition-colors">
                      <path strokeLinecap="round" strokeLinejoin="round" d="M4.5 9l3-3-3-3" />
                    </svg>
                  </button>
                );
              })}
            </div>

            {/* Bottom CTA */}
            <div className="mt-6 text-center lg:text-left">
              <span className="text-white/40 text-[11px]">
                Every saree supports an artisan family directly. ✦ Fair trade guaranteed.
              </span>
            </div>

          </div>
        </div>
      </div>
    </section>
  );
}

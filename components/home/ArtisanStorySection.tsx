"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const BRAND_STORIES = [
  {
    number: "01",
    name: "Boutiique Vastraa",
    role: "Heritage Fashion Boutique",
    story:
      "Born from a deep love for India's weaving heritage, Boutiique Vastraa was founded to bring the finest handcrafted ethnic wear from artisan looms directly to your doorstep. We believe every fabric tells a story — of hands that wove it, of traditions passed down through generations.",
    imageSide: "left" as const,
  },
  {
    number: "02",
    name: "Our Craft",
    role: "Handpicked. Handcrafted. Handpicked again.",
    story:
      "Each piece in our collection is curated with meticulous care. From premium cotton sarees to delicate silk drapes, our team visits weaving clusters across India to source only the finest quality. No compromises. No shortcuts. Just pure craft.",
    imageSide: "right" as const,
  },
  {
    number: "03",
    name: "Our Promise",
    role: "A Gift With Every Qualifying Order",
    story:
      "We celebrate your loyalty. With every purchase of any 2 styles worth ₹1,500 or more, we include a complimentary handpicked gift — our way of saying thank you for choosing tradition, choosing craft, choosing Boutiique Vastraa.",
    imageSide: "left" as const,
  },
];

export default function ArtisanStorySection() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);
  const [activeSlide, setActiveSlide] = useState(0);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  // Auto-advance slides
  useEffect(() => {
    const timer = setInterval(() => {
      setActiveSlide((prev) => (prev + 1) % BRAND_STORIES.length);
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  const story = BRAND_STORIES[activeSlide];

  return (
    <section ref={ref} className="py-12 sm:py-16 md:py-20 overflow-hidden bg-creamClr">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Header */}
        <div
          className={`text-center mb-12 transition-all duration-700 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"
          }`}
        >
          <span className="text-goldClr text-[11px] font-bold uppercase tracking-[0.3em]">
            Our Journey
          </span>
          <h2 className="font-kalnia text-maroonClr text-3xl sm:text-4xl font-medium mt-2">
            The Story Behind Every Drape
          </h2>
          <p className="text-gray-500 text-sm sm:text-base mt-3 max-w-xl mx-auto leading-relaxed">
            Rooted in tradition, woven with love — the Boutiique Vastraa story is one of passion, craft, and community.
          </p>
        </div>

        {/* Story layout */}
        <div
          className={`transition-all duration-700 delay-200 ${
            visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
          }`}
        >
          <div className="relative bg-white rounded-3xl shadow-lg overflow-hidden min-h-[420px] sm:min-h-[460px] flex flex-col sm:flex-row">
            {/* Image panel */}
            <div className="relative w-full sm:w-5/12 min-h-[260px] sm:min-h-full bg-maroonClr/10">
              <Image
                src="/images/banner-1773659037696-747582281.webp"
                alt={story.name}
                fill
                unoptimized
                className="object-cover object-center transition-opacity duration-700"
                sizes="(max-width: 640px) 100vw, 42vw"
              />
              {/* Number overlay */}
              <div className="absolute top-5 left-5 font-kalnia text-white/30 text-8xl font-bold leading-none select-none">
                {story.number}
              </div>
            </div>

            {/* Text panel */}
            <div className="flex flex-col justify-center p-7 sm:p-10 md:p-14 w-full sm:w-7/12">
              {/* Tag */}
              <span className="text-goldClr text-[11px] font-bold uppercase tracking-widest mb-4">
                {story.role}
              </span>
              <h3 className="font-kalnia text-maroonClr text-2xl sm:text-3xl font-medium mb-5 leading-snug">
                {story.name}
              </h3>
              <p className="text-gray-600 text-sm sm:text-base leading-relaxed mb-8">
                {story.story}
              </p>
              <Link
                href="/about-us"
                className="inline-flex items-center gap-2 self-start text-maroonClr font-bold text-sm uppercase tracking-wider border-b-2 border-goldClr pb-0.5 hover:text-goldClr transition-colors"
              >
                Read Full Story
                <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" className="w-3.5 h-3.5">
                  <path strokeLinecap="round" strokeLinejoin="round" d="M3.33 8h9.34M8.67 4.67L12 8l-3.33 3.33" />
                </svg>
              </Link>
            </div>
          </div>

          {/* Slide navigation dots */}
          <div className="flex justify-center gap-2.5 mt-6">
            {BRAND_STORIES.map((_, idx) => (
              <button
                key={idx}
                onClick={() => setActiveSlide(idx)}
                className={`h-2 rounded-full transition-all duration-300 ${
                  activeSlide === idx ? "bg-maroonClr w-7" : "bg-maroonClr/25 w-2 hover:bg-maroonClr/50"
                }`}
                aria-label={`Story ${idx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}

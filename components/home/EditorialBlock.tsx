"use client";

import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";

interface EditorialBlockProps {
  imageUrl?: string;
  heading?: string;
  body?: string;
  ctaText?: string;
  ctaLink?: string;
  tag?: string;
}

export default function EditorialBlock({
  imageUrl,
  heading,
  body,
  ctaText,
  ctaLink,
  tag,
}: EditorialBlockProps) {
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

  const defaultImage = "/images/banner-1773659037696-747582281.webp";
  const defaultHeading = "Celebrate the Season with Festive Edit 2026";
  const defaultBody = "An exclusive collection of elegant cotton & silk sarees, thoughtfully crafted for every festive celebration.";
  const defaultCta = "Shop Now";
  const defaultCtaLink = "/collections/saree";
  const defaultTag = "ONAM COLLECTION";

  // Inline SVG base64 stamp edges matching background (#FFFDF9)
  const leftStampStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='24' fill='%23FFFDF9'%3E%3Cpath d='M 0 0 L 16 0 A 6 6 0 0 0 16 12 A 6 6 0 0 0 16 24 L 0 24 Z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'repeat-y',
    backgroundSize: '16px 24px'
  };

  const rightStampStyle = {
    backgroundImage: `url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='16' height='24' fill='%23FFFDF9'%3E%3Cpath d='M 16 0 L 0 0 A 6 6 0 0 1 0 12 A 6 6 0 0 1 0 24 L 16 24 Z'/%3E%3C/svg%3E")`,
    backgroundRepeat: 'repeat-y',
    backgroundSize: '16px 24px'
  };

  return (
    <section ref={ref} className="py-6 sm:py-10 bg-[#FFFDF9] overflow-hidden">
      <div className="max-w-7xl mx-auto px-4 md:px-6">
        
        {/* Full-width campaign postage-stamp-framed banner */}
        <div className="relative rounded-lg overflow-hidden min-h-[300px] sm:min-h-[400px] md:min-h-[460px] flex items-center bg-[#fdfaf5] shadow-[0_4px_25px_rgba(0,0,0,0.05)] border border-gray-150/40">
          
          {/* Main Background Campaign Image */}
          <div className="absolute inset-0 z-0">
            <Image
              src={imageUrl || defaultImage}
              alt={heading || defaultHeading}
              fill
              unoptimized
              className="object-cover object-right md:object-center"
              sizes="100vw"
              priority
            />
            {/* Soft gradient overlay on the left to make text readable */}
            <div className="absolute inset-0 bg-gradient-to-r from-black/70 via-black/40 to-transparent md:from-black/60 md:to-transparent" />
          </div>

          {/* LEFT STAMP CUTOUT EDGE (Inward scallops) */}
          <div style={leftStampStyle} className="absolute left-0 top-0 bottom-0 w-[16px] z-10 pointer-events-none" />

          {/* RIGHT STAMP CUTOUT EDGE (Inward scallops) */}
          <div style={rightStampStyle} className="absolute right-0 top-0 bottom-0 w-[16px] z-10 pointer-events-none" />

          {/* Banner Content Overlay */}
          <div
            className={`relative z-10 max-w-lg px-8 sm:px-12 md:px-16 py-10 text-white transition-all duration-1000 ease-out ${
              visible ? "opacity-100 translate-x-0" : "opacity-0 -translate-x-12"
            }`}
          >
            {/* Small uppercase tag */}
            <span className="inline-block text-goldClr text-[11px] sm:text-xs font-bold uppercase tracking-widest mb-3 border-b border-goldClr/40 pb-1">
              ✥ {tag || defaultTag} ✥
            </span>

            {/* Display Heading */}
            <h2 className="font-kalnia text-2xl sm:text-4xl md:text-5xl font-medium leading-tight mb-4">
              {heading || defaultHeading}
            </h2>

            {/* Subtext description */}
            <p className="text-white/80 text-xs sm:text-sm md:text-base leading-relaxed mb-6 max-w-sm">
              {body || defaultBody}
            </p>

            {/* Button Link */}
            <Link
              href={ctaLink || defaultCtaLink}
              className="inline-flex items-center justify-center gap-2 bg-transparent border-2 border-white hover:bg-goldClr hover:border-goldClr text-white hover:text-maroonClr font-bold text-xs sm:text-sm uppercase tracking-wider px-6 py-3 rounded-full transition-all duration-300 shadow-sm"
            >
              {ctaText || defaultCta}
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 6h7M6.5 3.5L9 6l-2.5 2.5" />
              </svg>
            </Link>
          </div>

        </div>

      </div>
    </section>
  );
}

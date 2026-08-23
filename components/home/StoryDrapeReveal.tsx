"use client";

import Image from "next/image";
import { useState, useRef, useEffect } from "react";

interface StoryDrapeRevealProps {
  heading?: string;
  description?: string;
  beforeImage?: string;
  afterImage?: string;
}

export default function StoryDrapeReveal({
  heading = "From Thread to Royal Drape",
  description = "Drag the golden thread slider to witness raw handloom silk transform into a finished golden masterpiece.",
  beforeImage = "/images/pattern-bg.jpg",
  afterImage = "/images/craftmanship.jpeg"
}: StoryDrapeRevealProps) {
  const [sliderPos, setSliderPos] = useState(50); // percentage 0 to 100
  const [isDragging, setIsDragging] = useState(false);
  const containerRef = useRef<HTMLDivElement>(null);
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => { if (entry.isIntersecting) { setVisible(true); observer.disconnect(); } },
      { threshold: 0.15 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  const handleMove = (clientX: number) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const percentage = Math.min(100, Math.max(0, (x / rect.width) * 100));
    setSliderPos(percentage);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    if (!isDragging) return;
    handleMove(e.touches[0].clientX);
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (!isDragging) return;
    handleMove(e.clientX);
  };

  return (
    <section 
      ref={ref}
      className="py-12 sm:py-20 bg-[#12060c] text-white relative overflow-hidden select-none"
    >
      {/* Delicate Loom background watermarks */}
      <div 
        className="absolute inset-0 pointer-events-none opacity-5"
        style={{
          backgroundImage: `linear-gradient(90deg, rgba(201,168,76,0.2) 1px, transparent 1px), linear-gradient(rgba(201,168,76,0.2) 1px, transparent 1px)`,
          backgroundSize: "30px 30px"
        }}
      />

      <div className="max-w-6xl mx-auto px-4 md:px-6 relative z-10">

        {/* Section Header */}
        <div className={`text-center mb-8 sm:mb-12 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <span className="text-goldClr text-[11px] font-bold uppercase tracking-[0.3em] block mb-2">
            ✦ Interactive Weave Story ✦
          </span>
          <h2 className="font-kalnia text-white text-2xl sm:text-4xl font-medium">
            {heading}
          </h2>
          <p className="text-white/60 text-xs sm:text-sm mt-2 max-w-md mx-auto">
            {description}
          </p>
        </div>

        {/* Interactive Image Comparison Slider Box */}
        <div 
          ref={containerRef}
          onMouseDown={() => setIsDragging(true)}
          onMouseUp={() => setIsDragging(false)}
          onMouseLeave={() => setIsDragging(false)}
          onMouseMove={handleMouseMove}
          onTouchStart={() => setIsDragging(true)}
          onTouchEnd={() => setIsDragging(false)}
          onTouchMove={handleTouchMove}
          className="relative w-full max-w-4xl mx-auto aspect-[16/9] sm:aspect-[21/9] rounded-2xl overflow-hidden shadow-[0_20px_50px_rgba(0,0,0,0.8)] border border-goldClr/30 cursor-ew-resize touch-none"
        >
          {/* AFTER IMAGE (Finished Saree - Right side background) */}
          <div className="absolute inset-0">
            <Image
              src={afterImage}
              alt="Finished Handloom Saree"
              fill
              unoptimized
              className="object-cover object-center"
            />
            <div className="absolute top-4 right-4 bg-maroonClr/90 backdrop-blur-sm text-goldClr text-[10px] sm:text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-goldClr/40 shadow-lg">
              ✨ Royal Silk Finish
            </div>
          </div>

          {/* BEFORE IMAGE (Raw Loom Craftsmanship - Left side clipped) */}
          <div 
            className="absolute inset-0 overflow-hidden"
            style={{ width: `${sliderPos}%` }}
          >
            <div className="relative w-full max-w-4xl h-full aspect-[16/9] sm:aspect-[21/9]">
              <Image
                src={beforeImage}
                alt="Raw Silk Loom Threads"
                fill
                unoptimized
                className="object-cover object-center"
              />
              <div className="absolute top-4 left-4 bg-black/80 backdrop-blur-sm text-white text-[10px] sm:text-xs font-bold uppercase tracking-widest px-3 py-1.5 rounded-full border border-white/20 shadow-lg">
                🧵 Raw Loom Threads
              </div>
            </div>
          </div>

          {/* GOLDEN SLIDER LINE & HANDLE */}
          <div 
            className="absolute top-0 bottom-0 w-1 bg-gradient-to-b from-goldClr via-white to-goldClr shadow-[0_0_15px_rgba(201,168,76,0.9)] z-20 pointer-events-none"
            style={{ left: `${sliderPos}%` }}
          >
            {/* Center Slider Knob */}
            <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-10 h-10 rounded-full bg-maroonClr border-2 border-goldClr text-goldClr flex items-center justify-center shadow-2xl">
              <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-5 h-5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M8.25 15L12 18.75 15.75 15m-7.5-6L12 5.25 15.75 9" transform="rotate(90 12 12)"/>
              </svg>
            </div>
          </div>
        </div>

        {/* Story Footer Note */}
        <div className="mt-6 text-center text-white/50 text-xs tracking-wider">
          💡 Drag or swipe left & right to interact with the loom transformation
        </div>

      </div>
    </section>
  );
}

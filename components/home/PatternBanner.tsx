"use client";

import { useState, useRef, useEffect } from "react";
import { ChevronLeft, ChevronRight, Volume2, VolumeX, Eye } from "lucide-react";
import Link from "next/link";

interface Reel {
  id: string;
  videoUrl: string;
  title: string;
  price: string;
  compareAtPrice?: string;
  views?: string;
  link?: string;
}

export default function PatternBanner({ 
  heading, 
  mediaUrl, 
  type,
  reels = []
}: { 
  heading?: string; 
  mediaUrl?: string; 
  type?: "IMAGE" | "VIDEO";
  reels?: Reel[];
}) {
  const bgUrl = mediaUrl || "/images/pattern-bg.jpg";
  const isVideo = type === "VIDEO";
  
  const [mutedReels, setMutedReels] = useState<Record<string, boolean>>({});
  const scrollRef = useRef<HTMLDivElement>(null);

  // Initialize all reels to muted by default
  useEffect(() => {
    if (reels && reels.length > 0) {
      const initialMute: Record<string, boolean> = {};
      reels.forEach((r) => {
        initialMute[r.id] = true;
      });
      setMutedReels(initialMute);
    }
  }, [reels]);

  const toggleMute = (id: string, e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    setMutedReels((prev) => ({
      ...prev,
      [id]: !prev[id]
    }));
  };

  const scroll = (direction: "left" | "right") => {
    if (scrollRef.current) {
      const { scrollLeft, clientWidth } = scrollRef.current;
      const scrollTo = direction === "left" 
        ? scrollLeft - clientWidth * 0.75 
        : scrollLeft + clientWidth * 0.75;
      scrollRef.current.scrollTo({ left: scrollTo, behavior: "smooth" });
    }
  };

  return (
    <section className="bg-[#FAF7F0] py-12 sm:py-16 border-y border-[#EAE2CE]">
      <div className="max-w-7xl mx-auto px-4 md:px-6 space-y-8">
        
        {/* Heading */}
        <div className="text-center">
          <h2 className="font-kalnia text-maroonClr text-2xl font-bold sm:text-3xl md:text-4xl tracking-wide">
            {heading || "Spot it. Style it. Own it."}
          </h2>
          <div className="w-20 h-0.5 bg-goldClr mx-auto mt-3 rounded" />
        </div>

        {/* Video Reels Slider Section */}
        {reels && reels.length > 0 ? (
          <div className="relative group/slider px-4">
            
            {/* Scroll Container */}
            <div 
              ref={scrollRef}
              className="flex gap-4 overflow-x-auto snap-x snap-mandatory scroll-smooth scrollbar-hide py-4 px-2"
              style={{ scrollbarWidth: "none" }}
            >
              {reels.map((reel) => {
                const isReelMuted = mutedReels[reel.id] !== false; // default true
                
                return (
                  <Link
                    key={reel.id}
                    href={reel.link || "#"}
                    target={reel.link?.startsWith("http") ? "_blank" : undefined}
                    rel={reel.link?.startsWith("http") ? "noopener noreferrer" : undefined}
                    className="flex-shrink-0 w-[240px] aspect-[9/16] bg-white rounded-xl overflow-hidden border border-neutral-200/80 hover:border-maroonClr/40 transition-all duration-300 shadow-md hover:shadow-xl snap-start relative group"
                  >
                    {/* Video Player */}
                    {reel.videoUrl ? (
                      <video
                        src={reel.videoUrl}
                        autoPlay
                        loop
                        muted={isReelMuted}
                        playsInline
                        className="absolute inset-0 w-full h-full object-cover z-0"
                      />
                    ) : (
                      <div className="absolute inset-0 flex items-center justify-center bg-neutral-100 z-0">
                        <span className="text-[10px] text-neutral-400 font-bold uppercase">No Video</span>
                      </div>
                    )}

                    {/* Gradient Overlay for Legibility */}
                    <div className="absolute inset-0 bg-gradient-to-t from-black/90 via-transparent to-black/45 z-10" />

                    {/* Top Overlay Actions */}
                    <div className="absolute top-3 left-3 right-3 flex items-center justify-between z-20">
                      {/* Views Badge */}
                      <div className="bg-black/50 backdrop-blur-md text-white text-[9px] font-bold tracking-wider px-2 py-0.5 rounded-full flex items-center gap-1 border border-white/10">
                        <Eye className="w-3 h-3 text-neutral-300" />
                        <span>{reel.views || "10K"}</span>
                      </div>

                      {/* Sound Control */}
                      <button
                        onClick={(e) => toggleMute(reel.id, e)}
                        className="w-7 h-7 rounded-full bg-black/50 backdrop-blur-md border border-white/10 hover:bg-maroonClr text-white flex items-center justify-center transition-colors"
                        aria-label={isReelMuted ? "Unmute Video" : "Mute Video"}
                      >
                        {isReelMuted ? (
                          <VolumeX className="w-3.5 h-3.5" />
                        ) : (
                          <Volume2 className="w-3.5 h-3.5" />
                        )}
                      </button>
                    </div>

                    {/* Bottom Details (Product Title, Prices) */}
                    <div className="absolute bottom-4 left-3.5 right-3.5 z-20 space-y-1">
                      <h3 className="text-xs font-medium text-white line-clamp-1 group-hover:text-goldClr transition-colors">
                        {reel.title}
                      </h3>
                      <div className="flex items-baseline gap-2">
                        <span className="text-xs font-bold text-white">
                          ₹{reel.price}
                        </span>
                        {reel.compareAtPrice && (
                          <span className="text-[10px] text-neutral-300 line-through opacity-75">
                            ₹{reel.compareAtPrice}
                          </span>
                        )}
                      </div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {/* Slider Navigation Arrows */}
            <button
              onClick={() => scroll("left")}
              className="absolute left-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white hover:bg-maroonClr hover:text-white text-neutral-800 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity border border-neutral-200 shadow-md z-30"
              aria-label="Scroll left"
            >
              <ChevronLeft className="w-5 h-5" />
            </button>
            <button
              onClick={() => scroll("right")}
              className="absolute right-0 top-1/2 -translate-y-1/2 w-9 h-9 rounded-full bg-white hover:bg-maroonClr hover:text-white text-neutral-800 flex items-center justify-center opacity-0 group-hover/slider:opacity-100 transition-opacity border border-neutral-200 shadow-md z-30"
              aria-label="Scroll right"
            >
              <ChevronRight className="w-5 h-5" />
            </button>
          </div>
        ) : (
          /* Fallback Banner block */
          <div className="relative overflow-hidden py-8 sm:py-12 md:py-16 lg:py-20 flex items-center justify-center min-h-[160px] sm:min-h-[220px] rounded-xl border border-neutral-200 bg-white">
            {isVideo ? (
              <video
                autoPlay
                loop
                muted
                playsInline
                className="absolute inset-0 w-full h-full object-cover z-0"
                src={bgUrl}
              />
            ) : (
              <div 
                className="absolute inset-0 bg-cover bg-center bg-no-repeat z-0"
                style={{ backgroundImage: `url('${bgUrl}')` }}
              />
            )}
            <div className="absolute inset-0 bg-black/40 backdrop-blur-[1px] z-0" />
            <p className="text-white text-xs relative z-10 text-center font-sans tracking-wide">
              No product video reels configured. Add reels under visual settings.
            </p>
          </div>
        )}

      </div>
    </section>
  );
}

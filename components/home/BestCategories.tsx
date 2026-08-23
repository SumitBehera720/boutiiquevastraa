"use client";

import Image from "next/image";
import Link from "next/link";

interface Collection {
  id: string;
  title: string;
  handle: string;
  image?: { url: string; altText?: string } | null;
}

export default function BestCategories({
  collections,
  title,
  subtitle,
}: {
  collections: Collection[];
  title?: string;
  subtitle?: string;
}) {
  return (
    <section className="py-8 sm:py-12 bg-[#FFFDF9] overflow-hidden relative">
      {/* Background rangoli decoration */}
      <Image
        alt="rangoli-3"
        width={400}
        height={400}
        className="absolute right-0 bottom-0 -z-0 h-28 sm:h-44 w-fit scale-x-[-1] object-contain opacity-20 pointer-events-none"
        src="/images/rangoli-3.png"
        loading="lazy"
      />

      <div className="max-w-7xl mx-auto px-4 md:px-6">
        {/* Section Header */}
        <div className="text-center mb-6 sm:mb-8">
          <span className="text-goldClr text-[11px] font-bold uppercase tracking-widest block mb-1">
            ✥ Curated Collections ✥
          </span>
          <h2 className="font-kalnia text-maroonClr text-xl sm:text-3xl font-medium">
            {title || "Top Trending Collections"}
          </h2>
          {subtitle && (
            <p className="text-neutral-600 text-xs sm:text-sm mt-1 max-w-md mx-auto">
              {subtitle}
            </p>
          )}
        </div>

        {/* Scalloped Cards — Horizontal scroll on all viewports */}
        <div className="flex gap-4 sm:gap-6 overflow-x-auto pb-4 hideScrollbar snap-x snap-mandatory justify-start md:justify-center">
          {collections.slice(0, 6).map((col) => (
            <Link
              key={col.id}
              href={`/collections/${col.handle}`}
              className="flex-shrink-0 snap-start flex flex-col items-center gap-2 group"
            >
              {/* Scalloped Flower-Petal SVG Masked Card */}
              <div className="relative w-[110px] h-[130px] sm:w-[140px] sm:h-[165px] md:w-[160px] md:h-[190px]">
                {/* SVG clip masking the image with the scalloped petal shape */}
                <svg width="0" height="0" className="absolute">
                  <defs>
                    <clipPath
                      id={`scallop-clip-${col.id}`}
                      clipPathUnits="objectBoundingBox"
                    >
                      {/* 8-petal scalloped flower shape, matching reference screenshot */}
                      <path d="
                        M 0.5 0.05
                        C 0.62 0.05, 0.72 0.08, 0.78 0.15
                        C 0.88 0.12, 0.96 0.18, 0.96 0.28
                        C 1.00 0.34, 0.98 0.42, 0.95 0.5
                        C 0.98 0.58, 1.00 0.66, 0.96 0.72
                        C 0.96 0.82, 0.88 0.88, 0.78 0.85
                        C 0.72 0.92, 0.62 0.95, 0.5 0.95
                        C 0.38 0.95, 0.28 0.92, 0.22 0.85
                        C 0.12 0.88, 0.04 0.82, 0.04 0.72
                        C 0.00 0.66, 0.02 0.58, 0.05 0.5
                        C 0.02 0.42, 0.00 0.34, 0.04 0.28
                        C 0.04 0.18, 0.12 0.12, 0.22 0.15
                        C 0.28 0.08, 0.38 0.05, 0.5 0.05 Z
                      " />
                    </clipPath>
                  </defs>
                </svg>

                {/* Image with SVG clip-path applied */}
                <div
                  className="w-full h-full relative transition-transform duration-500 group-hover:scale-105"
                  style={{ clipPath: `url(#scallop-clip-${col.id})` }}
                >
                  {col.image?.url ? (
                    <Image
                      src={col.image.url}
                      alt={col.title}
                      fill
                      className="object-cover object-top"
                      sizes="(max-width: 640px) 35vw, (max-width: 1024px) 20vw, 14vw"
                    />
                  ) : (
                    <div className="w-full h-full bg-gradient-to-br from-goldClr/20 to-maroonClr/10 flex items-center justify-center">
                      <span className="text-maroonClr/40 text-3xl font-kalnia">B</span>
                    </div>
                  )}
                  {/* Subtle gradient overlay at bottom */}
                  <div className="absolute inset-0 bg-gradient-to-t from-maroonClr/30 via-transparent to-transparent pointer-events-none" />
                </div>

                {/* Scallop border ring (decorative outline matching the shape) */}
                <svg
                  viewBox="0 0 100 118"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  className="absolute inset-0 w-full h-full text-goldClr/60 pointer-events-none transition-all duration-300 group-hover:text-goldClr group-hover:stroke-[2]"
                  preserveAspectRatio="none"
                >
                  <path d="
                    M 50 6
                    C 62 6, 72 9.4, 78 17.7
                    C 88 14.2, 96 21.2, 96 33
                    C 100 40, 98 49.5, 95 59
                    C 98 68.5, 100 78, 96 85
                    C 96 96.8, 88 103.8, 78 100.3
                    C 72 108.6, 62 112, 50 112
                    C 38 112, 28 108.6, 22 100.3
                    C 12 103.8, 4 96.8, 4 85
                    C 0 78, 2 68.5, 5 59
                    C 2 49.5, 0 40, 4 33
                    C 4 21.2, 12 14.2, 22 17.7
                    C 28 9.4, 38 6, 50 6 Z
                  " />
                </svg>
              </div>

              {/* Collection label */}
              <span className="text-center font-kalnia text-maroonClr text-[11px] sm:text-sm font-medium group-hover:text-goldClr transition-colors duration-300 max-w-[120px] leading-tight">
                {col.title}
              </span>
            </Link>
          ))}
        </div>

        {/* View All CTA */}
        <div className="mt-6 text-center">
          <Link
            href="/collections"
            className="inline-flex items-center justify-center gap-2 text-xs sm:text-sm font-bold text-maroonClr border border-maroonClr hover:bg-maroonClr hover:text-white px-6 py-2.5 rounded-full transition-all duration-300 uppercase tracking-wider"
          >
            Explore All Collections
            <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 6h7M6.5 3.5L9 6l-2.5 2.5" />
            </svg>
          </Link>
        </div>
      </div>
    </section>
  );
}

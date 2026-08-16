"use client";

import Image from "next/image";
import Link from "next/link";
import { ChevronRight } from "lucide-react";

interface Collection {
  id: string;
  title: string;
  handle: string;
  image?: { url: string; altText?: string } | null;
}

export default function BestCategories({ collections, title, subtitle }: { collections: Collection[]; title?: string; subtitle?: string }) {
  return (
    <section>
      <div className="relative px-4 pb-8 sm:pb-12 md:px-6 md:pb-16 lg:pb-20">
        {/* Rangoli decoration */}
        <Image
          alt="rangoli-3"
          width={500}
          height={500}
          className="absolute right-0 bottom-0 -z-10 h-38 w-fit scale-x-[-1] object-contain opacity-40 sm:h-56"
          src="/images/rangoli-3.png"
          loading="lazy"
        />

        <div className="mx-auto max-w-2xl space-y-2 text-center">
          <h4 className="font-kalnia text-maroonClr text-2xl font-medium sm:text-3xl md:text-4xl">
            {title || "Explore Best Categories"}
          </h4>
          <p className="text-xs text-neutral-800 md:text-base">
            {subtitle || "Indulge in our handpicked categories featuring exquisite craftsmanship, premium fabrics, and timeless artistry made to elevate your wardrobe."}
          </p>
        </div>

        <div className="mt-8 flex flex-col md:flex-row justify-center items-center md:items-stretch gap-6 sm:gap-12 md:mt-12 px-4 max-w-5xl mx-auto">
          {collections.slice(0, 2).map((col) => (
            <Link
              key={col.id}
              href={`/collections/${col.handle}`}
              className="group relative w-full max-w-[280px] sm:max-w-[320px] lg:max-w-[360px] aspect-[3/4] overflow-hidden rounded-[2rem] bg-white shadow-xl"
            >
              {col.image?.url && (
                <Image
                  src={col.image.url}
                  alt={col.title}
                  fill
                  className="object-cover transition-transform duration-700 group-hover:scale-105"
                />
              )}
              
              {/* Ornate Gold Border Inner Frame */}
              <div className="absolute inset-3 border-[1.5px] border-goldClr/80 z-10 pointer-events-none">
                {/* Top Left Corner */}
                <div className="absolute -top-1 -left-1 w-8 h-8 border-t-[3px] border-l-[3px] border-goldClr bg-transparent" />
                {/* Top Right Corner */}
                <div className="absolute -top-1 -right-1 w-8 h-8 border-t-[3px] border-r-[3px] border-goldClr bg-transparent" />
                {/* Bottom Left Corner */}
                <div className="absolute -bottom-1 -left-1 w-8 h-8 border-b-[3px] border-l-[3px] border-goldClr bg-transparent" />
                {/* Bottom Right Corner */}
                <div className="absolute -bottom-1 -right-1 w-8 h-8 border-b-[3px] border-r-[3px] border-goldClr bg-transparent" />
                
                {/* Corner SVG flourishes (simulated) */}
                <svg className="absolute -top-2 -left-2 w-12 h-12 text-goldClr" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2">
                  <path d="M30,10 C30,30 10,30 10,30" />
                  <circle cx="20" cy="20" r="3" fill="currentColor" />
                </svg>
                <svg className="absolute -top-2 -right-2 w-12 h-12 text-goldClr" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" style={{transform: 'scaleX(-1)'}}>
                  <path d="M30,10 C30,30 10,30 10,30" />
                  <circle cx="20" cy="20" r="3" fill="currentColor" />
                </svg>
                <svg className="absolute -bottom-2 -left-2 w-12 h-12 text-goldClr" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" style={{transform: 'scaleY(-1)'}}>
                  <path d="M30,10 C30,30 10,30 10,30" />
                  <circle cx="20" cy="20" r="3" fill="currentColor" />
                </svg>
                <svg className="absolute -bottom-2 -right-2 w-12 h-12 text-goldClr" viewBox="0 0 100 100" fill="none" stroke="currentColor" strokeWidth="2" style={{transform: 'scale(-1)'}}>
                  <path d="M30,10 C30,30 10,30 10,30" />
                  <circle cx="20" cy="20" r="3" fill="currentColor" />
                </svg>
              </div>

              {/* Pink/Maroon Overlay at bottom */}
              <div className="absolute inset-0 bg-gradient-to-t from-maroonClr via-maroonClr/40 to-transparent opacity-90 z-0 h-[60%] top-auto" />
              
              {/* Content overlay */}
              <div className="absolute bottom-6 left-0 right-0 z-20 flex flex-col items-center justify-center">
                <div className="relative w-32 h-12 mb-2 opacity-80">
                   <Image src="/images/logo.png" alt="logo" fill className="object-contain" />
                </div>
                <h3 className="font-kalnia text-white text-2xl sm:text-3xl font-medium tracking-wide drop-shadow-md">
                  {col.title}
                </h3>
              </div>
            </Link>
          ))}
        </div>

        <div className="mt-4 text-center sm:mt-6">
          <Link
            href="/collections"
            className="inline-flex items-center justify-center gap-2 text-sm font-medium bg-maroonClr hover:bg-maroonClr/80 text-white h-9 px-4 py-2 rounded-full transition-all"
          >
            Explore all
            <ChevronRight className="text-2xl" aria-hidden="true" />
          </Link>
        </div>
      </div>
    </section>
  );
}

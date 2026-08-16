"use client";

import Image from "next/image";
import Link from "next/link";
import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";

interface BannerSlide {
  id?: string;
  imageUrl: string;
  mobileImageUrl?: string;
  title?: string;
  subtitle?: string;
  buttonText?: string;
  link?: string;
}

export default function HeroBanner({ slides }: { slides?: BannerSlide[] }) {
  const [currentSlide, setCurrentSlide] = useState(0);

  const bannerSlides = slides && slides.length > 0 ? slides : [
    {
      imageUrl: "/images/banner-1773659037696-747582281.webp",
      title: "Heritage Handlooms",
      subtitle: "Discover our new collections of Banarasi Silk & Organza Sarees",
      buttonText: "Explore Collection",
      link: "/collections/saree"
    },
    {
      imageUrl: "/images/banner-1773659047206-859638957.webp",
      title: "Elegance Redefined",
      subtitle: "Artisan craftsmanship, curated colors and modern designs",
      buttonText: "Shop All Products",
      link: "/collections/all"
    }
  ];

  useEffect(() => {
    if (bannerSlides.length <= 1) return;
    const timer = setInterval(() => {
      setCurrentSlide((prev) => (prev + 1) % bannerSlides.length);
    }, 3000);
    return () => clearInterval(timer);
  }, [bannerSlides.length]);

  return (
    <section className="relative w-full h-[520px] sm:h-[450px] md:h-[600px] lg:h-[680px] overflow-hidden bg-maroonClr">
      <AnimatePresence initial={false}>
        <motion.div
          key={currentSlide}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          transition={{ duration: 0.5, ease: "easeInOut" }}
          className="absolute inset-0 w-full h-full"
        >
          {/* Slide Background Image */}
          {/* Desktop Image */}
          <div className="hidden sm:block absolute inset-0 w-full h-full">
            <Image
              src={bannerSlides[currentSlide].imageUrl || "/images/banner-1773659037696-747582281.webp"}
              alt={bannerSlides[currentSlide].title || "Banner"}
              fill
              priority
              unoptimized
              className="object-cover object-center"
              sizes="100vw"
            />
          </div>
          {/* Mobile Image */}
          <div className="block sm:hidden absolute inset-0 w-full h-full">
            <Image
              src={bannerSlides[currentSlide].mobileImageUrl || bannerSlides[currentSlide].imageUrl || "/images/banner-1773659037696-747582281.webp"}
              alt={bannerSlides[currentSlide].title || "Banner"}
              fill
              priority
              unoptimized
              className="object-cover object-center"
              sizes="100vw"
            />
          </div>
          {/* Overlay gradient - removed/softened to make banner 100% clear */}
          <div className="absolute inset-0 bg-black/5" />
          
          {/* Banner Content Overlay */}
          <div className="absolute inset-0 flex items-center px-6 sm:px-12 md:px-20 lg:px-28 z-10">
            <div className="max-w-xl text-left space-y-3 sm:space-y-4">
              {bannerSlides[currentSlide].title && (
                <h1 className="font-kalnia text-goldClr text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-medium leading-tight drop-shadow-[0_2px_8px_rgba(0,0,0,0.6)]">
                  {bannerSlides[currentSlide].title}
                </h1>
              )}
              {bannerSlides[currentSlide].subtitle && (
                <p className="text-white text-sm sm:text-base md:text-lg font-light leading-relaxed max-w-md drop-shadow-[0_2px_6px_rgba(0,0,0,0.7)]">
                  {bannerSlides[currentSlide].subtitle}
                </p>
              )}
              {bannerSlides[currentSlide].link && (
                <div className="pt-2">
                  <Link
                    href={bannerSlides[currentSlide].link}
                    className="inline-block bg-maroonClr hover:bg-[#8f193c] text-white text-xs sm:text-sm font-bold uppercase tracking-wider px-6 py-3 rounded shadow-md hover:shadow-lg transition-all"
                  >
                    {bannerSlides[currentSlide].buttonText || "Shop Now"}
                  </Link>
                </div>
              )}
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Navigation Indicators */}
      {bannerSlides.length > 1 && (
        <div className="absolute bottom-4 left-0 right-0 flex justify-center gap-2 z-20">
          {bannerSlides.map((_, idx) => (
            <button
              key={idx}
              onClick={() => setCurrentSlide(idx)}
              className={`w-2 h-2 rounded-full transition-all ${
                currentSlide === idx ? "bg-[#C9A84C] w-6" : "bg-white/40 hover:bg-white"
              }`}
              aria-label={`Go to slide ${idx + 1}`}
            />
          ))}
        </div>
      )}
    </section>
  );
}

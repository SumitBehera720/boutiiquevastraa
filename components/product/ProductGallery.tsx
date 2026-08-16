"use client";

import { useState, useEffect } from "react";
import { createPortal } from "react-dom";
import Image from "next/image";
import { Swiper, SwiperSlide } from "swiper/react";
import { FreeMode, Navigation, Thumbs } from "swiper/modules";
import { Maximize2, X, ChevronLeft, ChevronRight } from "lucide-react";
import "swiper/css";
import "swiper/css/free-mode";
import "swiper/css/navigation";
import "swiper/css/thumbs";

export default function ProductGallery({ images }: { images: any[] }) {
  const [thumbsSwiper, setThumbsSwiper] = useState<any>(null);
  const [isLightboxOpen, setIsLightboxOpen] = useState(false);
  const [activeImageIndex, setActiveImageIndex] = useState(0);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        setIsLightboxOpen(false);
      }
    };
    if (isLightboxOpen) {
      document.body.style.overflow = "hidden";
      document.documentElement.style.overflow = "hidden";
      window.addEventListener("keydown", handleKeyDown);
    } else {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
    }
    return () => {
      document.body.style.overflow = "";
      document.documentElement.style.overflow = "";
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, [isLightboxOpen]);

  if (!images || images.length === 0) return <div className="aspect-[3/4] bg-gray-200"></div>;

  const hasEnoughForLoop = images.length >= 2;
  const hasEnoughThumbs = images.length >= 6;

  const openLightbox = (index: number) => {
    setActiveImageIndex(index);
    setIsLightboxOpen(true);
  };

  const nextImage = () => {
    setActiveImageIndex((prev) => (prev + 1) % images.length);
  };

  const prevImage = () => {
    setActiveImageIndex((prev) => (prev - 1 + images.length) % images.length);
  };

  return (
    <div className="flex flex-col gap-4">
      {/* Main Image */}
      <Swiper
        style={{
          "--swiper-navigation-color": "#800020",
          "--swiper-pagination-color": "#800020",
        } as any}
        loop={hasEnoughForLoop}
        spaceBetween={10}
        navigation={true}
        thumbs={{ swiper: thumbsSwiper && !thumbsSwiper.destroyed ? thumbsSwiper : null }}
        modules={[FreeMode, Navigation, Thumbs]}
        className="w-full rounded-lg aspect-[3/4] bg-gray-50 relative group"
      >
        {images.map((img, index) => (
          <SwiperSlide key={index}>
            <div 
              onClick={() => openLightbox(index)} 
              className="relative w-full h-full cursor-zoom-in overflow-hidden group"
              title="Click to view full screen"
            >
              <Image 
                src={img.node.url} 
                alt={img.node.altText || "Product Image"} 
                fill 
                priority={index === 0}
                className="object-cover group-hover:scale-105 transition-transform duration-500 origin-center" 
              />
              {/* Expand Hint Overlay */}
              <div className="absolute top-3 right-3 bg-black/60 text-white p-2 rounded-full opacity-80 group-hover:opacity-100 transition-opacity backdrop-blur-sm shadow-md">
                <Maximize2 className="w-4 h-4" />
              </div>
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Thumbnail Gallery */}
      <Swiper
        onSwiper={setThumbsSwiper}
        loop={hasEnoughThumbs}
        spaceBetween={10}
        slidesPerView={5}
        freeMode={true}
        watchSlidesProgress={true}
        modules={[FreeMode, Navigation, Thumbs]}
        className="w-full h-24"
      >
        {images.map((img, index) => (
          <SwiperSlide key={index} className="cursor-pointer opacity-60 [&.swiper-slide-thumb-active]:opacity-100 transition-opacity [&.swiper-slide-thumb-active>div]:border-maroonClr [&.swiper-slide-thumb-active>div]:border-2">
            <div className="relative w-full h-full rounded border border-gray-200 overflow-hidden">
              <Image 
                src={img.node.url} 
                alt={img.node.altText || "Thumbnail"} 
                fill 
                className="object-cover" 
              />
            </div>
          </SwiperSlide>
        ))}
      </Swiper>

      {/* Fullscreen Lightbox Modal */}
      {isLightboxOpen && mounted
        ? createPortal(
            <div 
              className="fixed inset-0 z-[999999] bg-black flex flex-col items-center justify-between p-4 sm:p-6 w-screen h-screen overflow-hidden select-none animate-fadeIn"
              onClick={() => setIsLightboxOpen(false)}
            >
              {/* Top Bar with Title and Close Cross Button */}
              <div className="w-full flex items-center justify-between z-[1000000] max-w-6xl">
                <span className="text-white/90 text-xs font-semibold uppercase tracking-widest bg-white/10 px-3.5 py-1.5 rounded-full backdrop-blur-md">
                  Image {activeImageIndex + 1} of {images.length}
                </span>

                {/* Prominent Cross (X) Close Button */}
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    setIsLightboxOpen(false);
                  }}
                  className="p-3 rounded-full bg-white/20 hover:bg-white/40 text-white transition-all shadow-2xl flex items-center justify-center cursor-pointer border border-white/30 backdrop-blur-md group"
                  aria-label="Close Fullscreen View"
                  title="Close Fullscreen View (Esc)"
                >
                  <X className="w-6 h-6 stroke-[3] group-hover:scale-110 transition-transform" />
                </button>
              </div>

              {/* Main Fullscreen Image Container */}
              <div 
                className="relative w-full flex-1 max-w-5xl my-4 flex items-center justify-center"
                onClick={(e) => e.stopPropagation()}
              >
                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={prevImage}
                    className="absolute left-2 sm:left-4 z-[110] p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors border border-white/20"
                    aria-label="Previous Image"
                  >
                    <ChevronLeft className="w-6 h-6" />
                  </button>
                )}

                <div className="relative w-full h-full max-h-[82vh] aspect-[3/4] mx-auto">
                  <Image
                    src={images[activeImageIndex]?.node?.url || ""}
                    alt={images[activeImageIndex]?.node?.altText || "Fullscreen Product Image"}
                    fill
                    priority
                    className="object-contain"
                    sizes="100vw"
                  />
                </div>

                {images.length > 1 && (
                  <button
                    type="button"
                    onClick={nextImage}
                    className="absolute right-2 sm:right-4 z-[110] p-3 rounded-full bg-black/50 hover:bg-black/80 text-white transition-colors border border-white/20"
                    aria-label="Next Image"
                  >
                    <ChevronRight className="w-6 h-6" />
                  </button>
                )}
              </div>

              {/* Bottom Thumbnail Selector inside Lightbox */}
              {images.length > 1 && (
                <div 
                  className="flex gap-2.5 overflow-x-auto max-w-full py-2 px-4 z-[110] bg-black/40 rounded-full border border-white/10"
                  onClick={(e) => e.stopPropagation()}
                >
                  {images.map((img, idx) => (
                    <button
                      key={idx}
                      type="button"
                      onClick={() => setActiveImageIndex(idx)}
                      className={`relative w-12 h-14 rounded overflow-hidden flex-shrink-0 border-2 transition-all ${
                        idx === activeImageIndex ? "border-maroonClr scale-110 opacity-100" : "border-white/20 opacity-50 hover:opacity-100"
                      }`}
                    >
                      <Image src={img.node.url} alt="Thumbnail" fill className="object-cover" />
                    </button>
                  ))}
                </div>
              )}
            </div>,
            document.body
          )
        : null}
    </div>
  );
}

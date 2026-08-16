"use client";

import Image from "next/image";
import { testimonials } from "@/lib/design-tokens";
import { useState, useEffect } from "react";

interface TestimonialProp {
  name: string;
  role: string;
  quote: string;
  image: string;
}

export default function TestimonialsSection({ customTestimonials }: { customTestimonials?: TestimonialProp[] }) {
  const allTestimonials = customTestimonials && customTestimonials.length > 0 
    ? customTestimonials 
    : testimonials;
    
  const [activeIndex, setActiveIndex] = useState(0);

  useEffect(() => {
    if (allTestimonials.length <= 1) return;
    const interval = setInterval(() => {
      setActiveIndex((prev) => (prev + 1) % allTestimonials.length);
    }, 5000);
    return () => clearInterval(interval);
  }, [allTestimonials.length]);

  const current = allTestimonials[activeIndex];

  return (
    <div>
      <div className="text-center space-y-2 max-w-2xl mx-auto md:mb-12 sm:mb-10 mb-8">
        <h4 className="text-2xl sm:text-3xl md:text-4xl font-medium font-kalnia text-goldClr">
          What Our Customers Say
        </h4>
        <p className="text-xs md:text-base text-white">
          Real stories from women who found their perfect saree with us. From weddings to everyday wear, hear how our sarees bring confidence, beauty, and joy to every occasion.
        </p>
      </div>

      <div className="container mx-auto max-w-7xl flex flex-wrap items-center px-4">
        {/* Left: Image Slider */}
        <div className="border border-goldClr/20 rounded-2xl w-full md:w-1/2 lg:w-5/12 mb-8 md:mb-0 overflow-hidden">
          <Image
            alt={current.name}
            width={500}
            height={500}
            className="object-contain object-center w-full h-full transition-opacity duration-500"
            src={current.image}
            loading="lazy"
          />
        </div>

        {/* Right: Text Testimonial */}
        <div className="w-full md:w-1/2 lg:w-7/12 md:pl-16">
          <div key={activeIndex} className="animate-fade-in">
            <div className="mb-4 flex items-center">
              <Image
                alt={current.name}
                width={250}
                height={250}
                className="w-12 h-12 rounded-full object-cover"
                src={current.image}
                loading="lazy"
              />
              <div className="ml-4">
                <p className="font-medium text-white">{current.name}</p>
                <p className="text-xs font-light text-gray-300">{current.role}</p>
              </div>
            </div>
            <p className="sm:text-3xl text-2xl sm:leading-11 font-kalnia text-white leading-8">
              &quot;{current.quote}&quot;
            </p>
          </div>

          {/* Dot indicators */}
          <div className="flex gap-2 mt-6">
            {allTestimonials.map((_, i) => (
              <button
                key={i}
                onClick={() => setActiveIndex(i)}
                className={`w-2.5 h-2.5 rounded-full transition-all ${
                  i === activeIndex ? "bg-goldClr w-6" : "bg-white/40"
                }`}
                aria-label={`Testimonial ${i + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

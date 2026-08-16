"use client";

import Image from "next/image";
import { faqItems } from "@/lib/design-tokens";
import { useState } from "react";
import { ChevronDown } from "lucide-react";

export default function FaqAccordion({ title, subtitle, faqs, image }: { title?: string; subtitle?: string; faqs?: any[]; image?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(null);
  const items = faqs && faqs.length > 0 ? faqs : faqItems;

  return (
    <div id="faq" className="grid grid-cols-1 gap-4 border-t border-gray-400 pt-12 sm:gap-6 sm:pt-16 md:grid-cols-2 md:gap-8 md:pt-20 px-4 md:px-6 pb-8 sm:pb-12 md:pb-16 lg:pb-20 scroll-mt-24">
      {/* Left Column */}
      <div className="space-y-2">
        <h4 className="font-kalnia text-goldClr text-2xl font-medium sm:text-3xl md:text-4xl">
          {title || "Frequently Asked Questions"}
        </h4>
        <p className="text-xs text-white md:text-base">
          {subtitle || "At Boutiique Vastraa, we believe that finding the perfect saree should be a delightful and effortless experience. Here are answers to some of the most common questions our customers ask."}
        </p>
        <Image
          alt="saree"
          width={1000}
          height={1000}
          className="mt-4 w-full rounded-xl"
          src={image || "/images/woman-2.jpg"}
          loading="lazy"
        />
      </div>

      {/* Right Column: Accordion */}
      <div>
        {items.map((item, index) => (
          <div
            key={index}
            className="border-b last:border-b-0 border-goldClr text-white"
          >
            <button
              onClick={() => setOpenIndex(openIndex === index ? null : index)}
              className="flex flex-1 w-full items-start justify-between gap-4 rounded-md py-4 text-left font-medium transition-all hover:underline font-kalnia text-xl sm:text-2xl"
            >
              {item.question}
              <ChevronDown
                className={`text-white pointer-events-none size-4 shrink-0 translate-y-0.5 transition-transform duration-200 ${
                  openIndex === index ? "rotate-180" : ""
                }`}
                aria-hidden="true"
              />
            </button>
            <div
              className={`overflow-hidden text-sm transition-all duration-300 ${
                openIndex === index ? "max-h-40 pb-4" : "max-h-0"
              }`}
            >
              <p className="text-white/90">{item.answer}</p>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

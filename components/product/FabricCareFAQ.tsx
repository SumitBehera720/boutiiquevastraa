"use client";

import { useState } from "react";
import { ChevronDown, Sparkles, Shirt, ShieldCheck, HeartHandshake } from "lucide-react";

export default function FabricCareFAQ({ productTitle }: { productTitle?: string }) {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const faqs = [
    {
      title: "Fabric Composition & Craftsmanship",
      icon: Sparkles,
      content:
        "Handcrafted with fine silk threads, delicate zari embroidery, and woven by master artisans. Each piece is tested for color fastness, thread density, and silk purity to guarantee an authentic heritage feel.",
    },
    {
      title: "Wash & Care Instructions",
      icon: Shirt,
      content:
        "Dry clean only for initial washes. Store in a breathable cotton or muslin fabric cover, avoiding plastic wraps. Air out periodically in indirect shade and steam iron on low-heat setting using a press cloth.",
    },
    {
      title: "Purity & Authenticity Certification",
      icon: ShieldCheck,
      content:
        "Every saree comes with our Boutiique Vastraa Quality Assurance tag and Silk Mark certification verification code, ensuring 100% natural pure silk fibers directly from verified weavers.",
    },
    {
      title: "Draping & Styling Tips",
      icon: HeartHandshake,
      content:
        "Pairs exquisitely with heavy gold or temple jewelry for grand occasions. For festive celebrations, drape with clean front pleats and let the pallu fall gracefully over your shoulder.",
    },
  ];

  return (
    <div className="mt-8 border border-amber-200/60 rounded-xl p-5 bg-gradient-to-br from-amber-50/40 via-white to-amber-50/20 shadow-sm">
      <h3 className="text-lg font-bold text-gray-900 mb-1 font-kalnia flex items-center gap-2">
        <Sparkles className="w-5 h-5 text-goldClr" />
        Fabric Details, Care & Authenticity Guide
      </h3>
      <p className="text-xs text-gray-600 mb-4">
        Essential care and craft insights for your {productTitle || "saree"}.
      </p>

      <div className="space-y-3">
        {faqs.map((faq, idx) => {
          const Icon = faq.icon;
          const isOpen = openIndex === idx;
          return (
            <div
              key={idx}
              className="border border-gray-200 rounded-lg bg-white overflow-hidden transition-colors"
            >
              <button
                type="button"
                onClick={() => setOpenIndex(isOpen ? null : idx)}
                className="w-full px-4 py-3 flex items-center justify-between text-left font-medium text-sm text-gray-800 hover:bg-gray-50 focus:outline-none"
              >
                <span className="flex items-center gap-2.5">
                  <Icon className="w-4 h-4 text-maroonClr" />
                  {faq.title}
                </span>
                <ChevronDown
                  className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${
                    isOpen ? "rotate-180 text-maroonClr" : ""
                  }`}
                />
              </button>
              {isOpen && (
                <div className="px-4 pb-3 text-xs text-gray-600 leading-relaxed border-t border-gray-100 bg-gray-50/50">
                  {faq.content}
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}

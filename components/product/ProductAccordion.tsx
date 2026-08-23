"use client";

import { useState } from "react";

interface ProductAccordionProps {
  descriptionHtml: string;
  specifications?: Record<string, any>;
}

export default function ProductAccordion({ descriptionHtml, specifications }: ProductAccordionProps) {
  const [openSections, setOpenSections] = useState<Record<string, boolean>>({
    description: true,
  });

  const toggle = (section: string) => {
    setOpenSections((prev) => ({
      ...prev,
      [section]: !prev[section],
    }));
  };

  // Convert specifications object to array of key-value pairs dynamically
  const specList = Object.entries(specifications || {})
    .filter(([key]) => key !== "manufacturedBy" && key !== "shippedBy" && key !== "id")
    .map(([key, value]) => ({ label: key, value: String(value || "").trim() }))
    .filter((item) => !!item.value); // Only show rows with filled values

  const hasMfg = !!(specifications?.manufacturedBy || specifications?.shippedBy);
  const hasSpecs = specList.length > 0 || hasMfg;

  return (
    <div className="mt-8 border border-gray-200 rounded-lg overflow-hidden bg-white shadow-sm font-sans">
      {/* 1. Product Description Section */}
      <div className="border-b border-gray-200">
        <button
          className="w-full flex items-center justify-between p-4 text-left focus:outline-none hover:bg-gray-50/50 transition-colors"
          onClick={() => toggle("description")}
        >
          <div className="flex items-center gap-3">
            {/* Styled Icon from reference image */}
            <div className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center text-maroonClr shrink-0 border border-pink-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm md:text-base leading-tight">Product Description</h3>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">Manufacture, Care and Fit</p>
            </div>
          </div>
          <div className="text-gray-400 font-light text-xl w-6 h-6 flex items-center justify-center select-none">
            {openSections.description ? "—" : "+"}
          </div>
        </button>

        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            openSections.description ? "max-h-[2500px] opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="p-4 pt-0 border-t border-gray-50/65">
            {/* Box Format: Side-by-Side (2 Columns on mobile & desktop to reduce vertical height) */}
            {specList.length > 0 && (
              <div className="grid grid-cols-2 gap-2 py-4">
                {specList.map((item, idx) => (
                  <div 
                    key={idx} 
                    className="bg-gray-50 border border-gray-100 rounded-lg p-2.5 md:p-3.5 flex flex-col justify-center min-h-[56px] md:min-h-[64px] hover:bg-gray-100/40 transition-colors"
                  >
                    <span className="text-[9px] md:text-[10px] text-gray-400 font-bold uppercase tracking-wider leading-none">
                      {item.label}
                    </span>
                    <span className="text-xs md:text-sm font-semibold text-gray-800 mt-1 whitespace-pre-line leading-snug">
                      {item.value}
                    </span>
                  </div>
                ))}
              </div>
            )}

            {/* Manufacturer Details */}
            {hasMfg && (
              <div className="mt-4 pt-4 border-t border-gray-100 space-y-4 text-xs md:text-sm">
                {specifications?.manufacturedBy?.trim() && (
                  <div className="space-y-1">
                    <h4 className="font-bold text-gray-900">Manufactured & Packed By:</h4>
                    <p className="text-gray-600 whitespace-pre-line leading-relaxed pl-0.5">
                      {specifications.manufacturedBy}
                    </p>
                  </div>
                )}
                {specifications?.shippedBy?.trim() && (
                  <div className="space-y-1">
                    <h4 className="font-bold text-gray-900">Shipped & Marketed By:</h4>
                    <p className="text-gray-600 whitespace-pre-line leading-relaxed pl-0.5">
                      {specifications.shippedBy}
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* Standard Description Overview */}
            {descriptionHtml && (
              <div className={`pt-4 ${hasSpecs ? "mt-4 border-t border-gray-100" : ""}`}>
                {hasSpecs && (
                  <h4 className="font-bold text-gray-900 text-xs md:text-sm mb-2 uppercase tracking-wider">
                    Overview
                  </h4>
                )}
                <div
                  className="prose prose-sm max-w-none text-gray-600 leading-relaxed text-xs md:text-sm"
                  dangerouslySetInnerHTML={{ __html: descriptionHtml }}
                />
              </div>
            )}
          </div>
        </div>
      </div>

      {/* 2. Shipping Section */}
      <div className="border-b border-gray-200">
        <button
          className="w-full flex items-center justify-between p-4 text-left focus:outline-none hover:bg-gray-50/50 transition-colors"
          onClick={() => toggle("shipping")}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center text-maroonClr shrink-0 border border-pink-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 8h14M5 8a2 2 0 110-4h14a2 2 0 110 4M5 8v10a2 2 0 002 2h10a2 2 0 002-2V8m-9 4h4" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm md:text-base leading-tight">Shipping Information</h3>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">Dispatch details & shipping speed</p>
            </div>
          </div>
          <div className="text-gray-400 font-light text-xl w-6 h-6 flex items-center justify-center select-none">
            {openSections.shipping ? "—" : "+"}
          </div>
        </button>

        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            openSections.shipping ? "max-h-96 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="p-4 pt-0 text-xs md:text-sm text-gray-600 leading-relaxed border-t border-gray-50/65">
            We offer free express shipping across all states in India. Orders are typically processed and dispatched within 24-48 hours. Standard delivery timeline ranges from 3-6 business days depending on the location.
          </div>
        </div>
      </div>

      {/* 3. Returns Section */}
      <div>
        <button
          className="w-full flex items-center justify-between p-4 text-left focus:outline-none hover:bg-gray-50/50 transition-colors"
          onClick={() => toggle("returns")}
        >
          <div className="flex items-center gap-3">
            <div className="w-9 h-9 rounded-lg bg-pink-50 flex items-center justify-center text-maroonClr shrink-0 border border-pink-100">
              <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth="2">
                <path strokeLinecap="round" strokeLinejoin="round" d="M4 4v5h.582m15.356 2A8.001 8.001 0 1121.21 8H18.5" />
              </svg>
            </div>
            <div>
              <h3 className="font-semibold text-gray-900 text-sm md:text-base leading-tight">Easy Returns & Exchanges</h3>
              <p className="text-[11px] text-gray-500 font-medium mt-0.5">7-day hassle-free return window</p>
            </div>
          </div>
          <div className="text-gray-400 font-light text-xl w-6 h-6 flex items-center justify-center select-none">
            {openSections.returns ? "—" : "+"}
          </div>
        </button>

        <div
          className={`transition-all duration-300 ease-in-out overflow-hidden ${
            openSections.returns ? "max-h-96 opacity-100" : "max-h-0 opacity-0 pointer-events-none"
          }`}
        >
          <div className="p-4 pt-0 text-xs md:text-sm text-gray-600 leading-relaxed border-t border-gray-50/65">
            We accept easy returns and size/color exchanges within 7 days of delivery. The item must be in its original, unworn state with tags attached. You can initiate a return or exchange request directly from your account page, or by contacting our support team via WhatsApp.
          </div>
        </div>
      </div>
    </div>
  );
}

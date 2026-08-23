"use client";

import { useEffect, useRef, useState } from "react";

const BADGES = [
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 8.25c0-2.485-2.099-4.5-4.688-4.5-1.935 0-3.597 1.126-4.312 2.733-.715-1.607-2.377-2.733-4.313-2.733C5.1 3.75 3 5.765 3 8.25c0 7.22 9 12 9 12s9-4.78 9-12z" />
      </svg>
    ),
    stat: "10,000+",
    label: "Esteemed Customers",
    color: "text-maroonClr",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
      </svg>
    ),
    stat: "Up to 49%",
    label: "Privilege Savings",
    color: "text-goldClr",
  },
  {
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.8" className="w-4 h-4 flex-shrink-0">
        <path strokeLinecap="round" strokeLinejoin="round" d="M21 11.25v8.25a1.5 1.5 0 01-1.5 1.5H5.25a1.5 1.5 0 01-1.5-1.5v-8.25M12 4.875A2.625 2.625 0 109.375 7.5H12m0-2.625V7.5m0-2.625A2.625 2.625 0 1114.625 7.5H12m0 0V21m-8.625-9.75h18c.621 0 1.125-.504 1.125-1.125v-1.5c0-.621-.504-1.125-1.125-1.125h-18c-.621 0-1.125.504-1.125 1.125v1.5c0 .621.504 1.125 1.125 1.125z" />
      </svg>
    ),
    stat: "Free Gift",
    label: "On Any 2 Styles ₹1,500+",
    color: "text-maroonClr",
  },
];

const DIVIDER = (
  <span className="flex-shrink-0 w-px h-5 bg-goldClr/30 mx-1" />
);

export default function TrustBadgeStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          observer.disconnect();
        }
      },
      { threshold: 0.1 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section
      ref={ref}
      className="bg-gradient-to-r from-[#fdf6ee] via-[#fff8f0] to-[#fdf6ee] border-y border-goldClr/20 overflow-hidden"
    >
      {/* ── Mobile: horizontal scroll strip ── */}
      <div className="flex sm:hidden items-center gap-3 overflow-x-auto hideScrollbar px-4 py-3">
        {BADGES.map((b, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-2 flex-shrink-0 bg-white/70 backdrop-blur-sm border border-goldClr/20 rounded-full px-3.5 py-2 shadow-sm transition-all duration-500 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-3"
            }`}
            style={{ transitionDelay: `${idx * 100}ms` }}
          >
            <span className={`${b.color}`}>{b.icon}</span>
            <span className="font-bold text-[11px] text-maroonClr whitespace-nowrap">{b.stat}</span>
            <span className="text-[10px] text-gray-500 whitespace-nowrap">{b.label}</span>
          </div>
        ))}
      </div>

      {/* ── Desktop: elegant inline 3-column row ── */}
      <div className="hidden sm:flex max-w-6xl mx-auto px-6 py-4 items-center justify-center divide-x divide-goldClr/25">
        {BADGES.map((b, idx) => (
          <div
            key={idx}
            className={`flex items-center gap-3 px-8 transition-all duration-600 ${
              visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-4"
            }`}
            style={{ transitionDelay: `${idx * 120}ms` }}
          >
            {/* Icon pill */}
            <span className={`w-9 h-9 rounded-full bg-white border border-goldClr/25 shadow-sm flex items-center justify-center ${b.color} flex-shrink-0`}>
              {b.icon}
            </span>
            <div className="flex flex-col leading-tight">
              <span className="font-kalnia text-maroonClr text-sm font-bold">{b.stat}</span>
              <span className="text-[10px] text-gray-500 uppercase tracking-wider">{b.label}</span>
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}

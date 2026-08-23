"use client";

import { useEffect, useRef, useState } from "react";

const STATS = [
  {
    value: 10000,
    suffix: "+",
    prefix: "",
    label: "Esteemed Customers",
    sub: "Loved across India & worldwide",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M15 19.128a9.38 9.38 0 002.625.372 9.337 9.337 0 004.121-.952 4.125 4.125 0 00-7.533-2.493M15 19.128v-.003c0-1.113-.285-2.16-.786-3.07M15 19.128v.106A12.318 12.318 0 018.624 21c-2.331 0-4.512-.645-6.374-1.766l-.001-.109a6.375 6.375 0 0111.964-3.07M12 6.375a3.375 3.375 0 11-6.75 0 3.375 3.375 0 016.75 0zm8.25 2.25a2.625 2.625 0 11-5.25 0 2.625 2.625 0 015.25 0z" />
      </svg>
    ),
  },
  {
    value: 49,
    suffix: "%",
    prefix: "UP TO ",
    label: "Privilege Savings",
    sub: "On our finest curated collections",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 14.25l6-6m4.5-3.493V21.75l-3.75-1.5-3.75 1.5-3.75-1.5-3.75 1.5V4.757c0-1.108.806-2.057 1.907-2.185a48.507 48.507 0 0111.186 0c1.1.128 1.907 1.077 1.907 2.185z" />
      </svg>
    ),
  },
  {
    value: 100,
    suffix: "%",
    prefix: "",
    label: "Authentic Handcraft",
    sub: "Sourced directly from master weavers",
    icon: (
      <svg viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-7 h-7">
        <path strokeLinecap="round" strokeLinejoin="round" d="M9 12.75L11.25 15 15 9.75M21 12c0 1.268-.63 2.39-1.593 3.068a3.745 3.745 0 01-1.043 3.296 3.745 3.745 0 01-3.296 1.043A3.745 3.745 0 0112 21c-1.268 0-2.39-.63-3.068-1.593a3.746 3.746 0 01-3.296-1.043 3.745 3.745 0 01-1.043-3.296A3.745 3.745 0 013 12c0-1.268.63-2.39 1.593-3.068a3.745 3.745 0 011.043-3.296 3.746 3.746 0 013.296-1.043A3.746 3.746 0 0112 3c1.268 0 2.39.63 3.068 1.593a3.746 3.746 0 013.296 1.043 3.746 3.746 0 011.043 3.296A3.745 3.745 0 0121 12z" />
      </svg>
    ),
  },
];

function useCountUp(target: number, duration: number, active: boolean) {
  const [count, setCount] = useState(0);

  useEffect(() => {
    if (!active) return;
    let start = 0;
    const step = target / (duration / 16);
    const timer = setInterval(() => {
      start += step;
      if (start >= target) {
        setCount(target);
        clearInterval(timer);
      } else {
        setCount(Math.floor(start));
      }
    }, 16);
    return () => clearInterval(timer);
  }, [target, duration, active]);

  return count;
}

function StatCard({ stat, active, delay }: { stat: typeof STATS[0]; active: boolean; delay: number }) {
  const count = useCountUp(stat.value, 1800, active);

  const display =
    stat.value >= 1000
      ? `${(count / 1000).toFixed(count >= stat.value ? 0 : 1)}K`
      : `${count}`;

  return (
    <div
      className={`flex flex-col items-center text-center px-6 py-8 transition-all duration-700 ${
        active ? "opacity-100 translate-y-0" : "opacity-0 translate-y-8"
      }`}
      style={{ transitionDelay: `${delay}ms` }}
    >
      {/* Icon circle */}
      <div className="w-16 h-16 rounded-full bg-white/10 border border-goldClr/30 flex items-center justify-center text-goldClr mb-5">
        {stat.icon}
      </div>
      {/* Number */}
      <div className="font-kalnia text-4xl sm:text-5xl font-bold text-goldClr leading-none mb-2">
        <span className="text-2xl sm:text-3xl">{stat.prefix}</span>
        {display}
        <span className="text-2xl sm:text-3xl">{stat.suffix}</span>
      </div>
      {/* Label */}
      <p className="text-white font-semibold text-sm sm:text-base uppercase tracking-widest mb-1.5">
        {stat.label}
      </p>
      {/* Sub */}
      <p className="text-white/60 text-xs sm:text-sm leading-relaxed max-w-[180px]">
        {stat.sub}
      </p>
    </div>
  );
}

export default function StatsStrip() {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) { setVisible(true); observer.disconnect(); }
      },
      { threshold: 0.2 }
    );
    if (ref.current) observer.observe(ref.current);
    return () => observer.disconnect();
  }, []);

  return (
    <section ref={ref} className="bg-maroonClr relative overflow-hidden py-2">
      {/* Subtle decorative background circles */}
      <div className="absolute -top-20 -left-20 w-64 h-64 rounded-full bg-white/5 pointer-events-none" />
      <div className="absolute -bottom-20 -right-20 w-64 h-64 rounded-full bg-goldClr/10 pointer-events-none" />

      <div className="relative z-10 max-w-7xl mx-auto px-4 md:px-6">
        {/* Section heading */}
        <div className={`text-center pt-6 sm:pt-12 pb-2 sm:pb-4 transition-all duration-700 ${visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-6"}`}>
          <span className="text-goldClr text-[11px] font-bold uppercase tracking-[0.3em]">
            By The Numbers
          </span>
          <h2 className="font-kalnia text-white text-3xl sm:text-4xl font-medium mt-2">
            The Boutiique Vastraa Promise
          </h2>
        </div>

        {/* Stats grid */}
        <div className="grid grid-cols-3 sm:grid-cols-3 divide-x divide-white/10 pb-6 sm:pb-12">
          {STATS.map((stat, idx) => (
            <StatCard key={idx} stat={stat} active={visible} delay={idx * 200} />
          ))}
        </div>
      </div>
    </section>
  );
}

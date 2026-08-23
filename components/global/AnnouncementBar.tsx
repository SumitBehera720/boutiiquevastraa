"use client";

import { useState, useEffect, useCallback } from "react";
import { usePathname } from "next/navigation";
import Link from "next/link";

interface Announcement {
  text: string;
  link?: string;
  linkText?: string;
}

interface AnnouncementBarProps {
  settings?: {
    announcements?: (string | Announcement)[];
    facebookUrl?: string;
    instagramUrl?: string;
    youtubeUrl?: string;
  };
}

function normalizeAnnouncement(raw: string | Announcement): Announcement {
  if (typeof raw === "string") return { text: raw };
  return raw;
}

export default function AnnouncementBar({ settings }: AnnouncementBarProps) {
  const pathname = usePathname();
  const [isCheckoutState, setIsCheckoutState] = useState(false);

  useEffect(() => {
    const p = (pathname || "").toLowerCase();
    const winP = (typeof window !== "undefined" ? window.location.pathname : "").toLowerCase();
    setIsCheckoutState(p.includes("checkout") || winP.includes("checkout"));
  }, [pathname]);

  const rawPath = pathname || "";
  const path = rawPath.toLowerCase();
  const isLoginPage = path === "/account/login";
  const isAdminPage = path.startsWith("/admin");
  const winP = (typeof window !== "undefined" ? window.location.pathname : "").toLowerCase();
  const isCheckoutPage = isCheckoutState || path.includes("checkout") || winP.includes("checkout");

  const rawAnnouncements = settings?.announcements && settings.announcements.length > 0
    ? settings.announcements
    : [
        "Easy Return & Exchange",
        "Free Shipping on All Orders | Cash on Delivery Available"
      ];

  const announcements: Announcement[] = rawAnnouncements.map(normalizeAnnouncement);

  const [currentIndex, setCurrentIndex] = useState(0);
  const [animating, setAnimating] = useState(false);
  const [direction, setDirection] = useState<"next" | "prev">("next");

  const goTo = useCallback((nextIndex: number, dir: "next" | "prev") => {
    if (animating) return;
    setDirection(dir);
    setAnimating(true);
    setTimeout(() => {
      setCurrentIndex(nextIndex);
      setAnimating(false);
    }, 320);
  }, [animating]);

  const goNext = useCallback(() => {
    goTo((currentIndex + 1) % announcements.length, "next");
  }, [currentIndex, announcements.length, goTo]);

  const goPrev = useCallback(() => {
    goTo((currentIndex - 1 + announcements.length) % announcements.length, "prev");
  }, [currentIndex, announcements.length, goTo]);

  // Auto-advance
  useEffect(() => {
    if (announcements.length <= 1) return;
    const timer = setInterval(goNext, 4500);
    return () => clearInterval(timer);
  }, [announcements.length, goNext]);

  if (isLoginPage || isAdminPage || isCheckoutPage) return null;

  const current = announcements[currentIndex];

  const slideStyle: React.CSSProperties = {
    transform: animating
      ? `translateY(${direction === "next" ? "-100%" : "100%"})`
      : "translateY(0)",
    opacity: animating ? 0 : 1,
    transition: "transform 0.32s ease, opacity 0.32s ease",
  };

  return (
    <div className="bg-maroonClr text-white text-center text-[11px] sm:text-[12px] font-medium overflow-hidden h-[36px] flex items-center justify-between relative select-none">
      {/* Prev arrow */}
      {announcements.length > 1 && (
        <button
          onClick={goPrev}
          aria-label="Previous announcement"
          className="flex-shrink-0 flex items-center justify-center w-8 h-full hover:bg-white/10 transition-colors z-10"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M10 12L6 8l4-4" />
          </svg>
        </button>
      )}

      {/* Announcement text */}
      <div className="flex-1 overflow-hidden relative h-full flex items-center justify-center">
        <div
          key={currentIndex}
          style={slideStyle}
          className="absolute inset-0 flex items-center justify-center px-2 leading-normal font-sans tracking-wide gap-2"
        >
          <span>{current.text}</span>
          {current.link && current.linkText && (
            <Link
              href={current.link}
              className="ml-2 inline-flex items-center gap-1 bg-white/20 hover:bg-white/30 text-white text-[10px] font-bold uppercase tracking-wider px-2.5 py-0.5 rounded-full transition-colors"
            >
              {current.linkText}
              <svg viewBox="0 0 12 12" fill="none" stroke="currentColor" strokeWidth="2" className="w-2.5 h-2.5">
                <path strokeLinecap="round" strokeLinejoin="round" d="M2.5 6h7M6.5 3.5L9 6l-2.5 2.5" />
              </svg>
            </Link>
          )}
        </div>
      </div>

      {/* Next arrow */}
      {announcements.length > 1 && (
        <button
          onClick={goNext}
          aria-label="Next announcement"
          className="flex-shrink-0 flex items-center justify-center w-8 h-full hover:bg-white/10 transition-colors z-10"
        >
          <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2.5" className="w-3 h-3">
            <path strokeLinecap="round" strokeLinejoin="round" d="M6 12l4-4-4-4" />
          </svg>
        </button>
      )}

      {/* Dot indicators */}
      {announcements.length > 1 && (
        <div className="absolute bottom-0.5 left-0 right-0 flex justify-center gap-1 pointer-events-none">
          {announcements.map((_, idx) => (
            <span
              key={idx}
              className={`block rounded-full transition-all duration-300 ${
                idx === currentIndex ? "w-3 h-0.5 bg-white" : "w-1 h-0.5 bg-white/40"
              }`}
            />
          ))}
        </div>
      )}
    </div>
  );
}

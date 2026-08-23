"use client";

import { useEffect, useState } from "react";

export default function StoryTrackerNav() {
  const [scrollProgress, setScrollProgress] = useState(0);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const handleScroll = () => {
      const totalHeight = document.documentElement.scrollHeight - window.innerHeight;
      const currentScroll = window.scrollY;
      const progress = Math.min(100, Math.max(0, (currentScroll / (totalHeight || 1)) * 100));
      setScrollProgress(progress);
      setIsVisible(currentScroll > 200);
    };

    window.addEventListener("scroll", handleScroll, { passive: true });
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  if (!isVisible) return null;

  return (
    /* Top Gold Scroll Thread Bar */
    <div 
      className="fixed top-0 left-0 right-0 h-0.5 z-[95] bg-goldClr/20 pointer-events-none"
    >
      <div 
        className="h-full bg-gradient-to-r from-maroonClr via-goldClr to-maroonClr transition-all duration-150 ease-out shadow-[0_0_8px_rgba(201,168,76,0.6)]"
        style={{ width: `${scrollProgress}%` }}
      />
    </div>
  );
}

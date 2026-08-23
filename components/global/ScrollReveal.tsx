"use client";

import { useEffect, useRef, ReactNode } from "react";

interface ScrollRevealProps {
  children: ReactNode;
  className?: string;
  delay?: number; // ms
  direction?: "up" | "down" | "left" | "right" | "fade";
  threshold?: number;
  once?: boolean;
}

/**
 * Wraps children and animates them into view on scroll.
 * Usage: <ScrollReveal direction="up" delay={100}> ... </ScrollReveal>
 */
export default function ScrollReveal({
  children,
  className = "",
  delay = 0,
  direction = "up",
  threshold = 0.12,
  once = true,
}: ScrollRevealProps) {
  const ref = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    // Initial hidden state
    const initialStyles: Record<string, string> = {
      opacity: "0",
      transition: `opacity 0.7s ease ${delay}ms, transform 0.7s cubic-bezier(0.22,0.61,0.36,1) ${delay}ms`,
    };

    const transforms: Record<string, string> = {
      up: "translateY(36px)",
      down: "translateY(-36px)",
      left: "translateX(36px)",
      right: "translateX(-36px)",
      fade: "scale(0.97)",
    };

    el.style.opacity = "0";
    el.style.transform = transforms[direction] || "translateY(36px)";
    el.style.transition = initialStyles.transition;

    const observer = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          el.style.opacity = "1";
          el.style.transform = "none";
          if (once) observer.disconnect();
        } else if (!once) {
          el.style.opacity = "0";
          el.style.transform = transforms[direction];
        }
      },
      { threshold }
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [delay, direction, threshold, once]);

  return (
    <div ref={ref} className={className}>
      {children}
    </div>
  );
}

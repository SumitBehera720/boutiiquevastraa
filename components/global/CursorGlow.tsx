"use client";

import { useEffect, useRef } from "react";

/**
 * Renders a soft ambient glow that follows the cursor.
 * The glow is a large, blurred, low-opacity circle.
 * Purely decorative — pointer-events: none.
 */
export default function CursorGlow() {
  const glowRef = useRef<HTMLDivElement>(null);
  const pos = useRef({ x: -200, y: -200 });
  const raf = useRef<number>(0);

  useEffect(() => {
    const onMove = (e: MouseEvent) => {
      pos.current = { x: e.clientX, y: e.clientY };
    };

    const animate = () => {
      if (glowRef.current) {
        glowRef.current.style.transform = `translate(${pos.current.x - 200}px, ${pos.current.y - 200}px)`;
      }
      raf.current = requestAnimationFrame(animate);
    };

    window.addEventListener("mousemove", onMove, { passive: true });
    raf.current = requestAnimationFrame(animate);

    return () => {
      window.removeEventListener("mousemove", onMove);
      cancelAnimationFrame(raf.current);
    };
  }, []);

  // Only visible on desktop — hidden on touch devices
  return (
    <div
      aria-hidden="true"
      className="pointer-events-none fixed top-0 left-0 z-[9] hidden lg:block"
    >
      <div
        ref={glowRef}
        className="w-[400px] h-[400px] rounded-full"
        style={{
          background:
            "radial-gradient(circle, rgba(201,168,76,0.06) 0%, rgba(141,11,65,0.03) 50%, transparent 70%)",
          willChange: "transform",
          transition: "transform 0.12s linear",
        }}
      />
    </div>
  );
}

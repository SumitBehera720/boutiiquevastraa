"use client";

import Image from "next/image";
import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

export default function PageLoader() {
  const [visible, setVisible] = useState(true);
  const [fadeOut, setFadeOut] = useState(false);
  const pathname = usePathname();

  useEffect(() => {
    setVisible(true);
    setFadeOut(false);
    const hideTimer = setTimeout(() => {
      setFadeOut(true);
      setTimeout(() => setVisible(false), 500);
    }, 1000);
    const fallbackTimer = setTimeout(() => {
      setVisible(false);
    }, 4000);
    return () => {
      clearTimeout(hideTimer);
      clearTimeout(fallbackTimer);
    };
  }, [pathname]);

  useEffect(() => {
    const onError = () => setVisible(false);
    window.addEventListener("error", onError);
    return () => window.removeEventListener("error", onError);
  }, []);

  if (!visible) return null;

  return (
    <>
      <noscript>
        <style>{`[data-page-loader]{display:none!important}`}</style>
      </noscript>
      <div
        data-page-loader
        className="bg-maroonClr fixed inset-0 z-[9999] flex items-center justify-center text-white"
        style={{
          opacity: fadeOut ? 0 : 1,
          transition: "opacity 0.5s ease-in-out",
          pointerEvents: "none",
        }}
      >
        <div className="flex flex-col items-center space-y-3">
          <Image
            alt="logo"
            width={500}
            height={500}
            className="loader-flip h-20 w-20 object-contain"
            src="/images/loader.png"
            priority
          />
        </div>
      </div>
    </>
  );
}

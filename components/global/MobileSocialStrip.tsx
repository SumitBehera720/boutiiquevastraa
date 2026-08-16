"use client";

import { useState, useEffect } from "react";
import { usePathname } from "next/navigation";

interface MobileSocialStripProps {
  facebook?: string;
  instagram?: string;
  pinterest?: string;
  whatsapp?: string;
  youtube?: string;
}

export default function MobileSocialStrip({
  facebook,
  instagram,
  pinterest,
  whatsapp,
  youtube
}: MobileSocialStripProps) {
  const [show, setShow] = useState(true);
  const pathname = usePathname();

  useEffect(() => {
    const handleScroll = () => {
      if (window.scrollY > 20) {
        setShow(false);
      }
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const p = (pathname || "").toLowerCase();
  const winP = (typeof window !== "undefined" ? window.location.pathname : "").toLowerCase();
  if (p.includes("checkout") || winP.includes("checkout") || p.startsWith("/admin")) {
    return null;
  }

  // If there are no configured social links, don't show it
  if (!facebook && !instagram && !pinterest && !whatsapp && !youtube) return null;

  return (
    <div
      className={`sm:hidden fixed right-0 top-1/2 -translate-y-1/2 z-40 bg-white border-l border-y border-neutral-200 py-3.5 px-1.5 rounded-l-xl shadow-[0_4px_12px_rgba(0,0,0,0.15)] flex flex-col gap-3.5 transition-transform duration-500 ease-in-out ${
        show ? "translate-x-0" : "translate-x-full"
      }`}
    >
      {facebook && (
        <a href={facebook} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#1877F2] text-white flex items-center justify-center transition-all hover:scale-105 shadow-sm" aria-label="Facebook">
          <svg fill="currentColor" viewBox="0 0 24 24" className="w-4.5 h-4.5"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
        </a>
      )}
      {instagram && (
        <a href={instagram} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#833AB4] text-white flex items-center justify-center transition-all hover:scale-105 shadow-sm" aria-label="Instagram">
          <svg fill="currentColor" viewBox="0 0 24 24" className="w-4.5 h-4.5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
        </a>
      )}
      {pinterest && (
        <a href={pinterest} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#BD081C] text-white flex items-center justify-center transition-all hover:scale-105 shadow-sm" aria-label="Pinterest">
          <svg fill="currentColor" viewBox="0 0 24 24" className="w-4.5 h-4.5"><path d="M12 0C5.373 0 0 5.373 0 12c0 5.084 3.163 9.426 7.627 11.174-.105-.949-.2-2.405.042-3.441.218-.937 1.407-5.965 1.407-5.965s-.359-.719-.359-1.782c0-1.668.967-2.914 2.171-2.914 1.023 0 1.518.769 1.518 1.69 0 1.029-.655 2.568-.994 3.995-.283 1.194.599 2.169 1.777 2.169 2.133 0 3.772-2.249 3.772-5.495 0-2.873-2.064-4.882-5.012-4.882-3.414 0-5.418 2.561-5.418 5.207 0 1.031.397 2.138.893 2.738.098.119.112.224.083.345-.091.378-.293 1.189-.333 1.353-.053.218-.175.263-.404.157-1.507-.702-2.449-2.903-2.449-4.669 0-3.802 2.763-7.295 7.965-7.295 4.182 0 7.43 2.981 7.43 6.962 0 4.155-2.62 7.5-6.258 7.5-1.222 0-2.371-.635-2.764-1.383l-.754 2.872c-.273 1.053-.996 2.373-1.482 3.167C9.9 23.83 10.929 24 12 24c6.627 0 12-5.373 12-12S18.627 0 12 0z"/></svg>
        </a>
      )}
      {youtube && (
        <a href={youtube} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#FF0000] text-white flex items-center justify-center transition-all hover:scale-105 shadow-sm" aria-label="YouTube">
          <svg fill="currentColor" viewBox="0 0 24 24" className="w-4.5 h-4.5"><path d="M21.582 6.186a2.668 2.668 0 00-1.88-1.884C18.044 3.864 12 3.864 12 3.864s-6.044 0-7.702.438a2.668 2.668 0 00-1.88 1.884C1.98 7.848 1.98 12 1.98 12s0 4.152.438 5.814a2.668 2.668 0 001.88 1.884c1.658.438 7.702.438 7.702.438s6.044 0 7.702-.438a2.668 2.668 0 001.88-1.884c.438-1.662.438-5.814.438-5.814s0-4.152-.438-5.814zM9.982 15.46V8.54l6.026 3.46-6.026 3.46z"/></svg>
        </a>
      )}
      {whatsapp && (
        <a href={whatsapp} target="_blank" rel="noopener noreferrer" className="w-8 h-8 rounded-full bg-[#25D366] text-white flex items-center justify-center transition-all hover:scale-105 shadow-sm" aria-label="WhatsApp">
          <svg fill="currentColor" viewBox="0 0 24 24" className="w-4.5 h-4.5"><path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.517 2.266 2.27 3.507 5.283 3.507 8.491-.005 6.657-5.342 11.997-11.957 11.997-2.005-.001-3.973-.502-5.739-1.455L0 24zm6.59-4.846c1.66.988 3.278 1.477 4.947 1.478 5.417 0 9.826-4.307 9.83-9.605.002-2.568-1.002-4.97-2.825-6.793C16.776 2.41 14.385 1.41 12.01 1.41c-5.42 0-9.828 4.31-9.832 9.61-.001 1.77.472 3.498 1.368 5.05L2.551 21.4l5.59-1.457c1.478.805 2.923 1.21 4.506 1.21zM17.18 13.9c-.29-.145-1.73-.85-1.99-.95-.26-.1-.45-.15-.64.14-.19.3-.74.95-.91 1.14-.17.19-.34.22-.63.07-.29-.15-1.22-.45-2.33-1.44-.86-.77-1.44-1.73-1.61-2.02-.17-.29-.02-.45.13-.59.13-.13.29-.34.44-.51.15-.17.2-.29.3-.49.1-.2.05-.37-.02-.52-.07-.15-.64-1.55-.88-2.13-.23-.56-.47-.48-.64-.49-.16-.01-.35-.01-.54-.01-.19 0-.5.07-.76.35-.26.28-.99.97-.99 2.37 0 1.4 1.02 2.76 1.16 2.96.14.2 2.01 3.08 4.88 4.32.68.3 1.22.48 1.63.61.69.22 1.32.19 1.82.11.55-.08 1.71-.7 1.95-1.37.24-.67.24-1.24.17-1.37-.07-.13-.26-.2-.55-.35z"/></svg>
        </a>
      )}
    </div>
  );
}

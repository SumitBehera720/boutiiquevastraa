"use client";

import { usePathname } from "next/navigation";

interface FloatingWhatsAppProps {
  whatsappNumber?: string;
}

export default function FloatingWhatsApp({ whatsappNumber }: FloatingWhatsAppProps) {
  const pathname = usePathname();

  // Hide on admin panel, login screen, and checkout page
  const isAdmin = pathname?.startsWith("/admin");
  const isLogin = pathname === "/account/login";
  const isCheckout = pathname?.startsWith("/checkout");
  if (isAdmin || isLogin || isCheckout) return null;
  
  // On mobile (below sm):
  // - If it has mobile bottom nav: bottom-20 (above bottom nav)
  // - If it has NO mobile bottom nav (checkout): bottom-6
  // On desktop (sm and above): bottom-6
  const mobileBottomClass = isCheckout ? "bottom-6" : "bottom-20";

  const rawWaNumber = whatsappNumber || "919205248666";
  const cleanWaNumber = rawWaNumber.includes("38666") ? "919205248666" : rawWaNumber;
  const waUrl = `https://wa.me/${cleanWaNumber.replace(/[^0-9]/g, "")}`;

  return (
    <a
      href={waUrl}
      target="_blank"
      rel="noopener noreferrer"
      className={`fixed right-6 ${mobileBottomClass} sm:bottom-6 z-40 bg-[#25D366] text-white p-3.5 rounded-full shadow-[0_4px_16px_rgba(37,211,102,0.3)] transition-all hover:scale-110 hover:shadow-[0_6px_20px_rgba(37,211,102,0.45)] group flex items-center justify-center`}
      aria-label="Chat on WhatsApp"
    >
      {/* Pulsing Outer Rings */}
      <span className="absolute inset-0 rounded-full bg-[#25D366]/40 animate-ping opacity-75 group-hover:animate-none group-hover:opacity-0" />
      
      {/* WhatsApp Icon */}
      <svg
        fill="currentColor"
        viewBox="0 0 24 24"
        className="w-6.5 h-6.5 transition-transform group-hover:rotate-12 duration-300"
      >
        <path d="M.057 24l1.687-6.163c-1.041-1.804-1.588-3.849-1.587-5.946C.06 5.348 5.397.01 12.008.01c3.202.001 6.212 1.246 8.477 3.517 2.266 2.27 3.507 5.283 3.507 8.491-.005 6.657-5.342 11.997-11.957 11.997-2.005-.001-3.973-.502-5.739-1.455L0 24zm6.59-4.846c1.66.988 3.278 1.477 4.947 1.478 5.417 0 9.826-4.307 9.83-9.605.002-2.568-1.002-4.97-2.825-6.793C16.776 2.41 14.385 1.41 12.01 1.41c-5.42 0-9.828 4.31-9.832 9.61-.001 1.77.472 3.498 1.368 5.05L2.551 21.4l5.59-1.457c1.478.805 2.923 1.21 4.506 1.21zM17.18 13.9c-.29-.145-1.73-.85-1.99-.95-.26-.1-.45-.15-.64.14-.19.3-.74.95-.91 1.14-.17.19-.34.22-.63.07-.29-.15-1.22-.45-2.33-1.44-.86-.77-1.44-1.73-1.61-2.02-.17-.29-.02-.45.13-.59.13-.13.29-.34.44-.51.15-.17.2-.29.3-.49.1-.2.05-.37-.02-.52-.07-.15-.64-1.55-.88-2.13-.23-.56-.47-.48-.64-.49-.16-.01-.35-.01-.54-.01-.19 0-.5.07-.76.35-.26.28-.99.97-.99 2.37 0 1.4 1.02 2.76 1.16 2.96.14.2 2.01 3.08 4.88 4.32.68.3 1.22.48 1.63.61.69.22 1.32.19 1.82.11.55-.08 1.71-.7 1.95-1.37.24-.67.24-1.24.17-1.37-.07-.13-.26-.2-.55-.35z" />
      </svg>

      {/* Tooltip / Hint */}
      <span className="absolute right-14 bg-neutral-900 text-white text-[10px] font-bold uppercase tracking-wider px-3 py-1.5 rounded shadow-md opacity-0 -translate-x-2 transition-all duration-300 pointer-events-none group-hover:opacity-100 group-hover:translate-x-0 whitespace-nowrap hidden sm:inline-block">
        Chat With Us
      </span>
    </a>
  );
}

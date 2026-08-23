"use client";

import { useState } from "react";
import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { Phone, Mail, MapPin } from "lucide-react";

interface FooterProps {
  settings?: {
    logoUrl?: string;
    description?: string;
    contactEmail?: string;
    contactPhone?: string;
    copyright?: string;
    facebookUrl?: string;
    instagramUrl?: string;
    pinterestUrl?: string;
    links?: { label: string; url: string }[];
  };
  whatsappNumber?: string;
}

export default function Footer({ settings, whatsappNumber }: FooterProps) {
  const pathname = usePathname();
  const isLoginPage = pathname === "/account/login";
  const isAdminPage = pathname.startsWith("/admin");
  const isCheckoutPage = pathname.startsWith("/checkout");

  const [newsletterEmail, setNewsletterEmail] = useState("");
  const [newsletterStatus, setNewsletterStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [newsletterMessage, setNewsletterMessage] = useState("");

  const handleNewsletterSubmit = async () => {
    if (!newsletterEmail || !newsletterEmail.includes("@")) {
      setNewsletterStatus("error");
      setNewsletterMessage("Please enter a valid email address.");
      return;
    }
    setNewsletterStatus("loading");
    setNewsletterMessage("");
    try {
      const res = await fetch("/api/newsletter/subscribe", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: newsletterEmail })
      });
      const data = await res.json();
      if (res.ok) {
        setNewsletterStatus("success");
        setNewsletterMessage(data.message || "Subscribed successfully!");
        setNewsletterEmail("");
      } else {
        setNewsletterStatus("error");
        setNewsletterMessage(data.message || "Failed to subscribe. Try again.");
      }
    } catch (err) {
      setNewsletterStatus("error");
      setNewsletterMessage("Something went wrong. Please check your connection.");
    }
  };

  if (isLoginPage || isAdminPage || isCheckoutPage) {
    return null;
  }

  const logoUrl = settings?.logoUrl || "/images/logo.png";
  const description = settings?.description || "Timeless Elegance, Handcrafted for Every Occasion. Shop our exclusive range of luxury sarees, designer kurtis, and jewellery.";
  const copyright = settings?.copyright || `© ${new Date().getFullYear()} Boutiique Vastraa. All rights reserved.`;
  const contactEmail = settings?.contactEmail || "boutiiquevastraa@gmail.com";
  const contactPhone = settings?.contactPhone || "+91 - 9205238666";
  const address = "2 No Gouranga Colony Koler Danga Road Nabadwip, West Bengal, Nadia, 741302";
  const supportTime = "24/7 Support Available";
  const facebookUrl = settings?.facebookUrl;
  const instagramUrl = settings?.instagramUrl;
  const pinterestUrl = settings?.pinterestUrl;
  
  const quickLinks = [
    { label: "About Us", url: "/about-us" },
    { label: "Contact Us", url: "/contact-us" },
    { label: "FAQ", url: "/#faq" },
    { label: "Track Order", url: "/track-order" }
  ];

  const policyLinks = [
    { label: "Privacy Policy", url: "/policies/privacy-policy" },
    { label: "Terms & Conditions", url: "/policies/terms-conditions" },
    { label: "Refund Policy", url: "/policies/refund-policy" },
    { label: "Shipping Policy", url: "/policies/shipping-policy" },
    { label: "Return Policy", url: "/policies/return-policy" }
  ];

  return (
    <footer className="bg-maroonClr text-white pt-12 pb-20 sm:pb-8">
      <div className="container mx-auto px-4 md:px-6">
        <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-8">
          
          {/* Brand */}
          <div className="space-y-4">
            <div className="relative w-32 h-14 bg-white/10 rounded-lg p-2 flex items-center justify-center">
              <Image
                src={logoUrl}
                alt="Boutiique Vastraa"
                fill
                className="object-contain p-1"
              />
            </div>
            <p className="text-sm text-gray-300 leading-relaxed max-w-xs">
              {description}
            </p>
            {/* Social Links */}
            <div className="flex gap-3 pt-2">
              {facebookUrl && (
                <a href={facebookUrl} target="_blank" rel="noopener noreferrer" className="text-goldClr hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><path d="M18 2h-3a5 5 0 0 0-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 0 1 1-1h3z"/></svg>
                </a>
              )}
              {instagramUrl && (
                <a href={instagramUrl} target="_blank" rel="noopener noreferrer" className="text-goldClr hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><rect width="20" height="20" x="2" y="2" rx="5" ry="5"/><path d="M16 11.37A4 4 0 1 1 12.63 8 4 4 0 0 1 16 11.37z"/><line x1="17.5" x2="17.51" y1="6.5" y2="6.5"/></svg>
                </a>
              )}
              {pinterestUrl && (
                <a href={pinterestUrl} target="_blank" rel="noopener noreferrer" className="text-goldClr hover:text-white transition-colors">
                  <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" className="w-5 h-5"><circle cx="12" cy="12" r="10"/><line x1="2" x2="22" y1="12" y2="12"/><path d="M12 2a15.3 15.3 0 0 1 4 10 15.3 15.3 0 0 1-4 10 15.3 15.3 0 0 1-4-10 15.3 15.3 0 0 1 4-10z"/></svg>
                </a>
              )}
            </div>
          </div>

          {/* Quick Links */}
          <div>
            <h3 className="font-kalnia text-xl font-medium mb-6 text-goldClr">Quick Links</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              {quickLinks.map((link, idx) => (
                <li key={idx}>
                  <Link href={link.url} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Policies */}
          <div>
            <h3 className="font-kalnia text-xl font-medium mb-6 text-goldClr">Policies</h3>
            <ul className="space-y-3 text-sm text-gray-300">
              {policyLinks.map((link, idx) => (
                <li key={idx}>
                  <Link href={link.url} className="hover:text-white transition-colors">
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Contact Details */}
          <div>
            <h3 className="font-kalnia text-xl font-medium mb-6 text-goldClr">Contact Us</h3>
            <ul className="space-y-4 text-sm text-gray-300">
              <li className="flex items-center gap-2">
                <Mail className="w-4 h-4 text-goldClr shrink-0" />
                <a href="mailto:boutiiquevastraa@gmail.com" className="hover:text-white transition-colors truncate">
                  Email: boutiiquevastraa@gmail.com
                </a>
              </li>
              <li className="flex items-center gap-2">
                <Phone className="w-4 h-4 text-goldClr shrink-0" />
                <a href={`tel:${contactPhone.replace(/[^0-9+]/g, "")}`} className="hover:text-white transition-colors">
                  Call: {contactPhone}
                </a>
              </li>
              <li className="flex items-center gap-2">
                <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" fill="currentColor" className="bi bi-whatsapp w-4 h-4 text-goldClr shrink-0" viewBox="0 0 16 16">
                  <path d="M13.601 2.326A7.85 7.85 0 0 0 7.994 0C3.627 0 .068 3.558.064 7.926c0 1.399.366 2.76 1.057 3.965L0 16l4.204-1.102a7.9 7.9 0 0 0 3.79.949h.004c4.368 0 7.926-3.558 7.93-7.93a7.9 7.9 0 0 0-2.327-5.592M7.994 14.521a6.6 6.6 0 0 1-3.356-.92l-.24-.144-2.494.654.666-2.433-.156-.251a6.56 6.56 0 0 1-1.007-3.505c1.11-4.287 4.584-6.514 8.74-6.3 4.27.228 5.56 3.654 4.887 7.155-.71 3.7-3.9 5.865-7.043 5.498"/>
                </svg>
                <a href={`https://wa.me/${(whatsappNumber || "919205238666").replace(/[^0-9]/g, "")}`} target="_blank" rel="noopener noreferrer" className="hover:text-white transition-colors">
                  WhatsApp: +91 - {(whatsappNumber || "919205238666").replace(/^91/, "").replace(/(\d{5})(\d{5})/, "$1 $2")}
                </a>
              </li>
              <li className="flex items-start gap-2">
                <span className="text-goldClr font-bold text-[9px] uppercase border border-goldClr/40 px-1.5 py-0.5 rounded leading-none mt-0.5">CS Time</span>
                <span>Customer Support Time: 24/7</span>
              </li>
              <li className="flex items-start gap-2 text-xs leading-relaxed mt-2 text-gray-400">
                <MapPin className="w-4 h-4 text-goldClr shrink-0 mt-0.5" />
                <span>Address: 2 No Gouranga Colony Koler Danga Road Nabadwip, West Bengal, Nadia, 741302</span>
              </li>
            </ul>
          </div>

          {/* Newsletter */}
          <div>
            <h3 className="font-kalnia text-xl font-medium mb-6 text-goldClr">Newsletter</h3>
            <p className="text-sm text-gray-300 mb-4">Subscribe to receive updates, access to exclusive deals, and more.</p>
            {newsletterStatus === "success" ? (
              <p className="text-sm text-green-400 bg-green-950/30 border border-green-900/50 p-3 rounded">{newsletterMessage}</p>
            ) : (
              <div className="space-y-2">
                <div className="flex gap-2">
                  <input 
                    type="email" 
                    placeholder="Enter your email" 
                    value={newsletterEmail}
                    onChange={(e) => setNewsletterEmail(e.target.value)}
                    disabled={newsletterStatus === "loading"}
                    className="bg-transparent border border-gray-400 text-white px-4 py-2 w-full rounded focus:outline-none focus:border-goldClr transition text-sm"
                  />
                  <button 
                    onClick={handleNewsletterSubmit}
                    disabled={newsletterStatus === "loading"}
                    className="bg-goldClr text-maroonClr px-4 py-2 rounded font-medium hover:bg-white transition text-sm whitespace-nowrap disabled:opacity-50"
                  >
                    {newsletterStatus === "loading" ? "Subscribing..." : "Subscribe"}
                  </button>
                </div>
                {newsletterStatus === "error" && (
                  <p className="text-xs text-red-400">{newsletterMessage}</p>
                )}
              </div>
            )}
          </div>

        </div>

        <div className="mt-12 pt-6 border-t border-white/20 flex flex-col items-center justify-center gap-4">
          {/* Payment icons */}
          <div className="flex flex-wrap items-center justify-center gap-2">
            <span className="text-[10px] text-gray-400 uppercase tracking-widest mr-1">We Accept:</span>
            {/* Visa */}
            <span className="bg-white rounded px-2.5 py-1 text-[#1A1F71] text-[11px] font-black tracking-tight leading-none">VISA</span>
            {/* Mastercard */}
            <span className="bg-white rounded px-2 py-1 flex items-center gap-0.5 leading-none">
              <span className="inline-block w-4 h-4 rounded-full bg-[#EB001B]" />
              <span className="inline-block w-4 h-4 rounded-full bg-[#F79E1B] -ml-2 opacity-90" />
            </span>
            {/* Amex */}
            <span className="bg-[#016FD0] rounded px-2.5 py-1 text-white text-[10px] font-bold tracking-tight leading-none">AMEX</span>
            {/* GPay */}
            <span className="bg-white rounded px-2.5 py-1 text-[11px] font-bold leading-none">
              <span className="text-[#4285F4]">G</span><span className="text-[#EA4335]">P</span><span className="text-[#FBBC05]">a</span><span className="text-[#34A853]">y</span>
            </span>
            {/* UPI */}
            <span className="bg-white rounded px-2.5 py-1 text-[#097939] text-[10px] font-black tracking-tight leading-none">UPI</span>
            {/* COD */}
            <span className="bg-goldClr/20 border border-goldClr/30 rounded px-2.5 py-1 text-goldClr text-[10px] font-bold tracking-tight leading-none">COD</span>
          </div>
          {/* Copyright */}
          <div className="text-center text-sm text-gray-400 flex flex-col items-center gap-1">
            <p>{copyright}</p>
            <p>
              Developed by{" "}
              <a 
                href="https://qubnixtechnology.com/" 
                target="_blank" 
                rel="noopener noreferrer" 
                className="text-goldClr hover:text-white transition"
              >
                Qubnix
              </a>
            </p>
          </div>
        </div>

      </div>
    </footer>
  );
}

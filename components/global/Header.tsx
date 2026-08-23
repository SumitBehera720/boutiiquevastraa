"use client";

import Link from "next/link";
import Image from "next/image";
import { Search, ShoppingCart, LogIn, Route, ChevronDown, User, Mail } from "lucide-react";
import { useState, useEffect } from "react";
import { useCartStore } from "@/store/cartStore";
import { useRouter, usePathname } from "next/navigation";
import MarqueeBanner from "@/components/global/MarqueeBanner";
import SearchBar from "@/components/search/SearchBar";

interface HeaderProps {
  isLoggedIn?: boolean;
  settings?: any;
  footerSettings?: any;
}

export default function Header({ isLoggedIn = false, settings, footerSettings }: HeaderProps) {
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.totalQuantity);
  const { openCart } = useCartStore();
  const router = useRouter();

  const whatsappNumber = settings?.whatsappNumber || "919205248666";
  const cleanWhatsappNumber = whatsappNumber.includes("38666") ? "919205248666" : whatsappNumber;

  const rawEmail = footerSettings?.contactEmail || "boutiiquevastraa@gmail.com";
  const cleanEmail = rawEmail.includes("info@") ? "boutiiquevastraa@gmail.com" : rawEmail;

  const [searchValue, setSearchValue] = useState("");
  const [searchFocused, setSearchFocused] = useState(false);
  const [suggestions, setSuggestions] = useState<{ products: any[]; categories: any[] }>({ products: [], categories: [] });
  
  useEffect(() => {
    if (!searchValue.trim()) {
      setSuggestions({ products: [], categories: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(searchValue)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (e) {
        console.error(e);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [searchValue]);

  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [collectionsOpen, setCollectionsOpen] = useState(false);
  const [sareeOpen, setSareeOpen] = useState(false);
  const [productsOpen, setProductsOpen] = useState(false);

  {/* SAREES MEGA MENU */}
  const renderSareesMegaMenu = (closeFn: () => void) => {
    const config = settings?.megaMenuSarees || settings?.header?.megaMenuSarees || {};
    const fabrics = config.fabrics || [
      { label: "TISSUE SAREES", handle: "tissuetales", img: "/images/client-3.jpg" },
      { label: "LINEN SAREES", handle: "linen", img: "/images/client-2.jpg" },
      { label: "MUL COTTON", handle: "mul-diaries", img: "/images/client-5.jpg" },
      { label: "SILK SAREES", handle: "silk", img: "/images/client-1.jpg" },
      { label: "ORGANZA SAREES", handle: "loom-aura", img: "/images/client-4.jpg" },
      { label: "CHIFFON & GEORGETTE", handle: "saree", img: "/images/client-2.jpg" },
    ];
    const occasions = config.occasions || [
      { label: "FESTIVE DRAPES", handle: "festive", img: "/images/client-2.jpg" },
      { label: "WEDDING SAREES", handle: "wedding", img: "/images/client-3.jpg" },
      { label: "PARTYWEAR SAREES", handle: "party-wear", img: "/images/client-4.jpg" },
      { label: "CASUAL DRAPES", handle: "casual", img: "/images/client-1.jpg" },
      { label: "WORKWEAR SAREES", handle: "office-wear", img: "/images/client-5.jpg" },
      { label: "BESTSELLING SAREES", handle: "best-sellers", img: "/images/client-3.jpg" },
    ];
    const colors = config.colors || [
      { label: "CRIMSON RED", handle: "red", img: "/images/client-3.jpg" },
      { label: "LUXE GOLD", handle: "luxe-gold", img: "/images/client-1.jpg" },
      { label: "PASTEL PEACH", handle: "peach", img: "/images/client-2.jpg" },
      { label: "LAVENDER TONES", handle: "lavender", img: "/images/client-5.jpg" },
      { label: "ROYAL BLUE", handle: "royal-blue", img: "/images/client-4.jpg" },
      { label: "MUSTARD YELLOW", handle: "yellow", img: "/images/client-3.jpg" },
    ];

    return (
      <div className="absolute left-1/2 -translate-x-1/2 top-full z-50 w-[94vw] max-w-[1040px] bg-[#FAF6F0] border border-[#EBE2CD] rounded-3xl shadow-2xl p-6 overflow-hidden animate-scaleUp text-left">
        <div className="grid grid-cols-12 gap-6 items-start">
          
          {/* Col 1: SAREE FABRICS & TYPES */}
          <div className="col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3.5 border-b border-gray-200/80 pb-2">
              {config.fabricsTitle || "SAREE FABRICS & WEAVES"}
            </h4>
            <ul className="space-y-2.5">
              {fabrics.map((item: any, idx: number) => (
                <li key={idx}>
                  <Link
                    href={item.handle?.startsWith("/") ? item.handle : `/collections/${item.handle}`}
                    onClick={closeFn}
                    className="flex items-center gap-3 group/item hover:opacity-90 transition-opacity"
                  >
                    <div className="relative w-9 h-11 rounded-md overflow-hidden bg-gray-200 flex-shrink-0 border border-gray-200">
                      <Image src={item.img} alt={item.label} fill unoptimized className="object-cover object-top group-hover/item:scale-110 transition-transform duration-300" />
                    </div>
                    <span className="text-xs font-bold text-gray-800 tracking-wide uppercase group-hover/item:text-[#9E3E28] transition-colors">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 2: SAREES BY OCCASION */}
          <div className="col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3.5 border-b border-gray-200/80 pb-2">
              {config.occasionsTitle || "SAREES BY OCCASION"}
            </h4>
            <ul className="space-y-2.5">
              {occasions.map((item: any, idx: number) => (
                <li key={idx}>
                  <Link
                    href={item.handle?.startsWith("/") ? item.handle : `/collections/${item.handle}`}
                    onClick={closeFn}
                    className="flex items-center gap-3 group/item hover:opacity-90 transition-opacity"
                  >
                    <div className="relative w-9 h-11 rounded-md overflow-hidden bg-gray-200 flex-shrink-0 border border-gray-200">
                      <Image src={item.img} alt={item.label} fill unoptimized className="object-cover object-top group-hover/item:scale-110 transition-transform duration-300" />
                    </div>
                    <span className="text-xs font-bold text-gray-800 tracking-wide uppercase group-hover/item:text-[#9E3E28] transition-colors">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: SHOP BY COLOR & CRAFT */}
          <div className="col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3.5 border-b border-gray-200/80 pb-2">
              {config.colorsTitle || "SHOP BY COLOR & CRAFT"}
            </h4>
            <ul className="space-y-2">
              {colors.map((item: any, idx: number) => (
                <li key={idx}>
                  <Link
                    href={item.handle?.startsWith("/") ? item.handle : `/collections/${item.handle}`}
                    onClick={closeFn}
                    className="flex items-center gap-3 group/item hover:opacity-90 transition-opacity"
                  >
                    <div className="relative w-8 h-10 rounded-md overflow-hidden bg-gray-200 flex-shrink-0 border border-gray-200">
                      <Image src={item.img} alt={item.label} fill unoptimized className="object-cover object-top group-hover/item:scale-110 transition-transform duration-300" />
                    </div>
                    <span className="text-xs font-bold text-gray-800 tracking-wide uppercase group-hover/item:text-[#9E3E28] transition-colors">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: PROMO FEATURED BANNERS */}
          <div className="col-span-3 flex flex-col gap-3">
            <Link
              href={config.promoTopLink || "/collections/silk"}
              onClick={closeFn}
              className="relative w-full h-[95px] rounded-2xl overflow-hidden bg-[#D8C7B0] p-1.5 flex items-center justify-between group shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative w-full h-full rounded-xl overflow-hidden">
                <Image
                  src={config.promoTopImage || "/images/client-1.jpg"}
                  alt="Handloom saree"
                  fill
                  unoptimized
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/15 group-hover:bg-black/5 transition-colors" />
              </div>
            </Link>

            <Link
              href={config.promoBottomLink || "/collections/festive"}
              onClick={closeFn}
              className="group flex flex-col items-center cursor-pointer"
            >
              <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-[#C58C80] border border-[#B3786B] shadow-md group-hover:shadow-xl transition-all duration-300">
                <Image
                  src={config.promoBottomImage || "/images/client-4.jpg"}
                  alt="Festive Sarees"
                  fill
                  unoptimized
                  className="object-cover object-top group-hover:scale-108 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity" />
              </div>
              <span className="font-sans font-bold text-xs sm:text-sm text-gray-900 tracking-tight mt-2 text-center group-hover:text-[#9E3E28] transition-colors">
                {config.promoBottomText || "Festive Sarees - 45% OFF"}
              </span>
            </Link>
          </div>

        </div>
      </div>
    );
  };

  {/* COLLECTIONS MEGA MENU */}
  const renderCollectionsMegaMenu = (closeFn: () => void) => {
    const config = settings?.megaMenuCollections || settings?.header?.megaMenuCollections || {};
    const categories = config.categories || [
      { label: "SAREES", handle: "saree", img: "/images/client-1.jpg" },
      { label: "KURTIS & TUNICS", handle: "kurti", img: "/images/client-2.jpg" },
      { label: "LEHENGAS", handle: "lehenga", img: "/images/client-4.jpg" },
      { label: "JEWELLERY", handle: "jewellery", img: "/images/client-3.jpg" },
      { label: "FABRIC LIBRARY", handle: "fabric", img: "/images/client-5.jpg" },
      { label: "SALE & OFFERS", handle: "sale", img: "/images/client-3.jpg" },
    ];
    const occasions = config.occasions || [
      { label: "FESTIVE SPECIALS", handle: "festive", img: "/images/client-2.jpg" },
      { label: "CASUAL WEAR", handle: "casual", img: "/images/client-1.jpg" },
      { label: "WEDDING EDIT", handle: "wedding", img: "/images/client-3.jpg" },
      { label: "PARTY & EVENING", handle: "party-wear", img: "/images/client-4.jpg" },
      { label: "NEW ARRIVALS", handle: "new-arrivals", img: "/images/client-5.jpg" },
    ];
    const colors = config.colors || [
      { label: "RED", handle: "red", img: "/images/client-3.jpg" },
      { label: "GOLD", handle: "luxe-gold", img: "/images/client-1.jpg" },
      { label: "PEACH", handle: "peach", img: "/images/client-2.jpg" },
      { label: "LAVENDER", handle: "lavender", img: "/images/client-5.jpg" },
      { label: "ROYAL BLUE", handle: "royal-blue", img: "/images/client-4.jpg" },
      { label: "BURGUNDY", handle: "burgundy", img: "/images/client-3.jpg" },
    ];

    return (
      <div className="absolute left-1/2 -translate-x-1/2 top-full z-50 w-[94vw] max-w-[1040px] bg-[#FAF6F0] border border-[#EBE2CD] rounded-3xl shadow-2xl p-6 overflow-hidden animate-scaleUp text-left">
        <div className="grid grid-cols-12 gap-6 items-start">
          
          {/* Col 1: ALL CATEGORIES */}
          <div className="col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3.5 border-b border-gray-200/80 pb-2">
              {config.categoriesTitle || "ALL CATEGORIES"}
            </h4>
            <ul className="space-y-2.5">
              {categories.map((item: any, idx: number) => (
                <li key={idx}>
                  <Link
                    href={item.handle?.startsWith("/") ? item.handle : `/collections/${item.handle}`}
                    onClick={closeFn}
                    className="flex items-center gap-3 group/item hover:opacity-90 transition-opacity"
                  >
                    <div className="relative w-9 h-11 rounded-md overflow-hidden bg-gray-200 flex-shrink-0 border border-gray-200">
                      <Image src={item.img} alt={item.label} fill unoptimized className="object-cover object-top group-hover/item:scale-110 transition-transform duration-300" />
                    </div>
                    <span className="text-xs font-bold text-gray-800 tracking-wide uppercase group-hover/item:text-[#9E3E28] transition-colors">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 2: SHOP BY OCCASION */}
          <div className="col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3.5 border-b border-gray-200/80 pb-2">
              {config.occasionsTitle || "SHOP BY OCCASION"}
            </h4>
            <ul className="space-y-2.5">
              {occasions.map((item: any, idx: number) => (
                <li key={idx}>
                  <Link
                    href={item.handle?.startsWith("/") ? item.handle : `/collections/${item.handle}`}
                    onClick={closeFn}
                    className="flex items-center gap-3 group/item hover:opacity-90 transition-opacity"
                  >
                    <div className="relative w-9 h-11 rounded-md overflow-hidden bg-gray-200 flex-shrink-0 border border-gray-200">
                      <Image src={item.img} alt={item.label} fill unoptimized className="object-cover object-top group-hover/item:scale-110 transition-transform duration-300" />
                    </div>
                    <span className="text-xs font-bold text-gray-800 tracking-wide uppercase group-hover/item:text-[#9E3E28] transition-colors">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 3: SHOP BY COLOR */}
          <div className="col-span-3">
            <h4 className="text-xs font-bold uppercase tracking-wider text-gray-900 mb-3.5 border-b border-gray-200/80 pb-2">
              {config.colorsTitle || "SHOP BY COLOR"}
            </h4>
            <ul className="space-y-2">
              {colors.map((item: any, idx: number) => (
                <li key={idx}>
                  <Link
                    href={item.handle?.startsWith("/") ? item.handle : `/collections/${item.handle}`}
                    onClick={closeFn}
                    className="flex items-center gap-3 group/item hover:opacity-90 transition-opacity"
                  >
                    <div className="relative w-8 h-10 rounded-md overflow-hidden bg-gray-200 flex-shrink-0 border border-gray-200">
                      <Image src={item.img} alt={item.label} fill unoptimized className="object-cover object-top group-hover/item:scale-110 transition-transform duration-300" />
                    </div>
                    <span className="text-xs font-bold text-gray-800 tracking-wide uppercase group-hover/item:text-[#9E3E28] transition-colors">
                      {item.label}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          </div>

          {/* Col 4: PROMO FEATURED BANNERS */}
          <div className="col-span-3 flex flex-col gap-3">
            <Link
              href={config.promoTopLink || "/collections"}
              onClick={closeFn}
              className="relative w-full h-[95px] rounded-2xl overflow-hidden bg-[#D8C7B0] p-1.5 flex items-center justify-between group shadow-sm hover:shadow-md transition-shadow"
            >
              <div className="relative w-full h-full rounded-xl overflow-hidden">
                <Image
                  src={config.promoTopImage || "/images/client-2.jpg"}
                  alt="Collections banner"
                  fill
                  unoptimized
                  className="object-cover object-center group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-black/15 group-hover:bg-black/5 transition-colors" />
              </div>
            </Link>

            <Link
              href={config.promoBottomLink || "/collections/sale"}
              onClick={closeFn}
              className="group flex flex-col items-center cursor-pointer"
            >
              <div className="relative w-full aspect-[4/5] rounded-3xl overflow-hidden bg-[#C58C80] border border-[#B3786B] shadow-md group-hover:shadow-xl transition-all duration-300">
                <Image
                  src={config.promoBottomImage || "/images/client-5.jpg"}
                  alt="Explore Collections"
                  fill
                  unoptimized
                  className="object-cover object-top group-hover:scale-108 transition-transform duration-700"
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black/50 via-transparent to-transparent opacity-40 group-hover:opacity-20 transition-opacity" />
              </div>
              <span className="font-sans font-bold text-xs sm:text-sm text-gray-900 tracking-tight mt-2 text-center group-hover:text-[#9E3E28] transition-colors">
                {config.promoBottomText || "Explore Collections - 45% OFF"}
              </span>
            </Link>
          </div>

        </div>
      </div>
    );
  };

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

  if (isLoginPage || isAdminPage || isCheckoutPage) {
    return null;
  }

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchValue.trim()) {
      router.push(`/search?q=${encodeURIComponent(searchValue.trim())}`);
      setSearchValue("");
    }
  };

  return (
    <header className="bg-[#EBE2CD] w-full">
      {/* Main Header Row */}
      <div className="bg-[#FFFDF9] flex items-center justify-between gap-4 px-2 py-2 sm:px-4 md:px-6">
        {/* Left: Social Icons */}
        <div className="flex flex-1 items-center max-md:hidden gap-2">
          {footerSettings?.facebookUrl && (
            <a href={footerSettings.facebookUrl} target="_blank" rel="noopener noreferrer" className="bg-[#1877F2] text-white rounded-full hover:opacity-85 hover:scale-105 transition-all flex items-center justify-center h-8 w-8 shadow-sm" aria-label="Facebook">
              <svg fill="currentColor" viewBox="0 0 24 24" className="w-4.5 h-4.5"><path d="M9 8h-3v4h3v12h5v-12h3.642l.358-4h-4v-1.667c0-.955.192-1.333 1.115-1.333h2.885v-5h-3.808c-3.596 0-5.192 1.583-5.192 4.615v3.385z"/></svg>
            </a>
          )}
          {footerSettings?.instagramUrl && (
            <a href={footerSettings.instagramUrl} target="_blank" rel="noopener noreferrer" className="bg-gradient-to-tr from-[#FD1D1D] via-[#E1306C] to-[#833AB4] text-white rounded-full hover:opacity-85 hover:scale-105 transition-all flex items-center justify-center h-8 w-8 shadow-sm" aria-label="Instagram">
              <svg fill="currentColor" viewBox="0 0 24 24" className="w-4.5 h-4.5"><path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zM12 0C8.741 0 8.333.014 7.053.072 2.695.272.273 2.69.073 7.052.014 8.333 0 8.741 0 12c0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98C8.333 23.986 8.741 24 12 24c3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98C15.668.014 15.259 0 12 0zm0 5.838a6.162 6.162 0 100 12.324 6.162 6.162 0 000-12.324zM12 16a4 4 0 110-8 4 4 0 010 8zm6.406-11.845a1.44 1.44 0 100 2.881 1.44 1.44 0 000-2.881z"/></svg>
            </a>
          )}
          {footerSettings?.youtubeUrl && (
            <a href={footerSettings.youtubeUrl} target="_blank" rel="noopener noreferrer" className="bg-[#FF0000] text-white rounded-full hover:opacity-85 hover:scale-105 transition-all flex items-center justify-center h-8 w-8 shadow-sm" aria-label="YouTube">
              <svg fill="currentColor" viewBox="0 0 24 24" className="w-4.5 h-4.5"><path d="M21.582 6.186a2.668 2.668 0 00-1.88-1.884C18.044 3.864 12 3.864 12 3.864s-6.044 0-7.702.438a2.668 2.668 0 00-1.88 1.884C1.98 7.848 1.98 12 1.98 12s0 4.152.438 5.814a2.668 2.668 0 001.88 1.884c1.658.438 7.702.438 7.702.438s6.044 0 7.702-.438a2.668 2.668 0 001.88-1.884c.438-1.662.438-5.814.438-5.814s0-4.152-.438-5.814zM9.982 15.46V8.54l6.026 3.46-6.026 3.46z"/></svg>
            </a>
          )}
          {cleanEmail && (
            <a href={`mailto:${cleanEmail}`} className="bg-[#FFB900] text-white rounded-full hover:opacity-85 hover:scale-105 transition-all flex items-center justify-center h-8 w-8 shadow-sm" aria-label="Email">
              <Mail className="w-4 h-4" />
            </a>
          )}
        </div>

        {/* Center: Logo */}
        <div className="flex items-center">
          <Link href="/" className="bg-transparent rounded block w-[64px] h-[64px] overflow-hidden flex items-center justify-center relative">
            <Image
              alt="Logo"
              fill
              className="object-contain p-1"
              src={settings?.logoUrl || "/images/logo.png"}
              priority
            />
          </Link>
        </div>

        {/* Right: Actions */}
        <div className="flex flex-1 items-center justify-end gap-2">
          {/* Search - Desktop */}
          <div className="relative max-sm:hidden">
            <form onSubmit={handleSearch}>
              <div className={`border-gray-200 bg-white focus-within:border-maroonClr flex h-[34px] items-center rounded-full px-3 transition-all duration-200 gap-2 border text-gray-500 shadow-sm`}>
                <Search className="h-4 w-4 text-maroonClr" aria-hidden="true" />
                <input
                  type="search"
                  placeholder="Search for products..."
                  className="w-0 flex-grow text-xs sm:text-sm transition-all duration-200 outline-none sm:w-[150px] focus:sm:w-[220px] bg-transparent"
                  value={searchValue}
                  onChange={(e) => setSearchValue(e.target.value)}
                  onFocus={() => setSearchFocused(true)}
                  onBlur={() => setTimeout(() => setSearchFocused(false), 250)}
                />
              </div>
            </form>

            {/* Suggestions Dropdown */}
            {searchFocused && (suggestions.products.length > 0 || suggestions.categories.length > 0) && (
              <div className="absolute right-0 mt-2 w-80 bg-white border border-gray-150 rounded-xl shadow-xl z-[9999] overflow-hidden animate-scaleUp">
                {suggestions.categories.length > 0 && (
                  <div className="p-3 border-b border-gray-100">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Categories</p>
                    <div className="space-y-1">
                      {suggestions.categories.map((c: any) => (
                        <Link
                          key={c.id}
                          href={`/collections/${c.handle}`}
                          onClick={() => {
                            setSearchValue("");
                            setSearchFocused(false);
                          }}
                          className="block text-xs font-semibold text-gray-750 hover:text-maroonClr hover:bg-gray-50 p-1.5 rounded transition-colors"
                        >
                          {c.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {suggestions.products.length > 0 && (
                  <div className="p-3">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-1.5">Products</p>
                    <div className="space-y-2">
                      {suggestions.products.map((p: any) => (
                        <Link
                          key={p.id}
                          href={`/products/${p.handle}`}
                          onClick={() => {
                            setSearchValue("");
                            setSearchFocused(false);
                          }}
                          className="flex items-center gap-3 p-1.5 rounded hover:bg-gray-50 transition-colors group"
                        >
                          {p.image && (
                            <div className="relative w-8 h-10 bg-gray-50 rounded overflow-hidden flex-shrink-0">
                              <img src={p.image} alt="" className="object-cover w-full h-full" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0 text-left">
                            <p className="text-xs font-bold text-gray-800 truncate group-hover:text-maroonClr transition-colors">{p.title}</p>
                            <p className="text-[10px] text-gray-500 font-semibold mt-0.5">₹{parseFloat(p.price).toFixed(2)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}
          </div>
          {/* Search - Mobile overlay trigger */}
          <div className="sm:hidden">
            <SearchBar />
          </div>

          {/* WhatsApp */}
          <a
            className="items-center justify-center hidden h-8 w-8 rounded-full bg-[#25D366] hover:opacity-80 text-white sm:inline-flex transition-all shadow-sm"
            href={`https://wa.me/${cleanWhatsappNumber}`}
            target="_blank"
            rel="noopener noreferrer"
            aria-label="WhatsApp"
          >
            <svg fill="white" width="16" height="16" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347z" />
              <path d="M12.05 2C6.532 2 2.05 6.485 2.05 12.003c0 1.762.46 3.43 1.339 4.925L2 22l5.233-1.37A9.957 9.957 0 0012.05 22c5.517 0 9.999-4.485 9.999-10.003C22.049 6.485 17.567 2 12.05 2zm0 18.15a8.14 8.14 0 01-4.153-1.137l-.298-.177-3.087.81.823-3.008-.195-.31A8.12 8.12 0 013.9 12.003c0-4.498 3.66-8.153 8.15-8.153s8.15 3.655 8.15 8.153c0 4.498-3.66 8.147-8.15 8.147z" />
            </svg>
          </a>

          {/* Track Order */}
          <Link
            href="/track-order"
            className="items-center justify-center bg-[#d4af37] hover:bg-goldClr hover:text-white hidden h-8 w-8 rounded-full sm:inline-flex transition-all shadow-sm"
            aria-label="Track Order"
          >
            <Route className="inline-block h-4 w-4 text-white" aria-hidden="true" />
          </Link>

          {/* Cart */}
          <button
            onClick={openCart}
            className="inline-flex items-center justify-center bg-[#d4af37] hover:opacity-80 hover:text-white relative h-8 w-8 cursor-pointer rounded-full transition-all shadow-sm"
            aria-label="Cart"
          >
            <ShoppingCart className="h-4 w-4 text-white duration-200" aria-hidden="true" />
            <span className="bg-maroonClr absolute -top-1 -right-1 flex h-4 w-4 items-center justify-center rounded-full text-[10px] text-white">
              {cartCount}
            </span>
          </button>

          {/* Login / Account */}
          <Link
            href={isLoggedIn ? "/account" : "/account/login"}
            className="items-center justify-center gap-1.5 whitespace-nowrap rounded-md text-sm font-medium bg-[#8f193c] hover:bg-[#8f193c]/90 text-white h-[34px] px-3.5 sm:inline-flex hidden transition-all shadow-sm"
          >
            {isLoggedIn ? (
              <User className="inline-block h-4 w-4" aria-hidden="true" />
            ) : (
              <LogIn className="inline-block h-4 w-4" aria-hidden="true" />
            )}
            {isLoggedIn ? "Account" : "Login"}
          </Link>

          {/* Mobile Hamburger */}
          <button
            onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
            className="inline-flex items-center justify-center bg-goldClr hover:bg-maroonClr hover:text-white size-8 md:hidden transition-all rounded-md"
            aria-expanded={mobileMenuOpen}
            aria-label="Toggle menu"
          >
            <svg className="pointer-events-none text-white" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" xmlns="http://www.w3.org/2000/svg">
              <path d="M4 12L20 12" className={`origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] ${mobileMenuOpen ? 'translate-y-0 rotate-[315deg]' : '-translate-y-[7px]'}`} />
              <path d="M4 12H20" className={`origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.8)] ${mobileMenuOpen ? 'rotate-45' : ''}`} />
              <path d="M4 12H20" className={`origin-center transition-all duration-300 ease-[cubic-bezier(.5,.85,.25,1.1)] ${mobileMenuOpen ? 'translate-y-0 rotate-[135deg]' : 'translate-y-[7px]'}`} />
            </svg>
          </button>
        </div>
      </div>

      {/* Desktop Navigation Bar */}
      <div 
        className="bg-[#EBE2CD] md:flex hidden justify-center py-0.5 relative"
        onMouseLeave={() => { setCollectionsOpen(false); setSareeOpen(false); }}
      >
        <nav aria-label="Main" className="relative flex max-w-7xl mx-auto flex-1 items-center justify-center">
          <ul className="flex flex-1 list-none items-center justify-center gap-6 flex-wrap">

            {/* 1. COLLECTIONS MEGA-MENU */}
            <li 
              onMouseEnter={() => { setCollectionsOpen(true); setSareeOpen(false); }}
            >
              <button className="group inline-flex w-max items-center justify-center px-2 py-1 text-[15px] font-medium hover:text-maroonClr transition-all text-gray-800">
                Collections
                <ChevronDown className={`relative top-[1px] ml-1 size-3 transition duration-300 ${collectionsOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
            </li>

            {/* 2. PRODUCTS DROPDOWN */}
            <li className="relative"
              onMouseEnter={() => { setProductsOpen(true); setCollectionsOpen(false); setSareeOpen(false); }}
              onMouseLeave={() => setProductsOpen(false)}
            >
              <button className="group inline-flex w-max items-center justify-center px-2 py-1 text-[15px] font-medium hover:text-maroonClr transition-all text-gray-800">
                Products
                <ChevronDown className={`relative top-[1px] ml-1 size-3 transition duration-300 ${productsOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
              {productsOpen && (
                <div className="absolute left-0 top-full z-50 w-52 bg-white border border-gray-100 rounded-xl shadow-xl overflow-hidden">
                  <div className="p-1.5">
                    <Link href="/products" onClick={() => setProductsOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-creamClr hover:text-maroonClr rounded-lg transition-all">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-goldClr flex-shrink-0"><rect x="1" y="1" width="6" height="6" rx="1" /><rect x="9" y="1" width="6" height="6" rx="1" /><rect x="1" y="9" width="6" height="6" rx="1" /><rect x="9" y="9" width="6" height="6" rx="1" /></svg>
                      All Products
                    </Link>
                    <Link href="/products?sort=best-selling" onClick={() => setProductsOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-creamClr hover:text-maroonClr rounded-lg transition-all">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-goldClr flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M8 2l1.5 4.5H15l-4 3 1.5 4.5L8 11l-4.5 3L5 9.5 1 6.5h5.5L8 2z" /></svg>
                      Best Sellers
                    </Link>
                    <Link href="/products?sort=created-descending" onClick={() => setProductsOpen(false)} className="flex items-center gap-2.5 px-3 py-2.5 text-sm text-gray-700 hover:bg-creamClr hover:text-maroonClr rounded-lg transition-all">
                      <svg viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" className="w-4 h-4 text-goldClr flex-shrink-0"><path strokeLinecap="round" strokeLinejoin="round" d="M8 2v12M2 8l6-6 6 6" /></svg>
                      New Arrivals
                    </Link>
                  </div>
                  <div className="border-t border-gray-100 p-1.5">
                    <Link href="/products?sort=price-ascending" onClick={() => setProductsOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-500 hover:bg-creamClr hover:text-maroonClr rounded-lg transition-all">Price: Low to High</Link>
                    <Link href="/products?sort=price-descending" onClick={() => setProductsOpen(false)} className="flex items-center gap-2.5 px-3 py-2 text-xs text-gray-500 hover:bg-creamClr hover:text-maroonClr rounded-lg transition-all">Price: High to Low</Link>
                  </div>
                </div>
              )}
            </li>

            {/* 3. SAREES MEGA-MENU */}
            <li 
              onMouseEnter={() => { setSareeOpen(true); setCollectionsOpen(false); }}
            >
              <button className="group inline-flex w-max items-center justify-center px-2 py-1 text-[15px] font-medium hover:text-maroonClr transition-all text-gray-800">
                Sarees
                <ChevronDown className={`relative top-[1px] ml-1 size-3 transition duration-300 ${sareeOpen ? 'rotate-180' : ''}`} aria-hidden="true" />
              </button>
            </li>

            {/* 4. LEHENGA */}
            <li>
              <Link href="/collections/lehenga" className="group inline-flex w-max items-center justify-center px-2 py-1 text-[15px] font-medium hover:text-maroonClr transition-all text-gray-800">
                Lehenga
              </Link>
            </li>

            {/* 5. KURTIS */}
            <li>
              <Link href="/collections/kurti" className="group inline-flex w-max items-center justify-center px-2 py-1 text-[15px] font-medium hover:text-maroonClr transition-all text-gray-800">
                Kurtis
              </Link>
            </li>

            {/* 6. JEWELLERY */}
            <li>
              <Link href="/collections/jewellery" className="group inline-flex w-max items-center justify-center px-2 py-1 text-[15px] font-medium hover:text-maroonClr transition-all text-gray-800">
                Jewellery
              </Link>
            </li>

            {/* Additional dynamic menu links from settings (filtered to prevent duplicates) */}
            {settings?.menuLinks && settings.menuLinks
              .filter((link: any) => {
                const l = (link.label || "").toLowerCase();
                return !["collections", "products", "saree", "sarees", "lehenga", "kurtis", "kurti", "jewellery"].includes(l);
              })
              .map((link: any, idx: number) => {
                const hasSubs = link.subLinks && link.subLinks.length > 0;
                return (
                  <li key={idx} className="relative group/menu">
                    {hasSubs ? (
                      <>
                        <button className="group inline-flex w-max items-center justify-center px-2 py-1 text-[15px] font-medium hover:text-maroonClr transition-all text-gray-800">
                          {link.label}
                          <ChevronDown className="relative top-[1px] ml-1 size-3 transition duration-300 group-hover/menu:rotate-180" aria-hidden="true" />
                        </button>
                        <div className="absolute left-0 top-full z-50 min-w-[200px] bg-white border border-gray-100 rounded-xl shadow-xl p-1.5 hidden group-hover/menu:block">
                          {link.url && (
                            <Link href={link.url} className="block px-4 py-2 text-sm hover:bg-creamClr rounded-lg font-medium text-maroonClr">
                              All {link.label}
                            </Link>
                          )}
                          {link.subLinks.map((sub: any, sIdx: number) => (
                            <Link key={sIdx} href={sub.url} className="block px-4 py-2 text-sm hover:bg-creamClr rounded-lg text-gray-700">
                              {sub.label}
                            </Link>
                          ))}
                        </div>
                      </>
                    ) : (
                      <Link href={link.url} className="group inline-flex w-max items-center justify-center px-2 py-1 text-[15px] font-medium hover:text-maroonClr transition-all text-gray-800">
                        {link.label}
                      </Link>
                    )}
                  </li>
                );
              })}
          </ul>
        </nav>

        {/* Mega Menu Panels Centered relative to Navbar Container */}
        {collectionsOpen && renderCollectionsMegaMenu(() => setCollectionsOpen(false))}
        {sareeOpen && renderSareesMegaMenu(() => setSareeOpen(false))}
      </div>

      {/* Marquee Banner */}
      <MarqueeBanner settings={settings} />

      {/* Mobile Menu Drawer */}
      {mobileMenuOpen && (
        <div className="md:hidden bg-white border-t border-gray-100 px-4 py-4 space-y-2">
          <Link href="/collections" className="block px-3 py-2 text-sm font-medium hover:bg-creamClr rounded" onClick={() => setMobileMenuOpen(false)}>
            Collections
          </Link>
          <Link href="/products" className="block px-3 py-2 text-sm font-medium hover:bg-creamClr rounded" onClick={() => setMobileMenuOpen(false)}>
            Products
          </Link>
          <Link href="/collections/saree" className="block px-3 py-2 text-sm font-medium hover:bg-creamClr rounded" onClick={() => setMobileMenuOpen(false)}>
            Sarees
          </Link>
          <Link href="/collections/lehenga" className="block px-3 py-2 text-sm font-medium hover:bg-creamClr rounded" onClick={() => setMobileMenuOpen(false)}>
            Lehenga
          </Link>
          <Link href="/collections/kurti" className="block px-3 py-2 text-sm font-medium hover:bg-creamClr rounded" onClick={() => setMobileMenuOpen(false)}>
            Kurtis
          </Link>
          <Link href="/collections/jewellery" className="block px-3 py-2 text-sm font-medium hover:bg-creamClr rounded" onClick={() => setMobileMenuOpen(false)}>
            Jewellery
          </Link>
          {settings?.menuLinks && settings.menuLinks
            .filter((link: any) => {
              const l = (link.label || "").toLowerCase();
              return !["collections", "products", "saree", "sarees", "lehenga", "kurtis", "kurti", "jewellery"].includes(l);
            })
            .map((link: any, idx: number) => {
              const hasSubs = link.subLinks && link.subLinks.length > 0;
              return (
                <div key={idx} className="space-y-1">
                  {hasSubs ? (
                    <>
                      <div className="flex items-center justify-between px-3 py-2 text-sm font-semibold text-gray-800">
                        <span>{link.label}</span>
                      </div>
                      <div className="pl-6 space-y-1">
                        {link.url && (
                          <Link href={link.url} className="block px-3 py-1.5 text-xs font-medium text-maroonClr hover:bg-creamClr rounded" onClick={() => setMobileMenuOpen(false)}>
                            All {link.label}
                          </Link>
                        )}
                        {link.subLinks.map((sub: any, sIdx: number) => (
                          <Link key={sIdx} href={sub.url} className="block px-3 py-1.5 text-xs font-medium text-gray-600 hover:bg-creamClr rounded" onClick={() => setMobileMenuOpen(false)}>
                            {sub.label}
                          </Link>
                        ))}
                      </div>
                    </>
                  ) : (
                    <Link href={link.url} className="block px-3 py-2 text-sm font-medium hover:bg-creamClr rounded" onClick={() => setMobileMenuOpen(false)}>
                      {link.label}
                    </Link>
                  )}
                </div>
              );
            })}
          <Link href="/track-order" className="block px-3 py-2 text-sm font-medium hover:bg-creamClr rounded" onClick={() => setMobileMenuOpen(false)}>
            Track Order
          </Link>
          <Link
            href={isLoggedIn ? "/account" : "/account/login"}
            className="block px-3 py-2 text-sm font-medium bg-maroonClr text-white rounded text-center"
            onClick={() => setMobileMenuOpen(false)}
          >
            {isLoggedIn ? "My Account" : "Login"}
          </Link>
        </div>
      )}
    </header>
  );
}

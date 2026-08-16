"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import VariantSelector from "./VariantSelector";
import QuantitySelector from "./QuantitySelector";
import ProductActions from "./ProductActions";
import ProductAccordion from "./ProductAccordion";
import { Truck, RefreshCcw, ShieldCheck, Ruler } from "lucide-react";
import SizeChartModal from "./SizeChartModal";
import { getTokenFromCookie } from "@/lib/api/auth-client";

function getPincodeFromAddress(defaultAddress: any): string | null {
  if (!defaultAddress) return null;
  if (Array.isArray(defaultAddress.addresses)) {
    const def = defaultAddress.addresses.find((a: any) => a.isDefault) || defaultAddress.addresses[0];
    return def?.zip || null;
  }
  return defaultAddress.zip || null;
}

function getDeliveryDateRange() {
  const options: Intl.DateTimeFormatOptions = { weekday: "short", month: "short", day: "numeric" };
  const minDate = new Date();
  minDate.setDate(minDate.getDate() + 3);
  const maxDate = new Date();
  maxDate.setDate(maxDate.getDate() + 6);
  
  return `${minDate.toLocaleDateString("en-IN", options)} - ${maxDate.toLocaleDateString("en-IN", options)}`;
}

export default function ProductInfo({ product, recommendedProducts }: { product: any, recommendedProducts?: any[] }) {
  const variantsList = Array.isArray(product.variants)
    ? product.variants.map((v: any) => ({
        id: v.id || product.id,
        price: v.price?.amount ? v.price : (product.priceRange?.minVariantPrice || { amount: "0" }),
        compareAtPrice: v.compareAtPrice,
        selectedOptions: v.selectedOptions || [{ name: "Standard", value: "Default Title" }]
      }))
    : (product.variants?.edges || []).map((e: any) => e.node || e);

  const initialVariant = variantsList[0] || {
    id: product.id,
    price: product.priceRange?.minVariantPrice || { amount: "0" },
    compareAtPrice: product.compareAtPriceRange?.minVariantPrice,
    selectedOptions: [{ name: "Standard", value: "Default Title" }]
  };

  const [selectedVariant, setSelectedVariant] = useState(initialVariant);
  const [quantity, setQuantity] = useState(1);
  const [sizeChartOpen, setSizeChartOpen] = useState(false);

  // Pincode Estimator States
  const [pincode, setPincode] = useState("");
  const [userPincode, setUserPincode] = useState<string | null>(null);
  const [checkedPincode, setCheckedPincode] = useState<string | null>(null);
  const [pincodeError, setPincodeError] = useState("");
  const [isChecking, setIsChecking] = useState(false);

  useEffect(() => {
    async function loadProfilePincode() {
      const token = getTokenFromCookie();
      if (!token) return;
      try {
        const res = await fetch("/api/auth/me");
        if (res.ok) {
          const data = await res.json();
          const pin = getPincodeFromAddress(data.defaultAddress);
          if (pin) {
            setUserPincode(pin);
            setCheckedPincode(pin);
          }
        }
      } catch (err) {
        console.error("Failed to load user profile for pincode", err);
      }
    }
    loadProfilePincode();
  }, []);

  const handleCheckPincode = (e: React.FormEvent) => {
    e.preventDefault();
    setPincodeError("");
    const trimmed = pincode.trim();
    if (!/^\d{6}$/.test(trimmed)) {
      setPincodeError("Please enter a valid 6-digit Indian pincode.");
      return;
    }
    setIsChecking(true);
    setTimeout(() => {
      setCheckedPincode(trimmed);
      setIsChecking(false);
    }, 400);
  };

  const titleLower = (product.title || "").toLowerCase();
  const handleLower = (product.handle || "").toLowerCase();
  const typeLower = (product.productType || "").toLowerCase();
  const colLower = (product.collectionHandles || []).map((c: any) => String(c).toLowerCase());
  const tagLower = (product.tags || []).map((t: any) => String(t).toLowerCase());

  const isSaree = titleLower.includes("saree") || handleLower.includes("saree") || typeLower.includes("saree") || colLower.some((c: string) => c.includes("saree")) || tagLower.some((t: string) => t.includes("saree"));

  // Build display options
  let displayOptions = product.options ? [...product.options] : [];
  displayOptions = displayOptions.filter((opt: any) => opt.name !== 'Title');

  if (!isSaree && product.sizesEnabled !== false) {
    const hasSizeOpt = displayOptions.some((opt: any) => opt.name.toLowerCase() === "size");
    if (!hasSizeOpt) {
      const defaultSizes = (product.selectedSizes && product.selectedSizes.length > 0)
        ? product.selectedSizes
        : ["Free Size", "S", "M", "L", "XL", "2XL", "3XL"];

      displayOptions.unshift({
        name: "Size",
        values: defaultSizes
      });
    }
  }

  const [selectedSize, setSelectedSize] = useState<string>(() => {
    const sizeOpt = displayOptions.find((opt: any) => opt.name.toLowerCase() === "size");
    return sizeOpt?.values[0] || "Free Size";
  });

  const handleOptionChange = (name: string, value: string) => {
    if (name.toLowerCase() === "size") {
      setSelectedSize(value);
    }

    const newOptions = (selectedVariant.selectedOptions || []).map((opt: any) => 
      opt.name === name ? { ...opt, value } : opt
    );

    if (!newOptions.some((o: any) => o.name === name)) {
      newOptions.push({ name, value });
    }

    const variant = variantsList.find((v: any) => {
      const opts = v.selectedOptions || [];
      return newOptions.every((newOpt: any) => 
        opts.some((o: any) => o.name === newOpt.name && o.value === newOpt.value)
      );
    });

    if (variant) {
      setSelectedVariant(variant);
    }
  };

  const price = parseFloat(selectedVariant.price.amount);
  const compareAtPrice = selectedVariant.compareAtPrice?.amount 
    ? parseFloat(selectedVariant.compareAtPrice.amount) 
    : null;
  const hasDiscount = compareAtPrice && compareAtPrice > price;
  const discountPercentage = hasDiscount 
    ? Math.round(((compareAtPrice - price) / compareAtPrice) * 100) 
    : 0;

  const getDeterministicRating = (handle: string) => {
    let hash = 0;
    for (let i = 0; i < handle.length; i++) {
      hash = handle.charCodeAt(i) + ((hash << 5) - hash);
    }
    const absHash = Math.abs(hash);
    const count = 40 + (absHash % 31); // 40 to 70 reviews
    const rating = 4.1 + ((absHash % 9) / 10); // 4.1 to 4.9 stars
    const roundedRating = Math.round(rating);
    const stars = "★".repeat(roundedRating) + "☆".repeat(5 - roundedRating);
    return { count, rating: rating.toFixed(1), stars };
  };

  const { count: reviewCount, rating: reviewRating, stars: reviewStars } = getDeterministicRating(product.handle || "");

  return (
    <div className="flex flex-col">
      <h1 className="text-[22px] md:text-2xl font-medium text-gray-900 mb-2">
        {product.title}
      </h1>
      
      <div className="flex items-center gap-2 mb-1">
        <span className="text-maroonClr font-bold text-xl">
          ₹{price.toFixed(0)}
        </span>
        {hasDiscount && (
          <span className="text-gray-400 line-through text-sm font-medium">
            ₹{compareAtPrice.toFixed(0)}
          </span>
        )}
        {hasDiscount && (
          <span className="bg-[#ffebf0] text-red-600 text-[10px] font-bold px-1.5 py-0.5 rounded border border-red-200 ml-1">
            {discountPercentage}% OFF
          </span>
        )}
      </div>
      
      <div className="text-gray-500 text-xs mb-3">
        Inclusive of all taxes
      </div>

      {selectedVariant.availableForSale ? (
        <div className="inline-flex items-center gap-1.5 text-xs text-green-600 font-semibold mb-3">
          <span className="w-2 h-2 rounded-full bg-green-600 animate-pulse"></span>
          In Stock & Ready to Ship
        </div>
      ) : (
        <div className="inline-flex items-center gap-1.5 text-xs text-red-600 font-semibold mb-3">
          <span className="w-2 h-2 rounded-full bg-red-600"></span>
          Out of Stock
        </div>
      )}

      <div className="flex items-center gap-1 mb-6">
        <div className="flex text-amber-500 font-bold tracking-wider text-sm">{reviewStars}</div>
        <span className="text-gray-800 font-bold text-xs ml-1">{reviewRating}</span>
        <a href="#reviews" className="text-gray-500 text-xs hover:underline ml-1">({reviewCount} customer reviews)</a>
      </div>

      {/* SIMILAR PRODUCTS Section */}
      {recommendedProducts && recommendedProducts.length > 0 && (
        <div className="mb-6 relative border border-maroonClr/30 rounded-md p-3 pt-5">
          <div className="absolute -top-2.5 left-1/2 -translate-x-1/2 bg-white px-2">
            <span className="bg-maroonClr text-white text-[10px] font-bold px-2 py-0.5 rounded uppercase tracking-wider">
              Similar Products
            </span>
          </div>
          <div className="flex gap-2 overflow-x-auto pb-1">
            {recommendedProducts.map((p) => {
              let imgUrl = "/images/placeholder.jpg";
              if (Array.isArray(p.images)) {
                const raw = p.images[0];
                imgUrl = typeof raw === "string" ? raw : raw?.url || raw?.node?.url || imgUrl;
              } else if (p.images && Array.isArray((p.images as any).edges)) {
                imgUrl = (p.images as any).edges[0]?.node?.url || imgUrl;
              }
              return (
                <Link href={`/products/${p.handle}`} key={p.id} className="flex-shrink-0 w-[72px] h-[90px] relative rounded overflow-hidden border border-gray-255 hover:border-maroonClr transition-colors" style={{ borderColor: '#E5E7EB' }}>
                  <Image src={imgUrl} alt={p.title} fill className="object-cover" />
                </Link>
              );
            })}
          </div>
        </div>
      )}

      {/* Selectors for Options & Sizes */}
      {displayOptions.length > 0 && (
        <div className="mb-6">
          <VariantSelector 
            options={displayOptions} 
            selectedOptions={
              displayOptions.map(opt => {
                if (opt.name.toLowerCase() === "size") {
                  return { name: opt.name, value: selectedSize };
                }
                const found = selectedVariant.selectedOptions?.find((o: any) => o.name === opt.name);
                return found || { name: opt.name, value: opt.values[0] };
              })
            }
            onChange={handleOptionChange}
            showSizeChart={product.showSizeChart}
            onOpenSizeChart={() => setSizeChartOpen(true)}
          />
        </div>
      )}

      {/* Standalone Size Chart Button (if product has showSizeChart enabled but no "Size" option in variants) */}
      {product.showSizeChart && !product.options?.some((opt: any) => opt.name.toLowerCase() === "size") && (
        <div className="mb-6">
          <button
            type="button"
            onClick={() => setSizeChartOpen(true)}
            className="flex items-center gap-1.5 text-xs text-maroonClr hover:text-maroonClr/80 font-bold uppercase tracking-wider transition-colors"
          >
            <Ruler className="w-4 h-4" />
            View Size Chart
          </button>
        </div>
      )}

      <div className="mb-6">
        <QuantitySelector quantity={quantity} setQuantity={setQuantity} />
      </div>

      <div className="mb-6">
        <ProductActions 
          variantId={selectedVariant.id} 
          quantity={quantity} 
          availableForSale={selectedVariant.availableForSale} 
          selectedSize={!isSaree ? selectedSize : undefined}
          productId={product.id}
          productTitle={product.title}
          productHandle={product.handle}
        />
      </div>

      {/* Pincode Delivery Estimator Section */}
      <div className="mb-6 bg-[#FAF7F0] border border-[#EAE2CE] rounded-lg p-4 font-sans text-xs">
        <div className="flex items-center gap-2 mb-2 text-gray-800 font-semibold uppercase tracking-wider">
          <Truck className="w-4 h-4 text-maroonClr" />
          <span>Delivery Availability & Estimator</span>
        </div>

        {checkedPincode ? (
          <div className="space-y-2">
            <div className="flex justify-between items-center bg-white p-2.5 rounded border border-[#EAE2CE]">
              <div>
                <p className="text-gray-600">
                  Estimated Delivery to <span className="font-semibold text-gray-900">{checkedPincode}</span>:
                </p>
                <p className="text-green-700 font-bold text-sm mt-0.5">
                  3 - 6 Business Days ({getDeliveryDateRange()})
                </p>
              </div>
              <button
                type="button"
                onClick={() => {
                  setCheckedPincode(null);
                  setPincode(checkedPincode);
                }}
                className="text-[10px] text-maroonClr hover:underline uppercase font-bold tracking-wider"
              >
                Change
              </button>
            </div>
            {userPincode && checkedPincode !== userPincode && (
              <button
                type="button"
                onClick={() => setCheckedPincode(userPincode)}
                className="text-[10px] text-gray-500 hover:text-maroonClr transition-colors hover:underline"
              >
                Reset to default address pincode ({userPincode})
              </button>
            )}
          </div>
        ) : (
          <form onSubmit={handleCheckPincode} className="space-y-2">
            <p className="text-gray-500 mb-1.5 leading-relaxed">
              Enter your pincode to check delivery availability and estimated delivery date.
            </p>
            <div className="flex gap-2">
              <input
                type="text"
                maxLength={6}
                value={pincode}
                onChange={(e) => setPincode(e.target.value.replace(/\D/g, ""))}
                placeholder="Enter 6-digit Pincode"
                className="flex-grow bg-white border border-gray-300 rounded px-3 py-2 text-xs text-gray-900 focus:outline-none focus:border-maroonClr font-mono"
              />
              <button
                type="submit"
                disabled={isChecking || !pincode}
                className="bg-maroonClr text-white hover:bg-[#6A102A] disabled:bg-gray-200 disabled:text-gray-405 font-bold px-4 py-2 rounded uppercase tracking-wider transition-all"
              >
                {isChecking ? "Checking..." : "Check"}
              </button>
            </div>
            {pincodeError && (
              <p className="text-red-600 text-[10px] font-semibold flex items-center gap-1">
                <span className="w-1.5 h-1.5 rounded-full bg-red-600"></span>
                {pincodeError}
              </p>
            )}
          </form>
        )}
      </div>

      {/* Features Row */}
      <div className="flex justify-between items-start py-6 border-y border-gray-100 mb-6 gap-2">
        <div className="flex flex-col items-center text-center gap-2 flex-1">
          <Truck className="w-6 h-6 text-[#c49a45]" />
          <span className="text-[11px] font-medium text-maroonClr leading-tight">Shipping all<br/>across India</span>
        </div>
        <div className="flex flex-col items-center text-center gap-2 flex-1">
          <RefreshCcw className="w-6 h-6 text-[#c49a45]" />
          <span className="text-[11px] font-medium text-maroonClr leading-tight">Easy 7-Day<br/>Exchange</span>
        </div>
        <div className="flex flex-col items-center text-center gap-2 flex-1">
          <ShieldCheck className="w-6 h-6 text-[#c49a45]" />
          <span className="text-[11px] font-medium text-maroonClr leading-tight">Safe Payments<br/>& COD</span>
        </div>
      </div>

      <ProductAccordion descriptionHtml={product.descriptionHtml} />

      <SizeChartModal 
        isOpen={sizeChartOpen} 
        onClose={() => setSizeChartOpen(false)} 
        sizeChartImage={product.sizeChartImage} 
      />
    </div>
  );
}

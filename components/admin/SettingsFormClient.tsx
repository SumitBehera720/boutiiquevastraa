"use client";

import { useState } from "react";
import { saveSeoSettingsAction, saveBannersSettingsAction, saveHomepageSettingsAction, saveFooterSettingsAction, saveHeaderSettingsAction, saveCollectionBannersAction, uploadFileAction } from "@/app/actions/adminSettings";
import { Sparkles, Save, Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, Globe, AlertCircle, CheckCircle2, Home, HelpCircle, Gift, Info, Star, PlusCircle, Link2, Mail, Phone, Heart, Grid, Video, Play, List, Compass, MessageSquare, Menu, Smile, Laptop, Smartphone, BookOpen, Feather, Award } from "lucide-react";

interface SettingsFormClientProps {
  initialSettings: any;
  products?: any[];
  collections?: any[];
}

// ----------------------------------------------------
// Reusable local device file uploader widget
// ----------------------------------------------------
function ImageOrVideoUploader({ 
  label, 
  value, 
  onChange, 
  accept = "image/*,video/*" 
}: { 
  label: string; 
  value: string; 
  onChange: (val: string) => void;
  accept?: string;
}) {
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const [localError, setLocalError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Set max file limit to 200MB (200 * 1024 * 1024 bytes)
    const MAX_SIZE = 200 * 1024 * 1024;
    if (file.size > MAX_SIZE) {
      setLocalError(`File size (${(file.size / (1024 * 1024)).toFixed(1)} MB) exceeds 200 MB limit.`);
      return;
    }

    setUploading(true);
    setProgress(0);
    setLocalError("");

    const CHUNK_SIZE = 5 * 1024 * 1024; // 5MB per chunk to prevent HTTP 413 Entity Too Large errors

    try {
      if (file.size > CHUNK_SIZE) {
        // Chunked upload stream for files larger than 5MB
        const totalChunks = Math.ceil(file.size / CHUNK_SIZE);
        const fileId = `${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;
        let finalUrl = "";

        for (let i = 0; i < totalChunks; i++) {
          const start = i * CHUNK_SIZE;
          const end = Math.min(file.size, start + CHUNK_SIZE);
          const chunk = file.slice(start, end);

          const formData = new FormData();
          formData.append("file", chunk, file.name);

          const res = await fetch("/api/upload", {
            method: "POST",
            headers: {
              "x-chunk-index": String(i),
              "x-total-chunks": String(totalChunks),
              "x-file-id": fileId,
              "x-file-name": file.name,
            },
            body: formData,
          });

          if (!res.ok) {
            throw new Error(`Upload error (${res.status}): ${res.statusText}`);
          }

          const data = await res.json();
          if (!data.success) {
            throw new Error(data.error || "Chunk upload failed.");
          }

          if (data.url) {
            finalUrl = data.url;
          }

          const pct = Math.round(((i + 1) / totalChunks) * 100);
          setProgress(pct);
        }

        if (finalUrl) {
          onChange(finalUrl);
        } else {
          throw new Error("Upload completed but no file URL was returned.");
        }
      } else {
        // Single POST request for small files (<5MB)
        const formData = new FormData();
        formData.append("file", file);

        const res = await fetch("/api/upload", {
          method: "POST",
          body: formData,
        });

        if (!res.ok) {
          throw new Error(`Upload error (${res.status}): ${res.statusText}`);
        }

        const data = await res.json();
        if (data.success && data.url) {
          onChange(data.url);
          setProgress(100);
        } else {
          setLocalError(data.error || "Failed to upload.");
        }
      }
    } catch (err: any) {
      setLocalError(err.message || "Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  const isVideo = value && (
    value.endsWith(".mp4") ||
    value.endsWith(".webm") ||
    value.endsWith(".mov") ||
    value.endsWith(".m4v") ||
    value.endsWith(".MOV") ||
    value.endsWith(".MP4") ||
    accept.includes("video")
  );

  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{label}</label>
      <div className="flex gap-3 items-center">
        {/* Preview */}
        {value && (
          <div className="relative w-12 h-12 rounded border border-neutral-800 bg-neutral-900 overflow-hidden flex items-center justify-center flex-shrink-0">
            {isVideo ? (
              <video src={value} autoPlay loop muted playsInline className="object-cover w-full h-full" />
            ) : (
              <img src={value} alt="Preview" className="object-cover w-full h-full" />
            )}
          </div>
        )}
        <div className="flex-1 space-y-1">
          <input
            type="file"
            accept={accept}
            onChange={handleFileChange}
            className="block w-full text-xs text-neutral-400 file:mr-3 file:py-1.5 file:px-3 file:rounded-md file:border-0 file:text-[10px] file:font-bold file:uppercase file:bg-maroonClr file:text-white file:cursor-pointer hover:file:opacity-90"
          />
          {value ? (
            <span className="text-[9px] text-neutral-500 block truncate font-mono">{value}</span>
          ) : (
            <span className="text-[9px] text-neutral-550 block font-sans">No file uploaded</span>
          )}
          {uploading && (
            <div className="space-y-1">
              <div className="flex justify-between items-center text-[9px] text-[#C9A84C] font-bold">
                <span className="animate-pulse">Uploading video stream...</span>
                <span>{progress}%</span>
              </div>
              <div className="w-full h-1 bg-neutral-800 rounded-full overflow-hidden">
                <div className="h-full bg-[#C9A84C] transition-all duration-200" style={{ width: `${progress}%` }} />
              </div>
            </div>
          )}
          {localError && <span className="text-[9px] text-red-500 block">{localError}</span>}
        </div>
      </div>
    </div>
  );
}

function ItemPickerPopover({
  label = "Select Store Collection or Product",
  linkValue = "",
  textValue = "",
  onSelect,
  collections = [],
  products = []
}: {
  label?: string;
  linkValue: string;
  textValue?: string;
  onSelect: (link: string, title: string) => void;
  collections?: any[];
  products?: any[];
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState("");
  const [tab, setTab] = useState<"ALL" | "COLLECTIONS" | "PRODUCTS">("ALL");

  const getProductImage = (p: any) => {
    if (typeof p.featuredImage === "string") return p.featuredImage;
    if (p.featuredImage?.url) return p.featuredImage.url;
    if (Array.isArray(p.images) && p.images.length > 0) {
      const first = p.images[0];
      if (typeof first === "string") return first;
      if (first?.url) return first.url;
    }
    if (p.image?.url) return p.image.url;
    if (typeof p.image === "string") return p.image;
    if (p.thumbnail) return p.thumbnail;
    return null;
  };

  const getCollectionImage = (c: any) => {
    if (typeof c.image === "string") return c.image;
    if (c.image?.url) return c.image.url;
    if (c.coverImage) return c.coverImage;
    if (c.imageUrl) return c.imageUrl;
    return null;
  };

  const getProductPrice = (p: any) => {
    const priceVal = p.price?.amount || p.price || p.priceRange?.minVariantPrice?.amount;
    if (!priceVal) return "";
    if (typeof priceVal === "number") return `₹${priceVal.toLocaleString("en-IN")}`;
    if (typeof priceVal === "string") return priceVal.startsWith("₹") ? priceVal : `₹${priceVal}`;
    return "";
  };

  const currentHandle = linkValue.replace("/collections/", "").replace("/products/", "");
  const matchedCol = collections.find((c: any) => c.handle === currentHandle);
  const matchedProd = products.find((p: any) => p.handle === currentHandle);
  const matchedImage = matchedProd ? getProductImage(matchedProd) : matchedCol ? getCollectionImage(matchedCol) : null;
  const displayTitle = textValue || matchedCol?.title || matchedProd?.title || (currentHandle ? currentHandle : "-- Click to Select Collection or Product --");
  const matchedPrice = matchedProd ? getProductPrice(matchedProd) : "";

  const allCollections = collections.map((c: any) => ({
    id: c.id || c.handle,
    title: c.title,
    handle: c.handle,
    type: "COLLECTION" as const,
    link: `/collections/${c.handle}`,
    image: getCollectionImage(c),
    price: ""
  }));

  const allProducts = products.map((p: any) => ({
    id: p.id || p.handle,
    title: p.title,
    handle: p.handle,
    type: "PRODUCT" as const,
    link: `/products/${p.handle}`,
    image: getProductImage(p),
    price: getProductPrice(p)
  }));

  const combinedItems = tab === "COLLECTIONS" ? allCollections : tab === "PRODUCTS" ? allProducts : [...allCollections, ...allProducts];

  const filteredItems = combinedItems.filter((item) =>
    item.title.toLowerCase().includes(search.toLowerCase()) ||
    item.handle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="relative space-y-1.5 w-full">
      {label && <label className="block text-[8px] font-bold text-[#C9A84C] uppercase tracking-wider">{label}</label>}
      
      {/* Trigger Button with Product Image Preview */}
      <button
        type="button"
        onClick={() => setIsOpen(!isOpen)}
        className="w-full bg-neutral-950 hover:bg-neutral-900 border border-neutral-800 hover:border-[#C9A84C] rounded-lg px-2.5 py-1.5 text-left flex items-center justify-between transition-colors shadow-sm gap-2"
      >
        <div className="flex items-center gap-2.5 truncate min-w-0">
          {matchedImage ? (
            <img src={matchedImage} alt="" className="w-7 h-8 object-cover object-top rounded border border-neutral-700 flex-shrink-0" />
          ) : (
            <span className="w-2 h-2 rounded-full bg-[#C9A84C] flex-shrink-0" />
          )}
          <div className="truncate min-w-0">
            <div className="flex items-center gap-1.5 truncate">
              <span className="text-xs font-semibold text-white truncate">{displayTitle}</span>
              {matchedPrice && <span className="text-[10px] font-bold text-[#C9A84C] flex-shrink-0">{matchedPrice}</span>}
            </div>
            {currentHandle && <span className="text-[9px] text-neutral-500 font-mono block truncate">{linkValue || `/collections/${currentHandle}`}</span>}
          </div>
        </div>
        <span className="text-[10px] text-[#C9A84C] font-bold uppercase tracking-wider flex-shrink-0 ml-1">Choose ▾</span>
      </button>

      {/* Popover Dropdown Modal */}
      {isOpen && (
        <>
          {/* Backdrop overlay */}
          <div className="fixed inset-0 z-40 bg-black/40 backdrop-blur-[1px]" onClick={() => setIsOpen(false)} />

          {/* Modal Container */}
          <div className="absolute left-0 right-0 top-full mt-1.5 z-50 bg-neutral-950 border border-neutral-800 rounded-xl shadow-2xl overflow-hidden p-3 space-y-3 max-h-[420px] flex flex-col">
            {/* Search Input & Filter Tabs */}
            <div className="space-y-2">
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="🔍 Type to search collections or products..."
                autoFocus
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white placeholder:text-neutral-500 focus:outline-none focus:border-[#C9A84C]"
              />

              <div className="flex gap-1 bg-neutral-900 p-1 rounded-lg">
                <button
                  type="button"
                  onClick={() => setTab("ALL")}
                  className={`flex-1 py-1 text-[9px] font-bold uppercase rounded transition-colors ${tab === "ALL" ? "bg-maroonClr text-white" : "text-neutral-400 hover:text-white"}`}
                >
                  All ({allCollections.length + allProducts.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTab("COLLECTIONS")}
                  className={`flex-1 py-1 text-[9px] font-bold uppercase rounded transition-colors ${tab === "COLLECTIONS" ? "bg-maroonClr text-white" : "text-neutral-400 hover:text-white"}`}
                >
                  Collections ({allCollections.length})
                </button>
                <button
                  type="button"
                  onClick={() => setTab("PRODUCTS")}
                  className={`flex-1 py-1 text-[9px] font-bold uppercase rounded transition-colors ${tab === "PRODUCTS" ? "bg-maroonClr text-white" : "text-neutral-400 hover:text-white"}`}
                >
                  Products ({allProducts.length})
                </button>
              </div>
            </div>

            {/* Scrollable Items List with Product Thumbnail Previews */}
            <div className="flex-1 overflow-y-auto space-y-1.5 pr-1 custom-scrollbar">
              {filteredItems.length === 0 ? (
                <div className="p-4 text-center text-xs text-neutral-500">No matching collections or products found.</div>
              ) : (
                filteredItems.map((item) => (
                  <button
                    key={`${item.type}_${item.id}`}
                    type="button"
                    onClick={() => {
                      onSelect(item.link, item.title);
                      setIsOpen(false);
                    }}
                    className={`w-full p-2 rounded-xl text-left flex items-center justify-between transition-all ${
                      currentHandle === item.handle ? "bg-maroonClr/30 border border-[#C9A84C] text-white shadow-md" : "bg-neutral-900/60 hover:bg-neutral-900 border border-neutral-850 text-neutral-200"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {item.image ? (
                        <img src={item.image} alt="" className="w-10 h-12 object-cover object-top rounded-md border border-neutral-700/80 bg-neutral-950 flex-shrink-0 shadow-sm" />
                      ) : (
                        <div className="w-10 h-12 bg-neutral-800 rounded-md flex items-center justify-center text-xs text-neutral-400 font-bold flex-shrink-0 border border-neutral-700">
                          {item.type === "COLLECTION" ? "📁" : "🛍️"}
                        </div>
                      )}
                      <div className="truncate space-y-0.5 min-w-0">
                        <span className="text-xs font-bold text-white block truncate">{item.title}</span>
                        <div className="flex items-center gap-2 min-w-0">
                          {item.price && <span className="text-[10px] font-extrabold text-[#C9A84C] flex-shrink-0">{item.price}</span>}
                          <span className="text-[9px] text-neutral-400 font-mono block truncate">{item.link}</span>
                        </div>
                      </div>
                    </div>

                    <span className={`text-[8px] font-bold px-2 py-0.5 rounded-full uppercase flex-shrink-0 ml-2 ${item.type === "COLLECTION" ? "bg-amber-950/70 text-amber-300 border border-amber-700/50" : "bg-purple-950/70 text-purple-300 border border-purple-700/50"}`}>
                      {item.type}
                    </span>
                  </button>
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  );
}

function LinkSelector({
  label = "Target Link Route",
  value = "",
  onChange,
  collections = [],
  products = []
}: {
  label?: string;
  value: string;
  onChange: (url: string) => void;
  collections?: any[];
  products?: any[];
}) {
  return (
    <ItemPickerPopover
      label={label}
      linkValue={value}
      onSelect={(link) => onChange(link)}
      collections={collections}
      products={products}
    />
  );
}

function ChooseExistingLinkAndOverlay({
  label = "Choose From Existing Collection or Product",
  linkValue = "",
  textValue = "",
  onSelect,
  collections = [],
  products = []
}: {
  label?: string;
  linkValue: string;
  textValue: string;
  onSelect: (link: string, text: string) => void;
  collections?: any[];
  products?: any[];
}) {
  return (
    <div className="space-y-2 bg-neutral-900/80 p-3 rounded-lg border border-neutral-800">
      <ItemPickerPopover
        label={label}
        linkValue={linkValue}
        textValue={textValue}
        onSelect={(link, title) => onSelect(link, textValue || title)}
        collections={collections}
        products={products}
      />

      <div className="grid grid-cols-1 md:grid-cols-2 gap-2 pt-1">
        <div>
          <label className="block text-[8px] font-bold text-neutral-400 uppercase mb-0.5">Card Text Overlay / Title</label>
          <input
            type="text"
            value={textValue}
            onChange={(e) => onSelect(linkValue, e.target.value)}
            placeholder="Text Overlay"
            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
          />
        </div>
        <div>
          <label className="block text-[8px] font-bold text-neutral-400 uppercase mb-0.5">Target Link Route</label>
          <input
            type="text"
            value={linkValue}
            onChange={(e) => onSelect(e.target.value, textValue)}
            placeholder="/collections/..."
            className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white font-mono focus:outline-none"
          />
        </div>
      </div>
    </div>
  );
}

export default function SettingsFormClient({ initialSettings, products = [], collections = [] }: SettingsFormClientProps) {
  const [activeTab, setActiveTab] = useState<"SEO" | "HEADER" | "MEGAMENU" | "BANNERS" | "HOMEPAGE" | "FOOTER" | "COLLECTIONS">("SEO");
  const [activeSubSection, setActiveSubSection] = useState<string>("lovedCollections");
  
  const [seoSuccess, setSeoSuccess] = useState("");
  const [headerSuccess, setHeaderSuccess] = useState("");
  const [bannersSuccess, setBannersSuccess] = useState("");
  const [homeSuccess, setHomeSuccess] = useState("");
  const [footerSuccess, setFooterSuccess] = useState("");
  const [collectionsSuccess, setCollectionsSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // ----------------------------------------------------
  // Collection Banners State
  // ----------------------------------------------------
  const [collectionBanners, setCollectionBanners] = useState<Record<string, string>>(initialSettings.collectionBanners || {});

  // ----------------------------------------------------
  // 1. SEO State
  // ----------------------------------------------------
  const [titleTemplate, setTitleTemplate] = useState(initialSettings.seo?.titleTemplate || "");
  const [defaultDescription, setDefaultDescription] = useState(initialSettings.seo?.defaultDescription || "");
  const [keywords, setKeywords] = useState(initialSettings.seo?.keywords || "");

  // ----------------------------------------------------
  // 2. Header State
  // ----------------------------------------------------
  const hd = initialSettings.header || {};
  const hp = initialSettings.homepage || {};
  const [banners, setBanners] = useState<any[]>(initialSettings.banners || []);

  const [headerLogoUrl, setHeaderLogoUrl] = useState(hd.logoUrl || "");
  const [whatsappNumber, setWhatsappNumber] = useState(hd.whatsappNumber || "");
  const [announcements, setAnnouncements] = useState<string[]>(hd.announcements || []);
  const [marqueeItems, setMarqueeItems] = useState<any[]>(hd.marquee || []);
  const [menuLinks, setMenuLinks] = useState<any[]>(hd.menuLinks || []);

  // Mega Menus State
  const [megaMenuSarees, setMegaMenuSarees] = useState<any>(hd.megaMenuSarees || {});
  const [megaMenuCollections, setMegaMenuCollections] = useState<any>(hd.megaMenuCollections || {});

  // Section 1: Loved Collections
  const [lovedCollectionsTitle, setLovedCollectionsTitle] = useState(hp.lovedCollectionsTitle || "");
  const [lovedCollectionsSubtitle, setLovedCollectionsSubtitle] = useState(hp.lovedCollectionsSubtitle || "");
  const [lovedCollectionsItems, setLovedCollectionsItems] = useState<any[]>(hp.lovedCollectionsItems || []);

  // Top Trending Collections Scalloped Cards
  const [trendingCollectionsTitle, setTrendingCollectionsTitle] = useState(hp.trendingCollectionsTitle || "TOP TRENDING COLLECTIONS");
  const [trendingCollectionsItems, setTrendingCollectionsItems] = useState<any[]>(hp.trendingCollectionsItems || []);

  const [patternBannerHeading, setPatternBannerHeading] = useState(hp.patternBanner?.heading || "");
  const [patternBannerType, setPatternBannerType] = useState<"IMAGE" | "VIDEO">(hp.patternBanner?.type || "IMAGE");
  const [patternBannerMediaUrl, setPatternBannerMediaUrl] = useState(hp.patternBanner?.mediaUrl || "");
  const [reels, setReels] = useState<any[]>(hp.videoReels || hp.patternBanner?.reels || []);

  // Section 3: Top Sellings
  const [trendingTitle, setTrendingTitle] = useState(hp.trendingTitle || "");
  const [trendingSubtitle, setTrendingSubtitle] = useState(hp.trendingSubtitle || "");
  const [topSellingsProductIds, setTopSellingsProductIds] = useState<string[]>(hp.topSellingsProductIds || []);

  // Section 4: Perfect Saree Tabs
  const [perfectSareeTitle, setPerfectSareeTitle] = useState(hp.perfectSareeTitle || "");
  const [perfectSareeSubtitle, setPerfectSareeSubtitle] = useState(hp.perfectSareeSubtitle || "");
  const [perfectSareeTabs, setPerfectSareeTabs] = useState<any[]>(hp.perfectSareeTabs || []);

  // Section 5: Best Categories
  const [categoriesTitle, setCategoriesTitle] = useState(hp.categoriesTitle || "");
  const [categoriesSubtitle, setCategoriesSubtitle] = useState(hp.categoriesSubtitle || "");
  const [categoriesItems, setCategoriesItems] = useState<any[]>(hp.categoriesItems || []);

  // Section 6: Features
  const [featuresTitle, setFeaturesTitle] = useState(hp.featuresTitle || "");
  const [featuresSubtitle, setFeaturesSubtitle] = useState(hp.featuresSubtitle || "");
  const [features, setFeatures] = useState<any[]>(hp.features || []);

  // Section 7: Testimonials
  const [testimonialsTitle, setTestimonialsTitle] = useState(hp.testimonialsTitle || "");
  const [testimonials, setTestimonials] = useState<any[]>(hp.testimonials || []);

  // Section 8: FAQs
  const [faqTitle, setFaqTitle] = useState(hp.faqTitle || "");
  const [faqSubtitle, setFaqSubtitle] = useState(hp.faqSubtitle || "");
  const [faqImage, setFaqImage] = useState(hp.faqImage || "");
  const [faqs, setFaqs] = useState<any[]>(hp.faqs || []);

  // Section 9: Occasion Finder
  const [occasionFinderTitle, setOccasionFinderTitle] = useState(hp.occasionFinderTitle || "SHOP BY OCCASION");
  const [occasionFinderSubtitle, setOccasionFinderSubtitle] = useState(hp.occasionFinderSubtitle || "DISCOVER HANDLOOM DRAPES FOR EVERY MOMENT");
  const [occasionFinderItems, setOccasionFinderItems] = useState<any[]>(hp.occasionFinderItems || []);

  // Section 10: Celebrity / Styled by You Spotlight
  const [celebritySpotlightTitle, setCelebritySpotlightTitle] = useState(hp.celebritySpotlightTitle || "Styled by You, Crafted by Us");
  const [celebritySpotlightSubtitle, setCelebritySpotlightSubtitle] = useState(hp.celebritySpotlightSubtitle || "Real women. Real drapes. Stories that inspire.");
  const [celebritySpotlightItems, setCelebritySpotlightItems] = useState<any[]>(hp.celebritySpotlightItems || []);

  // Section 11: Fabric Library
  const [fabricLibraryTitle, setFabricLibraryTitle] = useState(hp.fabricLibraryTitle || "Our Fabric Library");
  const [fabricLibrarySubtitle, setFabricLibrarySubtitle] = useState(hp.fabricLibrarySubtitle || "Every thread has a lineage. Discover the heritage, origin, and distinct weave details of our signature materials.");
  const [fabricLibraryItems, setFabricLibraryItems] = useState<any[]>(hp.fabricLibraryItems || []);

  // Section 12: Story Drape Transformer
  const [storyDrapeHeading, setStoryDrapeHeading] = useState(hp.storyDrapeHeading || "From Thread to Royal Drape");
  const [storyDrapeDescription, setStoryDrapeDescription] = useState(hp.storyDrapeDescription || "Drag the golden thread slider to witness raw handloom silk transform into a finished golden masterpiece.");
  const [storyDrapeBeforeImage, setStoryDrapeBeforeImage] = useState(hp.storyDrapeBeforeImage || "/images/pattern-bg.jpg");
  const [storyDrapeAfterImage, setStoryDrapeAfterImage] = useState(hp.storyDrapeAfterImage || "/images/craftmanship.jpeg");

  // Section 13: As Seen In Press
  const [asSeenInPressTitle, setAsSeenInPressTitle] = useState(hp.asSeenInPressTitle || "As Featured In");
  const [asSeenInPressItems, setAsSeenInPressItems] = useState<any[]>(hp.asSeenInPressItems || []);

  // Section 14: Artisan Timeline (Artisans & Weavers)
  const [artisanTimelineTitle, setArtisanTimelineTitle] = useState(hp.artisanTimelineTitle || "Artisans & Weavers");
  const [artisanTimelineSubtitle, setArtisanTimelineSubtitle] = useState(hp.artisanTimelineSubtitle || "Behind every drape is a master weaver. Meet the artisans preserving centuries of India's textile heritage.");
  const [artisanTimelineItems, setArtisanTimelineItems] = useState<any[]>(hp.artisanTimelineItems || []);

  // Section 15: Secondary Campaign Banners
  const [promoBanners, setPromoBanners] = useState<any[]>(hp.promoBanners || [
    { imageUrl: "/images/banner-1773659037696-747582281.webp", title: "New Arrivals", subtitle: "Fresh styles just dropped", link: "/products", buttonText: "Shop Now" },
    { imageUrl: "/images/banner-1773659047206-859638957.webp", title: "Best Sellers", subtitle: "Loved by thousands", link: "/products", buttonText: "Explore" }
  ]);

  // ----------------------------------------------------
  // 5. Footer Settings State
  // ----------------------------------------------------
  const ft = initialSettings.footer || {};
  const [footerLogoUrl, setFooterLogoUrl] = useState(ft.logoUrl || "");
  const [footerDescription, setFooterDescription] = useState(ft.description || "");
  const [footerEmail, setFooterEmail] = useState(ft.contactEmail || "");
  const [footerPhone, setFooterPhone] = useState(ft.contactPhone || "");
  const [footerCopyright, setFooterCopyright] = useState(ft.copyright || "");
  const [facebookUrl, setFacebookUrl] = useState(ft.facebookUrl || "");
  const [instagramUrl, setInstagramUrl] = useState(ft.instagramUrl || "");
  const [pinterestUrl, setPinterestUrl] = useState(ft.pinterestUrl || "");
  const [youtubeUrl, setYoutubeUrl] = useState(ft.youtubeUrl || "");
  const [footerLinks, setFooterLinks] = useState<any[]>(ft.links || []);

  // ----------------------------------------------------
  // Helpers
  // ----------------------------------------------------

  // Header helpers
  const [newAnnouncement, setNewAnnouncement] = useState("");
  const addAnnouncement = () => {
    if (!newAnnouncement) return;
    setAnnouncements([...announcements, newAnnouncement]);
    setNewAnnouncement("");
  };

  const [newMarqueeText, setNewMarqueeText] = useState("");
  const [newMarqueeIcon, setNewMarqueeIcon] = useState("gift");
  const addMarqueeItem = () => {
    if (!newMarqueeText) return;
    setMarqueeItems([...marqueeItems, { text: newMarqueeText, icon: newMarqueeIcon }]);
    setNewMarqueeText("");
  };

  const [newMenuLabel, setNewMenuLabel] = useState("");
  const [newMenuUrl, setNewMenuUrl] = useState("");
  const [newMenuLinkType, setNewMenuLinkType] = useState<"CUSTOM" | "COLLECTION">("CUSTOM");
  const [selectedMenuColHandle, setSelectedMenuColHandle] = useState("");

  const [newSubLabelMap, setNewSubLabelMap] = useState<Record<number, string>>({});
  const [newSubUrlMap, setNewSubUrlMap] = useState<Record<number, string>>({});
  const [newSubColMap, setNewSubColMap] = useState<Record<number, string>>({});
  const [newSubTypeMap, setNewSubTypeMap] = useState<Record<number, "CUSTOM" | "COLLECTION">>({});

  const addMenuLink = () => {
    let label = newMenuLabel.trim();
    let url = newMenuUrl.trim();
    if (newMenuLinkType === "COLLECTION") {
      const col = collections.find((c: any) => c.handle === selectedMenuColHandle);
      if (!col) return;
      label = col.title;
      url = `/collections/${col.handle}`;
    }
    if (!label || !url) return;
    setMenuLinks([...menuLinks, { label, url, subLinks: [] }]);
    setNewMenuLabel("");
    setNewMenuUrl("");
    setSelectedMenuColHandle("");
  };

  const addSubLink = (mainIdx: number) => {
    const type = newSubTypeMap[mainIdx] || "CUSTOM";
    let label = (newSubLabelMap[mainIdx] || "").trim();
    let url = (newSubUrlMap[mainIdx] || "").trim();

    if (type === "COLLECTION") {
      const col = collections.find((c: any) => c.handle === newSubColMap[mainIdx]);
      if (!col) return;
      label = col.title;
      url = `/collections/${col.handle}`;
    }

    if (!label || !url) return;

    const updated = [...menuLinks];
    const mainLink = updated[mainIdx];
    const subLinks = mainLink.subLinks ? [...mainLink.subLinks] : [];
    subLinks.push({ label, url });
    updated[mainIdx] = { ...mainLink, subLinks };
    setMenuLinks(updated);

    // Clear inputs
    setNewSubLabelMap({ ...newSubLabelMap, [mainIdx]: "" });
    setNewSubUrlMap({ ...newSubUrlMap, [mainIdx]: "" });
    setNewSubColMap({ ...newSubColMap, [mainIdx]: "" });
  };

  const deleteSubLink = (mainIdx: number, subIdx: number) => {
    const updated = [...menuLinks];
    const mainLink = updated[mainIdx];
    const subLinks = (mainLink.subLinks || []).filter((_: any, sIdx: number) => sIdx !== subIdx);
    updated[mainIdx] = { ...mainLink, subLinks };
    setMenuLinks(updated);
  };

  const moveSubLink = (mainIdx: number, subIdx: number, direction: "UP" | "DOWN") => {
    const mainLink = menuLinks[mainIdx];
    const subLinks = [...(mainLink.subLinks || [])];
    if (direction === "UP" && subIdx === 0) return;
    if (direction === "DOWN" && subIdx === subLinks.length - 1) return;
    const targetIdx = direction === "UP" ? subIdx - 1 : subIdx + 1;
    const temp = subLinks[subIdx];
    subLinks[subIdx] = subLinks[targetIdx];
    subLinks[targetIdx] = temp;

    const updated = [...menuLinks];
    updated[mainIdx] = { ...mainLink, subLinks };
    setMenuLinks(updated);
  };

  // Loved Collections Helpers
  const [lovedColHandle, setLovedColHandle] = useState("");
  const [lovedColTitle, setLovedColTitle] = useState("");
  const [lovedColImage, setLovedColImage] = useState("");
  const addLovedCollection = () => {
    if (!lovedColHandle) return;
    const title = lovedColTitle || collections.find((c: any) => c.handle === lovedColHandle)?.title || lovedColHandle;
    setLovedCollectionsItems([
      ...lovedCollectionsItems,
      { collectionHandle: lovedColHandle, customTitle: title, customImage: lovedColImage }
    ]);
    setLovedColHandle("");
    setLovedColTitle("");
    setLovedColImage("");
  };

  // Trending Collections Helpers
  const [trendColHandle, setTrendColHandle] = useState("");
  const [trendColTitle, setTrendColTitle] = useState("");
  const [trendColImage, setTrendColImage] = useState("");
  const addTrendingCollection = () => {
    if (!trendColHandle) return;
    const title = trendColTitle || collections.find((c: any) => c.handle === trendColHandle)?.title || trendColHandle;
    setTrendingCollectionsItems([
      ...trendingCollectionsItems,
      { title, handle: trendColHandle, image: trendColImage || "/images/client-1.jpg" }
    ]);
    setTrendColHandle("");
    setTrendColTitle("");
    setTrendColImage("");
  };

  // Top Sellings Helpers
  const [featuredProdId, setFeaturedProdId] = useState("");
  const addFeaturedProduct = () => {
    if (!featuredProdId || topSellingsProductIds.includes(featuredProdId)) return;
    setTopSellingsProductIds([...topSellingsProductIds, featuredProdId]);
    setFeaturedProdId("");
  };

  // Perfect Saree Tabs Helpers
  const [sareeTabColHandle, setSareeTabColHandle] = useState("");
  const [sareeTabLabel, setSareeTabLabel] = useState("");
  const [sareeTabImage, setSareeTabImage] = useState("");
  const addSareeTab = () => {
    if (!sareeTabColHandle) return;
    const label = sareeTabLabel || collections.find((c: any) => c.handle === sareeTabColHandle)?.title || sareeTabColHandle;
    setPerfectSareeTabs([
      ...perfectSareeTabs,
      { collectionHandle: sareeTabColHandle, label, image: sareeTabImage }
    ]);
    setSareeTabColHandle("");
    setSareeTabLabel("");
    setSareeTabImage("");
  };

  // Best Categories Helpers
  const [bestCatColHandle, setBestCatColHandle] = useState("");
  const [bestCatTitle, setBestCatTitle] = useState("");
  const [bestCatImage, setBestCatImage] = useState("");
  const addBestCategory = () => {
    if (!bestCatColHandle) return;
    setCategoriesItems([
      ...categoriesItems,
      { collectionHandle: bestCatColHandle, customTitle: bestCatTitle, customImage: bestCatImage }
    ]);
    setBestCatColHandle("");
    setBestCatTitle("");
    setBestCatImage("");
  };

  // Testimonials Helpers
  const [testName, setTestName] = useState("");
  const [testRating, setTestRating] = useState("5");
  const [testComment, setTestComment] = useState("");
  const [testImage, setTestImage] = useState("");
  const addTestimonial = () => {
    if (!testName || !testComment) return;
    setTestimonials([
      ...testimonials,
      { id: `t_${Date.now()}`, name: testName, rating: parseInt(testRating), comment: testComment, image: testImage }
    ]);
    setTestName("");
    setTestComment("");
    setTestImage("");
  };

  // FAQ Helpers
  const [faqQ, setFaqQ] = useState("");
  const [faqA, setFaqA] = useState("");
  const addFaq = () => {
    if (!faqQ || !faqA) return;
    setFaqs([...faqs, { question: faqQ, answer: faqA }]);
    setFaqQ("");
    setFaqA("");
  };

  // Reels Helpers
  const handleAddReel = () => {
    setReels([
      ...reels,
      {
        id: `reel_${Date.now()}`,
        videoUrl: "",
        title: "",
        price: "",
        compareAtPrice: "",
        views: "10K",
        link: ""
      }
    ]);
  };

  const handleReelChange = (index: number, key: string, val: string) => {
    const updated = [...reels];
    updated[index] = { ...updated[index], [key]: val };
    setReels(updated);
  };

  // Footer Link Helpers
  const [footLinkLabel, setFootLinkLabel] = useState("");
  const [footLinkUrl, setFootLinkUrl] = useState("");
  const addFooterLink = () => {
    if (!footLinkLabel || !footLinkUrl) return;
    setFooterLinks([...footerLinks, { label: footLinkLabel, url: footLinkUrl }]);
    setFootLinkLabel("");
    setFootLinkUrl("");
  };

  // Reorder/Delete
  const moveItem = (list: any[], setList: Function, index: number, direction: "UP" | "DOWN") => {
    if (direction === "UP" && index === 0) return;
    if (direction === "DOWN" && index === list.length - 1) return;
    const targetIndex = direction === "UP" ? index - 1 : index + 1;
    const updated = [...list];
    const temp = updated[index];
    updated[index] = updated[targetIndex];
    updated[targetIndex] = temp;
    setList(updated);
  };

  const deleteItem = (list: any[], setList: Function, index: number) => {
    setList(list.filter((_, idx) => idx !== index));
  };

  // Banner list controls
  const handleAddBanner = () => {
    setBanners([
      ...banners,
      {
        id: `slide_${Date.now()}`,
        imageUrl: "",
        mobileImageUrl: "",
        title: "",
        subtitle: "",
        buttonText: "Explore Now",
        link: "/collections/all",
      },
    ]);
  };

  const handleBannerChange = (index: number, key: string, val: string) => {
    const updated = [...banners];
    updated[index] = { ...updated[index], [key]: val };
    setBanners(updated);
  };

  const handleFeatureChange = (index: number, key: string, val: string) => {
    const updated = [...features];
    updated[index] = { ...updated[index], [key]: val };
    setFeatures(updated);
  };

  // ----------------------------------------------------
  // Save Trigger Handlers
  // ----------------------------------------------------
  const triggerSaveSEO = async (e: React.FormEvent) => {
    e.preventDefault();
    setSeoSuccess("");
    setError("");
    setLoading(true);
    const res = await saveSeoSettingsAction({ titleTemplate, defaultDescription, keywords });
    setLoading(false);
    if (res.success) setSeoSuccess("SEO Settings saved successfully!");
    else setError(res.error || "Failed to save SEO settings.");
  };

  const triggerSaveHeader = async () => {
    setHeaderSuccess("");
    setError("");
    setLoading(true);
    const res = await saveHeaderSettingsAction({
      logoUrl: headerLogoUrl,
      whatsappNumber,
      announcements,
      marquee: marqueeItems,
      menuLinks,
      megaMenuSarees,
      megaMenuCollections
    });
    setLoading(false);
    if (res.success) setHeaderSuccess("Header layouts saved successfully!");
    else setError(res.error || "Failed to save header settings.");
  };

  const triggerSaveBanners = async () => {
    setBannersSuccess("");
    setError("");
    setLoading(true);
    const res = await saveBannersSettingsAction(banners);
    setLoading(false);
    if (res.success) setBannersSuccess("Homepage Banner slides saved successfully!");
    else setError(res.error || "Failed to save banners.");
  };

  const triggerSaveHomepage = async () => {
    setHomeSuccess("");
    setError("");
    setLoading(true);
    const res = await saveHomepageSettingsAction({
      lovedCollectionsTitle,
      lovedCollectionsSubtitle,
      lovedCollectionsItems,
      trendingCollectionsTitle,
      trendingCollectionsItems,
      videoReels: reels,
      patternBanner: {
        heading: patternBannerHeading,
        type: patternBannerType,
        mediaUrl: patternBannerMediaUrl,
        reels: reels
      },
      trendingTitle,
      trendingSubtitle,
      topSellingsProductIds,
      perfectSareeTitle,
      perfectSareeSubtitle,
      perfectSareeTabs,
      categoriesTitle,
      categoriesSubtitle,
      categoriesItems,
      featuresTitle,
      featuresSubtitle,
      features,
      testimonialsTitle,
      testimonials,
      faqTitle,
      faqSubtitle,
      faqImage,
      faqs,
      occasionFinderTitle,
      occasionFinderSubtitle,
      occasionFinderItems,
      celebritySpotlightTitle,
      celebritySpotlightSubtitle,
      celebritySpotlightItems,
      fabricLibraryTitle,
      fabricLibrarySubtitle,
      fabricLibraryItems,
      storyDrapeHeading,
      storyDrapeDescription,
      storyDrapeBeforeImage,
      storyDrapeAfterImage,
      asSeenInPressTitle,
      asSeenInPressItems,
      artisanTimelineTitle,
      artisanTimelineSubtitle,
      artisanTimelineItems,
      promoBanners
    });
    setLoading(false);
    if (res.success) setHomeSuccess("Homepage Visual Layout saved successfully!");
    else setError(res.error || "Failed to save homepage layout.");
  };

  const triggerSaveFooter = async () => {
    setFooterSuccess("");
    setError("");
    setLoading(true);
    const res = await saveFooterSettingsAction({
      logoUrl: footerLogoUrl,
      description: footerDescription,
      contactEmail: footerEmail,
      contactPhone: footerPhone,
      copyright: footerCopyright,
      facebookUrl,
      instagramUrl,
      pinterestUrl,
      youtubeUrl,
      links: footerLinks
    });
    setLoading(false);
    if (res.success) setFooterSuccess("Footer Configuration saved successfully!");
    else setError(res.error || "Failed to save footer settings.");
  };

  const triggerSaveCollectionBanners = async () => {
    setCollectionsSuccess("");
    setError("");
    setLoading(true);
    const res = await saveCollectionBannersAction(collectionBanners);
    setLoading(false);
    if (res.success) setCollectionsSuccess("Category Banners saved successfully!");
    else setError(res.error || "Failed to save collection banners.");
  };

  return (
    <div className="space-y-6 max-w-6xl">
      
      {/* Header and Tabs */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 pb-4 border-b border-neutral-850">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            Store Content Settings <Sparkles className="w-4.5 h-4.5 text-[#C9A84C]" />
          </h1>
          <p className="text-xs text-neutral-400">Configure site announcement strips, sliders, and homepage visuals with device file uploads.</p>
        </div>

        {/* Tab Switcher */}
        <div className="flex border border-neutral-800 rounded-lg bg-neutral-950 p-1 flex-wrap gap-1">
          {(["SEO", "HEADER", "MEGAMENU", "BANNERS", "HOMEPAGE", "FOOTER", "COLLECTIONS"] as const).map((tab) => (
            <button
              key={tab}
              onClick={() => {
                setActiveTab(tab);
                setError("");
                setSeoSuccess("");
                setHeaderSuccess("");
                setBannersSuccess("");
                setHomeSuccess("");
                setFooterSuccess("");
                setCollectionsSuccess("");
              }}
              className={`px-3.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? "bg-maroonClr text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {tab === "SEO" 
                ? "SEO & METADATA" 
                : tab === "HEADER" 
                ? "HEADER LAYOUT" 
                : tab === "MEGAMENU" 
                ? "MEGA MENUS" 
                : tab === "BANNERS" 
                ? "HERO SLIDES" 
                : tab === "HOMEPAGE" 
                ? "HOMEPAGE SECTIONS" 
                : tab === "FOOTER" 
                ? "STORE FOOTER" 
                : "CATEGORY BANNERS"}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-900/50 text-red-400 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5" />
          <span>{error}</span>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 1: SEO
          ---------------------------------------------------- */}
      {activeTab === "SEO" && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 md:p-8 shadow-sm space-y-6 max-w-2xl">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-900">
            <Globe className="w-5 h-5 text-[#C9A84C]" />
            <h3 className="text-sm font-bold text-white uppercase tracking-wider">Search Engine Tags</h3>
          </div>

          {seoSuccess && (
            <div className="p-3.5 bg-green-950/40 border border-green-900/50 text-green-400 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5" />
              <span>{seoSuccess}</span>
            </div>
          )}

          <form onSubmit={triggerSaveSEO} className="space-y-4">
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Meta Title Template</label>
              <input
                type="text"
                required
                value={titleTemplate}
                onChange={(e) => setTitleTemplate(e.target.value)}
                placeholder="%s | Boutiique Vastraa"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-maroonClr font-mono"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Meta Description</label>
              <textarea
                required
                rows={3}
                value={defaultDescription}
                onChange={(e) => setDefaultDescription(e.target.value)}
                placeholder="Default description..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-maroonClr leading-relaxed"
              />
            </div>
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">SEO Keywords</label>
              <input
                type="text"
                value={keywords}
                onChange={(e) => setKeywords(e.target.value)}
                placeholder="sarees, handloom, silk"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-white focus:outline-none focus:border-maroonClr"
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="bg-maroonClr hover:bg-[#A30C4D] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-maroonClr/20 disabled:opacity-50"
            >
              <Save className="w-4 h-4" /> {loading ? "Saving Settings..." : "Save SEO Settings"}
            </button>
          </form>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 2: HEADER LAYOUT
          ---------------------------------------------------- */}
      {activeTab === "HEADER" && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
            <div className="flex items-center gap-2">
              <Menu className="w-5 h-5 text-[#C9A84C]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Header & Navigation Customizer</h3>
            </div>
            {headerSuccess && (
              <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
              </span>
            )}
          </div>

          {headerSuccess && (
            <div className="p-3.5 bg-green-950/40 border border-green-900/50 text-green-400 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5" />
              <span>{headerSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Left Column: Logo & WhatsApp */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-900">1. Brand Identity</h4>
              
              <ImageOrVideoUploader
                label="Store Header Logo"
                value={headerLogoUrl}
                onChange={setHeaderLogoUrl}
                accept="image/*"
              />

              <div>
                <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">WhatsApp Contact Number</label>
                <input
                  type="text"
                  value={whatsappNumber}
                  onChange={(e) => setWhatsappNumber(e.target.value)}
                  placeholder="919205238666"
                  className="w-full bg-neutral-900 border border-neutral-850 rounded px-3 py-2 text-xs text-white focus:outline-none"
                />
                <span className="text-[9px] text-neutral-500 block mt-1">Include country code without + or spaces (e.g. 919205238666)</span>
              </div>


              {/* Dynamic Announcement list */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-900">2. Announcement Bar Sliding Items</h4>
                <div className="bg-neutral-900 p-3 rounded border border-neutral-850 flex gap-2 items-end">
                  <div className="flex-1">
                    <label className="block text-[8px] font-bold text-neutral-400 uppercase mb-1">New Announcement Message</label>
                    <input type="text" value={newAnnouncement} onChange={(e) => setNewAnnouncement(e.target.value)} placeholder="FREE SHIPPING ON ALL STYLES" className="w-full bg-neutral-955 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white" />
                  </div>
                  <button type="button" onClick={addAnnouncement} className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-3 py-1.5 text-[10px] font-bold uppercase rounded tracking-wider transition-colors"><Plus className="w-3.5 h-3.5" /></button>
                </div>
                <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                  {announcements.map((ann, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-neutral-900 border border-neutral-855 p-2 rounded text-xs">
                      <span className="text-white truncate max-w-[80%]">{ann}</span>
                      <div className="flex gap-1">
                        <button onClick={() => moveItem(announcements, setAnnouncements, idx, "UP")} disabled={idx === 0} className="p-0.5 bg-neutral-950 text-neutral-400 disabled:opacity-20"><ArrowUp className="w-3 h-3" /></button>
                        <button onClick={() => moveItem(announcements, setAnnouncements, idx, "DOWN")} disabled={idx === announcements.length - 1} className="p-0.5 bg-neutral-950 text-neutral-400 disabled:opacity-20"><ArrowDown className="w-3 h-3" /></button>
                        <button onClick={() => deleteItem(announcements, setAnnouncements, idx)} className="p-0.5 text-neutral-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>

            {/* Right Column: Menu links and Marquee list */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-900">3. Navigation Menu Links</h4>
              
              <div className="bg-neutral-900 p-3 rounded border border-neutral-850 space-y-3">
                <h5 className="text-[10px] font-bold text-white uppercase tracking-wider">Add Custom Menu Item</h5>
                
                <div className="flex gap-4 mb-2">
                  <label className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-300 uppercase cursor-pointer">
                    <input type="radio" checked={newMenuLinkType === "CUSTOM"} onChange={() => setNewMenuLinkType("CUSTOM")} className="accent-maroonClr" />
                    Custom Link
                  </label>
                  <label className="flex items-center gap-1.5 text-[9px] font-bold text-neutral-300 uppercase cursor-pointer">
                    <input type="radio" checked={newMenuLinkType === "COLLECTION"} onChange={() => setNewMenuLinkType("COLLECTION")} className="accent-maroonClr" />
                    Category Collection
                  </label>
                </div>

                {newMenuLinkType === "CUSTOM" ? (
                  <div className="grid grid-cols-2 gap-2">
                    <div>
                      <label className="block text-[8px] font-bold text-neutral-400 uppercase mb-0.5">Link Label Name</label>
                      <input type="text" value={newMenuLabel} onChange={(e) => setNewMenuLabel(e.target.value)} placeholder="Linen Sarees" className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-neutral-400 uppercase mb-0.5">URL Target Route</label>
                      <input type="text" value={newMenuUrl} onChange={(e) => setNewMenuUrl(e.target.value)} placeholder="/collections/linen" className="w-full bg-neutral-955 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white font-mono" />
                    </div>
                  </div>
                ) : (
                  <div>
                    <label className="block text-[8px] font-bold text-neutral-400 uppercase mb-0.5">Select Category Collection</label>
                    <select
                      value={selectedMenuColHandle}
                      onChange={(e) => setSelectedMenuColHandle(e.target.value)}
                      className="w-full bg-neutral-955 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                    >
                      <option value="">-- Choose Category --</option>
                      {collections.map((col: any) => (
                        <option key={col.handle} value={col.handle}>{col.title}</option>
                      ))}
                    </select>
                  </div>
                )}
                <button type="button" onClick={addMenuLink} className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-3 py-1 text-[9px] font-bold uppercase rounded tracking-wider flex items-center gap-1"><Plus className="w-3 h-3" /> Add Link</button>
              </div>

              <div className="space-y-3 max-h-[450px] overflow-y-auto pr-1">
                {menuLinks.map((link, idx) => {
                  const subLinksList = link.subLinks || [];
                  const subType = newSubTypeMap[idx] || "CUSTOM";
                  return (
                    <div key={idx} className="bg-neutral-950 border border-neutral-850 p-3 rounded-lg space-y-2">
                      <div className="flex justify-between items-center bg-neutral-900/60 p-2 rounded">
                        <div>
                          <span className="text-white font-semibold text-xs">{link.label}</span>
                          <span className="text-[10px] text-neutral-400 ml-2">({link.url})</span>
                        </div>
                        <div className="flex gap-1.5">
                          <button type="button" onClick={() => moveItem(menuLinks, setMenuLinks, idx, "UP")} disabled={idx === 0} className="p-1 bg-neutral-950 text-neutral-400 disabled:opacity-20 hover:text-white rounded"><ArrowUp className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => moveItem(menuLinks, setMenuLinks, idx, "DOWN")} disabled={idx === menuLinks.length - 1} className="p-1 bg-neutral-950 text-neutral-400 disabled:opacity-20 hover:text-white rounded"><ArrowDown className="w-3.5 h-3.5" /></button>
                          <button type="button" onClick={() => deleteItem(menuLinks, setMenuLinks, idx)} className="p-1 bg-neutral-950 text-neutral-500 hover:text-red-400 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>

                      {/* Sub Links List */}
                      <div className="pl-4 space-y-1.5 border-l border-neutral-800">
                        {subLinksList.map((sub: any, sIdx: number) => (
                          <div key={sIdx} className="flex justify-between items-center bg-neutral-900/30 p-1.5 rounded text-[11px]">
                            <div>
                              <span className="text-neutral-300 font-medium">{sub.label}</span>
                              <span className="text-[9px] text-neutral-500 ml-2">({sub.url})</span>
                            </div>
                            <div className="flex gap-1">
                              <button type="button" onClick={() => moveSubLink(idx, sIdx, "UP")} disabled={sIdx === 0} className="p-0.5 bg-neutral-950 text-neutral-500 disabled:opacity-20 hover:text-white rounded"><ArrowUp className="w-3 h-3" /></button>
                              <button type="button" onClick={() => moveSubLink(idx, sIdx, "DOWN")} disabled={sIdx === subLinksList.length - 1} className="p-0.5 bg-neutral-950 text-neutral-500 disabled:opacity-20 hover:text-white rounded"><ArrowDown className="w-3 h-3" /></button>
                              <button type="button" onClick={() => deleteSubLink(idx, sIdx)} className="p-0.5 bg-neutral-950 text-neutral-500 hover:text-red-400 rounded"><Trash2 className="w-3.5 h-3.5" /></button>
                            </div>
                          </div>
                        ))}

                        {/* Add Sub-Link Form inline */}
                        <div className="bg-neutral-900/40 p-2 rounded border border-neutral-850 space-y-2 mt-2">
                          <span className="block text-[8px] font-bold text-neutral-400 uppercase tracking-wide">Add Sub-category Menu Item</span>
                          
                          <div className="flex gap-3 mb-1">
                            <label className="flex items-center gap-1 text-[8px] font-bold text-neutral-400 uppercase cursor-pointer">
                              <input type="radio" checked={subType === "CUSTOM"} onChange={() => setNewSubTypeMap({...newSubTypeMap, [idx]: "CUSTOM"})} className="accent-maroonClr" />
                              Custom Link
                            </label>
                            <label className="flex items-center gap-1 text-[8px] font-bold text-neutral-400 uppercase cursor-pointer">
                              <input type="radio" checked={subType === "COLLECTION"} onChange={() => setNewSubTypeMap({...newSubTypeMap, [idx]: "COLLECTION"})} className="accent-maroonClr" />
                              Collection
                            </label>
                          </div>

                          {subType === "CUSTOM" ? (
                            <div className="grid grid-cols-2 gap-1.5">
                              <input type="text" placeholder="Sub-category Label" value={newSubLabelMap[idx] || ""} onChange={(e) => setNewSubLabelMap({...newSubLabelMap, [idx]: e.target.value})} className="bg-neutral-955 border border-neutral-800 rounded px-2 py-1 text-[11px] text-white w-full" />
                              <input type="text" placeholder="Sub-category URL" value={newSubUrlMap[idx] || ""} onChange={(e) => setNewSubUrlMap({...newSubUrlMap, [idx]: e.target.value})} className="bg-neutral-955 border border-neutral-800 rounded px-2 py-1 text-[11px] text-white font-mono w-full" />
                            </div>
                          ) : (
                            <select
                              value={newSubColMap[idx] || ""}
                              onChange={(e) => setNewSubColMap({...newSubColMap, [idx]: e.target.value})}
                              className="bg-neutral-955 border border-neutral-800 rounded px-2 py-1 text-[11px] text-white w-full focus:outline-none"
                            >
                              <option value="">-- Select Category Collection --</option>
                              {collections.map((col: any) => (
                                <option key={col.handle} value={col.handle}>{col.title}</option>
                              ))}
                            </select>
                          )}
                          <button type="button" onClick={() => addSubLink(idx)} className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-2 py-1 text-[8px] font-bold uppercase rounded flex items-center gap-0.5"><Plus className="w-2.5 h-2.5" /> Add Sub-category</button>
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>

              {/* Dynamic Scrolling Marquee Strip */}
              <div className="space-y-3 pt-2">
                <h4 className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-900">4. Scrolling Offer Strip (Marquee)</h4>
                
                <div className="bg-neutral-900 p-3 rounded border border-neutral-850 space-y-3">
                  <div className="grid grid-cols-3 gap-2 items-end">
                    <div className="col-span-2">
                      <label className="block text-[8px] font-bold text-neutral-400 uppercase mb-0.5">Promo Message Text</label>
                      <input type="text" value={newMarqueeText} onChange={(e) => setNewMarqueeText(e.target.value)} placeholder="UP TO 40% OFF" className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-neutral-400 uppercase mb-0.5">Icon Decor</label>
                      <select value={newMarqueeIcon} onChange={(e) => setNewMarqueeIcon(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white">
                        <option value="gift">Gift</option>
                        <option value="star">Star</option>
                        <option value="sparkles">Sparkles</option>
                      </select>
                    </div>
                  </div>
                  <button type="button" onClick={addMarqueeItem} className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-3 py-1 text-[9px] font-bold uppercase tracking-wider flex items-center gap-1"><Plus className="w-3 h-3" /> Add Message</button>
                </div>

                <div className="space-y-1.5 max-h-[150px] overflow-y-auto pr-1">
                  {marqueeItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-neutral-900 border border-neutral-850 p-2 rounded text-xs">
                      <span className="text-white truncate font-medium">{item.text} <span className="text-[9px] text-[#C9A84C] ml-1.5 font-bold uppercase">({item.icon})</span></span>
                      <div className="flex gap-1">
                        <button onClick={() => moveItem(marqueeItems, setMarqueeItems, idx, "UP")} disabled={idx === 0} className="p-0.5 bg-neutral-950 text-neutral-400 disabled:opacity-20"><ArrowUp className="w-3 h-3" /></button>
                        <button onClick={() => moveItem(marqueeItems, setMarqueeItems, idx, "DOWN")} disabled={idx === marqueeItems.length - 1} className="p-0.5 bg-neutral-950 text-neutral-400 disabled:opacity-20"><ArrowDown className="w-3 h-3" /></button>
                        <button onClick={() => deleteItem(marqueeItems, setMarqueeItems, idx)} className="p-0.5 text-neutral-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-neutral-900">
            <button onClick={triggerSaveHeader} disabled={loading} className="bg-maroonClr hover:bg-[#A30C4D] text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-maroonClr/20 disabled:opacity-50"><Save className="w-4 h-4" /> Save Header Layout</button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 2.5: MEGA MENUS EDITOR (Sarees & Collections)
          ---------------------------------------------------- */}
      {activeTab === "MEGAMENU" && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 md:p-8 shadow-sm space-y-8">
          <div className="flex items-center justify-between pb-2 border-b border-neutral-900">
            <div className="flex items-center gap-2">
              <Grid className="w-5 h-5 text-[#C9A84C]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Dropdown Mega Menus & Campaign Banners</h3>
            </div>
            {headerSuccess && (
              <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
              </span>
            )}
          </div>

          {headerSuccess && (
            <div className="p-3.5 bg-green-950/40 border border-green-900/50 text-green-400 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5" />
              <span>{headerSuccess}</span>
            </div>
          )}

          {/* 1. SAREES MEGA MENU SECTION */}
          <div className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-2xl space-y-6">
            <h4 className="text-sm font-bold text-[#C9A84C] uppercase tracking-widest pb-2 border-b border-neutral-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> 1. SAREES MEGA MENU CONFIGURATION
            </h4>

            {/* Campaign Promos for Sarees */}
            <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-4">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">Sarees Mega Menu — Featured Banners (Right Side)</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <ImageOrVideoUploader
                    label="Top Small Banner Image"
                    value={megaMenuSarees.promoTopImage || "/images/client-1.jpg"}
                    onChange={(url) => setMegaMenuSarees({ ...megaMenuSarees, promoTopImage: url })}
                    accept="image/*"
                  />
                  <div className="mt-2">
                    <ChooseExistingLinkAndOverlay
                      label="Top Banner Target & Overlay"
                      linkValue={megaMenuSarees.promoTopLink || "/collections/silk"}
                      textValue={megaMenuSarees.promoTopText || ""}
                      onSelect={(link, text) => setMegaMenuSarees({ ...megaMenuSarees, promoTopLink: link, promoTopText: text })}
                      collections={collections}
                      products={products}
                    />
                  </div>
                </div>

                <div>
                  <ImageOrVideoUploader
                    label="Bottom Featured Card Image"
                    value={megaMenuSarees.promoBottomImage || "/images/client-4.jpg"}
                    onChange={(url) => setMegaMenuSarees({ ...megaMenuSarees, promoBottomImage: url })}
                    accept="image/*"
                  />
                  <div className="mt-2">
                    <ChooseExistingLinkAndOverlay
                      label="Bottom Featured Card Target & Text Overlay"
                      linkValue={megaMenuSarees.promoBottomLink || "/collections/festive"}
                      textValue={megaMenuSarees.promoBottomText || "Festive Sarees - 45% OFF"}
                      onSelect={(link, text) => setMegaMenuSarees({ ...megaMenuSarees, promoBottomLink: link, promoBottomText: text })}
                      collections={collections}
                      products={products}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Fabrics & Occasions Links List Editors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Col 1: Fabrics List */}
              <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider">Col 1: Fabrics & Weaves</h5>
                  <button
                    type="button"
                    onClick={() => {
                      const list = megaMenuSarees.fabrics ? [...megaMenuSarees.fabrics] : [];
                      list.push({ label: "NEW FABRIC", handle: "silk", img: "/images/client-1.jpg" });
                      setMegaMenuSarees({ ...megaMenuSarees, fabrics: list });
                    }}
                    className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-2 py-0.5 text-[8px] font-bold uppercase rounded flex items-center gap-0.5"
                  >
                    <Plus className="w-2.5 h-2.5" /> Add
                  </button>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {(megaMenuSarees.fabrics || []).map((item: any, idx: number) => (
                    <div key={idx} className="bg-neutral-900 border border-neutral-850 p-2.5 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-[#C9A84C]">Item #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const list = megaMenuSarees.fabrics.filter((_: any, i: number) => i !== idx);
                            setMegaMenuSarees({ ...megaMenuSarees, fabrics: list });
                          }}
                          className="text-neutral-500 hover:text-red-400 p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <ImageOrVideoUploader
                        label="Thumbnail Image"
                        value={item.img}
                        onChange={(url) => {
                          const list = [...megaMenuSarees.fabrics];
                          list[idx] = { ...list[idx], img: url };
                          setMegaMenuSarees({ ...megaMenuSarees, fabrics: list });
                        }}
                        accept="image/*"
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => {
                            const list = [...megaMenuSarees.fabrics];
                            list[idx] = { ...list[idx], label: e.target.value };
                            setMegaMenuSarees({ ...megaMenuSarees, fabrics: list });
                          }}
                          placeholder="Label Name"
                          className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[10px] text-white w-full"
                        />
                        <input
                          type="text"
                          value={item.handle}
                          onChange={(e) => {
                            const list = [...megaMenuSarees.fabrics];
                            list[idx] = { ...list[idx], handle: e.target.value };
                            setMegaMenuSarees({ ...megaMenuSarees, fabrics: list });
                          }}
                          placeholder="Target Handle"
                          className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[10px] text-white font-mono w-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Col 2: Occasions List */}
              <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider">Col 2: Sarees by Occasion</h5>
                  <button
                    type="button"
                    onClick={() => {
                      const list = megaMenuSarees.occasions ? [...megaMenuSarees.occasions] : [];
                      list.push({ label: "NEW OCCASION", handle: "festive", img: "/images/client-2.jpg" });
                      setMegaMenuSarees({ ...megaMenuSarees, occasions: list });
                    }}
                    className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-2 py-0.5 text-[8px] font-bold uppercase rounded flex items-center gap-0.5"
                  >
                    <Plus className="w-2.5 h-2.5" /> Add
                  </button>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {(megaMenuSarees.occasions || []).map((item: any, idx: number) => (
                    <div key={idx} className="bg-neutral-900 border border-neutral-850 p-2.5 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-[#C9A84C]">Item #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const list = megaMenuSarees.occasions.filter((_: any, i: number) => i !== idx);
                            setMegaMenuSarees({ ...megaMenuSarees, occasions: list });
                          }}
                          className="text-neutral-500 hover:text-red-400 p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <ImageOrVideoUploader
                        label="Thumbnail Image"
                        value={item.img}
                        onChange={(url) => {
                          const list = [...megaMenuSarees.occasions];
                          list[idx] = { ...list[idx], img: url };
                          setMegaMenuSarees({ ...megaMenuSarees, occasions: list });
                        }}
                        accept="image/*"
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => {
                            const list = [...megaMenuSarees.occasions];
                            list[idx] = { ...list[idx], label: e.target.value };
                            setMegaMenuSarees({ ...megaMenuSarees, occasions: list });
                          }}
                          placeholder="Label Name"
                          className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[10px] text-white w-full"
                        />
                        <input
                          type="text"
                          value={item.handle}
                          onChange={(e) => {
                            const list = [...megaMenuSarees.occasions];
                            list[idx] = { ...list[idx], handle: e.target.value };
                            setMegaMenuSarees({ ...megaMenuSarees, occasions: list });
                          }}
                          placeholder="Target Handle"
                          className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[10px] text-white font-mono w-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Col 3: Colors List */}
              <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider">Col 3: Colors & Crafts</h5>
                  <button
                    type="button"
                    onClick={() => {
                      const list = megaMenuSarees.colors ? [...megaMenuSarees.colors] : [];
                      list.push({ label: "NEW COLOR", handle: "red", img: "/images/client-3.jpg" });
                      setMegaMenuSarees({ ...megaMenuSarees, colors: list });
                    }}
                    className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-2 py-0.5 text-[8px] font-bold uppercase rounded flex items-center gap-0.5"
                  >
                    <Plus className="w-2.5 h-2.5" /> Add
                  </button>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {(megaMenuSarees.colors || []).map((item: any, idx: number) => (
                    <div key={idx} className="bg-neutral-900 border border-neutral-850 p-2.5 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-[#C9A84C]">Item #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const list = megaMenuSarees.colors.filter((_: any, i: number) => i !== idx);
                            setMegaMenuSarees({ ...megaMenuSarees, colors: list });
                          }}
                          className="text-neutral-500 hover:text-red-400 p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <ImageOrVideoUploader
                        label="Thumbnail Image"
                        value={item.img}
                        onChange={(url) => {
                          const list = [...megaMenuSarees.colors];
                          list[idx] = { ...list[idx], img: url };
                          setMegaMenuSarees({ ...megaMenuSarees, colors: list });
                        }}
                        accept="image/*"
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => {
                            const list = [...megaMenuSarees.colors];
                            list[idx] = { ...list[idx], label: e.target.value };
                            setMegaMenuSarees({ ...megaMenuSarees, colors: list });
                          }}
                          placeholder="Label Name"
                          className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[10px] text-white w-full"
                        />
                        <input
                          type="text"
                          value={item.handle}
                          onChange={(e) => {
                            const list = [...megaMenuSarees.colors];
                            list[idx] = { ...list[idx], handle: e.target.value };
                            setMegaMenuSarees({ ...megaMenuSarees, colors: list });
                          }}
                          placeholder="Target Handle"
                          className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[10px] text-white font-mono w-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>


          {/* 2. COLLECTIONS MEGA MENU SECTION */}
          <div className="bg-neutral-900/40 border border-neutral-850 p-6 rounded-2xl space-y-6">
            <h4 className="text-sm font-bold text-[#C9A84C] uppercase tracking-widest pb-2 border-b border-neutral-800 flex items-center gap-2">
              <Sparkles className="w-4 h-4" /> 2. COLLECTIONS MEGA MENU CONFIGURATION
            </h4>

            {/* Campaign Promos for Collections */}
            <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-4">
              <h5 className="text-xs font-bold text-white uppercase tracking-wider">Collections Mega Menu — Featured Banners (Right Side)</h5>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <ImageOrVideoUploader
                    label="Top Small Banner Image"
                    value={megaMenuCollections.promoTopImage || "/images/client-2.jpg"}
                    onChange={(url) => setMegaMenuCollections({ ...megaMenuCollections, promoTopImage: url })}
                    accept="image/*"
                  />
                  <div className="mt-2">
                    <ChooseExistingLinkAndOverlay
                      label="Top Banner Target & Overlay"
                      linkValue={megaMenuCollections.promoTopLink || "/collections"}
                      textValue={megaMenuCollections.promoTopText || ""}
                      onSelect={(link, text) => setMegaMenuCollections({ ...megaMenuCollections, promoTopLink: link, promoTopText: text })}
                      collections={collections}
                      products={products}
                    />
                  </div>
                </div>

                <div>
                  <ImageOrVideoUploader
                    label="Bottom Featured Card Image"
                    value={megaMenuCollections.promoBottomImage || "/images/client-5.jpg"}
                    onChange={(url) => setMegaMenuCollections({ ...megaMenuCollections, promoBottomImage: url })}
                    accept="image/*"
                  />
                  <div className="mt-2">
                    <ChooseExistingLinkAndOverlay
                      label="Bottom Featured Card Target & Text Overlay"
                      linkValue={megaMenuCollections.promoBottomLink || "/collections/sale"}
                      textValue={megaMenuCollections.promoBottomText || "Explore Collections - 45% OFF"}
                      onSelect={(link, text) => setMegaMenuCollections({ ...megaMenuCollections, promoBottomLink: link, promoBottomText: text })}
                      collections={collections}
                      products={products}
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Categories & Occasions Links List Editors */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {/* Col 1: All Categories List */}
              <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider">Col 1: All Categories</h5>
                  <button
                    type="button"
                    onClick={() => {
                      const list = megaMenuCollections.categories ? [...megaMenuCollections.categories] : [];
                      list.push({ label: "NEW CATEGORY", handle: "saree", img: "/images/client-1.jpg" });
                      setMegaMenuCollections({ ...megaMenuCollections, categories: list });
                    }}
                    className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-2 py-0.5 text-[8px] font-bold uppercase rounded flex items-center gap-0.5"
                  >
                    <Plus className="w-2.5 h-2.5" /> Add
                  </button>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {(megaMenuCollections.categories || []).map((item: any, idx: number) => (
                    <div key={idx} className="bg-neutral-900 border border-neutral-850 p-2.5 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-[#C9A84C]">Item #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const list = megaMenuCollections.categories.filter((_: any, i: number) => i !== idx);
                            setMegaMenuCollections({ ...megaMenuCollections, categories: list });
                          }}
                          className="text-neutral-500 hover:text-red-400 p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <ImageOrVideoUploader
                        label="Thumbnail Image"
                        value={item.img}
                        onChange={(url) => {
                          const list = [...megaMenuCollections.categories];
                          list[idx] = { ...list[idx], img: url };
                          setMegaMenuCollections({ ...megaMenuCollections, categories: list });
                        }}
                        accept="image/*"
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => {
                            const list = [...megaMenuCollections.categories];
                            list[idx] = { ...list[idx], label: e.target.value };
                            setMegaMenuCollections({ ...megaMenuCollections, categories: list });
                          }}
                          placeholder="Label Name"
                          className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[10px] text-white w-full"
                        />
                        <input
                          type="text"
                          value={item.handle}
                          onChange={(e) => {
                            const list = [...megaMenuCollections.categories];
                            list[idx] = { ...list[idx], handle: e.target.value };
                            setMegaMenuCollections({ ...megaMenuCollections, categories: list });
                          }}
                          placeholder="Target Handle"
                          className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[10px] text-white font-mono w-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Col 2: Occasions List */}
              <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider">Col 2: Shop by Occasion</h5>
                  <button
                    type="button"
                    onClick={() => {
                      const list = megaMenuCollections.occasions ? [...megaMenuCollections.occasions] : [];
                      list.push({ label: "NEW OCCASION", handle: "festive", img: "/images/client-2.jpg" });
                      setMegaMenuCollections({ ...megaMenuCollections, occasions: list });
                    }}
                    className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-2 py-0.5 text-[8px] font-bold uppercase rounded flex items-center gap-0.5"
                  >
                    <Plus className="w-2.5 h-2.5" /> Add
                  </button>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {(megaMenuCollections.occasions || []).map((item: any, idx: number) => (
                    <div key={idx} className="bg-neutral-900 border border-neutral-850 p-2.5 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-[#C9A84C]">Item #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const list = megaMenuCollections.occasions.filter((_: any, i: number) => i !== idx);
                            setMegaMenuCollections({ ...megaMenuCollections, occasions: list });
                          }}
                          className="text-neutral-500 hover:text-red-400 p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <ImageOrVideoUploader
                        label="Thumbnail Image"
                        value={item.img}
                        onChange={(url) => {
                          const list = [...megaMenuCollections.occasions];
                          list[idx] = { ...list[idx], img: url };
                          setMegaMenuCollections({ ...megaMenuCollections, occasions: list });
                        }}
                        accept="image/*"
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => {
                            const list = [...megaMenuCollections.occasions];
                            list[idx] = { ...list[idx], label: e.target.value };
                            setMegaMenuCollections({ ...megaMenuCollections, occasions: list });
                          }}
                          placeholder="Label Name"
                          className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[10px] text-white w-full"
                        />
                        <input
                          type="text"
                          value={item.handle}
                          onChange={(e) => {
                            const list = [...megaMenuCollections.occasions];
                            list[idx] = { ...list[idx], handle: e.target.value };
                            setMegaMenuCollections({ ...megaMenuCollections, occasions: list });
                          }}
                          placeholder="Target Handle"
                          className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[10px] text-white font-mono w-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Col 3: Colors List */}
              <div className="bg-neutral-950 border border-neutral-800 p-4 rounded-xl space-y-3">
                <div className="flex justify-between items-center pb-2 border-b border-neutral-800">
                  <h5 className="text-xs font-bold text-white uppercase tracking-wider">Col 3: Shop by Color</h5>
                  <button
                    type="button"
                    onClick={() => {
                      const list = megaMenuCollections.colors ? [...megaMenuCollections.colors] : [];
                      list.push({ label: "NEW COLOR", handle: "red", img: "/images/client-3.jpg" });
                      setMegaMenuCollections({ ...megaMenuCollections, colors: list });
                    }}
                    className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-2 py-0.5 text-[8px] font-bold uppercase rounded flex items-center gap-0.5"
                  >
                    <Plus className="w-2.5 h-2.5" /> Add
                  </button>
                </div>
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1">
                  {(megaMenuCollections.colors || []).map((item: any, idx: number) => (
                    <div key={idx} className="bg-neutral-900 border border-neutral-850 p-2.5 rounded-lg space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-[10px] font-bold text-[#C9A84C]">Item #{idx + 1}</span>
                        <button
                          type="button"
                          onClick={() => {
                            const list = megaMenuCollections.colors.filter((_: any, i: number) => i !== idx);
                            setMegaMenuCollections({ ...megaMenuCollections, colors: list });
                          }}
                          className="text-neutral-500 hover:text-red-400 p-0.5"
                        >
                          <Trash2 className="w-3 h-3" />
                        </button>
                      </div>
                      <ImageOrVideoUploader
                        label="Thumbnail Image"
                        value={item.img}
                        onChange={(url) => {
                          const list = [...megaMenuCollections.colors];
                          list[idx] = { ...list[idx], img: url };
                          setMegaMenuCollections({ ...megaMenuCollections, colors: list });
                        }}
                        accept="image/*"
                      />
                      <div className="grid grid-cols-2 gap-1.5">
                        <input
                          type="text"
                          value={item.label}
                          onChange={(e) => {
                            const list = [...megaMenuCollections.colors];
                            list[idx] = { ...list[idx], label: e.target.value };
                            setMegaMenuCollections({ ...megaMenuCollections, colors: list });
                          }}
                          placeholder="Label Name"
                          className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[10px] text-white w-full"
                        />
                        <input
                          type="text"
                          value={item.handle}
                          onChange={(e) => {
                            const list = [...megaMenuCollections.colors];
                            list[idx] = { ...list[idx], handle: e.target.value };
                            setMegaMenuCollections({ ...megaMenuCollections, colors: list });
                          }}
                          placeholder="Target Handle"
                          className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-[10px] text-white font-mono w-full"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-neutral-900">
            <button onClick={triggerSaveHeader} disabled={loading} className="bg-maroonClr hover:bg-[#A30C4D] text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-maroonClr/20 disabled:opacity-50">
              <Save className="w-4 h-4" /> Save Mega Menus Configuration
            </button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 3: BANNERS (Hero slideshow)
          ---------------------------------------------------- */}
      {activeTab === "BANNERS" && (
        <div className="space-y-6">
          <div className="flex justify-between items-center bg-neutral-950 p-4 rounded-xl border border-neutral-800">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#C9A84C]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Homepage Banner Slides</h3>
            </div>
            <button
              onClick={handleAddBanner}
              className="bg-neutral-900 border border-neutral-800 hover:border-neutral-700 text-white px-3.5 py-2 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-colors flex items-center gap-1.5"
            >
              <Plus className="w-4 h-4 text-[#C9A84C]" /> Add Slide
            </button>
          </div>

          {bannersSuccess && (
            <div className="p-3.5 bg-green-950/40 border border-green-900/50 text-green-400 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5" />
              <span>{bannersSuccess}</span>
            </div>
          )}

          <div className="space-y-6">
            {banners.map((slide, index) => (
              <div key={slide.id} className="bg-neutral-950 border border-neutral-800 hover:border-neutral-755 transition-all rounded-xl p-5 shadow-sm space-y-4 relative">
                <div className="absolute right-4 top-4 flex gap-1">
                  <button onClick={() => moveItem(banners, setBanners, index, "UP")} disabled={index === 0} className="p-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded border border-neutral-800 disabled:opacity-20"><ArrowUp className="w-3.5 h-3.5" /></button>
                  <button onClick={() => moveItem(banners, setBanners, index, "DOWN")} disabled={index === banners.length - 1} className="p-1 bg-neutral-900 hover:bg-neutral-800 text-neutral-400 hover:text-white rounded border border-neutral-800 disabled:opacity-20"><ArrowDown className="w-3.5 h-3.5" /></button>
                  <button onClick={() => deleteItem(banners, setBanners, index)} className="p-1 bg-neutral-900 hover:bg-red-950/40 text-neutral-500 hover:text-red-400 rounded border border-neutral-800"><Trash2 className="w-3.5 h-3.5" /></button>
                </div>
                <h4 className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-900">Slide #{index + 1}</h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6 bg-neutral-900/30 p-5 rounded-xl border border-neutral-850">
                  {/* Desktop configuration panel */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-800/60 flex items-center gap-1.5">
                      <Laptop className="w-3.5 h-3.5" /> 1. Desktop Slide Media
                    </h5>
                    <ImageOrVideoUploader
                      label="Desktop Banner Image"
                      value={slide.imageUrl}
                      onChange={(url) => handleBannerChange(index, "imageUrl", url)}
                      accept="image/*"
                    />
                    <div className="pt-1.5">
                      <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Slide Title</label>
                      <input type="text" value={slide.title} onChange={(e) => handleBannerChange(index, "title", e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-maroonClr" />
                    </div>
                  </div>

                  {/* Mobile portrait configuration panel */}
                  <div className="space-y-4">
                    <h5 className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-800/60 flex items-center gap-1.5">
                      <Smartphone className="w-3.5 h-3.5" /> 2. Mobile Slide Media (Portrait)
                    </h5>
                    <ImageOrVideoUploader
                      label="Mobile Portrait Image"
                      value={slide.mobileImageUrl || ""}
                      onChange={(url) => handleBannerChange(index, "mobileImageUrl", url)}
                      accept="image/*"
                    />
                    <div className="pt-1.5">
                      <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Slide Subtitle</label>
                      <input type="text" value={slide.subtitle} onChange={(e) => handleBannerChange(index, "subtitle", e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-maroonClr" />
                    </div>
                  </div>

                  {/* CTA & Link row */}
                  <div className="col-span-1 md:col-span-2 pt-3 border-t border-neutral-800/60">
                    <ChooseExistingLinkAndOverlay
                      label="Choose Target Collection / Product (Auto-Fills Slide Title & Action Link)"
                      linkValue={slide.link || ""}
                      textValue={slide.title || ""}
                      onSelect={(link, text) => {
                        const updated = [...banners];
                        updated[index] = { ...updated[index], link, title: text };
                        setBanners(updated);
                      }}
                      collections={collections}
                      products={products}
                    />
                  </div>
                </div>
              </div>
            ))}
          </div>

          <button onClick={triggerSaveBanners} disabled={loading} className="bg-maroonClr hover:bg-[#A30C4D] text-white px-5 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-maroonClr/20 disabled:opacity-50"><Save className="w-4 h-4" /> Save Banner Slideshow</button>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 4: HOMEPAGE CMS
          ---------------------------------------------------- */}
      {activeTab === "HOMEPAGE" && (
        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 items-start">
          
          {/* Subsections Menu */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-3 flex flex-col gap-1 lg:sticky lg:top-24">
            <p className="text-[10px] font-bold text-neutral-500 uppercase tracking-wider px-3 mb-2 pt-2">Homepage Sections</p>
            {[
              { id: "lovedCollections", label: "Our Most Loved Collections", icon: Heart },
              { id: "trendingCollections", label: "Top Trending Collections", icon: Star },
              { id: "patternBanner", label: "Shoppable Video Reels", icon: Video },
              { id: "promoBanners", label: "Featured Campaign Banners", icon: ImageIcon },
              { id: "occasionFinder", label: "Shop By Occasion", icon: Compass },
              { id: "celebritySpotlight", label: "Styled by You, Crafted by Us", icon: Sparkles },
              { id: "fabricLibrary", label: "Our Fabric Library", icon: BookOpen },
              { id: "artisanTimeline", label: "Artisans & Weavers", icon: Sparkles },
              { id: "storyDrape", label: "From Thread to Royal Drape", icon: Feather },
              { id: "asSeenInPress", label: "As Featured In (Press)", icon: Award },
              { id: "topSellings", label: "Top-Sellings Products", icon: List },
              { id: "perfectSaree", label: "Perfect Saree Tabs", icon: Compass },
              { id: "bestCategories", label: "Best Categories Grid", icon: Grid },
              { id: "features", label: "Value Props / Features", icon: Gift },
              { id: "testimonials", label: "Customer Reviews", icon: MessageSquare },
              { id: "faqs", label: "Frequently FAQs", icon: HelpCircle }
            ].map((section) => {
              const Icon = section.icon;
              return (
                <button
                  key={section.id}
                  onClick={() => {
                    setActiveSubSection(section.id);
                    setHomeSuccess("");
                    setError("");
                  }}
                  className={`w-full text-left px-3 py-2 rounded-lg text-xs font-semibold flex items-center gap-2.5 transition-colors ${
                    activeSubSection === section.id
                      ? "bg-maroonClr/20 text-white border-l-2 border-[#C9A84C]"
                      : "text-neutral-400 hover:bg-neutral-900 hover:text-white"
                  }`}
                >
                  <Icon className="w-4 h-4 shrink-0 text-[#C9A84C]" />
                  <span>{section.label}</span>
                </button>
              );
            })}
          </div>

          {/* Subsections Editors */}
          <div className="lg:col-span-3 bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-6">
            
            {homeSuccess && (
              <div className="p-3.5 bg-green-955/40 border border-green-900/50 text-green-400 text-xs rounded-lg flex items-center gap-2">
                <CheckCircle2 className="w-4.5 h-4.5" />
                <span>{homeSuccess}</span>
              </div>
            )}

            {/* Subsection 1: Loved Collections */}
            {activeSubSection === "lovedCollections" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-900">1. Our Most Loved Collections (6 Boxes)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Section Title</label>
                    <input type="text" value={lovedCollectionsTitle} onChange={(e) => setLovedCollectionsTitle(e.target.value)} className="w-full bg-neutral-900 border border-neutral-850 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-maroonClr" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Section Subtitle</label>
                    <input type="text" value={lovedCollectionsSubtitle} onChange={(e) => setLovedCollectionsSubtitle(e.target.value)} className="w-full bg-neutral-900 border border-neutral-850 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-maroonClr" />
                  </div>
                </div>

                {/* Add collection item */}
                <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-850 space-y-3">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Add Featured Collection Card</h4>
                  
                  <ImageOrVideoUploader
                    label="Custom Cover Image"
                    value={lovedColImage}
                    onChange={setLovedColImage}
                    accept="image/*"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1.5">
                    <div>
                      <label className="block text-[8px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Select Collection</label>
                      <select
                        value={lovedColHandle}
                        onChange={(e) => {
                          const handle = e.target.value;
                          setLovedColHandle(handle);
                          const matched = collections.find((c: any) => c.handle === handle);
                          if (matched && !lovedColTitle) {
                            setLovedColTitle(matched.title);
                          }
                        }}
                        className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                      >
                        <option value="">-- Choose Store Collection --</option>
                        {collections.map(c => <option key={c.id} value={c.handle}>{c.title}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Custom Title (Optional)</label>
                      <input type="text" value={lovedColTitle} onChange={(e) => setLovedColTitle(e.target.value)} className="w-full bg-neutral-955 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none" />
                    </div>
                  </div>
                  <button type="button" onClick={addLovedCollection} className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-3 py-1 text-[10px] font-bold uppercase rounded tracking-wider transition-colors flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Collection</button>
                </div>

                {/* Items List */}
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                  {lovedCollectionsItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-neutral-900 border border-neutral-850 p-2.5 rounded-lg text-xs">
                      <div className="flex items-center gap-3">
                        {(item.customImage || item.image) && <img src={item.customImage || item.image} alt="" className="w-7 h-7 object-cover rounded border border-neutral-800" />}
                        <div>
                          <span className="font-semibold text-white uppercase">{item.customTitle || item.title || item.collectionHandle}</span>
                          <span className="text-[10px] text-neutral-400 ml-2">({item.handle || item.collectionHandle})</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => moveItem(lovedCollectionsItems, setLovedCollectionsItems, idx, "UP")} disabled={idx === 0} className="p-1 bg-neutral-955 text-neutral-450 disabled:opacity-20"><ArrowUp className="w-3.5 h-3.5" /></button>
                        <button onClick={() => moveItem(lovedCollectionsItems, setLovedCollectionsItems, idx, "DOWN")} disabled={idx === lovedCollectionsItems.length - 1} className="p-1 bg-neutral-955 text-neutral-450 disabled:opacity-20"><ArrowDown className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteItem(lovedCollectionsItems, setLovedCollectionsItems, idx)} className="p-1 bg-neutral-955 hover:text-red-400 text-neutral-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subsection 1.5: Trending Collections Cards */}
            {activeSubSection === "trendingCollections" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-900">Top Trending Collections (5 Simple Cards)</h3>
                <div>
                  <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Section Title</label>
                  <input type="text" value={trendingCollectionsTitle} onChange={(e) => setTrendingCollectionsTitle(e.target.value)} className="w-full bg-neutral-900 border border-neutral-850 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-maroonClr" />
                </div>

                {/* Add Trending Collection Item Box */}
                <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-850 space-y-3">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Add Trending Collection Card</h4>
                  
                  <ImageOrVideoUploader
                    label="Custom Cover Image (PNG with transparent bg supported)"
                    value={trendColImage}
                    onChange={setTrendColImage}
                    accept="image/*"
                  />

                  <div className="space-y-2 pt-1.5">
                    <ItemPickerPopover
                      label="Select Store Collection"
                      linkValue={trendColHandle ? `/collections/${trendColHandle}` : ""}
                      textValue={trendColTitle}
                      onSelect={(link, title) => {
                        const handle = link.replace("/collections/", "").replace("/products/", "");
                        setTrendColHandle(handle);
                        if (!trendColTitle) setTrendColTitle(title);
                      }}
                      collections={collections}
                      products={[]}
                    />

                    <div>
                      <label className="block text-[8px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Custom Title (Optional)</label>
                      <input type="text" value={trendColTitle} onChange={(e) => setTrendColTitle(e.target.value)} className="w-full bg-neutral-955 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none" />
                    </div>
                  </div>
                  <button type="button" onClick={addTrendingCollection} className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-3 py-1 text-[10px] font-bold uppercase rounded tracking-wider transition-colors flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Collection</button>
                </div>

                {/* Items List */}
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                  {trendingCollectionsItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-neutral-900 border border-neutral-850 p-2.5 rounded-lg text-xs">
                      <div className="flex items-center gap-3">
                        {item.image && <img src={item.image} alt="" className="w-7 h-7 object-cover rounded border border-neutral-800" />}
                        <div>
                          <span className="font-semibold text-white uppercase">{item.title}</span>
                          <span className="text-[10px] text-neutral-400 ml-2">({item.handle})</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => moveItem(trendingCollectionsItems, setTrendingCollectionsItems, idx, "UP")} disabled={idx === 0} className="p-1 bg-neutral-955 text-neutral-450 disabled:opacity-20"><ArrowUp className="w-3.5 h-3.5" /></button>
                        <button onClick={() => moveItem(trendingCollectionsItems, setTrendingCollectionsItems, idx, "DOWN")} disabled={idx === trendingCollectionsItems.length - 1} className="p-1 bg-neutral-955 text-neutral-450 disabled:opacity-20"><ArrowDown className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteItem(trendingCollectionsItems, setTrendingCollectionsItems, idx)} className="p-1 bg-neutral-955 hover:text-red-400 text-neutral-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subsection 2: Pattern Banner */}
            {activeSubSection === "patternBanner" && (
              <div className="space-y-6">
                <h3 className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-900">2. Pattern Banner (Headline & Reels)</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Banner Text Headline</label>
                    <input type="text" value={patternBannerHeading} onChange={(e) => setPatternBannerHeading(e.target.value)} className="w-full bg-neutral-900 border border-neutral-850 rounded px-3 py-2 text-xs text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Background Media File (Fallback)</label>
                    <ImageOrVideoUploader
                      label="Background Media File"
                      value={patternBannerMediaUrl}
                      onChange={setPatternBannerMediaUrl}
                      accept={patternBannerType === "VIDEO" ? "video/*" : "image/*"}
                    />
                  </div>
                </div>

                {/* Reels Customizer */}
                <div className="space-y-4 pt-4 border-t border-neutral-900">
                  <div className="flex justify-between items-center bg-neutral-900/60 p-3 rounded-lg border border-neutral-850">
                    <div>
                      <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Shoppable Video Reels</h4>
                      <p className="text-[9px] text-neutral-500 mt-0.5">Configure portrait videos with product titles, pricing and links.</p>
                    </div>
                    <button
                      type="button"
                      onClick={handleAddReel}
                      className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-3 py-1.5 text-[9px] font-bold uppercase rounded tracking-wider flex items-center gap-1 transition-colors"
                    >
                      <Plus className="w-3 h-3" /> Add Video Card
                    </button>
                  </div>

                  <div className="space-y-4">
                    {reels.map((reel, index) => (
                      <div key={reel.id} className="bg-neutral-900/40 border border-neutral-855 p-4 rounded-xl space-y-4 relative group">
                        <div className="absolute right-4 top-4 flex gap-1">
                          <button type="button" onClick={() => moveItem(reels, setReels, index, "UP")} disabled={index === 0} className="p-1 bg-neutral-950 hover:bg-neutral-900 text-neutral-400 hover:text-white rounded border border-neutral-800 disabled:opacity-20"><ArrowUp className="w-3 h-3" /></button>
                          <button type="button" onClick={() => moveItem(reels, setReels, index, "DOWN")} disabled={index === reels.length - 1} className="p-1 bg-neutral-955 hover:bg-neutral-900 text-neutral-400 hover:text-white rounded border border-neutral-800 disabled:opacity-20"><ArrowDown className="w-3 h-3" /></button>
                          <button type="button" onClick={() => deleteItem(reels, setReels, index)} className="p-1 bg-neutral-955 hover:bg-red-950/40 text-neutral-500 hover:text-red-400 rounded border border-neutral-800"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                        
                        <h5 className="text-[10px] font-bold text-[#C9A84C] uppercase tracking-wider">Video Card #{index + 1}</h5>
                        
                        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                          <div className="space-y-2">
                            <ImageOrVideoUploader
                              label="Video File"
                              value={reel.videoUrl || ""}
                              onChange={(url) => handleReelChange(index, "videoUrl", url)}
                              accept="video/*"
                            />
                            <div>
                              <label className="block text-[8px] font-bold text-neutral-500 uppercase">Views Badge (e.g. 12K)</label>
                              <input type="text" value={reel.views || ""} onChange={(e) => handleReelChange(index, "views", e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none" />
                            </div>
                                          <div className="space-y-2">
                            <ItemPickerPopover
                              label="Choose Store Product (Auto-Fills Details)"
                              linkValue={reel.productHandle ? `/products/${reel.productHandle}` : ""}
                              textValue={reel.title || ""}
                              onSelect={(link, title) => {
                                const selectedHandle = link.replace("/products/", "").replace("/collections/", "");
                                const matchedProd = products.find((p: any) => p.handle === selectedHandle || p.id === selectedHandle);
                                const updated = [...reels];
                                if (matchedProd) {
                                  const rawPrice = matchedProd.price?.amount || matchedProd.price || matchedProd.priceRange?.minVariantPrice?.amount;
                                  const rawCompare = matchedProd.compareAtPrice?.amount || matchedProd.compareAtPrice || matchedProd.compareAtPriceRange?.minVariantPrice?.amount;
                                  
                                  const pNum = typeof rawPrice === 'number' ? rawPrice : parseFloat(String(rawPrice || "").replace(/[^0-9.]/g, ""));
                                  const cNum = typeof rawCompare === 'number' ? rawCompare : parseFloat(String(rawCompare || "").replace(/[^0-9.]/g, ""));
                                  let badge = "";
                                  if (cNum > pNum && pNum > 0) {
                                    badge = `${Math.round(((cNum - pNum) / cNum) * 100)}% OFF`;
                                  }

                                  const formattedP = typeof rawPrice === 'number' ? `₹ ${rawPrice.toLocaleString("en-IN")}` : (rawPrice ? (String(rawPrice).startsWith("₹") ? String(rawPrice) : `₹ ${rawPrice}`) : "");
                                  const formattedC = typeof rawCompare === 'number' ? `₹ ${rawCompare.toLocaleString("en-IN")}` : (rawCompare ? (String(rawCompare).startsWith("₹") ? String(rawCompare) : `₹ ${rawCompare}`) : "");

                                  updated[index] = {
                                    ...updated[index],
                                    productHandle: matchedProd.handle,
                                    title: matchedProd.title,
                                    price: formattedP,
                                    compareAtPrice: formattedC,
                                    discountBadge: badge,
                                    link: `/products/${matchedProd.handle}`
                                  };
                                } else {
                                  updated[index] = { ...updated[index], productHandle: selectedHandle, title: title || selectedHandle, link: `/products/${selectedHandle}` };
                                }
                                setReels(updated);
                              }}
                              collections={[]}
                              products={products}
                            />
                            <div>
                              <label className="block text-[8px] font-bold text-neutral-500 uppercase">Product Title</label>
                              <input type="text" value={reel.title || ""} onChange={(e) => handleReelChange(index, "title", e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none" />
                            </div>               </div>
                            <div className="grid grid-cols-2 gap-2">
                              <div>
                                <label className="block text-[8px] font-bold text-neutral-500 uppercase">Price (INR)</label>
                                <input type="text" value={reel.price || ""} onChange={(e) => handleReelChange(index, "price", e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-white focus:outline-none" />
                              </div>
                              <div>
                                <label className="block text-[8px] font-bold text-neutral-500 uppercase">Compare Price</label>
                                <input type="text" value={reel.compareAtPrice || ""} onChange={(e) => handleReelChange(index, "compareAtPrice", e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded px-2 py-1 text-xs text-white focus:outline-none" />
                              </div>
                            </div>
                          </div>
                          <div>
                            <label className="block text-[8px] font-bold text-neutral-500 uppercase mb-1">Product Action / Target Link</label>
                            <input type="text" value={reel.link || ""} onChange={(e) => handleReelChange(index, "link", e.target.value)} placeholder="/products/handle" className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none" />
                            <span className="text-[8px] text-neutral-500 block mt-1">E.g., /products/woven-kanjivaram-silk-blend-saree-pink</span>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* Subsection: Occasion Finder */}
            {activeSubSection === "occasionFinder" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-900">Shop By Occasion Customizer</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Section Title</label>
                    <input type="text" value={occasionFinderTitle} onChange={(e) => setOccasionFinderTitle(e.target.value)} className="w-full bg-neutral-900 border border-neutral-850 rounded px-3 py-2 text-xs text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Section Subtitle</label>
                    <input type="text" value={occasionFinderSubtitle} onChange={(e) => setOccasionFinderSubtitle(e.target.value)} className="w-full bg-neutral-900 border border-neutral-850 rounded px-3 py-2 text-xs text-white focus:outline-none" />
                  </div>
                </div>

                <div className="flex justify-between items-center bg-neutral-900 p-3 rounded-lg border border-neutral-850">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Occasion Tabs List</span>
                  <button
                    type="button"
                    onClick={() => setOccasionFinderItems([
                      ...occasionFinderItems,
                      { id: `occ_${Date.now()}`, name: "Partywear", subtitle: "Georgette & Chiffon Drapes", products: [] }
                    ])}
                    className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-3 py-1 text-[9px] font-bold uppercase rounded flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Occasion Tab
                  </button>
                </div>

                <div className="space-y-3">
                  {occasionFinderItems.map((item, idx) => (
                    <div key={idx} className="bg-neutral-900/40 border border-neutral-850 p-3 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[#C9A84C] uppercase">Occasion #{idx + 1}</span>
                        <button type="button" onClick={() => deleteItem(occasionFinderItems, setOccasionFinderItems, idx)} className="p-1 text-neutral-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="grid grid-cols-2 gap-2">
                        <div>
                          <label className="block text-[8px] font-bold text-neutral-400 uppercase mb-0.5">Occasion Name</label>
                          <input type="text" value={item.name} onChange={(e) => {
                            const updated = [...occasionFinderItems];
                            updated[idx] = { ...updated[idx], name: e.target.value };
                            setOccasionFinderItems(updated);
                          }} className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white" />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-neutral-400 uppercase mb-0.5">Subtitle Description</label>
                          <input type="text" value={item.subtitle} onChange={(e) => {
                            const updated = [...occasionFinderItems];
                            updated[idx] = { ...updated[idx], subtitle: e.target.value };
                            setOccasionFinderItems(updated);
                          }} className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white" />
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subsection: Celebrity Spotlight */}
            {activeSubSection === "celebritySpotlight" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-900">Styled by You, Crafted by Us Customizer</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Section Title</label>
                    <input type="text" value={celebritySpotlightTitle} onChange={(e) => setCelebritySpotlightTitle(e.target.value)} className="w-full bg-neutral-900 border border-neutral-850 rounded px-3 py-2 text-xs text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Section Subtitle</label>
                    <input type="text" value={celebritySpotlightSubtitle} onChange={(e) => setCelebritySpotlightSubtitle(e.target.value)} className="w-full bg-neutral-900 border border-neutral-850 rounded px-3 py-2 text-xs text-white focus:outline-none" />
                  </div>
                </div>

                <div className="flex justify-between items-center bg-neutral-900 p-3 rounded-lg border border-neutral-850">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Polaroid Cards List</span>
                  <button
                    type="button"
                    onClick={() => setCelebritySpotlightItems([
                      ...celebritySpotlightItems,
                      { id: `c_${Date.now()}`, title: "Festive Silk", location: "Styled in Jaipur", image: "/images/client-1.jpg", price: "₹1,899", handle: "saree" }
                    ])}
                    className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-3 py-1 text-[9px] font-bold uppercase rounded flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Polaroid Card
                  </button>
                </div>

                <div className="space-y-3">
                  {celebritySpotlightItems.map((item, idx) => (
                    <div key={idx} className="bg-neutral-900/40 border border-neutral-850 p-3 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[#C9A84C] uppercase">Card #{idx + 1}</span>
                        <button type="button" onClick={() => deleteItem(celebritySpotlightItems, setCelebritySpotlightItems, idx)} className="p-1 text-neutral-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      <ImageOrVideoUploader
                        label="Customer Outfit Photo"
                        value={item.image}
                        onChange={(url) => {
                          const updated = [...celebritySpotlightItems];
                          updated[idx] = { ...updated[idx], image: url };
                          setCelebritySpotlightItems(updated);
                        }}
                        accept="image/*"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input type="text" placeholder="Title" value={item.title} onChange={(e) => {
                          const updated = [...celebritySpotlightItems];
                          updated[idx] = { ...updated[idx], title: e.target.value };
                          setCelebritySpotlightItems(updated);
                        }} className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white" />
                        <input type="text" placeholder="Location tag" value={item.location} onChange={(e) => {
                          const updated = [...celebritySpotlightItems];
                          updated[idx] = { ...updated[idx], location: e.target.value };
                          setCelebritySpotlightItems(updated);
                        }} className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white" />
                        <input type="text" placeholder="Handle" value={item.handle} onChange={(e) => {
                          const updated = [...celebritySpotlightItems];
                          updated[idx] = { ...updated[idx], handle: e.target.value };
                          setCelebritySpotlightItems(updated);
                        }} className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white font-mono" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subsection: Fabric Library */}
            {activeSubSection === "fabricLibrary" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-900">Our Fabric Library Customizer</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Section Title</label>
                    <input type="text" value={fabricLibraryTitle} onChange={(e) => setFabricLibraryTitle(e.target.value)} className="w-full bg-neutral-900 border border-neutral-850 rounded px-3 py-2 text-xs text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Section Subtitle</label>
                    <input type="text" value={fabricLibrarySubtitle} onChange={(e) => setFabricLibrarySubtitle(e.target.value)} className="w-full bg-neutral-900 border border-neutral-850 rounded px-3 py-2 text-xs text-white focus:outline-none" />
                  </div>
                </div>

                <div className="flex justify-between items-center bg-neutral-900 p-3 rounded-lg border border-neutral-850">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Fabric Swatches List</span>
                  <button
                    type="button"
                    onClick={() => setFabricLibraryItems([
                      ...fabricLibraryItems,
                      { id: `f_${Date.now()}`, name: "Pure Tussar Silk", origin: "Bhagalpur", description: "Rich textured wild silk weave", image: "/images/client-3.jpg", handle: "silk" }
                    ])}
                    className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-3 py-1 text-[9px] font-bold uppercase rounded flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Fabric Swatch
                  </button>
                </div>

                <div className="space-y-3">
                  {fabricLibraryItems.map((item, idx) => (
                    <div key={idx} className="bg-neutral-900/40 border border-neutral-850 p-3 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[#C9A84C] uppercase">Fabric Swatch #{idx + 1}</span>
                        <button type="button" onClick={() => deleteItem(fabricLibraryItems, setFabricLibraryItems, idx)} className="p-1 text-neutral-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      <ImageOrVideoUploader
                        label="Fabric Swatch Cover Image"
                        value={item.image}
                        onChange={(url) => {
                          const updated = [...fabricLibraryItems];
                          updated[idx] = { ...updated[idx], image: url };
                          setFabricLibraryItems(updated);
                        }}
                        accept="image/*"
                      />
                      <div className="grid grid-cols-3 gap-2">
                        <input type="text" placeholder="Fabric Name" value={item.name} onChange={(e) => {
                          const updated = [...fabricLibraryItems];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setFabricLibraryItems(updated);
                        }} className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white" />
                        <input type="text" placeholder="Origin Place" value={item.origin} onChange={(e) => {
                          const updated = [...fabricLibraryItems];
                          updated[idx] = { ...updated[idx], origin: e.target.value };
                          setFabricLibraryItems(updated);
                        }} className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white" />
                        <input type="text" placeholder="Target Handle" value={item.handle} onChange={(e) => {
                          const updated = [...fabricLibraryItems];
                          updated[idx] = { ...updated[idx], handle: e.target.value };
                          setFabricLibraryItems(updated);
                        }} className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white font-mono" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subsection: Story Drape Transformer */}
            {activeSubSection === "storyDrape" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-900">From Thread to Royal Drape (Interactive Slider)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Headline Text</label>
                    <input type="text" value={storyDrapeHeading} onChange={(e) => setStoryDrapeHeading(e.target.value)} className="w-full bg-neutral-900 border border-neutral-850 rounded px-3 py-2 text-xs text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Description Paragraph</label>
                    <input type="text" value={storyDrapeDescription} onChange={(e) => setStoryDrapeDescription(e.target.value)} className="w-full bg-neutral-900 border border-neutral-850 rounded px-3 py-2 text-xs text-white focus:outline-none" />
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4 pt-2">
                  <ImageOrVideoUploader
                    label="Before Image (Raw Loom Threads)"
                    value={storyDrapeBeforeImage}
                    onChange={setStoryDrapeBeforeImage}
                    accept="image/*"
                  />
                  <ImageOrVideoUploader
                    label="After Image (Finished Royal Silk Drape)"
                    value={storyDrapeAfterImage}
                    onChange={setStoryDrapeAfterImage}
                    accept="image/*"
                  />
                </div>
              </div>
            )}

            {/* Subsection: As Seen In Press */}
            {activeSubSection === "asSeenInPress" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-900">As Featured In (Press Authority Bar)</h3>
                <div>
                  <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Section Title</label>
                  <input type="text" value={asSeenInPressTitle} onChange={(e) => setAsSeenInPressTitle(e.target.value)} className="w-full bg-neutral-900 border border-neutral-850 rounded px-3 py-2 text-xs text-white focus:outline-none" />
                </div>

                <div className="flex justify-between items-center bg-neutral-900 p-3 rounded-lg border border-neutral-850">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Press Quotes List</span>
                  <button
                    type="button"
                    onClick={() => setAsSeenInPressItems([
                      ...asSeenInPressItems,
                      { publication: "VOGUE INDIA", quote: "Redefining luxury in handloom sarees.", tag: "Fashion Feature" }
                    ])}
                    className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-3 py-1 text-[9px] font-bold uppercase rounded flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Press Quote
                  </button>
                </div>

                <div className="space-y-3">
                  {asSeenInPressItems.map((item, idx) => (
                    <div key={idx} className="bg-neutral-900/40 border border-neutral-850 p-3 rounded-xl space-y-2">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[#C9A84C] uppercase">Press Quote #{idx + 1}</span>
                        <button type="button" onClick={() => deleteItem(asSeenInPressItems, setAsSeenInPressItems, idx)} className="p-1 text-neutral-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                      <div className="grid grid-cols-3 gap-2">
                        <input type="text" placeholder="Publication Name" value={item.publication} onChange={(e) => {
                          const updated = [...asSeenInPressItems];
                          updated[idx] = { ...updated[idx], publication: e.target.value };
                          setAsSeenInPressItems(updated);
                        }} className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white" />
                        <input type="text" placeholder="Press Quote" value={item.quote} onChange={(e) => {
                          const updated = [...asSeenInPressItems];
                          updated[idx] = { ...updated[idx], quote: e.target.value };
                          setAsSeenInPressItems(updated);
                        }} className="col-span-2 bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subsection: Featured Campaign Banners */}
            {activeSubSection === "promoBanners" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-900">Featured Campaign Banners (2 Cards)</h3>
                
                <div className="flex justify-between items-center bg-neutral-900 p-3 rounded-lg border border-neutral-850">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Campaign Cards List</span>
                  <button
                    type="button"
                    onClick={() => setPromoBanners([
                      ...promoBanners,
                      { imageUrl: "/images/banner-1773659037696-747582281.webp", title: "New Campaign", subtitle: "Exclusive Edit", link: "/products", buttonText: "Shop Now" }
                    ])}
                    className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-3 py-1 text-[9px] font-bold uppercase rounded flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Banner Card
                  </button>
                </div>

                <div className="space-y-4">
                  {promoBanners.map((banner, idx) => (
                    <div key={idx} className="bg-neutral-900/40 border border-neutral-850 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[#C9A84C] uppercase">Campaign Card #{idx + 1}</span>
                        <button type="button" onClick={() => deleteItem(promoBanners, setPromoBanners, idx)} className="p-1 text-neutral-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>

                      <ImageOrVideoUploader
                        label="Campaign Banner Image"
                        value={banner.imageUrl}
                        onChange={(url) => {
                          const updated = [...promoBanners];
                          updated[idx] = { ...updated[idx], imageUrl: url };
                          setPromoBanners(updated);
                        }}
                        accept="image/*"
                      />

                      <div className="grid grid-cols-3 gap-2">
                        <div>
                          <label className="block text-[8px] font-bold text-neutral-400 uppercase mb-0.5">Card Title</label>
                          <input type="text" value={banner.title || ""} onChange={(e) => {
                            const updated = [...promoBanners];
                            updated[idx] = { ...updated[idx], title: e.target.value };
                            setPromoBanners(updated);
                          }} className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white" />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-neutral-400 uppercase mb-0.5">Subtitle</label>
                          <input type="text" value={banner.subtitle || ""} onChange={(e) => {
                            const updated = [...promoBanners];
                            updated[idx] = { ...updated[idx], subtitle: e.target.value };
                            setPromoBanners(updated);
                          }} className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white" />
                        </div>
                        <div>
                          <label className="block text-[8px] font-bold text-neutral-400 uppercase mb-0.5">Button Text</label>
                          <input type="text" value={banner.buttonText || ""} onChange={(e) => {
                            const updated = [...promoBanners];
                            updated[idx] = { ...updated[idx], buttonText: e.target.value };
                            setPromoBanners(updated);
                          }} className="w-full bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white" />
                        </div>
                      </div>

                      <LinkSelector
                        label="Banner Redirect Target"
                        value={banner.link || ""}
                        onChange={(url) => {
                          const updated = [...promoBanners];
                          updated[idx] = { ...updated[idx], link: url };
                          setPromoBanners(updated);
                        }}
                        collections={collections}
                        products={products}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subsection: Artisans & Weavers */}
            {activeSubSection === "artisanTimeline" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-900">Artisans & Master Weavers Customizer</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Section Title</label>
                    <input type="text" value={artisanTimelineTitle} onChange={(e) => setArtisanTimelineTitle(e.target.value)} className="w-full bg-neutral-900 border border-neutral-850 rounded px-3 py-2 text-xs text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Section Subtitle</label>
                    <input type="text" value={artisanTimelineSubtitle} onChange={(e) => setArtisanTimelineSubtitle(e.target.value)} className="w-full bg-neutral-900 border border-neutral-850 rounded px-3 py-2 text-xs text-white focus:outline-none" />
                  </div>
                </div>

                <div className="flex justify-between items-center bg-neutral-900 p-3 rounded-lg border border-neutral-850">
                  <span className="text-[10px] font-bold text-white uppercase tracking-wider">Artisan Profiles List</span>
                  <button
                    type="button"
                    onClick={() => setArtisanTimelineItems([
                      ...artisanTimelineItems,
                      { id: `art_${Date.now()}`, name: "Ramkali Devi", craft: "Spinner of Heritage Threads", region: "Varanasi", story: "Hand-spun silk yarn master", image: "/images/client-4.jpg", years: "35 yrs", specialty: "Mulberry Silk" }
                    ])}
                    className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-3 py-1 text-[9px] font-bold uppercase rounded flex items-center gap-1"
                  >
                    <Plus className="w-3 h-3" /> Add Artisan Profile
                  </button>
                </div>

                <div className="space-y-4">
                  {artisanTimelineItems.map((item, idx) => (
                    <div key={idx} className="bg-neutral-900/40 border border-neutral-850 p-4 rounded-xl space-y-3">
                      <div className="flex justify-between items-center">
                        <span className="text-xs font-bold text-[#C9A84C] uppercase">Artisan #{idx + 1}</span>
                        <button type="button" onClick={() => deleteItem(artisanTimelineItems, setArtisanTimelineItems, idx)} className="p-1 text-neutral-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>

                      <ImageOrVideoUploader
                        label="Artisan Portrait Photo"
                        value={item.image}
                        onChange={(url) => {
                          const updated = [...artisanTimelineItems];
                          updated[idx] = { ...updated[idx], image: url };
                          setArtisanTimelineItems(updated);
                        }}
                        accept="image/*"
                      />

                      <div className="grid grid-cols-3 gap-2">
                        <input type="text" placeholder="Name" value={item.name} onChange={(e) => {
                          const updated = [...artisanTimelineItems];
                          updated[idx] = { ...updated[idx], name: e.target.value };
                          setArtisanTimelineItems(updated);
                        }} className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white" />
                        <input type="text" placeholder="Craft Role" value={item.craft} onChange={(e) => {
                          const updated = [...artisanTimelineItems];
                          updated[idx] = { ...updated[idx], craft: e.target.value };
                          setArtisanTimelineItems(updated);
                        }} className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white" />
                        <input type="text" placeholder="Region" value={item.region} onChange={(e) => {
                          const updated = [...artisanTimelineItems];
                          updated[idx] = { ...updated[idx], region: e.target.value };
                          setArtisanTimelineItems(updated);
                        }} className="bg-neutral-950 border border-neutral-800 rounded px-2 py-1 text-xs text-white" />
                      </div>

                      <textarea placeholder="Artisan Story" rows={2} value={item.story} onChange={(e) => {
                        const updated = [...artisanTimelineItems];
                        updated[idx] = { ...updated[idx], story: e.target.value };
                        setArtisanTimelineItems(updated);
                      }} className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subsection 3: Top Sellings */}
            {activeSubSection === "topSellings" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-900">3. Featured Products Slider (Top Sellings)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Section Title</label>
                    <input type="text" value={trendingTitle} onChange={(e) => setTrendingTitle(e.target.value)} className="w-full bg-neutral-900 border border-neutral-855 rounded px-3 py-2 text-xs text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Section Subtitle</label>
                    <input type="text" value={trendingSubtitle} onChange={(e) => setTrendingSubtitle(e.target.value)} className="w-full bg-neutral-900 border border-neutral-855 rounded px-3 py-2 text-xs text-white focus:outline-none" />
                  </div>
                </div>

                {/* Add product */}
                <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-850 flex gap-4 items-end">
                  <div className="flex-1">
                    <label className="block text-[8px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Select Product to Feature</label>
                    <select value={featuredProdId} onChange={(e) => setFeaturedProdId(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none">
                      <option value="">-- Choose Product --</option>
                      {products.map(p => <option key={p.id} value={p.id}>{p.title}</option>)}
                    </select>
                  </div>
                  <button type="button" onClick={addFeaturedProduct} className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-4 py-2 text-[10px] font-bold uppercase rounded tracking-wider transition-all"><Plus className="w-3.5 h-3.5 inline-block mr-1" /> Add</button>
                </div>

                {/* List */}
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                  {topSellingsProductIds.map((pId, idx) => {
                    const prodObj = products.find(p => p.id === pId || p.handle === pId);
                    return (
                      <div key={idx} className="flex justify-between items-center bg-neutral-900 border border-neutral-850 p-2.5 rounded-lg text-xs">
                        <span className="font-semibold text-white">{prodObj?.title || `Product ID: ${pId}`}</span>
                        <div className="flex gap-1">
                          <button onClick={() => moveItem(topSellingsProductIds, setTopSellingsProductIds, idx, "UP")} disabled={idx === 0} className="p-1 bg-neutral-955 text-neutral-450 disabled:opacity-20"><ArrowUp className="w-3.5 h-3.5" /></button>
                          <button onClick={() => moveItem(topSellingsProductIds, setTopSellingsProductIds, idx, "DOWN")} disabled={idx === topSellingsProductIds.length - 1} className="p-1 bg-neutral-955 text-neutral-455 disabled:opacity-20"><ArrowDown className="w-3.5 h-3.5" /></button>
                          <button onClick={() => deleteItem(topSellingsProductIds, setTopSellingsProductIds, idx)} className="p-1 bg-neutral-955 hover:text-red-400 text-neutral-500"><Trash2 className="w-3.5 h-3.5" /></button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            )}

            {/* Subsection 4: Perfect Saree Tabs */}
            {activeSubSection === "perfectSaree" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-900">4. Find Your Perfect Saree (Filtered Tabs)</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Section Title</label>
                    <input type="text" value={perfectSareeTitle} onChange={(e) => setPerfectSareeTitle(e.target.value)} className="w-full bg-neutral-900 border border-neutral-850 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-maroonClr" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Section Subtitle</label>
                    <input type="text" value={perfectSareeSubtitle} onChange={(e) => setPerfectSareeSubtitle(e.target.value)} className="w-full bg-neutral-900 border border-neutral-850 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-maroonClr" />
                  </div>
                </div>

                {/* Add Tab form */}
                <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-850 space-y-3">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Add Category Tab</h4>
                  
                  <ImageOrVideoUploader
                    label="Tab Icon/Cover"
                    value={sareeTabImage}
                    onChange={setSareeTabImage}
                    accept="image/*"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1.5">
                    <div>
                      <label className="block text-[8px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Select Collection</label>
                      <select value={sareeTabColHandle} onChange={(e) => setSareeTabColHandle(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none">
                        <option value="">-- Choose --</option>
                        {collections.map(c => <option key={c.id} value={c.handle}>{c.title}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Tab Label Name</label>
                      <input type="text" value={sareeTabLabel} onChange={(e) => setSareeTabLabel(e.target.value)} className="w-full bg-neutral-955 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none" />
                    </div>
                  </div>
                  <button type="button" onClick={addSareeTab} className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-3 py-1 text-[10px] font-bold uppercase rounded tracking-wider transition-colors flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Tab</button>
                </div>

                {/* Tab items list */}
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                  {perfectSareeTabs.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-neutral-900 border border-neutral-850 p-2.5 rounded-lg text-xs">
                      <div className="flex items-center gap-3">
                        {item.image && <img src={item.image} alt="" className="w-7 h-7 object-cover rounded border border-neutral-800" />}
                        <div>
                          <span className="font-semibold text-white uppercase">{item.label}</span>
                          <span className="text-[10px] text-neutral-400 ml-2">({item.collectionHandle})</span>
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => moveItem(perfectSareeTabs, setPerfectSareeTabs, idx, "UP")} disabled={idx === 0} className="p-1 bg-neutral-955 text-neutral-400 disabled:opacity-20"><ArrowUp className="w-3.5 h-3.5" /></button>
                        <button onClick={() => moveItem(perfectSareeTabs, setPerfectSareeTabs, idx, "DOWN")} disabled={idx === perfectSareeTabs.length - 1} className="p-1 bg-neutral-955 text-neutral-400 disabled:opacity-20"><ArrowDown className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteItem(perfectSareeTabs, setPerfectSareeTabs, idx)} className="p-1 bg-neutral-955 hover:text-red-400 text-neutral-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subsection 5: Best Categories */}
            {activeSubSection === "bestCategories" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-900">5. Explore Best Categories Grid</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Section Title</label>
                    <input type="text" value={categoriesTitle} onChange={(e) => setCategoriesTitle(e.target.value)} className="w-full bg-neutral-900 border border-neutral-850 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-maroonClr" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Section Subtitle</label>
                    <input type="text" value={categoriesSubtitle} onChange={(e) => setCategoriesSubtitle(e.target.value)} className="w-full bg-neutral-900 border border-neutral-850 rounded px-3 py-2 text-xs text-white focus:outline-none focus:border-maroonClr" />
                  </div>
                </div>

                {/* Add category box */}
                <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-850 space-y-3">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Add Category Grid Box</h4>
                  
                  <ImageOrVideoUploader
                    label="Grid Box Cover Image"
                    value={bestCatImage}
                    onChange={setBestCatImage}
                    accept="image/*"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1.5">
                    <div>
                      <label className="block text-[8px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Select Collection</label>
                      <select value={bestCatColHandle} onChange={(e) => setBestCatColHandle(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none">
                        <option value="">-- Choose --</option>
                        {collections.map(c => <option key={c.id} value={c.handle}>{c.title}</option>)}
                      </select>
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Grid Headline Label (Optional)</label>
                      <input type="text" value={bestCatTitle} onChange={(e) => setBestCatTitle(e.target.value)} className="w-full bg-neutral-955 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none" />
                    </div>
                  </div>
                  <button type="button" onClick={addBestCategory} className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-3 py-1 text-[10px] font-bold uppercase rounded tracking-wider transition-colors flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Grid Item</button>
                </div>

                {/* Items list */}
                <div className="space-y-2 max-h-[250px] overflow-y-auto pr-1 custom-scrollbar">
                  {categoriesItems.map((item, idx) => (
                    <div key={idx} className="flex justify-between items-center bg-neutral-900 border border-neutral-855 p-2.5 rounded-lg text-xs">
                      <div className="flex items-center gap-3">
                        {item.customImage && <img src={item.customImage} alt="" className="w-7 h-7 object-cover rounded border border-neutral-800" />}
                        <div>
                          <span className="font-semibold text-white uppercase">{item.collectionHandle}</span>
                          {item.customTitle && <span className="text-[10px] text-neutral-400 ml-2">({item.customTitle})</span>}
                        </div>
                      </div>
                      <div className="flex gap-1">
                        <button onClick={() => moveItem(categoriesItems, setCategoriesItems, idx, "UP")} disabled={idx === 0} className="p-1 bg-neutral-955 text-neutral-450 disabled:opacity-20"><ArrowUp className="w-3.5 h-3.5" /></button>
                        <button onClick={() => moveItem(categoriesItems, setCategoriesItems, idx, "DOWN")} disabled={idx === categoriesItems.length - 1} className="p-1 bg-neutral-955 text-neutral-450 disabled:opacity-20"><ArrowDown className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteItem(categoriesItems, setCategoriesItems, idx)} className="p-1 bg-neutral-955 hover:text-red-400 text-neutral-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subsection 6: Features */}
            {activeSubSection === "features" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-900">6. Special Shopping Features / Value Props</h3>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Section Title</label>
                    <input type="text" value={featuresTitle} onChange={(e) => setFeaturesTitle(e.target.value)} className="w-full bg-neutral-900 border border-neutral-855 rounded px-3 py-2 text-xs text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Description Subtitle</label>
                    <input type="text" value={featuresSubtitle} onChange={(e) => setFeaturesSubtitle(e.target.value)} className="w-full bg-neutral-900 border border-neutral-855 rounded px-3 py-2 text-xs text-white focus:outline-none" />
                  </div>
                </div>

                <div className="space-y-4 pt-2">
                  {features.map((feat, idx) => (
                    <div key={idx} className="bg-neutral-900 p-4 rounded-lg border border-neutral-850 space-y-3">
                      <p className="text-[10px] font-bold text-[#C9A84C] uppercase">Feature Card #{idx + 1}</p>
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                          <label className="block text-[8px] font-bold text-neutral-500 uppercase mb-1">Card Title</label>
                          <input type="text" value={feat.title} onChange={(e) => handleFeatureChange(idx, "title", e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white" />
                        </div>
                        <ImageOrVideoUploader
                          label="Card Icon/Image"
                          value={feat.image}
                          onChange={(url) => handleFeatureChange(idx, "image", url)}
                          accept="image/*"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-neutral-500 uppercase mb-0.5">Card Description Text</label>
                        <textarea rows={1} value={feat.description} onChange={(e) => handleFeatureChange(idx, "description", e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white leading-relaxed" />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subsection 7: Testimonials */}
            {activeSubSection === "testimonials" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-900">7. What Our Customers Say (Testimonials slider)</h3>
                <div>
                  <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Section Title</label>
                  <input type="text" value={testimonialsTitle} onChange={(e) => setTestimonialsTitle(e.target.value)} className="w-full bg-neutral-900 border border-neutral-855 rounded px-3 py-2 text-xs text-white focus:outline-none" />
                </div>

                {/* Add Testimonial */}
                <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-850 space-y-3">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Add Custom Review Card</h4>
                  
                  <ImageOrVideoUploader
                    label="Customer Profile Avatar"
                    value={testImage}
                    onChange={setTestImage}
                    accept="image/*"
                  />

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-1.5">
                    <div>
                      <label className="block text-[8px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Customer Name</label>
                      <input type="text" value={testName} onChange={(e) => setTestName(e.target.value)} placeholder="Prisha V." className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white" />
                    </div>
                    <div>
                      <label className="block text-[8px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Star Rating (1-5)</label>
                      <select value={testRating} onChange={(e) => setTestRating(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white">
                        <option value="5">5 Stars</option>
                        <option value="4">4 Stars</option>
                        <option value="3">3 Stars</option>
                      </select>
                    </div>
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Review Comment</label>
                    <textarea rows={2} value={testComment} onChange={(e) => setTestComment(e.target.value)} placeholder="Write review here..." className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white" />
                  </div>
                  <button type="button" onClick={addTestimonial} className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-3 py-1 text-[10px] font-bold uppercase rounded tracking-wider transition-colors flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Review</button>
                </div>

                {/* List */}
                <div className="space-y-3 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                  {testimonials.map((test, idx) => (
                    <div key={test.id} className="bg-neutral-900 border border-neutral-850 p-3 rounded-lg text-xs relative space-y-2">
                      <button onClick={() => deleteItem(testimonials, setTestimonials, idx)} className="absolute right-2 top-2 text-neutral-500 hover:text-red-400"><Trash2 className="w-3.5 h-3.5" /></button>
                      <div className="flex gap-2.5 items-center">
                        {test.image && <img src={test.image} alt="" className="w-8 h-8 object-cover rounded-full border border-neutral-800" />}
                        <div className="flex-1">
                          <span className="font-semibold text-white block">{test.name}</span>
                          <span className="flex text-[#C9A84C] gap-0.5 font-bold text-[9px] uppercase"><Star className="w-2.5 h-2.5 fill-current" /> {test.rating} stars</span>
                        </div>
                      </div>
                      <p className="text-neutral-400 italic leading-relaxed">&quot;{test.comment}&quot;</p>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Subsection 8: FAQs */}
            {activeSubSection === "faqs" && (
              <div className="space-y-4">
                <h3 className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-900">8. Frequently Asked Questions Accordion</h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-3">
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">FAQ Header Title</label>
                      <input type="text" value={faqTitle} onChange={(e) => setFaqTitle(e.target.value)} className="w-full bg-neutral-900 border border-neutral-855 rounded px-3 py-2 text-xs text-white focus:outline-none" />
                    </div>
                    <div>
                      <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">FAQ Subheading Text</label>
                      <textarea rows={2} value={faqSubtitle} onChange={(e) => setFaqSubtitle(e.target.value)} className="w-full bg-neutral-900 border border-neutral-855 rounded px-3 py-2 text-xs text-white focus:outline-none leading-relaxed" />
                    </div>
                  </div>
                  
                  <ImageOrVideoUploader
                    label="FAQ Side Image"
                    value={faqImage}
                    onChange={setFaqImage}
                    accept="image/*"
                  />
                </div>

                {/* Add FAQ form */}
                <div className="bg-neutral-900 p-4 rounded-lg border border-neutral-850 space-y-3">
                  <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Add Accordion Question</h4>
                  <div>
                    <label className="block text-[8px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Question Text</label>
                    <input type="text" value={faqQ} onChange={(e) => setFaqQ(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white" />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Answer Text</label>
                    <textarea rows={2} value={faqA} onChange={(e) => setFaqA(e.target.value)} className="w-full bg-neutral-955 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white" />
                  </div>
                  <button type="button" onClick={addFaq} className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-3 py-1 text-[10px] font-bold uppercase rounded tracking-wider transition-colors flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Q&A</button>
                </div>

                {/* Editable FAQs list - users can edit directly after saving */}
                <div className="space-y-4 max-h-[400px] overflow-y-auto pr-1 custom-scrollbar">
                  {faqs.map((faq, idx) => (
                    <div key={idx} className="bg-neutral-900 border border-neutral-850 p-4 rounded-lg space-y-3">
                      <p className="text-[10px] font-bold text-[#C9A84C] uppercase">Saved FAQ #{idx + 1}</p>
                      <div>
                        <label className="block text-[8px] font-bold text-neutral-500 uppercase mb-0.5">Question Text</label>
                        <input
                          type="text"
                          value={faq.question}
                          onChange={(e) => {
                            const updated = [...faqs];
                            updated[idx].question = e.target.value;
                            setFaqs(updated);
                          }}
                          className="w-full bg-neutral-955 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div>
                        <label className="block text-[8px] font-bold text-neutral-500 uppercase mb-0.5">Answer Text</label>
                        <textarea
                          rows={2}
                          value={faq.answer}
                          onChange={(e) => {
                            const updated = [...faqs];
                            updated[idx].answer = e.target.value;
                            setFaqs(updated);
                          }}
                          className="w-full bg-neutral-955 border border-neutral-800 rounded px-2.5 py-1 text-xs text-white focus:outline-none"
                        />
                      </div>
                      <div className="flex justify-end gap-1 pt-1.5 border-t border-neutral-950">
                        <button onClick={() => moveItem(faqs, setFaqs, idx, "UP")} disabled={idx === 0} className="p-1 bg-neutral-950 text-neutral-400 disabled:opacity-20"><ArrowUp className="w-3.5 h-3.5" /></button>
                        <button onClick={() => moveItem(faqs, setFaqs, idx, "DOWN")} disabled={idx === faqs.length - 1} className="p-1 bg-neutral-950 text-neutral-400 disabled:opacity-20"><ArrowDown className="w-3.5 h-3.5" /></button>
                        <button onClick={() => deleteItem(faqs, setFaqs, idx)} className="p-1 bg-neutral-950 hover:text-red-400 text-neutral-500"><Trash2 className="w-3.5 h-3.5" /></button>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div className="flex justify-end pt-2 border-t border-neutral-900">
              <button onClick={triggerSaveHomepage} disabled={loading} className="bg-maroonClr hover:bg-[#A30C4D] text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-maroonClr/20 disabled:opacity-50"><Save className="w-4 h-4" /> Save Page Sections</button>
            </div>

          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 5: FOOTER CUSTOMIZER
          ---------------------------------------------------- */}
      {activeTab === "FOOTER" && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-900 justify-between">
            <div className="flex items-center gap-2">
              <Link2 className="w-5 h-5 text-[#C9A84C]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Store Footer Customizer</h3>
            </div>
            {footerSuccess && (
              <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved Successfully!
              </span>
            )}
          </div>

          {footerSuccess && (
            <div className="p-3.5 bg-green-950/40 border border-green-900/50 text-green-400 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5" />
              <span>{footerSuccess}</span>
            </div>
          )}

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            
            {/* Column A: Logo, Brand Text, Contact Info */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-900">1. Contact & Brand Profile</h4>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <ImageOrVideoUploader
                  label="Footer Brand Logo"
                  value={footerLogoUrl}
                  onChange={setFooterLogoUrl}
                  accept="image/*"
                />
                <div>
                  <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Copyright Footer Line</label>
                  <input type="text" value={footerCopyright} onChange={(e) => setFooterCopyright(e.target.value)} className="w-full bg-neutral-900 border border-neutral-855 rounded px-3 py-2 text-xs text-white focus:outline-none" />
                </div>
              </div>

              <div>
                <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1">Footer Brand Description</label>
                <textarea rows={3} value={footerDescription} onChange={(e) => setFooterDescription(e.target.value)} className="w-full bg-neutral-900 border border-neutral-855 rounded px-3 py-2 text-xs text-white focus:outline-none leading-relaxed" />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1"><Mail className="w-3.5 h-3.5 inline mr-1 text-[#C9A84C]" /> Contact Email Address</label>
                  <input type="email" value={footerEmail} onChange={(e) => setFooterEmail(e.target.value)} className="w-full bg-neutral-900 border border-neutral-855 rounded px-3 py-2 text-xs text-white focus:outline-none" />
                </div>
                <div>
                  <label className="block text-[9px] font-bold text-neutral-400 uppercase tracking-wider mb-1"><Phone className="w-3.5 h-3.5 inline mr-1 text-[#C9A84C]" /> Contact Phone Number</label>
                  <input type="text" value={footerPhone} onChange={(e) => setFooterPhone(e.target.value)} className="w-full bg-neutral-900 border border-neutral-855 rounded px-3 py-2 text-xs text-white focus:outline-none" />
                </div>
              </div>

              <div className="space-y-2 pt-2">
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Social Media Links</p>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[8px] font-bold text-neutral-500 uppercase mb-0.5">Facebook Link</label>
                    <input type="text" placeholder="Facebook Link" value={facebookUrl} onChange={(e) => setFacebookUrl(e.target.value)} className="w-full bg-neutral-900 border border-neutral-850 rounded px-2.5 py-1.5 text-xs text-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-neutral-500 uppercase mb-0.5">Instagram Link</label>
                    <input type="text" placeholder="Instagram Link" value={instagramUrl} onChange={(e) => setInstagramUrl(e.target.value)} className="w-full bg-neutral-900 border border-neutral-850 rounded px-2.5 py-1.5 text-xs text-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-neutral-500 uppercase mb-0.5">Pinterest Link</label>
                    <input type="text" placeholder="Pinterest Link" value={pinterestUrl} onChange={(e) => setPinterestUrl(e.target.value)} className="w-full bg-neutral-900 border border-neutral-850 rounded px-2.5 py-1.5 text-xs text-white font-mono" />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-neutral-500 uppercase mb-0.5">YouTube Link</label>
                    <input type="text" placeholder="YouTube Link" value={youtubeUrl} onChange={(e) => setYoutubeUrl(e.target.value)} className="w-full bg-neutral-900 border border-neutral-850 rounded px-2.5 py-1.5 text-xs text-white font-mono" />
                  </div>
                </div>
              </div>
            </div>

            {/* Column B: Quick Links Editor */}
            <div className="space-y-4">
              <h4 className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-900">2. Quick Navigation Links</h4>

              {/* Add link form */}
              <div className="bg-neutral-900 border border-neutral-850 p-4 rounded-lg space-y-3">
                <h4 className="text-[10px] font-bold text-white uppercase tracking-wider">Add Custom Menu Link</h4>
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="block text-[8px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Link Label (e.g. Shipping policy)</label>
                    <input type="text" value={footLinkLabel} onChange={(e) => setFootLinkLabel(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none" />
                  </div>
                  <div>
                    <label className="block text-[8px] font-bold text-neutral-400 uppercase tracking-wider mb-0.5">Link URL Destination (e.g. /shipping)</label>
                    <input type="text" value={footLinkUrl} onChange={(e) => setFootLinkUrl(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none font-mono" />
                  </div>
                </div>
                <button type="button" onClick={addFooterLink} className="bg-neutral-800 hover:bg-[#C9A84C] hover:text-black text-white px-3 py-1 text-[10px] font-bold uppercase rounded tracking-wider transition-colors flex items-center gap-1.5"><Plus className="w-3.5 h-3.5" /> Add Menu Link</button>
              </div>

              {/* List */}
              <div className="space-y-2 max-h-[300px] overflow-y-auto pr-1 custom-scrollbar">
                {footerLinks.map((link, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-neutral-900 border border-neutral-850 p-2.5 rounded-lg text-xs">
                    <div>
                      <span className="font-semibold text-white">{link.label}</span>
                      <span className="text-[10px] text-neutral-400 ml-2">({link.url})</span>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={() => moveItem(footerLinks, setFooterLinks, idx, "UP")} disabled={idx === 0} className="p-1 bg-neutral-950 text-neutral-400 disabled:opacity-20"><ArrowUp className="w-3.5 h-3.5" /></button>
                      <button onClick={() => moveItem(footerLinks, setFooterLinks, idx, "DOWN")} disabled={idx === footerLinks.length - 1} className="p-1 bg-neutral-955 text-neutral-400 disabled:opacity-20"><ArrowDown className="w-3.5 h-3.5" /></button>
                      <button onClick={() => deleteItem(footerLinks, setFooterLinks, idx)} className="p-1 bg-neutral-955 hover:text-red-400 text-neutral-500"><Trash2 className="w-3.5 h-3.5" /></button>
                    </div>
                  </div>
                ))}
              </div>
            </div>

          </div>

          <div className="flex justify-end pt-2 border-t border-neutral-900">
            <button onClick={triggerSaveFooter} disabled={loading} className="bg-maroonClr hover:bg-[#A30C4D] text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-maroonClr/20 disabled:opacity-50"><Save className="w-4 h-4" /> Save Footer Settings</button>
          </div>
        </div>
      )}

      {/* ----------------------------------------------------
          TAB 6: CATEGORY BANNERS
          ---------------------------------------------------- */}
      {activeTab === "COLLECTIONS" && (
        <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 md:p-8 shadow-sm space-y-6">
          <div className="flex items-center gap-2 pb-2 border-b border-neutral-900 justify-between">
            <div className="flex items-center gap-2">
              <ImageIcon className="w-5 h-5 text-[#C9A84C]" />
              <h3 className="text-sm font-bold text-white uppercase tracking-wider">Category Banner Images</h3>
            </div>
            {collectionsSuccess && (
              <span className="text-[10px] text-green-400 font-bold uppercase tracking-wider flex items-center gap-1">
                <CheckCircle2 className="w-3.5 h-3.5" /> Saved!
              </span>
            )}
          </div>

          {collectionsSuccess && (
            <div className="p-3.5 bg-green-950/40 border border-green-900/50 text-green-400 text-xs rounded-lg flex items-center gap-2">
              <CheckCircle2 className="w-4.5 h-4.5" />
              <span>{collectionsSuccess}</span>
            </div>
          )}

          <div className="space-y-6 max-w-3xl">
            <p className="text-xs text-neutral-400">Upload custom banners for your category collection pages. If left blank, the collection image set in Shopify will be used.</p>
            
            <div className="grid grid-cols-1 gap-6 bg-neutral-900/20 p-5 rounded-xl border border-neutral-850">
              {collections.map((col: any) => (
                <div key={col.id} className="p-4 bg-neutral-950 border border-neutral-800 rounded-lg flex flex-col md:flex-row md:items-center justify-between gap-4">
                  <div className="flex-1">
                    <span className="text-sm font-bold text-white block">{col.title}</span>
                    <span className="text-[10px] text-neutral-500 font-mono">Handle: {col.handle}</span>
                  </div>
                  <div className="flex-1 min-w-[250px]">
                    <ImageOrVideoUploader
                      label="Custom Banner Image"
                      value={collectionBanners[col.handle] || ""}
                      onChange={(url) => {
                        setCollectionBanners({
                          ...collectionBanners,
                          [col.handle]: url
                        });
                      }}
                      accept="image/*"
                    />
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end pt-2 border-t border-neutral-900">
            <button onClick={triggerSaveCollectionBanners} disabled={loading} className="bg-maroonClr hover:bg-[#A30C4D] text-white px-6 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-colors flex items-center gap-2 shadow-lg shadow-maroonClr/20 disabled:opacity-50"><Save className="w-4 h-4" /> Save Category Banners</button>
          </div>
        </div>
      )}
    </div>
  );
}

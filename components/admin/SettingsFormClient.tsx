"use client";

import { useState } from "react";
import { saveSeoSettingsAction, saveBannersSettingsAction, saveHomepageSettingsAction, saveFooterSettingsAction, saveHeaderSettingsAction, uploadFileAction } from "@/app/actions/adminSettings";
import { Sparkles, Save, Plus, Trash2, ArrowUp, ArrowDown, Image as ImageIcon, Globe, AlertCircle, CheckCircle2, Home, HelpCircle, Gift, Info, Star, PlusCircle, Link2, Mail, Phone, Heart, Grid, Video, Play, List, Compass, MessageSquare, Menu, Smile, Laptop, Smartphone } from "lucide-react";

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
  const [localError, setLocalError] = useState("");

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setUploading(true);
    setLocalError("");

    const formData = new FormData();
    formData.append("file", file);

    try {
      const res = await fetch("/api/upload", {
        method: "POST",
        body: formData,
      });
      if (!res.ok) {
        throw new Error(`Upload server error: ${res.statusText}`);
      }
      const data = await res.json();
      if (data.success && data.url) {
        onChange(data.url);
      } else {
        setLocalError(data.error || "Failed to upload.");
      }
    } catch (err: any) {
      setLocalError(err.message || "Failed to upload file.");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-1.5">
      <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{label}</label>
      <div className="flex gap-3 items-center">
        {/* Preview */}
        {value && (
          <div className="relative w-12 h-12 rounded border border-neutral-800 bg-neutral-900 overflow-hidden flex items-center justify-center flex-shrink-0">
            {value.endsWith(".mp4") || value.endsWith(".webm") || value.endsWith(".mov") ? (
              <Video className="w-6 h-6 text-[#C9A84C]" />
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
          {uploading && <span className="text-[9px] text-[#C9A84C] block animate-pulse">Uploading file...</span>}
          {localError && <span className="text-[9px] text-red-500 block">{localError}</span>}
        </div>
      </div>
    </div>
  );
}

export default function SettingsFormClient({ initialSettings, products = [], collections = [] }: SettingsFormClientProps) {
  const [activeTab, setActiveTab] = useState<"SEO" | "HEADER" | "BANNERS" | "HOMEPAGE" | "FOOTER">("SEO");
  const [activeSubSection, setActiveSubSection] = useState<string>("lovedCollections");
  
  const [seoSuccess, setSeoSuccess] = useState("");
  const [headerSuccess, setHeaderSuccess] = useState("");
  const [bannersSuccess, setBannersSuccess] = useState("");
  const [homeSuccess, setHomeSuccess] = useState("");
  const [footerSuccess, setFooterSuccess] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

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
  const [headerLogoUrl, setHeaderLogoUrl] = useState(hd.logoUrl || "");
  const [whatsappNumber, setWhatsappNumber] = useState(hd.whatsappNumber || "");
  const [announcements, setAnnouncements] = useState<string[]>(hd.announcements || []);
  const [marqueeItems, setMarqueeItems] = useState<any[]>(hd.marquee || []);
  const [menuLinks, setMenuLinks] = useState<any[]>(hd.menuLinks || []);


  // ----------------------------------------------------
  // 3. Banners State
  // ----------------------------------------------------
  const [banners, setBanners] = useState<any[]>(initialSettings.banners || []);

  // ----------------------------------------------------
  // 4. Homepage Sections State
  // ----------------------------------------------------
  const hp = initialSettings.homepage || {};
  
  // Section 1: Loved Collections
  const [lovedCollectionsTitle, setLovedCollectionsTitle] = useState(hp.lovedCollectionsTitle || "");
  const [lovedCollectionsSubtitle, setLovedCollectionsSubtitle] = useState(hp.lovedCollectionsSubtitle || "");
  const [lovedCollectionsItems, setLovedCollectionsItems] = useState<any[]>(hp.lovedCollectionsItems || []);

  const [patternBannerHeading, setPatternBannerHeading] = useState(hp.patternBanner?.heading || "");
  const [patternBannerType, setPatternBannerType] = useState<"IMAGE" | "VIDEO">(hp.patternBanner?.type || "IMAGE");
  const [patternBannerMediaUrl, setPatternBannerMediaUrl] = useState(hp.patternBanner?.mediaUrl || "");
  const [reels, setReels] = useState<any[]>(hp.patternBanner?.reels || []);

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
    setLovedCollectionsItems([
      ...lovedCollectionsItems,
      { collectionHandle: lovedColHandle, customTitle: lovedColTitle, customImage: lovedColImage }
    ]);
    setLovedColHandle("");
    setLovedColTitle("");
    setLovedColImage("");
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
      menuLinks
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
      faqs
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
          {(["SEO", "HEADER", "BANNERS", "HOMEPAGE", "FOOTER"] as const).map((tab) => (
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
              }}
              className={`px-3.5 py-1.5 rounded-md text-[10px] font-bold uppercase tracking-wider transition-all ${
                activeTab === tab
                  ? "bg-maroonClr text-white"
                  : "text-neutral-400 hover:text-white"
              }`}
            >
              {tab === "SEO" ? "SEO & METADATA" : tab === "HEADER" ? "HEADER LAYOUT" : tab === "BANNERS" ? "HERO SLIDES" : tab === "HOMEPAGE" ? "HOMEPAGE SECTIONS" : "STORE FOOTER"}
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
                  <div className="col-span-1 md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-4 pt-3 border-t border-neutral-800/60">
                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Button Text</label>
                        <input type="text" value={slide.buttonText} onChange={(e) => handleBannerChange(index, "buttonText", e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-maroonClr" />
                      </div>
                      <div>
                        <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Action Link</label>
                        <input type="text" value={slide.link} onChange={(e) => handleBannerChange(index, "link", e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none focus:border-maroonClr font-mono" />
                      </div>
                    </div>
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
              { id: "lovedCollections", label: "Loved Collections", icon: Heart },
              { id: "patternBanner", label: "Pattern Banner (Video/Img)", icon: Video },
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
                <h3 className="text-xs font-bold text-[#C9A84C] uppercase tracking-widest pb-1 border-b border-neutral-900">1. Our Most Loved Collections Slider</h3>
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
                      <select value={lovedColHandle} onChange={(e) => setLovedColHandle(e.target.value)} className="w-full bg-neutral-950 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none">
                        <option value="">-- Choose --</option>
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
                        {item.customImage && <img src={item.customImage} alt="" className="w-7 h-7 object-cover rounded border border-neutral-800" />}
                        <div>
                          <span className="font-semibold text-white uppercase">{item.collectionHandle}</span>
                          {item.customTitle && <span className="text-[10px] text-neutral-400 ml-2">({item.customTitle})</span>}
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
                          </div>
                          <div className="space-y-2">
                            <div>
                              <label className="block text-[8px] font-bold text-neutral-500 uppercase">Product Title</label>
                              <input type="text" value={reel.title || ""} onChange={(e) => handleReelChange(index, "title", e.target.value)} className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none" />
                            </div>
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
                            <label className="block text-[8px] font-bold text-neutral-500 uppercase mb-1">Product Action / Instagram Video Link</label>
                            <input type="text" value={reel.link || ""} onChange={(e) => handleReelChange(index, "link", e.target.value)} placeholder="https://instagram.com/reel/... or /products/handle" className="w-full bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1.5 text-xs text-white font-mono focus:outline-none" />
                            <span className="text-[8px] text-neutral-500 block mt-1">E.g., /products/gold-ring or https://instagram.com/reel/xyz</span>
                        </div>
                      </div>
                    ))}
                  </div>
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
    </div>
  );
}

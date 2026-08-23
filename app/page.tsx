import { Metadata } from 'next';
import { getProducts, getCollections } from "@/lib/shopify/queries";
export const dynamic = 'force-dynamic';
import CollectionsSlider from "@/components/home/CollectionsSlider";
import TopSellings from "@/components/home/TopSellings";
import PerfectSareeTabs from "@/components/home/PerfectSareeTabs";
import FeaturesGrid from "@/components/home/FeaturesGrid";
import TestimonialsSection from "@/components/home/TestimonialsSection";
import FaqAccordion from "@/components/home/FaqAccordion";
import HeroBanner from "@/components/home/HeroBanner";
import TrustBadgeStrip from "@/components/home/TrustBadgeStrip";
import PromoBannerGrid from "@/components/home/PromoBannerGrid";
import EditorialBlock from "@/components/home/EditorialBlock";
import StatsStrip from "@/components/home/StatsStrip";
import ArtisanStorySection from "@/components/home/ArtisanStorySection";
import TrustIconsRow from "@/components/home/TrustIconsRow";
import FabricLibrary from "@/components/home/FabricLibrary";
import CelebritySpotlight from "@/components/home/CelebritySpotlight";
import ArtisanTimeline from "@/components/home/ArtisanTimeline";
import ReelsSlider from "@/components/home/ReelsSlider";
import TrendingCollectionsGrid from "@/components/home/TrendingCollectionsGrid";
import OccasionFinder from "@/components/home/OccasionFinder";
import AsSeenInPress from "@/components/home/AsSeenInPress";
import StoryDrapeReveal from "@/components/home/StoryDrapeReveal";
import { serverGetSettings, serverGetReviews } from "@/lib/server-data";

export async function generateMetadata(): Promise<Metadata> {
  const settings: any = await serverGetSettings();
  const cleanTitle = settings.seo?.titleTemplate
    ? settings.seo.titleTemplate.replace("%s | ", "")
    : "Boutiique Vastraa";
  return {
    title: "Home | " + cleanTitle,
    description: settings.seo?.defaultDescription,
    openGraph: {
      type: 'website',
      url: 'https://boutiiquevastraa.com',
      title: cleanTitle,
      description: settings.seo?.defaultDescription,
      siteName: 'Boutiique Vastraa',
    },
  };
}

export default async function Home() {
  const settings: any = await serverGetSettings();
  const bannerSlides: any[] = settings.banners || [];
  const dbReviews: any[] = await serverGetReviews();

  const homeSettings = settings.homepage || {};
  
  // Custom Testimonials mapping
  let customTestimonials = [];
  if (homeSettings.testimonials && homeSettings.testimonials.length > 0) {
    customTestimonials = homeSettings.testimonials.map((t: any) => ({
      name: t.name,
      role: "Verified Buyer",
      quote: t.comment,
      image: t.image || "/images/client-1.jpg"
    }));
  } else {
    customTestimonials = dbReviews.map((r, idx) => {
      const avatars = [
        "/images/client-1.jpg",
        "/images/client-2.jpg",
        "/images/client-3.jpg",
        "/images/client-4.jpg",
        "/images/client-5.jpg"
      ];
      return {
        name: r.author,
        role: "Verified Buyer",
        quote: r.comment,
        image: avatars[idx % avatars.length]
      };
    });
  }

  // Fetch live data from Shopify
  const allProducts = await getProducts(24);
  const allCollections = await getCollections(20);

  // Map collections for components
  const collectionsWithImages = allCollections.map((c: any) => ({
    id: c.id,
    title: c.title,
    handle: c.handle,
    image: c.image || null,
  }));

  // Loved Collections Slider Selection
  let lovedCollections = [];
  if (homeSettings.lovedCollectionsItems && homeSettings.lovedCollectionsItems.length > 0) {
    lovedCollections = homeSettings.lovedCollectionsItems.map((item: any) => {
      const matched = allCollections.find((c: any) => c.handle === item.collectionHandle);
      return {
        id: matched?.id || `col_${item.collectionHandle}`,
        title: item.customTitle || matched?.title || item.collectionHandle,
        handle: item.collectionHandle,
        image: item.customImage ? { url: item.customImage } : (matched?.image || null)
      };
    });
  } else {
    lovedCollections = collectionsWithImages;
  }

  // Explore Best Categories Selection
  let bestCategories = [];
  if (homeSettings.categoriesItems && homeSettings.categoriesItems.length > 0) {
    bestCategories = homeSettings.categoriesItems.map((item: any) => {
      const matched = allCollections.find((c: any) => c.handle === item.collectionHandle);
      return {
        id: matched?.id || `col_${item.collectionHandle}`,
        title: item.customTitle || matched?.title || item.collectionHandle,
        handle: item.collectionHandle,
        image: item.customImage ? { url: item.customImage } : (matched?.image || null)
      };
    });
  } else {
    bestCategories = collectionsWithImages;
  }

  // Trending Products selection
  let trendingProducts = [];
  if (homeSettings.topSellingsProductIds && homeSettings.topSellingsProductIds.length > 0) {
    trendingProducts = homeSettings.topSellingsProductIds.map((pId: string) => {
      return allProducts.find((p: any) => p.id === pId || p.handle === pId);
    }).filter(Boolean);
  }
  if (trendingProducts.length === 0) {
    trendingProducts = allProducts.slice(0, 10);
  }

  // Build tabs from collections for PerfectSareeTabs — direct DS access (no HTTP round-trip)
  let perfectSareeTabs = [];
  const tabConfigs = homeSettings.perfectSareeTabs?.length
    ? homeSettings.perfectSareeTabs
    : allCollections.slice(0, 10).map((c: any) => ({ collectionHandle: c.handle, label: c.title, image: c.image?.url }));
  perfectSareeTabs = tabConfigs.map((tabItem: any) => {
    const matchedCol = allCollections.find((c: any) => c.handle === tabItem.collectionHandle);
    const filtered = allProducts.filter((p: any) =>
      (Array.isArray(p.collectionHandles) && p.collectionHandles.includes(tabItem.collectionHandle))
      || (matchedCol && Array.isArray(p.collectionHandles) && p.collectionHandles.includes(matchedCol.id))
    );
    return {
      label: tabItem.label || matchedCol?.title || tabItem.collectionHandle,
      image: tabItem.image || matchedCol?.image?.url || null,
      products: filtered.slice(0, 8),
    };
  });

  return (
    <>
      {/* 1. Hero Slideshow */}
      <HeroBanner slides={bannerSlides} />

      {/* 2. Circular Quick Category Links */}
      <CollectionsSlider collections={lovedCollections} items={homeSettings.lovedCollectionsItems} title={homeSettings.lovedCollectionsTitle} />

      {/* 3. Thin Trust Badge Strip */}
      <TrustBadgeStrip />

      {/* 4. Top Trending Products (Seen immediately!) */}
      <TopSellings 
        products={trendingProducts} 
        title={homeSettings.trendingTitle} 
        subtitle={homeSettings.trendingSubtitle} 
      />

      {/* 4.4. Top Trending Collections (Scalloped Petal Cards) */}
      <TrendingCollectionsGrid items={homeSettings.trendingCollectionsItems} title={homeSettings.trendingCollectionsTitle} />

      {/* 4.5. Upgraded Video Reels Slider Section */}
      <ReelsSlider reels={homeSettings.videoReels} />

      {/* 4.6. Interactive Occasion Drape Quiz (Unique Competitive Feature) */}
      <OccasionFinder />

      {/* 5. Editorial / Brand Story Block */}
      <EditorialBlock
        imageUrl={homeSettings.editorialBlock?.imageUrl}
        heading={homeSettings.editorialBlock?.heading}
        body={homeSettings.editorialBlock?.body}
        ctaText={homeSettings.editorialBlock?.ctaText}
        ctaLink={homeSettings.editorialBlock?.ctaLink}
        tag={homeSettings.editorialBlock?.tag}
      />

      {/* 6. Find Your Perfect Style (Collection Tabs) */}
      <PerfectSareeTabs 
        tabs={perfectSareeTabs} 
        title={homeSettings.perfectSareeTitle} 
        subtitle={homeSettings.perfectSareeSubtitle} 
      />

      {/* 7. Polaroid Lookbook Collage */}
      <CelebritySpotlight />

      {/* 8. Secondary Campaign Banners (Lower down to keep top clean) */}
      <PromoBannerGrid banners={homeSettings.promoBanners} />

      {/* 9. Upgraded Swatch Fabric Library Flip Grid */}
      <FabricLibrary />

      {/* 10. Upgraded Interactive Artisan Loom Stages Timeline */}
      <ArtisanTimeline />

      {/* 10.2. Interactive Story Weave Transformer */}
      <StoryDrapeReveal />

      {/* 10.5. As Seen In Media & Press Authority Bar */}
      <AsSeenInPress />

      {/* 11. Stats Strip — Big Numbers */}
      <StatsStrip />

      {/* 12. Maroon Section: Features Grid + Customer Testimonials + FAQ */}
      <section className="bg-maroonClr">
        {/* Features Grid */}
        <FeaturesGrid 
          title={homeSettings.featuresTitle} 
          subtitle={homeSettings.featuresSubtitle} 
          features={homeSettings.features} 
        />

        {/* Customer Reviews / Testimonials */}
        <div className="px-4 md:px-6 pb-12 sm:pb-16 md:pb-20">
          <TestimonialsSection customTestimonials={customTestimonials} />
        </div>

        {/* FAQ Accordion */}
        <FaqAccordion 
          title={homeSettings.faqTitle} 
          subtitle={homeSettings.faqSubtitle} 
          image={homeSettings.faqImage} 
          faqs={homeSettings.faqs} 
        />
      </section>

      {/* 13. Trust Icons Row — Free Shipping / Support / Secure / Easy Returns */}
      <TrustIconsRow />
    </>
  );
}

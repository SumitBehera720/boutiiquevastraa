import Image from "next/image";
import { serverGetSettings } from "@/lib/server-data";

export default async function CollectionHeader({ collection }: { collection: any }) {
  if (!collection) return null;

  const settings = await serverGetSettings();
  const customBanners = settings?.collectionBanners || {};
  const customBannerUrl = customBanners[collection.handle];
  const bannerUrl = customBannerUrl || collection.image?.url;

  const capitalizedTitle = collection.title 
    ? collection.title.charAt(0).toUpperCase() + collection.title.slice(1) 
    : "";

  return (
    <div className="relative w-full h-[220px] sm:h-[300px] md:h-[380px] lg:h-[450px] bg-neutral-100 overflow-hidden mb-8">
      {bannerUrl && (
        <>
          <Image
            src={bannerUrl}
            alt={collection.image?.altText || collection.title}
            fill
            className="object-cover object-center"
            priority
          />
        </>
      )}
      <div className="absolute inset-0 bg-black/25 flex flex-col items-center justify-center text-center p-4 z-10">
        <h1 className="text-3xl sm:text-4xl md:text-5xl font-kalnia text-white font-bold mb-2 drop-shadow-[0_2px_8px_rgba(0,0,0,0.7)]">
          {capitalizedTitle}
        </h1>
        {collection.description ? (
          <p className="max-w-2xl text-white/90 text-xs sm:text-sm md:text-base font-light drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            {collection.description}
          </p>
        ) : (
          <p className="max-w-2xl text-white/90 text-xs sm:text-sm md:text-base font-light drop-shadow-[0_1px_4px_rgba(0,0,0,0.8)]">
            Explore our handcrafted {capitalizedTitle} collection, woven with pure silk fibers and intricate traditional zari details.
          </p>
        )}
      </div>
    </div>
  );
}

import Image from "next/image";

export default function CollectionHeader({ collection }: { collection: any }) {
  if (!collection) return null;

  const capitalizedTitle = collection.title 
    ? collection.title.charAt(0).toUpperCase() + collection.title.slice(1) 
    : "";

  return (
    <div className="relative w-full h-64 md:h-80 bg-neutral-100 overflow-hidden mb-8">
      {collection.image && (
        <>
          <Image
            src={collection.image.url}
            alt={collection.image.altText || collection.title}
            fill
            className="object-cover object-center opacity-85"
            priority
          />
          {/* Subtle light overlay to ensure title contrast */}
          <div className="absolute inset-0 bg-white/30 backdrop-blur-[1px]" />
        </>
      )}
      <div className="absolute inset-0 flex flex-col items-center justify-center text-center p-4 z-10">
        <h1 className="text-4xl md:text-5xl font-kalnia text-maroonClr font-bold mb-4 drop-shadow-[0_2px_8px_rgba(255,255,255,0.9)]">
          {capitalizedTitle}
        </h1>
        {collection.description && (
          <p className="max-w-2xl text-gray-800 text-sm md:text-base font-medium drop-shadow-[0_1px_4px_rgba(255,255,255,0.9)]">
            {collection.description}
          </p>
        )}
      </div>
    </div>
  );
}

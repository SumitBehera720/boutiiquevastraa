import { getCollections } from "@/lib/shopify/queries";
import Image from "next/image";
import Link from "next/link";
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "Collections | Boutiique Vastraa",
  description: "Browse our curated collections of handcrafted sarees, kurtis, lehengas, and jewellery.",
};

export default async function CollectionsPage() {
  const collections = await getCollections(30);

  return (
    <div className="min-h-screen bg-bgClr pb-20 pt-10">
      <div className="container mx-auto px-4 text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-kalnia text-maroonClr font-medium mb-4">
          Our Collections
        </h1>
        <p className="text-neutral-600 text-sm md:text-base">
          Discover elegance woven into every drape.
        </p>
      </div>

      <div className="container mx-auto px-4">
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 sm:gap-6 md:gap-8">
          {collections.map((col: any) => (
            <Link
              key={col.id}
              href={`/collections/${col.handle}`}
              className="group relative aspect-[3/4] overflow-hidden rounded-xl border border-goldClr/20"
            >
              {col.image?.url && (
                <Image
                  src={col.image.url}
                  alt={col.title}
                  fill
                  sizes="(max-width: 768px) 50vw, (max-width: 1200px) 33vw, 25vw"
                  className="object-cover transition-transform duration-500 group-hover:scale-105"
                />
              )}
              <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/20 to-transparent" />
              <div className="absolute bottom-0 left-0 right-0 p-4">
                <h3 className="font-kalnia text-white text-base sm:text-lg font-medium">{col.title}</h3>
              </div>
            </Link>
          ))}
        </div>
      </div>
    </div>
  );
}

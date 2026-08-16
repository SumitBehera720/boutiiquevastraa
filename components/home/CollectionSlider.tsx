import Image from "next/image";
import Link from "next/link";

interface Collection {
  id: string;
  title: string;
  handle: string;
  image?: {
    url: string;
    altText: string;
  };
}

export default function CollectionSlider({ collections }: { collections: Collection[] }) {
  if (!collections || collections.length === 0) return null;

  return (
    <section className="py-16 bg-[#FDFBF7] overflow-hidden">
      <div className="container mx-auto px-4 text-center">
        <h2 className="text-3xl md:text-4xl font-serif text-primary font-bold mb-12">
          Our Most Loved Collections
        </h2>

        {/* Using a horizontal scrolling flex container for simplicity and matching the reference */}
        <div className="flex overflow-x-auto pb-8 gap-6 md:justify-center scrollbar-hide snap-x">
          {collections.slice(0, 5).map((collection) => (
            <Link 
              href={`/collections/${collection.handle}`} 
              key={collection.id}
              className="flex flex-col items-center flex-shrink-0 snap-center group"
            >
              <div className="w-40 h-40 md:w-56 md:h-56 rounded-full border-[3px] border-secondary p-1 mb-4 overflow-hidden relative transition-transform duration-300 group-hover:scale-105 shadow-md">
                <div className="w-full h-full rounded-full overflow-hidden relative">
                  {collection.image ? (
                    <Image
                      src={collection.image.url}
                      alt={collection.image.altText || collection.title}
                      fill
                      className="object-cover"
                    />
                  ) : (
                    <div className="w-full h-full bg-gray-200 flex items-center justify-center">
                      <span className="text-gray-500 text-xs">No Image</span>
                    </div>
                  )}
                </div>
              </div>
              <h3 className="text-lg font-medium text-gray-800 tracking-wide font-sans group-hover:text-primary transition-colors">
                {collection.title}
              </h3>
            </Link>
          ))}
        </div>
      </div>
    </section>
  );
}

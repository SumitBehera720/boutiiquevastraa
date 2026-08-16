"use client";

import Image from "next/image";
import Link from "next/link";

interface Collection {
  id: string;
  title: string;
  handle: string;
  image?: { url: string; altText?: string } | null;
}

export default function CollectionsSlider({ collections, title }: { collections: Collection[]; title?: string }) {
  return (
    <section>
      <div className="relative py-8 sm:py-12 md:py-16 lg:py-20">
        {/* Rangoli decoration */}
        <Image
          alt="rangoli"
          width={500}
          height={500}
          className="absolute top-0 left-0 max-h-40 w-auto object-contain opacity-60 sm:max-h-52"
          src="/images/rangoli.png"
          loading="lazy"
        />

        <h1 className="font-kalnia text-maroonClr text-center text-2xl font-medium sm:text-3xl md:text-4xl">
          {title || "Our Most Loved Collections"}
        </h1>

        <div className="mx-auto mt-8 max-w-7xl sm:mt-12 px-4">
          <div className="flex flex-wrap gap-x-2 gap-y-4 sm:gap-x-4 sm:gap-y-6 justify-center pb-4">
            {collections.slice(0, 7).map((col) => (
              <Link
                key={col.id}
                href={`/collections/${col.handle}`}
                className="flex flex-col items-center group w-[90px] min-[375px]:w-[105px] min-[425px]:w-[115px] sm:w-[130px] md:w-[140px] lg:w-[130px] xl:w-[150px]"
              >
                <div className="relative aspect-square w-full overflow-hidden rounded-xl border-[3px] border-goldClr/40 p-1 group-hover:border-goldClr transition-colors duration-300">
                  <div className="relative w-full h-full rounded-lg overflow-hidden bg-creamClr">
                    {col.image?.url && (
                      <Image
                        src={col.image.url}
                        alt={col.title}
                        fill
                        sizes="(max-width: 768px) 140px, 180px"
                        className="object-cover transition-transform duration-700 group-hover:scale-110"
                      />
                    )}
                  </div>
                </div>
                <h3 className="font-kalnia text-maroonClr text-[12px] min-[375px]:text-[13px] min-[425px]:text-[14px] sm:text-base font-medium mt-3 text-center group-hover:text-goldClr transition-colors duration-300 leading-tight">
                  {col.title}
                </h3>
              </Link>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}


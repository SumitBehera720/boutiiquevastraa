import Image from "next/image";
import { featureCards } from "@/lib/design-tokens";

export default function FeaturesGrid({ title, subtitle, features }: { title?: string; subtitle?: string; features?: any[] }) {
  const cards = features && features.length > 0 ? features : featureCards;

  return (
    <section className="bg-maroonClr space-y-12 px-4 py-8 sm:space-y-16 sm:py-12 md:space-y-20 md:px-6 md:py-16 lg:py-20">
      <div className="border-b border-gray-400 pb-12 sm:pb-16 md:pb-20">
        <div className="flex flex-col justify-between gap-6 md:flex-row">
          <h2 className="text-goldClr font-kalnia text-3xl font-medium md:w-1/2">
            {title || "What makes shopping sarees with us special?"}
          </h2>
          <p className="text-white md:w-1/2">
            {subtitle || "From handpicked fabrics to doorstep delivery, we take care of everything so you can simply enjoy the experience of finding your perfect saree."}
          </p>
        </div>

        <div className="mt-11 grid w-full grid-cols-1 gap-4 sm:gap-6 md:grid-cols-2 md:gap-8 lg:grid-cols-3">
          {cards.map((card) => (
            <div key={card.title} className="bg-goldClr overflow-hidden rounded-xl shadow-sm">
              <Image
                alt={card.title}
                width={1000}
                height={1000}
                className="aspect-video w-full object-cover"
                src={card.image}
                loading="lazy"
              />
              <div className="p-5">
                <p className="text-maroonClr font-kalnia mb-1 text-lg font-medium">
                  {card.title}
                </p>
                <p className="text-sm text-gray-100">
                  {card.description}
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}

import Link from "next/link";

export default function PromoBanner() {
  return (
    <section className="bg-primary py-12 border-y-4 border-secondary overflow-hidden relative">
      {/* Decorative subtle pattern could be added via CSS background here */}
      <div className="absolute inset-0 opacity-10 bg-[url('https://www.transparenttextures.com/patterns/stardust.png')] pointer-events-none"></div>
      
      <div className="container mx-auto px-4 flex flex-col items-center text-center relative z-10">
        <h2 className="text-4xl md:text-5xl font-serif text-secondary font-bold tracking-widest drop-shadow-md">
          Spot it. Style it. Own it.
        </h2>
        <p className="text-white mt-4 max-w-xl text-sm md:text-base font-light tracking-wide">
          Curated styles for the modern woman who embraces her heritage.
        </p>
        <Link 
          href="/collections/all" 
          className="mt-8 bg-transparent border border-secondary text-secondary hover:bg-secondary hover:text-primary transition-colors px-8 py-3 uppercase tracking-widest text-sm font-bold rounded"
        >
          Explore Collection
        </Link>
      </div>
    </section>
  );
}

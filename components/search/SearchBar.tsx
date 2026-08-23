"use client";
 
import { useState, useRef, useEffect } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { Search, X } from "lucide-react";
 
export default function SearchBar() {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<{ products: any[]; categories: any[] }>({ products: [], categories: [] });
  const inputRef = useRef<HTMLInputElement>(null);
  const router = useRouter();

  useEffect(() => {
    if (!query.trim()) {
      setSuggestions({ products: [], categories: [] });
      return;
    }

    const timer = setTimeout(async () => {
      try {
        const res = await fetch(`/api/search/suggestions?q=${encodeURIComponent(query)}`);
        if (res.ok) {
          const data = await res.json();
          setSuggestions(data);
        }
      } catch (e) {
        console.error(e);
      }
    }, 200);

    return () => clearTimeout(timer);
  }, [query]);
 
  // Focus input when search bar opens
  useEffect(() => {
    if (isOpen && inputRef.current) {
      inputRef.current.focus();
    }
  }, [isOpen]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (query.trim()) {
      router.push(`/search?q=${encodeURIComponent(query.trim())}`);
      setIsOpen(false);
      setQuery("");
    }
  };

  return (
    <>
      <button 
        onClick={() => setIsOpen(true)}
        className="inline-flex items-center justify-center bg-[#d4af37] hover:opacity-80 text-white relative h-8 w-8 cursor-pointer rounded-full transition-all shadow-sm"
        aria-label="Open search"
      >
        <Search className="h-4 w-4 text-white" aria-hidden="true" />
      </button>

      {isOpen && (
        <div className="fixed inset-0 z-50 bg-white/95 backdrop-blur-sm flex flex-col items-center pt-24 px-4 transition-all overflow-y-auto">
          <button 
            onClick={() => {
              setIsOpen(false);
              setQuery("");
            }}
            className="absolute top-6 right-6 md:right-12 p-2 text-gray-500 hover:text-primary transition-colors"
          >
            <X className="w-8 h-8" />
          </button>

          <div className="w-full max-w-3xl">
            <p className="text-sm font-medium text-gray-500 uppercase tracking-widest mb-4">
              What are you looking for?
            </p>
            <form onSubmit={handleSubmit} className="relative flex items-center mb-6">
              <input
                ref={inputRef}
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search products, collections..."
                className="w-full text-2xl md:text-4xl font-serif text-gray-800 bg-transparent border-b-2 border-gray-300 py-4 focus:outline-none focus:border-primary transition-colors placeholder:text-gray-300"
              />
              <button 
                type="submit"
                className="absolute right-0 text-primary hover:text-[#6A102A] p-4 transition-colors"
              >
                <Search className="w-8 h-8 md:w-10 md:h-10" />
              </button>
            </form>

            {/* Suggestions list for mobile */}
            {(suggestions.products.length > 0 || suggestions.categories.length > 0) && (
              <div className="bg-white border border-gray-100 rounded-xl shadow-md p-4 mb-6 animate-scaleUp text-left max-h-[50vh] overflow-y-auto">
                {suggestions.categories.length > 0 && (
                  <div className="mb-4">
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Matching Categories</p>
                    <div className="flex flex-wrap gap-2">
                      {suggestions.categories.map((c: any) => (
                        <Link
                          key={c.id}
                          href={`/collections/${c.handle}`}
                          onClick={() => {
                            setIsOpen(false);
                            setQuery("");
                          }}
                          className="text-xs font-semibold bg-gray-50 text-gray-700 hover:text-white hover:bg-maroonClr px-3 py-1.5 rounded-full transition-all"
                        >
                          {c.title}
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
                {suggestions.products.length > 0 && (
                  <div>
                    <p className="text-[10px] font-bold text-gray-400 uppercase tracking-widest mb-2">Matching Products</p>
                    <div className="space-y-3">
                      {suggestions.products.map((p: any) => (
                        <Link
                          key={p.id}
                          href={`/products/${p.handle}`}
                          onClick={() => {
                            setIsOpen(false);
                            setQuery("");
                          }}
                          className="flex items-center gap-4 p-2 rounded-lg hover:bg-gray-50 transition-colors group"
                        >
                          {p.image && (
                            <div className="relative w-10 h-12 bg-gray-100 rounded overflow-hidden flex-shrink-0">
                              <img src={p.image} alt="" className="object-cover w-full h-full" />
                            </div>
                          )}
                          <div className="flex-grow min-w-0">
                            <p className="text-sm font-bold text-gray-800 truncate group-hover:text-maroonClr transition-colors">{p.title}</p>
                            <p className="text-xs text-gray-500 font-semibold mt-0.5">₹{parseFloat(p.price).toFixed(2)}</p>
                          </div>
                        </Link>
                      ))}
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Quick Links Suggestions */}
            <div className="flex gap-4 text-sm text-gray-500 font-medium">
              <span>Popular:</span>
              <button onClick={() => { setQuery("Saree"); }} className="hover:text-primary underline">Sarees</button>
              <button onClick={() => { setQuery("Lehenga"); }} className="hover:text-primary underline">Lehengas</button>
              <button onClick={() => { setQuery("Jewellery"); }} className="hover:text-primary underline">Jewellery</button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

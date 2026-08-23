"use client";

import { useState, useTransition, useMemo } from "react";
import Image from "next/image";
import Link from "next/link";
import { Filter, X, ChevronDown, ChevronUp } from "lucide-react";
import ProductCard from "@/components/product/ProductCard";

interface ProductsClientProps {
  initialProducts: any[];
}

export default function ProductsClient({ initialProducts }: ProductsClientProps) {
  const [isPending, startTransition] = useTransition();
  const [isMobileFiltersOpen, setIsMobileFiltersOpen] = useState(false);

  // Filter States
  const [selectedCollection, setSelectedCollection] = useState<string | null>(null);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [selectedSubCategory, setSelectedSubCategory] = useState<string | null>(null);
  const [priceRange, setPriceRange] = useState<[number, number]>([0, 10000]);
  const [sortBy, setSortBy] = useState<string>("recommended");

  // Options - dynamically extracted from store products
  const collectionsList = useMemo(() => {
    const set = new Set<string>();
    initialProducts.forEach(p => {
      const colHandles = Array.isArray(p.collectionHandles) ? p.collectionHandles : [];
      colHandles.forEach((h: string) => {
        if (!["saree", "kurti", "lehenga", "jewellery", "men", "women", "all", "frontpage"].includes(h.toLowerCase())) {
          const title = h.split("-").map(w => w.charAt(0).toUpperCase() + w.slice(1)).join(" ");
          set.add(title);
        }
      });
    });
    const list = Array.from(set).filter(Boolean);
    return list.length > 0 ? list : ["New Arrival", "Festive Collection", "Wedding Collection", "Best Seller", "Daily Wear"];
  }, [initialProducts]);

  const categoriesList = useMemo(() => {
    const set = new Set<string>();
    initialProducts.forEach(p => {
      if (p.productType) {
        set.add(p.productType.charAt(0).toUpperCase() + p.productType.slice(1).toLowerCase());
      }
      const colHandles = Array.isArray(p.collectionHandles) ? p.collectionHandles : [];
      colHandles.forEach((h: string) => {
        const lh = h.toLowerCase();
        if (["saree", "sarees", "kurti", "kurtis", "lehenga", "lehengas", "jewellery", "men", "women"].includes(lh)) {
          if (lh.startsWith("saree")) set.add("Sarees");
          else if (lh.startsWith("kurti")) set.add("Kurtis");
          else if (lh.startsWith("lehenga")) set.add("Lehengas");
          else if (lh === "jewellery") set.add("Jewellery");
          else set.add(lh.charAt(0).toUpperCase() + lh.slice(1));
        }
      });
    });
    const list = Array.from(set).filter(Boolean);
    return list.length > 0 ? list : ["Sarees", "Lehengas", "Kurtis", "Jewellery"];
  }, [initialProducts]);

  const subCategoriesList = useMemo(() => {
    const set = new Set<string>();
    initialProducts.forEach(p => {
      if (selectedCategory) {
        const catNorm = selectedCategory.toLowerCase().replace(/s$/, "");
        const categoryMatch = p.productType?.toLowerCase() === selectedCategory.toLowerCase() ||
          p.title.toLowerCase().includes(selectedCategory.toLowerCase()) ||
          p.title.toLowerCase().includes(catNorm) ||
          (Array.isArray(p.collectionHandles) && p.collectionHandles.some((h: string) => h.toLowerCase() === catNorm));
        if (!categoryMatch) return;
      }
      if (Array.isArray(p.tags)) {
        p.tags.forEach((tag: string) => {
          const lowerTag = tag.toLowerCase();
          if (["saree", "sarees", "kurti", "kurtis", "lehenga", "lehengas", "jewellery", "men", "women", "new", "hot", "trending", "featured", "best"].includes(lowerTag)) {
            return;
          }
          set.add(tag.charAt(0).toUpperCase() + tag.slice(1).toLowerCase());
        });
      }
    });
    return Array.from(set).filter(Boolean).slice(0, 10);
  }, [initialProducts, selectedCategory]);

  const hasActiveFilters = selectedCollection !== null || selectedCategory !== null || selectedSubCategory !== null || priceRange[1] < 10000;

  const clearFilters = () => {
    startTransition(() => {
      setSelectedCollection(null);
      setSelectedCategory(null);
      setSelectedSubCategory(null);
      setPriceRange([0, 10000]);
    });
  };

  const handleCollectionChange = (val: string) => {
    startTransition(() => {
      setSelectedCollection(val === selectedCollection ? null : val);
    });
  };

  const handleCategoryChange = (val: string) => {
    startTransition(() => {
      setSelectedCategory(val === selectedCategory ? null : val);
    });
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseInt(e.target.value);
    startTransition(() => {
      setPriceRange([0, val]);
    });
  };

  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // Filter by Collection
    if (selectedCollection) {
      result = result.filter(p => {
        const titleMatch = p.title.toLowerCase().includes(selectedCollection.toLowerCase());
        const tagsMatch = p.tags?.some((t: string) => t.toLowerCase() === selectedCollection.toLowerCase());
        return titleMatch || tagsMatch;
      });
    }

    // Filter by Category
    if (selectedCategory) {
      result = result.filter(p => {
        const titleMatch = p.title.toLowerCase().includes(selectedCategory.toLowerCase());
        const typeMatch = p.productType?.toLowerCase() === selectedCategory.toLowerCase();
        return titleMatch || typeMatch;
      });
    }

    // Filter by Sub Category
    if (selectedSubCategory) {
      result = result.filter(p => 
        Array.isArray(p.tags) && p.tags.some((t: string) => t.toLowerCase() === selectedSubCategory.toLowerCase())
      );
    }

    // Filter by Price
    result = result.filter(p => {
      const price = parseFloat(p.priceRange?.minVariantPrice?.amount || "0");
      return price >= priceRange[0] && price <= priceRange[1];
    });

    // Sort
    switch (sortBy) {
      case "price-low-high":
        result.sort((a, b) => parseFloat(a.priceRange?.minVariantPrice?.amount || "0") - parseFloat(b.priceRange?.minVariantPrice?.amount || "0"));
        break;
      case "price-high-low":
        result.sort((a, b) => parseFloat(b.priceRange?.minVariantPrice?.amount || "0") - parseFloat(a.priceRange?.minVariantPrice?.amount || "0"));
        break;
      case "newest":
        result.reverse();
        break;
      default:
        break;
    }

    return result;
  }, [initialProducts, selectedCollection, selectedCategory, selectedSubCategory, priceRange, sortBy]);

  return (
    <div className="bg-[#FFFDF9] min-h-screen">
      {/* Promotional Banner matching screenshot */}
      <div className="w-full bg-[#7B0B36] text-white relative flex flex-col md:flex-row items-center overflow-hidden">
         {/* Background pattern */}
         <div className="absolute right-0 top-0 h-full w-1/2 opacity-20 pointer-events-none">
            <div className="w-[500px] h-[500px] border-[50px] border-white/20 rounded-full absolute -right-[200px] -top-[100px] blur-3xl"></div>
            <div className="w-[800px] h-[800px] border-[2px] border-dashed border-goldClr/40 rounded-full absolute -right-[100px] top-1/2 -translate-y-1/2 opacity-50 animate-[spin_60s_linear_infinite]"></div>
         </div>
         {/* Banner Content */}
         <div className="container mx-auto px-4 py-16 md:py-24 relative z-10 flex flex-col md:flex-row items-center gap-8">
            <div className="flex-1 md:pr-12 flex flex-col justify-center items-center">
              <p className="text-[#e2b861] font-medium tracking-wide mb-2 text-lg md:text-xl md:mb-4">Timeless Sarees, Limited-Time Prices</p>
              <h1 className="font-kalnia text-5xl md:text-6xl lg:text-7xl mb-4 leading-tight text-center md:whitespace-nowrap">
                WRAP YOURSELF<br />IN ELEGANCE
              </h1>
              <p className="text-2xl md:text-4xl font-light mb-8">Save Up to <span className="font-bold text-white text-3xl md:text-5xl">60%</span></p>
              <div className="flex flex-col sm:flex-row items-center gap-6">
                 <button className="bg-[#FF6B4A] text-white px-10 py-3 rounded-full font-bold uppercase tracking-wider text-sm hover:bg-[#ff5630] transition-colors shadow-lg">
                   SHOP NOW!
                 </button>
                 <span className="text-white/90 font-light tracking-wide font-serif italic md:text-xl">www.boutiiquevastraa.com</span>
              </div>
            </div>
            
            {/* The 3 models layout matching screenshot closely */}
            <div className="hidden md:flex gap-1 w-1/2 justify-end h-[500px] relative">
                <div className="w-[200px] h-[450px] relative overflow-hidden shadow-2xl border-2 border-maroonClr/50 rounded z-10 self-end -mr-10 translate-y-4">
                   <Image src="/images/banner-1773659037696-747582281.webp" alt="Model" fill className="object-cover" />
                </div>
                <div className="w-[220px] h-[480px] relative overflow-hidden shadow-2xl border-4 border-white/10 rounded z-20">
                   <Image src="/images/banner-1773659047206-859638957.webp" alt="Model" fill className="object-cover" />
                </div>
                <div className="w-[200px] h-[450px] relative overflow-hidden shadow-2xl border-2 border-maroonClr/50 rounded z-10 self-end -ml-10 translate-y-4">
                   <Image src="/images/banner-1773659037696-747582281.webp" alt="Model" fill className="object-cover scale-x-[-1]" />
                </div>
            </div>
         </div>
      </div>

      <div className="container mx-auto px-4 py-8 flex flex-col lg:flex-row gap-8">
        {/* Mobile Filters Toggle */}
        <button 
          onClick={() => setIsMobileFiltersOpen(!isMobileFiltersOpen)}
          className="lg:hidden flex items-center justify-center gap-2 bg-maroonClr text-white py-3 rounded-md font-medium w-full"
        >
          <Filter size={18} /> {isMobileFiltersOpen ? 'Hide Filters' : 'Show Filters'}
        </button>

        {/* Sidebar Filters */}
        <div className={`w-full lg:w-64 flex-shrink-0 ${isMobileFiltersOpen ? 'block' : 'hidden lg:block'}`}>
          <div className="bg-white p-5 rounded-lg border border-gray-100 shadow-sm sticky top-[160px] max-h-[75vh] overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between mb-6 pb-4 border-b border-gray-100">
               <h3 className="font-bold text-maroonClr flex items-center gap-2 uppercase tracking-wide">
                 <Filter size={16} /> FILTERS
               </h3>
               {hasActiveFilters && (
                 <button onClick={clearFilters} className="text-xs text-red-500 font-medium flex items-center gap-1 hover:underline px-2 py-1 bg-red-50 rounded">
                   <X size={12} /> Clear
                 </button>
               )}
            </div>

            {/* Collection */}
            <div className="mb-6">
              <h4 className="font-bold text-gray-800 mb-3 text-sm">Collection</h4>
              <div className="space-y-3 pl-1">
                {collectionsList.map(col => (
                  <label key={col} className="flex items-center gap-3 cursor-pointer group">
                    <div className="relative flex items-center justify-center">
                      <input 
                        type="radio" 
                        checked={selectedCollection === col}
                        onChange={() => handleCollectionChange(col)}
                        className="peer appearance-none w-4 h-4 border border-gray-300 rounded-full checked:border-maroonClr cursor-pointer transition-colors"
                      />
                      <div className="absolute w-2 h-2 bg-maroonClr rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                    </div>
                    <span className="text-sm text-gray-600 group-hover:text-maroonClr transition-colors">{col}</span>
                  </label>
                ))}
              </div>
            </div>

            {/* Category */}
            {!selectedCategory ? (
              <div className="mb-6">
                <h4 className="font-bold text-gray-800 mb-3 text-sm">Category</h4>
                <div className="space-y-3 pl-1">
                  {categoriesList.map(cat => (
                    <label key={cat} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input 
                          type="radio" 
                          checked={selectedCategory === cat}
                          onChange={() => handleCategoryChange(cat)}
                          className="peer appearance-none w-4 h-4 border border-gray-300 rounded-full checked:border-maroonClr cursor-pointer transition-colors"
                        />
                        <div className="absolute w-2 h-2 bg-maroonClr rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                      </div>
                      <span className="text-sm text-gray-600 group-hover:text-maroonClr transition-colors">{cat}</span>
                    </label>
                  ))}
                </div>
              </div>
            ) : (
              <>
                <div className="mb-6 bg-maroonClr/5 p-3 rounded-lg border border-maroonClr/10">
                  <div className="flex items-center justify-between">
                    <div>
                      <span className="text-[10px] uppercase font-bold tracking-wider text-gray-400">Category</span>
                      <h5 className="font-bold text-maroonClr text-sm">{selectedCategory}</h5>
                    </div>
                    <button 
                      onClick={() => {
                        startTransition(() => {
                          setSelectedCategory(null);
                          setSelectedSubCategory(null);
                        });
                      }}
                      className="text-xs text-maroonClr hover:underline font-semibold"
                    >
                      Change
                    </button>
                  </div>
                </div>

                {/* Sub Category */}
                <div className="mb-6">
                  <h4 className="font-bold text-gray-800 mb-3 text-sm">Sub Category</h4>
                  {subCategoriesList.length > 0 ? (
                    <div className="space-y-3 pl-1 max-h-[160px] overflow-y-auto pr-1">
                      {subCategoriesList.map(sub => (
                        <label key={sub} className="flex items-center gap-3 cursor-pointer group">
                          <div className="relative flex items-center justify-center">
                            <input 
                              type="radio" 
                              checked={selectedSubCategory === sub}
                              onChange={() => startTransition(() => setSelectedSubCategory(sub === selectedSubCategory ? null : sub))}
                              className="peer appearance-none w-4 h-4 border border-gray-300 rounded-full checked:border-maroonClr cursor-pointer transition-colors"
                            />
                            <div className="absolute w-2 h-2 bg-maroonClr rounded-full opacity-0 peer-checked:opacity-100 transition-opacity"></div>
                          </div>
                          <span className="text-sm text-gray-600 group-hover:text-maroonClr transition-colors">{sub}</span>
                        </label>
                      ))}
                    </div>
                  ) : (
                    <p className="text-xs text-gray-400 pl-1">No sub-categories available</p>
                  )}
                </div>

                {/* Price Range */}
                <div className="mb-6">
                  <h4 className="font-bold text-gray-800 mb-3 text-sm">Price Range</h4>
                  <div className="px-1">
                    <div className="flex justify-between text-xs font-medium text-gray-800 mb-2">
                      <span>₹0</span>
                      <span>₹{priceRange[1]}</span>
                    </div>
                    <input 
                      type="range" 
                      min="0" 
                      max="10000" 
                      step="100"
                      value={priceRange[1]} 
                      onChange={handlePriceChange}
                      className="w-full h-[3px] bg-maroonClr/20 rounded-lg appearance-none cursor-pointer accent-maroonClr"
                    />
                  </div>
                </div>
              </>
            )}
          </div>
        </div>

        {/* Products Grid Area */}
        <div className="flex-1">
          {/* Header */}
          <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center mb-6 pb-2 border-b border-gray-200 gap-4">
             <h2 className="text-3xl font-bold text-maroonClr font-kalnia">All Products</h2>
             <div className="relative min-w-[150px]">
               <select 
                 value={sortBy}
                 onChange={(e) => startTransition(() => setSortBy(e.target.value))}
                 className="appearance-none bg-maroonClr text-white text-sm font-bold px-4 py-2.5 pr-8 rounded flex items-center gap-2 cursor-pointer focus:outline-none w-full"
               >
                 <option value="recommended">Sort by: Recommended</option>
                 <option value="newest">Newest</option>
                 <option value="price-low-high">Price: Low to High</option>
                 <option value="price-high-low">Price: High to Low</option>
               </select>
               <div className="absolute right-3 top-1/2 -translate-y-1/2 flex flex-col pointer-events-none text-white/80">
                 <ChevronUp size={12} className="-mb-1" />
                 <ChevronDown size={12} />
               </div>
             </div>
          </div>

          {/* Loading State Overlay */}
          <div className="relative min-h-[400px]">
            {isPending && (
              <div className="absolute inset-0 z-20 bg-white/60 backdrop-blur-[2px] flex flex-col items-center justify-center rounded-lg">
                <div className="w-12 h-12 border-4 border-gray-200 border-t-maroonClr rounded-full animate-spin mb-4"></div>
                <p className="text-maroonClr font-medium animate-pulse text-sm">Applying filters...</p>
              </div>
            )}

            {/* Grid */}
            {filteredProducts.length > 0 ? (
              <div className="grid grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-3 sm:gap-4 xl:gap-6">
                {filteredProducts.map(p => (
                  <ProductCard key={p.id} product={p} />
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center py-20 text-center text-gray-500 bg-white border border-gray-100 rounded-xl shadow-sm">
                 <p className="text-xl font-medium mb-3 text-maroonClr font-kalnia">No products found</p>
                 <p className="text-sm mb-6 max-w-sm">We couldn't find any products matching your current filters. Try selecting a different category or price range.</p>
                 <button onClick={clearFilters} className="bg-maroonClr text-white px-6 py-2 rounded font-bold text-sm hover:bg-maroonClr/90 transition-colors">Clear All Filters</button>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

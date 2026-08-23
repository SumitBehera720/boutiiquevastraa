"use client";

import { useState, useMemo, useEffect } from "react";
import FilterSidebar from "./FilterSidebar";
import SortDropdown from "./SortDropdown";
import ProductGrid from "./ProductGrid";

interface CollectionProductsClientProps {
  initialProducts: any[];
  filters: any[];
}

export default function CollectionProductsClient({ 
  initialProducts, 
  filters 
}: CollectionProductsClientProps) {
  const [activeFilters, setActiveFilters] = useState<string[]>([]);
  const [sortValue, setSortValue] = useState<string>("DEFAULT");

  // Load initial filter and sort states from URL on client mount
  useEffect(() => {
    const searchParams = new URLSearchParams(window.location.search);
    const filtersFromUrl = searchParams.getAll("filter");
    setActiveFilters(filtersFromUrl);

    const sort = searchParams.get("sort") || "COLLECTION_DEFAULT";
    const reverse = searchParams.get("reverse") || "false";
    const val = sort === "COLLECTION_DEFAULT" ? "DEFAULT" : `${sort}-${reverse}`;
    setSortValue(val);
  }, []);

  const handleFilterToggle = (filterInput: any) => {
    const filterJson = JSON.stringify(filterInput);
    setActiveFilters((prev) => {
      const isAlreadyActive = prev.includes(filterJson);
      const next = isAlreadyActive 
        ? prev.filter(f => f !== filterJson) 
        : [...prev, filterJson];

      // Update URL query parameters silently without page reload
      const url = new URL(window.location.href);
      url.searchParams.delete("filter");
      url.searchParams.delete("after"); // Reset pagination
      next.forEach(f => url.searchParams.append("filter", f));
      window.history.replaceState(null, "", url.toString());

      return next;
    });
  };

  const handleClearAll = () => {
    setActiveFilters([]);
    const url = new URL(window.location.href);
    url.searchParams.delete("filter");
    url.searchParams.delete("after");
    window.history.replaceState(null, "", url.toString());
  };

  const handleSortChange = (val: string) => {
    setSortValue(val);
    const url = new URL(window.location.href);
    if (val === "DEFAULT") {
      url.searchParams.delete("sort");
      url.searchParams.delete("reverse");
    } else {
      const [sortKey, reverse] = val.split("-");
      url.searchParams.set("sort", sortKey);
      url.searchParams.set("reverse", reverse);
    }
    url.searchParams.delete("after");
    window.history.replaceState(null, "", url.toString());
  };

  // Computes the filtered and sorted products instantly
  const filteredProducts = useMemo(() => {
    let result = [...initialProducts];

    // Apply Active Filters
    if (activeFilters.length > 0) {
      const parsedFilters = activeFilters.map(f => JSON.parse(f));
      const availabilityFilters = parsedFilters.filter(f => f.available !== undefined);
      const priceFilters = parsedFilters.filter(f => f.price !== undefined);
      const tagFilters = parsedFilters.filter(f => f.tag !== undefined);

      result = result.filter((edge: any) => {
        const p = edge.node;

        if (availabilityFilters.length > 0) {
          const isAvail = p.inventory === null || p.inventory === undefined || Number(p.inventory) > 0;
          const matchesAny = availabilityFilters.some(f => isAvail === f.available);
          if (!matchesAny) return false;
        }

        if (priceFilters.length > 0) {
          const price = parseFloat(p.priceRange?.minVariantPrice?.amount || "0");
          const matchesAny = priceFilters.some(f => {
            const min = f.price.min ?? 0;
            const max = f.price.max ?? Infinity;
            return price >= min && price <= max;
          });
          if (!matchesAny) return false;
        }

        if (tagFilters.length > 0) {
          const pTags = (p.tags || []).map((t: string) => t.toLowerCase());
          const matchesAny = tagFilters.some(f => pTags.includes(f.tag.toLowerCase()));
          if (!matchesAny) return false;
        }

        return true;
      });
    }

    // Apply Sorting
    if (sortValue !== "DEFAULT") {
      const [sortKey, reverseStr] = sortValue.split("-");
      const reverse = reverseStr === "true";

      if (sortKey === "PRICE") {
        result.sort((a, b) => {
          const priceA = parseFloat(a.node.priceRange?.minVariantPrice?.amount || "0");
          const priceB = parseFloat(b.node.priceRange?.minVariantPrice?.amount || "0");
          return reverse ? priceB - priceA : priceA - priceB;
        });
      } else if (sortKey === "CREATED_AT") {
        result.sort((a, b) => {
          const idA = a.node.id || "";
          const idB = b.node.id || "";
          return reverse ? idB.localeCompare(idA) : idA.localeCompare(idB);
        });
      }
    }

    return result;
  }, [initialProducts, activeFilters, sortValue]);

  return (
    <div className="flex flex-col md:flex-row gap-8 items-start">
      {/* Sidebar */}
      <FilterSidebar 
        filters={filters} 
        activeFilters={activeFilters}
        onFilterToggle={handleFilterToggle}
        onClearAll={handleClearAll}
      />

      {/* Main Product Grid */}
      <div className="flex-1 w-full">
        {/* Top Bar info & Sort */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between mb-8 border-b border-gray-200 pb-4">
          <p className="text-gray-600 text-sm font-medium mb-4 sm:mb-0">
            Showing {filteredProducts.length} products
          </p>
          <div className="flex items-center justify-end w-full sm:w-auto">
            <SortDropdown 
              sortValue={sortValue}
              onSortChange={handleSortChange}
            />
          </div>
        </div>

        {/* Product Grid */}
        <ProductGrid products={filteredProducts} />
      </div>
    </div>
  );
}

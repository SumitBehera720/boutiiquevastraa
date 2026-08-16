"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";

export default function SortDropdown() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();

  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const value = e.target.value;
    const params = new URLSearchParams(searchParams.toString());
    
    if (value === "DEFAULT") {
      params.delete("sort");
      params.delete("reverse");
    } else {
      const [sortKey, reverse] = value.split("-");
      params.set("sort", sortKey);
      params.set("reverse", reverse);
    }
    
    // Reset cursor for pagination when sorting changes
    params.delete("after");

    router.push(`${pathname}?${params.toString()}`);
  };

  const currentSort = searchParams.get("sort") || "COLLECTION_DEFAULT";
  const currentReverse = searchParams.get("reverse") || "false";
  const currentValue = currentSort === "COLLECTION_DEFAULT" ? "DEFAULT" : `${currentSort}-${currentReverse}`;

  return (
    <div className="flex items-center gap-2">
      <label htmlFor="sort" className="text-sm text-gray-600 font-medium">Sort by:</label>
      <select 
        id="sort"
        value={currentValue}
        onChange={handleSortChange}
        className="border border-gray-300 rounded px-3 py-1.5 text-sm text-gray-800 focus:outline-none focus:border-primary bg-white"
      >
        <option value="DEFAULT">Featured</option>
        <option value="CREATED_AT-true">Newest</option>
        <option value="PRICE-false">Price: Low to High</option>
        <option value="PRICE-true">Price: High to Low</option>
        <option value="BEST_SELLING-false">Best Selling</option>
      </select>
    </div>
  );
}

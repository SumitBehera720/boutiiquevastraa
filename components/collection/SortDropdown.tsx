"use client";


interface SortDropdownProps {
  sortValue: string;
  onSortChange: (val: string) => void;
}

export default function SortDropdown({ 
  sortValue = "DEFAULT", 
  onSortChange 
}: SortDropdownProps) {
  const handleSortChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onSortChange(e.target.value);
  };

  const currentValue = sortValue;

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

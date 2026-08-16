"use client";

import { useRouter, useSearchParams, usePathname } from "next/navigation";
import { useState } from "react";
import { ChevronDown, ChevronUp, X, Filter } from "lucide-react";

export default function FilterSidebar({ filters }: { filters: any[] }) {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  if (!filters || filters.length === 0) return null;

  const handleFilterToggle = (filterInput: any) => {
    const params = new URLSearchParams(searchParams.toString());
    const filterJson = JSON.stringify(filterInput);
    
    // Check if filter already exists
    const existingFilters = params.getAll("filter");
    if (existingFilters.includes(filterJson)) {
      // Remove it
      const newFilters = existingFilters.filter(f => f !== filterJson);
      params.delete("filter");
      newFilters.forEach(f => params.append("filter", f));
    } else {
      // Add it
      params.append("filter", filterJson);
    }

    params.delete("after"); // Reset pagination
    router.push(`${pathname}?${params.toString()}`);
  };

  const isFilterActive = (filterInput: any) => {
    const filterJson = JSON.stringify(filterInput);
    return searchParams.getAll("filter").includes(filterJson);
  };

  const hasActiveFilters = searchParams.getAll("filter").length > 0;

  const clearAllFilters = () => {
    const params = new URLSearchParams(searchParams.toString());
    params.delete("filter");
    params.delete("after");
    router.push(`${pathname}?${params.toString()}`);
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden mb-4">
        <button 
          onClick={() => setIsOpenMobile(true)}
          className="flex items-center gap-2 border border-gray-300 px-4 py-2 rounded font-medium text-gray-700 w-full justify-center"
        >
          <Filter className="w-4 h-4" /> Filter Options
        </button>
      </div>

      {/* Sidebar Content */}
      <div className={`
        fixed inset-0 z-50 bg-white md:bg-transparent md:static md:block md:w-64 flex-shrink-0 transition-transform duration-300 transform
        ${isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        overflow-y-auto h-full md:h-auto pb-20 md:pb-0
      `}>
        <div className="p-4 md:p-0 border-b md:border-none border-gray-200 flex justify-between items-center md:mb-6">
          <h2 className="text-xl font-serif font-bold text-gray-800">Filters</h2>
          <button className="md:hidden p-2" onClick={() => setIsOpenMobile(false)}>
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {hasActiveFilters && (
          <button 
            onClick={clearAllFilters}
            className="text-sm text-primary underline mb-4 block hover:text-[#6A102A]"
          >
            Clear all
          </button>
        )}

        <div className="px-4 md:px-0 space-y-6">
          {filters.map((filter) => (
            <FilterSection 
              key={filter.id} 
              filter={filter} 
              isFilterActive={isFilterActive} 
              handleFilterToggle={handleFilterToggle} 
            />
          ))}
        </div>

        {/* Mobile Apply Button */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 p-4 bg-white border-t border-gray-200">
          <button 
            onClick={() => setIsOpenMobile(false)}
            className="w-full bg-primary text-white py-3 rounded font-bold tracking-widest uppercase"
          >
            Show Results
          </button>
        </div>
      </div>
    </>
  );
}

function FilterSection({ filter, isFilterActive, handleFilterToggle }: any) {
  const [isOpen, setIsOpen] = useState(true);

  // Exclude empty filters
  const validValues = filter.values.filter((v: any) => v.count > 0);
  if (validValues.length === 0) return null;

  return (
    <div className="border-b border-gray-200 pb-4">
      <button 
        className="w-full flex justify-between items-center py-2 text-left focus:outline-none"
        onClick={() => setIsOpen(!isOpen)}
      >
        <span className="font-semibold text-gray-800 text-sm uppercase tracking-wider">{filter.label}</span>
        {isOpen ? <ChevronUp className="w-4 h-4 text-gray-500" /> : <ChevronDown className="w-4 h-4 text-gray-500" />}
      </button>
      
      {isOpen && (
        <div className="mt-3 space-y-2 max-h-60 overflow-y-auto custom-scrollbar">
          {validValues.map((val: any) => (
            <label key={val.id} className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input 
                  type="checkbox" 
                  checked={isFilterActive(JSON.parse(val.input))}
                  onChange={() => handleFilterToggle(JSON.parse(val.input))}
                  className="peer appearance-none w-4 h-4 border border-gray-300 rounded checked:bg-primary checked:border-primary transition-colors cursor-pointer"
                />
                <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-sm text-gray-600 group-hover:text-primary transition-colors flex-1">
                {val.label}
              </span>
              <span className="text-xs text-gray-400">({val.count})</span>
            </label>
          ))}
        </div>
      )}
    </div>
  );
}

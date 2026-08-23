"use client";

import { useState } from "react";
import { ChevronDown, ChevronUp, X, Filter } from "lucide-react";

interface FilterSidebarProps {
  filters: any[];
  activeFilters?: string[];
  onFilterToggle: (filterInput: any) => void;
  onClearAll: () => void;
}

export default function FilterSidebar({ 
  filters, 
  activeFilters = [], 
  onFilterToggle, 
  onClearAll 
}: FilterSidebarProps) {
  const [isOpenMobile, setIsOpenMobile] = useState(false);

  if (!filters || filters.length === 0) return null;

  const handleFilterToggle = (filterInput: any) => {
    onFilterToggle(filterInput);
  };

  const isFilterActive = (filterInput: any) => {
    const filterJson = JSON.stringify(filterInput);
    return activeFilters.includes(filterJson);
  };

  const hasActiveFilters = activeFilters.length > 0;

  const clearAllFilters = () => {
    onClearAll();
  };

  return (
    <>
      {/* Mobile Toggle Button */}
      <div className="md:hidden mb-4">
        <button 
          onClick={() => setIsOpenMobile(true)}
          className="flex items-center gap-2 border border-maroonClr/40 bg-white px-4 py-2.5 rounded-lg font-semibold text-maroonClr w-full justify-center shadow-sm"
        >
          <Filter className="w-4 h-4 text-maroonClr" /> Filter Products
          {hasActiveFilters && (
            <span className="ml-1 bg-maroonClr text-white text-[10px] font-bold px-2 py-0.5 rounded-full">
              {activeFilters.length}
            </span>
          )}
        </button>
      </div>

      {/* Dark Backdrop Overlay on Mobile */}
      {isOpenMobile && (
        <div 
          onClick={() => setIsOpenMobile(false)}
          className="md:hidden fixed inset-0 z-[110] bg-black/60 backdrop-blur-xs transition-opacity duration-300"
        />
      )}

      {/* Sidebar Content Sheet */}
      <div className={`
        fixed inset-y-0 left-0 z-[120] bg-white w-full max-w-xs md:max-w-none md:bg-transparent md:sticky md:top-[160px] md:z-30 md:block md:w-64 flex-shrink-0 transition-transform duration-300 transform
        ${isOpenMobile ? "translate-x-0" : "-translate-x-full md:translate-x-0"}
        overflow-y-auto h-full md:h-fit md:max-h-[75vh] pb-28 md:pb-4 custom-scrollbar
      `}>
        <div className="p-4 md:p-0 border-b md:border-none border-gray-200 flex justify-between items-center md:mb-6">
          <h2 className="text-xl font-serif font-bold text-gray-800">Filter Products</h2>
          <button className="md:hidden p-2 rounded-full hover:bg-gray-100" onClick={() => setIsOpenMobile(false)}>
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {hasActiveFilters && (
          <div className="px-4 md:px-0 pt-3">
            <button 
              onClick={clearAllFilters}
              className="text-xs font-bold text-maroonClr underline mb-4 block hover:text-[#6A102A]"
            >
              Clear all filters ({activeFilters.length})
            </button>
          </div>
        )}

        <div className="px-4 md:px-0 space-y-6 pt-2">
          {filters.map((filter) => (
            <FilterSection 
              key={filter.id} 
              filter={filter} 
              isFilterActive={isFilterActive} 
              handleFilterToggle={handleFilterToggle} 
            />
          ))}
        </div>

        {/* Mobile Apply Floating Bar — High z-130 so it sits ABOVE MobileBottomNav (z-40) */}
        <div className="md:hidden fixed bottom-0 left-0 right-0 z-[130] p-4 pb-6 bg-white border-t border-gray-200 shadow-[0_-4px_20px_rgba(0,0,0,0.15)] flex gap-2">
          {hasActiveFilters && (
            <button
              onClick={clearAllFilters}
              className="px-4 py-3 border border-gray-300 text-gray-700 rounded-lg text-xs font-bold uppercase tracking-wider"
            >
              Clear
            </button>
          )}
          <button 
            onClick={() => setIsOpenMobile(false)}
            className="flex-1 bg-maroonClr text-white py-3 rounded-lg text-xs font-bold tracking-widest uppercase shadow-md active:scale-98 transition-transform"
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
                  className="peer appearance-none w-4 h-4 border border-gray-300 rounded checked:bg-maroonClr checked:border-maroonClr transition-colors cursor-pointer"
                />
                <svg className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" viewBox="0 0 14 10" fill="none" xmlns="http://www.w3.org/2000/svg">
                  <path d="M1 5L4.5 8.5L13 1" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
                </svg>
              </div>
              <span className="text-sm text-gray-600 group-hover:text-maroonClr transition-colors flex-1">
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

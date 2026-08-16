"use client";

import { Ruler } from "lucide-react";

interface VariantSelectorProps {
  options: any[];
  selectedOptions: any[];
  onChange: (name: string, value: string) => void;
  showSizeChart?: boolean;
  onOpenSizeChart?: () => void;
}

export default function VariantSelector({ 
  options, 
  selectedOptions, 
  onChange,
  showSizeChart,
  onOpenSizeChart
}: VariantSelectorProps) {
  if (!options || options.length === 0 || (options.length === 1 && options[0].name === "Title")) {
    return null; // Don't show selector for single default variant
  }

  return (
    <div className="flex flex-col gap-5 mb-6">
      {options.map((option) => {
        const selectedValue = selectedOptions.find((o) => o.name === option.name)?.value;
        const isSizeOption = option.name.toLowerCase() === "size";

        return (
          <div key={option.name}>
            <div className="flex justify-between items-center mb-2.5">
              <h3 className="text-xs font-bold text-gray-900 uppercase tracking-wider flex items-center gap-2">
                <span>Select {option.name}:</span>
                {selectedValue && (
                  <span className="font-semibold text-maroonClr capitalize">{selectedValue}</span>
                )}
              </h3>
              {isSizeOption && showSizeChart && onOpenSizeChart && (
                <button
                  type="button"
                  onClick={onOpenSizeChart}
                  className="flex items-center gap-1 text-[11px] text-maroonClr hover:underline font-bold uppercase tracking-wider transition-colors"
                >
                  <Ruler className="w-3.5 h-3.5" />
                  Size Guide
                </button>
              )}
            </div>
            <div className="flex flex-wrap gap-2.5">
              {option.values.map((val: string) => {
                const isSelected = selectedValue === val;
                
                return (
                  <button
                    key={val}
                    type="button"
                    onClick={() => onChange(option.name, val)}
                    className={`px-4 py-2 border text-xs font-semibold rounded-md transition-all shadow-sm ${
                      isSelected 
                        ? "border-maroonClr bg-maroonClr text-white ring-2 ring-maroonClr/20 scale-105" 
                        : "border-gray-200 bg-white text-gray-700 hover:border-maroonClr hover:text-maroonClr"
                    } ${option.name.toLowerCase() === 'color' && val.match(/^[0-9a-fA-F]{6}$/) ? 'w-10 h-10 rounded-full p-0 flex items-center justify-center' : ''}`}
                  >
                    {option.name.toLowerCase() === 'color' && val.match(/^[0-9a-fA-F]{6}$/) ? (
                      <span 
                        className="w-full h-full rounded-full block border border-black/10" 
                        style={{ backgroundColor: `#${val}` }}
                      />
                    ) : (
                      val === "Free Size" ? "Free Size" : val
                    )}
                  </button>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}


"use client";

import { useEffect, useState } from "react";
import { X, Ruler } from "lucide-react";

interface SizeChartModalProps {
  isOpen: boolean;
  onClose: () => void;
  sizeChartImage?: string | null;
}

const sizeDataInches = [
  { size: "XS", bust: "32 - 33", waist: "24 - 25", hips: "34 - 35", shoulder: "14.0" },
  { size: "S", bust: "34 - 35", waist: "26 - 27", hips: "36 - 37", shoulder: "14.5" },
  { size: "M", bust: "36 - 37", waist: "28 - 29", hips: "38 - 39", shoulder: "15.0" },
  { size: "L", bust: "38 - 40", waist: "30 - 32", hips: "40 - 42", shoulder: "15.5" },
  { size: "XL", bust: "41 - 43", waist: "33 - 35", hips: "43 - 45", shoulder: "16.0" },
  { size: "XXL", bust: "44 - 46", waist: "36 - 38", hips: "46 - 48", shoulder: "16.5" },
];

const sizeDataCm = [
  { size: "XS", bust: "81 - 84", waist: "61 - 64", hips: "86 - 89", shoulder: "35.5" },
  { size: "S", bust: "86 - 89", waist: "66 - 69", hips: "91 - 94", shoulder: "37.0" },
  { size: "M", bust: "91 - 94", waist: "71 - 74", hips: "96 - 99", shoulder: "38.0" },
  { size: "L", bust: "96 - 101", waist: "76 - 81", hips: "101 - 107", shoulder: "39.5" },
  { size: "XL", bust: "104 - 109", waist: "84 - 89", hips: "109 - 114", shoulder: "40.5" },
  { size: "XXL", bust: "112 - 117", waist: "91 - 97", hips: "117 - 122", shoulder: "42.0" },
];

export default function SizeChartModal({ isOpen, onClose, sizeChartImage }: SizeChartModalProps) {
  const [unit, setUnit] = useState<"in" | "cm">("in");

  // Prevent background scrolling when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  const activeData = unit === "in" ? sizeDataInches : sizeDataCm;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 md:p-6 bg-black/60 backdrop-blur-sm transition-opacity duration-300">
      {/* Backdrop click to close */}
      <div className="absolute inset-0 cursor-default" onClick={onClose}></div>

      {/* Modal Container */}
      <div className="relative w-full max-w-2xl bg-white rounded-xl shadow-2xl overflow-hidden border border-gray-100 flex flex-col max-h-[90vh] md:max-h-[85vh] animate-in fade-in zoom-in-95 duration-200">
        
        {/* Header */}
        <div className="flex justify-between items-center px-6 py-4 border-b border-gray-100 bg-gray-50/50">
          <div className="flex items-center gap-2">
            <Ruler className="w-5 h-5 text-maroonClr" />
            <h2 className="text-lg font-serif font-semibold text-gray-900">Product Size Chart</h2>
          </div>
          <button 
            type="button"
            onClick={onClose}
            className="p-1.5 rounded-full text-gray-400 hover:text-gray-600 hover:bg-gray-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="flex-1 overflow-y-auto p-6 scrollbar-thin">
          {sizeChartImage ? (
            /* Uploaded Image view */
            <div className="flex items-center justify-center min-h-[300px]">
              <img 
                src={sizeChartImage} 
                alt="Product Size Chart" 
                className="max-w-full max-h-[60vh] object-contain rounded-lg shadow-sm border border-gray-200" 
              />
            </div>
          ) : (
            /* Fallback Responsive Table View */
            <div className="space-y-6">
              
              {/* Unit Toggle & Description */}
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <p className="text-xs text-gray-500 max-w-md">
                  Please measure yourself carefully before choosing a size. Refer to the table below for body measurements.
                </p>
                <div className="flex bg-gray-100 p-0.5 rounded-lg border border-gray-200 self-start sm:self-auto">
                  <button
                    type="button"
                    onClick={() => setUnit("in")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      unit === "in" 
                        ? "bg-white text-maroonClr shadow-sm" 
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Inches
                  </button>
                  <button
                    type="button"
                    onClick={() => setUnit("cm")}
                    className={`px-3 py-1 text-xs font-semibold rounded-md transition-all ${
                      unit === "cm" 
                        ? "bg-white text-maroonClr shadow-sm" 
                        : "text-gray-600 hover:text-gray-900"
                    }`}
                  >
                    Centimeters
                  </button>
                </div>
              </div>

              {/* Table */}
              <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
                <table className="w-full text-left text-xs border-collapse">
                  <thead className="bg-gray-50 border-b border-gray-200 text-gray-700 font-semibold uppercase tracking-wider">
                    <tr>
                      <th className="py-3 px-4 text-center font-bold text-gray-900">Brand Size</th>
                      <th className="py-3 px-4">Bust ({unit})</th>
                      <th className="py-3 px-4">Waist ({unit})</th>
                      <th className="py-3 px-4">Hips ({unit})</th>
                      <th className="py-3 px-4">Across Shoulder ({unit})</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 text-gray-600">
                    {activeData.map((row) => (
                      <tr key={row.size} className="hover:bg-gray-50/50 transition-colors">
                        <td className="py-3.5 px-4 text-center font-bold text-maroonClr bg-gray-50/30 border-r border-gray-100">{row.size}</td>
                        <td className="py-3.5 px-4 font-mono">{row.bust}</td>
                        <td className="py-3.5 px-4 font-mono">{row.waist}</td>
                        <td className="py-3.5 px-4 font-mono">{row.hips}</td>
                        <td className="py-3.5 px-4 font-mono">{row.shoulder}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Measurement Guide */}
              <div className="p-4 bg-[#FDFBF7] rounded-xl border border-[#C9A84C]/20 space-y-3">
                <h4 className="text-xs font-bold text-[#C9A84C] uppercase tracking-wider flex items-center gap-1.5">
                  <Ruler className="w-3.5 h-3.5" /> How to Measure
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-[11px] text-gray-600">
                  <div>
                    <span className="font-semibold text-gray-800">1. Bust:</span> Measure around the fullest part of your chest, keeping the tape horizontal.
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">2. Waist:</span> Measure around your natural waistline (narrowest part), keeping tape loose.
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">3. Hips:</span> Measure around the fullest part of your hips (approx. 8 inches below waist).
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800">4. Shoulder:</span> Measure from one shoulder tip to the other tip across the back.
                  </div>
                </div>
              </div>

            </div>
          )}
        </div>

        {/* Footer */}
        <div className="bg-gray-50 border-t border-gray-100 px-6 py-3.5 flex justify-end">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-gray-900 text-white rounded-lg text-xs font-semibold hover:bg-gray-800 transition-colors"
          >
            Close Window
          </button>
        </div>

      </div>
    </div>
  );
}

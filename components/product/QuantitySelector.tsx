"use client";

import { Minus, Plus } from "lucide-react";

export default function QuantitySelector({ quantity, setQuantity }: { 
  quantity: number; 
  setQuantity: (q: number) => void;
}) {
  const decrease = () => {
    if (quantity > 1) setQuantity(quantity - 1);
  };

  const increase = () => {
    setQuantity(quantity + 1);
  };

  return (
    <div>
      <h3 className="text-sm font-semibold text-gray-800 uppercase tracking-wider mb-3">
        Quantity
      </h3>
      <div className="flex items-center border border-gray-300 rounded w-32">
        <button 
          onClick={decrease}
          disabled={quantity <= 1}
          className="p-3 text-gray-600 hover:text-primary disabled:opacity-50 transition"
        >
          <Minus className="w-4 h-4" />
        </button>
        <div className="flex-1 text-center font-medium text-gray-800">
          {quantity}
        </div>
        <button 
          onClick={increase}
          className="p-3 text-gray-600 hover:text-primary transition"
        >
          <Plus className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import { saveGiftsSettingsAction } from "@/app/actions/adminSettings";
import { Plus, Trash2, Sparkles, Search, Check, Save, Loader2, Gift, AlertCircle, CheckCircle2 } from "lucide-react";

interface GiftsListClientProps {
  initialGifts: any[];
  allProducts: any[];
}

export default function GiftsListClient({ initialGifts, allProducts = [] }: GiftsListClientProps) {
  const [gifts, setGifts] = useState<any[]>(initialGifts);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");
  const [isSaving, setIsSaving] = useState(false);
  const [successMsg, setSuccessMsg] = useState("");
  const [errorMsg, setErrorMsg] = useState("");

  const handleAddGift = (product: any) => {
    // Check if variantId exists, else fallback to standard variant ID logic
    const firstVariant = product.variants?.edges?.[0]?.node;
    const variantId = firstVariant?.id || product.id;
    const price = firstVariant?.price?.amount || product.priceRange?.minVariantPrice?.amount || "999";
    const imageUrl = product.images?.edges?.[0]?.node?.url || product.image || "";

    const newGift = {
      id: product.id,
      title: product.title,
      handle: product.handle,
      image: imageUrl,
      price: price,
      variantId: variantId,
    };

    if (gifts.some((g) => g.id === product.id)) return;
    setGifts([...gifts, newGift]);
  };

  const handleRemoveGift = (giftId: string) => {
    setGifts(gifts.filter((g) => g.id !== giftId));
  };

  const handleSaveChanges = async () => {
    setIsSaving(true);
    setSuccessMsg("");
    setErrorMsg("");

    try {
      const res = await saveGiftsSettingsAction(gifts);
      if (res.success) {
        setSuccessMsg("Gifts configuration saved successfully!");
        // Clear message after 3 seconds
        setTimeout(() => setSuccessMsg(""), 3000);
      } else {
        setErrorMsg(res.error || "Failed to save gifts.");
      }
    } catch (err) {
      console.error(err);
      setErrorMsg("An unexpected error occurred while saving.");
    } finally {
      setIsSaving(false);
    }
  };

  // Filter products for the picker modal based on search query
  const filteredProducts = allProducts.filter((product) =>
    product.title?.toLowerCase().includes(searchQuery.toLowerCase())
  );

  return (
    <div className="space-y-8 min-h-screen text-neutral-200 p-1">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 pb-5 border-b border-neutral-800">
        <div>
          <h1 className="text-3xl font-serif font-bold text-white flex items-center gap-2">
            Configure Free Gifts <Gift className="w-6 h-6 text-[#C9A84C]" />
          </h1>
          <p className="text-neutral-400 text-sm">Set up complimentary gifts available for order subtotals over ₹3,000.</p>
        </div>
        <div className="flex gap-3">
          <button
            onClick={() => setIsModalOpen(true)}
            className="flex items-center gap-2 bg-maroonClr hover:bg-[#6A102A] text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-md"
          >
            <Plus className="w-4 h-4" /> Add Gift Product
          </button>
          <button
            onClick={handleSaveChanges}
            disabled={isSaving}
            className="flex items-center gap-2 bg-green-700 hover:bg-green-800 disabled:bg-neutral-800 text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider transition-all shadow-md"
          >
            {isSaving ? (
              <Loader2 className="w-4 h-4 animate-spin" />
            ) : (
              <Save className="w-4 h-4" />
            )}
            {isSaving ? "Saving..." : "Save Changes"}
          </button>
        </div>
      </div>

      {/* Notifications */}
      {successMsg && (
        <div className="p-4 bg-green-950/30 border border-green-800/50 rounded-xl text-green-400 text-sm flex items-center gap-2.5 animate-fadeIn">
          <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}
      {errorMsg && (
        <div className="p-4 bg-red-950/30 border border-red-800/50 rounded-xl text-red-400 text-sm flex items-center gap-2.5 animate-fadeIn">
          <AlertCircle className="w-5 h-5 flex-shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {/* Gifts List Grid */}
      {gifts.length === 0 ? (
        <div className="bg-neutral-950 rounded-xl border border-neutral-800 p-12 text-center max-w-xl mx-auto space-y-4">
          <div className="w-16 h-16 bg-neutral-900 border border-neutral-800 rounded-full flex items-center justify-center mx-auto text-neutral-500">
            <Gift className="w-8 h-8" />
          </div>
          <h3 className="text-lg font-serif font-semibold text-white">No Gifts Configured</h3>
          <p className="text-neutral-400 text-xs max-w-sm mx-auto">
            Customers spending over ₹3,000 will not see gift options until you add products from your store.
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="inline-flex items-center gap-2 bg-neutral-900 hover:bg-neutral-800 text-white px-4 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-neutral-800 transition-colors"
          >
            <Plus className="w-4.5 h-4.5 text-[#C9A84C]" /> Select First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {gifts.map((gift) => (
            <div
              key={gift.id}
              className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden shadow-sm hover:border-[#C9A84C]/30 transition-all flex flex-col group"
            >
              {/* Product Visual */}
              <div className="relative aspect-[3/4] bg-neutral-900 flex-shrink-0 overflow-hidden border-b border-neutral-850">
                {gift.image ? (
                  <img
                    src={gift.image}
                    alt={gift.title}
                    className="object-cover w-full h-full group-hover:scale-105 transition-transform duration-500"
                  />
                ) : (
                  <div className="absolute inset-0 flex items-center justify-center text-neutral-600 font-bold font-serif text-sm">
                    No Image
                  </div>
                )}
                <span className="absolute top-3 left-3 bg-[#25D366] text-white text-[9px] font-bold uppercase tracking-wider px-2 py-1 rounded shadow-sm">
                  FREE GIFT
                </span>
              </div>

              {/* Product Info */}
              <div className="p-4 flex-1 flex flex-col justify-between gap-4">
                <div>
                  <h3 className="font-serif text-white font-semibold text-sm line-clamp-1 group-hover:text-[#C9A84C] transition-colors">
                    {gift.title}
                  </h3>
                  <p className="text-[10px] text-neutral-500 font-mono mt-1">Handle: {gift.handle}</p>
                </div>
                <div className="flex items-center justify-between border-t border-neutral-900 pt-3">
                  <div>
                    <span className="text-[10px] text-neutral-500 uppercase block font-semibold">Value</span>
                    <span className="text-sm font-bold text-white font-mono">₹{parseFloat(gift.price || "999").toFixed(0)}</span>
                  </div>
                  <button
                    onClick={() => handleRemoveGift(gift.id)}
                    className="text-neutral-500 hover:text-red-400 p-2 hover:bg-red-950/20 rounded-lg transition-all"
                    title="Remove Gift"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Gift Picker Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          {/* Overlay */}
          <div
            onClick={() => setIsModalOpen(false)}
            className="fixed inset-0 bg-black/85 backdrop-blur-sm"
          />

          {/* Modal Content */}
          <div className="relative bg-neutral-950 rounded-xl border border-neutral-800 shadow-2xl max-w-2xl w-full p-6 overflow-hidden z-10 flex flex-col max-h-[85vh]">
            {/* Header */}
            <div className="flex justify-between items-center mb-4 pb-3 border-b border-neutral-800">
              <h3 className="text-lg font-serif font-bold text-white flex items-center gap-2">
                Add Gift Product <Sparkles className="w-4 h-4 text-[#C9A84C]" />
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-neutral-500 hover:text-white transition-colors font-bold text-sm"
              >
                ✕
              </button>
            </div>

            {/* Search Input */}
            <div className="relative mb-4 flex-shrink-0">
              <span className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none text-neutral-500">
                <Search className="w-4.5 h-4.5" />
              </span>
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Search products by title..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-[#C9A84C]"
              />
            </div>

            {/* Products Selection List */}
            <div className="flex-1 overflow-y-auto space-y-3 pr-1.5 custom-scrollbar">
              {filteredProducts.length === 0 ? (
                <div className="text-center py-12 text-neutral-500 text-xs font-sans">
                  No matching products found.
                </div>
              ) : (
                filteredProducts.map((product) => {
                  const isAdded = gifts.some((g) => g.id === product.id);

                  return (
                    <div
                      key={product.id}
                      className="flex items-center justify-between p-2.5 rounded-lg border border-neutral-850 bg-neutral-900/50 hover:bg-neutral-900 transition-colors"
                    >
                      <div className="flex items-center gap-3.5 min-w-0">
                        {/* Thumbnail */}
                        <div className="relative w-11 h-14 bg-neutral-800 border border-neutral-800 rounded overflow-hidden flex-shrink-0">
                          {product.images?.edges?.[0]?.node?.url ? (
                            <img
                              src={product.images.edges[0].node.url}
                              alt={product.title}
                              className="object-cover w-full h-full"
                            />
                          ) : (
                            <div className="w-full h-full bg-neutral-900 flex items-center justify-center text-neutral-700 text-[8px] font-bold">
                              No Pic
                            </div>
                          )}
                        </div>

                        {/* Title & Stats */}
                        <div className="min-w-0">
                          <h4 className="font-semibold text-white text-xs truncate max-w-xs sm:max-w-md">
                            {product.title}
                          </h4>
                          <span className="text-[10px] text-[#C9A84C] font-mono mt-1 block">
                            ₹{parseFloat(product.variants?.edges?.[0]?.node?.price?.amount || product.priceRange?.minVariantPrice?.amount || "0").toFixed(0)}
                          </span>
                        </div>
                      </div>

                      {/* Add Button */}
                      <button
                        onClick={() => handleAddGift(product)}
                        disabled={isAdded}
                        className={`text-[10px] font-bold uppercase tracking-wider px-3.5 py-2 rounded-lg transition-all flex items-center gap-1 ${
                          isAdded
                            ? "bg-neutral-800 text-neutral-500 cursor-default"
                            : "bg-[#C9A84C]/10 text-[#C9A84C] hover:bg-[#C9A84C] hover:text-neutral-950"
                        }`}
                      >
                        {isAdded ? (
                          <>
                            <Check className="w-3.5 h-3.5" /> Added
                          </>
                        ) : (
                          "Add"
                        )}
                      </button>
                    </div>
                  );
                })
              )}
            </div>

            {/* Footer buttons */}
            <div className="mt-4 pt-3 border-t border-neutral-800 text-right flex-shrink-0">
              <button
                onClick={() => setIsModalOpen(false)}
                className="bg-neutral-900 hover:bg-neutral-800 text-white px-5 py-2 rounded-lg text-xs font-bold uppercase tracking-wider border border-neutral-800 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X, Gift, Sparkles, AlertCircle } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import * as cartClient from "@/lib/api/cart-client";

export default function GiftManager() {
  const { cartId, lines, setCart } = useCartStore();
  const [giftsList, setGiftsList] = useState<any[]>([]);
  const [isOpen, setIsOpen] = useState(false);
  const [loadingGiftId, setLoadingGiftId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Calculate regular subtotal (excluding gift items)
  const regularSubtotal = lines
    .filter((l: any) => !l.isGift)
    .reduce((sum, l) => sum + parseFloat(l.price || "0") * l.quantity, 0);
  const giftItem = lines.find((l: any) => l.isGift);

  // Fetch gifts list from site settings
  useEffect(() => {
    async function loadSettings() {
      try {
        const res = await fetch("/api/settings");
        if (res.ok) {
          const data = await res.json();
          if (data.gifts && Array.isArray(data.gifts)) {
            setGiftsList(data.gifts);
          }
        }
      } catch (err) {
        console.error("Failed to load gifts settings:", err);
      }
    }
    loadSettings();
  }, []);

  // Listen to the custom event to open the modal
  useEffect(() => {
    const handleOpen = () => {
      setIsOpen(true);
      setError("");
    };
    window.addEventListener("open-gift-modal", handleOpen);
    return () => window.removeEventListener("open-gift-modal", handleOpen);
  }, []);

  // Automatic Trigger: Show modal once when subtotal reaches >= 3000 and user hasn't chosen a gift
  useEffect(() => {
    if (regularSubtotal >= 3000 && !giftItem && giftsList.length > 0) {
      setIsOpen(true);
    }
  }, [regularSubtotal, giftItem, giftsList]);

  // Automatic Removal: If subtotal drops below 3000, remove the gift automatically
  useEffect(() => {
    if (cartId && regularSubtotal < 3000 && giftItem) {
      const autoRemove = async () => {
        try {
          const updated = await cartClient.removeFromCart(cartId, [giftItem.id]);
          setCart(updated);
        } catch (err) {
          console.error("Auto-remove gift failed:", err);
        }
      };
      autoRemove();
    }
  }, [regularSubtotal, giftItem, cartId, setCart]);

  const handleSelectGift = async (gift: any) => {
    if (!cartId) return;
    setLoadingGiftId(gift.id);
    setError("");

    try {
      let updatedCart = null;
      // 1. Remove existing gift if present
      if (giftItem) {
        updatedCart = await cartClient.removeFromCart(cartId, [giftItem.id]);
      }

      // 2. Add new gift
      const res = await cartClient.addToCart(cartId, [
        {
          merchandiseId: gift.variantId || gift.id,
          quantity: 1,
          isGift: true,
        },
      ]);
      
      setCart(res);
      setIsOpen(false);
    } catch (err: any) {
      console.error(err);
      setError("Failed to add gift item. Please try again.");
    } finally {
      setLoadingGiftId(null);
    }
  };

  const handleClose = () => {
    setIsOpen(false);
    sessionStorage.setItem("gift-modal-dismissed", "true");
  };

  if (giftsList.length === 0) return null;

  return (
    <AnimatePresence>
      {isOpen && (
        <div className="fixed inset-0 z-[100000] flex items-center justify-center p-4">
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={handleClose}
            className="fixed inset-0 bg-black/60 backdrop-blur-sm"
          />

          {/* Modal Container */}
          <motion.div
            initial={{ opacity: 0, scale: 0.9, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.9, y: 20 }}
            className="relative bg-white rounded-2xl shadow-2xl max-w-lg w-full p-6 md:p-8 overflow-hidden z-10 border border-[#C9A84C]/20"
          >
            {/* Elegant Header Background Glow */}
            <div className="absolute -top-10 -right-10 w-32 h-32 bg-goldClr/10 rounded-full blur-xl pointer-events-none" />
            <div className="absolute -bottom-10 -left-10 w-32 h-32 bg-maroonClr/5 rounded-full blur-xl pointer-events-none" />

            {/* Close Button */}
            <button
              onClick={handleClose}
              className="absolute top-4 right-4 p-2 text-gray-400 hover:text-gray-700 hover:bg-gray-100 rounded-full transition-colors"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header Content */}
            <div className="text-center mb-6">
              <div className="w-12 h-12 bg-maroonClr text-white rounded-full flex items-center justify-center mx-auto mb-3 shadow-md animate-bounce">
                <Gift className="w-6 h-6 text-[#C9A84C]" />
              </div>
              <h3 className="text-xl md:text-2xl font-serif font-bold text-maroonClr flex items-center justify-center gap-1.5">
                Unlocked: Free Gift! <Sparkles className="w-4 h-4 text-goldClr animate-pulse" />
              </h3>
              <p className="text-xs md:text-sm text-gray-500 mt-1 max-w-sm mx-auto">
                Your order is over ₹3,000! Select any one of the following premium items as your complimentary gift.
              </p>
            </div>

            {error && (
              <div className="mb-4 p-3 bg-red-50 border-l-4 border-red-500 text-red-700 text-xs rounded flex items-center gap-2">
                <AlertCircle className="w-4 h-4" />
                <span>{error}</span>
              </div>
            )}

            {/* Gifts Selection List */}
            <div className="space-y-4 max-h-[300px] overflow-y-auto pr-1.5 custom-scrollbar">
              {giftsList.map((gift) => {
                const isSelected = giftItem?.merchandiseId === gift.variantId || giftItem?.merchandiseId === gift.id;
                const isLoading = loadingGiftId === gift.id;

                return (
                  <div
                    key={gift.id}
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                      isSelected
                        ? "border-[#C9A84C] bg-[#C9A84C]/5 shadow-sm"
                        : "border-gray-100 bg-gray-50 hover:bg-white hover:border-gray-300"
                    }`}
                  >
                    {/* Image */}
                    <div className="relative w-16 h-20 bg-white border border-gray-100 rounded overflow-hidden flex-shrink-0">
                      {gift.image ? (
                        <img
                          src={gift.image}
                          alt={gift.title}
                          className="object-cover w-full h-full"
                        />
                      ) : (
                        <div className="w-full h-full bg-maroonClr/5 flex items-center justify-center text-maroonClr/20 font-bold text-[10px]">
                          Gift
                        </div>
                      )}
                    </div>

                    {/* Info */}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-gray-800 text-sm truncate">{gift.title}</h4>
                      <p className="text-[10px] text-gray-400 mt-0.5">Complimentary Gift</p>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="text-xs text-green-600 font-bold bg-green-50 px-2 py-0.5 rounded">FREE</span>
                        <span className="text-xs text-gray-400 line-through">₹{gift.price || "999"}</span>
                      </div>
                    </div>

                    {/* Action Button */}
                    <button
                      disabled={loadingGiftId !== null}
                      onClick={() => handleSelectGift(gift)}
                      className={`text-xs font-bold uppercase tracking-wider px-4 py-2 rounded-lg transition-all flex items-center justify-center ${
                        isSelected
                          ? "bg-green-600 text-white shadow-sm cursor-default"
                          : "bg-maroonClr text-white hover:bg-[#6A102A] shadow hover:shadow-md disabled:bg-gray-300"
                      }`}
                    >
                      {isLoading ? (
                        <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                      ) : isSelected ? (
                        "Selected"
                      ) : (
                        "Select"
                      )}
                    </button>
                  </div>
                );
              })}
            </div>

            {/* Footer Notice */}
            <div className="mt-6 text-center text-[10px] text-gray-400 border-t border-gray-100 pt-4">
              * Gift items are subject to stock availability and cannot be exchanged.
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
}

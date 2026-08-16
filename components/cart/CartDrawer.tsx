"use client";

import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingBag, ArrowRight, AlertTriangle, Gift } from "lucide-react";
import Link from "next/link";
import { useCartStore } from "@/store/cartStore";
import CartItem from "./CartItem";

export default function CartDrawer() {
  const { isCartOpen, closeCart, lines, subtotal, checkoutUrl, lastTransactionCancelled, setTransactionCancelled } = useCartStore();

  return (
    <AnimatePresence>
      {isCartOpen && (
        <>
          {/* Overlay */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={closeCart}
            className="fixed inset-0 bg-black/50 z-[99999] backdrop-blur-sm"
          />

          {/* Drawer */}
          <motion.div
            initial={{ x: "100%" }}
            animate={{ x: 0 }}
            exit={{ x: "100%" }}
            transition={{ type: "tween", duration: 0.3, ease: "easeInOut" }}
            className="fixed top-0 right-0 h-full w-full max-w-md bg-white shadow-2xl z-[99999] flex flex-col"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-4 border-b border-gray-200">
              <h2 className="text-xl font-serif font-bold text-gray-800 flex items-center gap-2">
                <ShoppingBag className="w-5 h-5 text-primary" />
                Your Cart
              </h2>
              <button 
                onClick={closeCart}
                className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Body */}
            <div className="flex-1 overflow-y-auto p-4 flex flex-col">
              {lines.length === 0 ? (
                lastTransactionCancelled ? (
                  <div className="flex flex-col items-center justify-center my-auto text-center px-4 py-8 space-y-4">
                    <div className="w-16 h-16 rounded-full bg-amber-50 text-amber-600 flex items-center justify-center border border-amber-200 shadow-sm">
                      <AlertTriangle className="w-8 h-8" />
                    </div>
                    <div>
                      <h3 className="text-lg font-serif font-bold text-gray-900 mb-1">
                        Last Transaction Was Cancelled
                      </h3>
                      <p className="text-xs text-gray-500 max-w-xs mx-auto">
                        Your previous payment attempt was cancelled or interrupted. No funds were deducted.
                      </p>
                    </div>
                    <div className="flex flex-col w-full gap-2.5 pt-2 max-w-xs">
                      <Link 
                        href="/products" 
                        onClick={() => {
                          setTransactionCancelled(false);
                          closeCart();
                        }}
                        className="w-full bg-primary text-white py-3 rounded-lg font-bold uppercase tracking-widest text-xs text-center hover:bg-[#6A102A] transition-colors shadow-md"
                      >
                        Keep Shopping
                      </Link>
                      <Link 
                        href="/" 
                        onClick={() => {
                          setTransactionCancelled(false);
                          closeCart();
                        }}
                        className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-bold uppercase tracking-widest text-xs text-center hover:bg-gray-50 transition-colors"
                      >
                        Home
                      </Link>
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col items-center justify-center my-auto text-center px-4 py-8 space-y-4">
                    <ShoppingBag className="w-16 h-16 text-gray-300 opacity-40" />
                    <div>
                      <h3 className="text-lg font-serif font-bold text-gray-800 mb-1">
                        Your cart is empty
                      </h3>
                      <p className="text-xs text-gray-500 max-w-xs mx-auto">
                        Explore our handcrafted sarees, kurtis, and ethnic wear.
                      </p>
                    </div>
                    <div className="flex flex-col w-full gap-2.5 pt-2 max-w-xs">
                      <Link 
                        href="/products" 
                        onClick={closeCart}
                        className="w-full bg-primary text-white py-3 rounded-lg font-bold uppercase tracking-widest text-xs text-center hover:bg-[#6A102A] transition-colors shadow-md"
                      >
                        Keep Shopping
                      </Link>
                      <Link 
                        href="/" 
                        onClick={closeCart}
                        className="w-full bg-white border border-gray-300 text-gray-700 py-3 rounded-lg font-bold uppercase tracking-widest text-xs text-center hover:bg-gray-50 transition-colors"
                      >
                        Home
                      </Link>
                    </div>
                  </div>
                )
              ) : (
                <div className="flex flex-col">
                  {lines.map((item: any) => (
                    <CartItem key={item.id} item={item} />
                  ))}
                </div>
              )}
            </div>

            {/* Footer */}
            {lines.length > 0 && (() => {
              const regularSubtotal = lines
                .filter((l: any) => !l.isGift)
                .reduce((sum, l) => sum + parseFloat(l.price || "0") * l.quantity, 0);
              const giftItem = lines.find((l: any) => l.isGift);
              const remaining = 3000 - regularSubtotal;
              const percentage = Math.min((regularSubtotal / 3000) * 100, 100);

              return (
                <div className="border-t border-gray-200 p-5 sm:p-6 pb-[calc(1.5rem+env(safe-area-inset-bottom))] bg-gray-50">
                  {/* Gift Status Banner */}
                  {regularSubtotal < 3000 ? (
                    <div className="bg-amber-50 border border-amber-200/50 rounded-lg p-3.5 mb-4">
                      <p className="text-xs font-semibold text-amber-800 flex justify-between mb-1.5">
                        <span>Add ₹{remaining.toFixed(0)} more to unlock a FREE gift!</span>
                        <span>{percentage.toFixed(0)}%</span>
                      </p>
                      <div className="w-full bg-amber-100/50 rounded-full h-1.5">
                        <div 
                          className="bg-amber-500 h-1.5 rounded-full transition-all duration-500" 
                          style={{ width: `${percentage}%` }}
                        ></div>
                      </div>
                    </div>
                  ) : giftItem ? (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3.5 mb-4 flex items-center justify-between">
                      <div className="flex items-center gap-2.5 text-xs text-green-800 font-semibold min-w-0">
                        <Gift className="w-5 h-5 text-green-700 shrink-0" />
                        <div className="min-w-0">
                          <p className="font-bold">Free Gift Unlocked!</p>
                          <p className="text-[10px] text-green-700 font-medium truncate max-w-[180px]">
                            {giftItem.title}
                          </p>
                        </div>
                      </div>
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent("open-gift-modal"))}
                        className="text-[10px] font-bold text-green-700 hover:text-green-950 border border-green-300 bg-white px-2 py-1 rounded transition-colors uppercase tracking-wider flex-shrink-0"
                      >
                        Change
                      </button>
                    </div>
                  ) : (
                    <div className="bg-green-50 border border-green-200 rounded-lg p-3.5 mb-4 flex items-center justify-between animate-pulse">
                      <div className="flex items-center gap-2.5 text-xs text-green-800 font-bold min-w-0">
                        <Gift className="w-5 h-5 text-green-700 shrink-0" />
                        <span>You've unlocked a FREE gift!</span>
                      </div>
                      <button
                        onClick={() => window.dispatchEvent(new CustomEvent("open-gift-modal"))}
                        className="text-[10px] font-bold text-white bg-green-600 hover:bg-green-700 px-2.5 py-1.5 rounded transition-all shadow-sm uppercase tracking-wider flex-shrink-0"
                      >
                        Choose
                      </button>
                    </div>
                  )}

                  <div className="flex justify-between items-center mb-4 text-gray-800">
                    <span className="font-semibold uppercase tracking-wider text-sm">Subtotal</span>
                    <span className="font-bold text-xl text-primary">₹{parseFloat(subtotal).toFixed(2)}</span>
                  </div>
                  <p className="text-xs text-gray-500 mb-6 text-center">
                    Shipping, taxes, and discount codes calculated at checkout.
                  </p>
                  <a 
                    href={checkoutUrl || "#"}
                    onClick={closeCart}
                    className="w-full bg-primary text-white py-4 rounded font-bold uppercase tracking-widest text-sm flex items-center justify-center gap-2 hover:bg-[#6A102A] transition-colors shadow-md"
                  >
                    Checkout <ArrowRight className="w-4 h-4" />
                  </a>
                </div>
              );
            })()}
          </motion.div>
        </>
      )}
    </AnimatePresence>
  );
}

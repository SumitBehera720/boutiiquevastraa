"use client";

import { useState, useEffect } from "react";
import { X, Bell, CheckCircle2, AlertCircle } from "lucide-react";
import { getTokenFromCookie } from "@/lib/api/auth-client";

interface NotifyMeModalProps {
  isOpen: boolean;
  onClose: () => void;
  productId: string;
  productTitle: string;
  productHandle: string;
}

export default function NotifyMeModal({
  isOpen,
  onClose,
  productId,
  productTitle,
  productHandle,
}: NotifyMeModalProps) {
  const [email, setEmail] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [status, setStatus] = useState<"idle" | "success" | "error">("idle");
  const [message, setMessage] = useState("");

  // Prefill email if user is logged in
  useEffect(() => {
    if (isOpen) {
      setStatus("idle");
      setMessage("");
      
      const token = getTokenFromCookie();
      if (token) {
        fetch("/api/auth/me", {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        })
          .then((res) => (res.ok ? res.json() : null))
          .then((data) => {
            if (data && data.email) {
              setEmail(data.email);
            }
          })
          .catch((err) => console.error("Error fetching user profile:", err));
      } else {
        setEmail("");
      }
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email || !email.includes("@")) {
      setStatus("error");
      setMessage("Please enter a valid email address.");
      return;
    }

    setIsSubmitting(true);
    setStatus("idle");
    setMessage("");

    try {
      const res = await fetch("/api/notify-me", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify({
          email,
          productId,
          productHandle,
        }),
      });

      const data = await res.json();
      if (res.ok && data.success) {
        setStatus("success");
        setMessage(data.message || "Thank you! We will notify you when this product is back in stock.");
      } else {
        setStatus("error");
        setMessage(data.message || "Something went wrong. Please try again.");
      }
    } catch (err: any) {
      setStatus("error");
      setMessage("Failed to register subscription. Please check your connection.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop with Blur */}
      <div 
        className="absolute inset-0 bg-black/50 backdrop-blur-sm transition-opacity duration-300"
        onClick={onClose}
      />

      {/* Modal Container */}
      <div className="relative bg-white w-full max-w-md rounded-xl border border-gray-100 shadow-2xl overflow-hidden z-10 transform scale-100 transition-all duration-300 animate-in fade-in zoom-in-95 duration-200">
        
        {/* Close Button */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 transition-colors p-1 rounded-full hover:bg-gray-100"
          aria-label="Close modal"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="bg-maroonClr/5 px-6 py-6 border-b border-maroonClr/10 text-center">
          <div className="mx-auto w-12 h-12 bg-maroonClr/10 rounded-full flex items-center justify-center mb-3">
            <Bell className="w-6 h-6 text-maroonClr" />
          </div>
          <h3 className="text-lg font-serif font-semibold text-gray-900">
            Back In Stock Notification
          </h3>
          <p className="text-xs text-gray-500 mt-1 max-w-[280px] mx-auto line-clamp-1">
            For: {productTitle}
          </p>
        </div>

        {/* Modal Body */}
        <div className="p-6">
          {status === "success" ? (
            <div className="text-center py-4">
              <div className="mx-auto w-12 h-12 bg-green-50 rounded-full flex items-center justify-center mb-3 border border-green-100">
                <CheckCircle2 className="w-6 h-6 text-green-600" />
              </div>
              <p className="text-sm font-medium text-gray-800 mb-2">
                Successfully Subscribed!
              </p>
              <p className="text-xs text-gray-500 leading-relaxed max-w-[280px] mx-auto">
                {message}
              </p>
              <button
                onClick={onClose}
                className="mt-6 w-full bg-maroonClr text-white hover:bg-maroonClr/90 transition-colors py-2.5 font-bold uppercase text-xs rounded tracking-wider"
              >
                Close
              </button>
            </div>
          ) : (
            <form onSubmit={handleSubmit} className="space-y-4">
              <p className="text-xs text-gray-600 leading-relaxed text-center">
                This item is currently out of stock. Leave your email address below, and we will send you a message as soon as it becomes available again.
              </p>

              {status === "error" && (
                <div className="flex gap-2 items-start bg-red-50 border border-red-200 text-red-700 p-3 rounded text-xs">
                  <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
                  <span>{message}</span>
                </div>
              )}

              <div className="space-y-1.5">
                <label htmlFor="notify-email" className="block text-xs font-semibold text-gray-700 uppercase tracking-wider">
                  Email Address
                </label>
                <input
                  id="notify-email"
                  type="email"
                  required
                  placeholder="Enter your email to get notified"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full px-3 py-2 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-maroonClr focus:border-maroonClr outline-none transition-shadow placeholder:text-gray-400"
                />
              </div>

              <div className="pt-2 flex gap-3">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 border border-gray-300 text-gray-700 hover:bg-gray-50 transition-colors py-2.5 font-bold uppercase text-xs rounded tracking-wider"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-maroonClr text-white hover:bg-maroonClr/90 transition-colors py-2.5 font-bold uppercase text-xs rounded tracking-wider disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {isSubmitting ? "Submitting..." : "Notify Me"}
                </button>
              </div>
            </form>
          )}
        </div>
      </div>
    </div>
  );
}

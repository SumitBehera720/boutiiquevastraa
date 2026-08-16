"use client";

import { useState } from "react";
import { register, login, syncSession } from "@/lib/api/auth-client";
import { useRouter } from "next/navigation";
import Image from "next/image";
import { Eye, EyeOff } from "lucide-react";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";
import GoogleSignInButton from "./GoogleSignInButton";

export default function RegisterForm({ onToggleView }: { onToggleView: () => void }) {
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const router = useRouter();

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError(null);
    
    const form = e.currentTarget;
    const formData = new FormData(form);
    const input = {
      firstName: formData.get("firstName") as string,
      lastName: formData.get("lastName") as string,
      email: formData.get("email") as string,
      password: formData.get("password") as string,
    };

    try {
      const guestCartId = useCartStore.getState().cartId;
      const guestWishlist = useWishlistStore.getState().items;

      await register(input);

      // Merge client guest cart & wishlist with account-saved data
      try {
        const syncRes = await syncSession({ cartId: guestCartId, wishlist: guestWishlist });
        if (syncRes && syncRes.success) {
          if (syncRes.cart) {
            useCartStore.getState().setCart(syncRes.cart);
          } else if (syncRes.cartId === null) {
            useCartStore.getState().clearCart();
          }
          if (syncRes.wishlist) {
            useWishlistStore.getState().setWishlist(syncRes.wishlist);
          }
        }
      } catch (syncErr) {
        console.error("Session sync failed:", syncErr);
      }

      const searchParams = new URLSearchParams(window.location.search);
      const redirectUrl = searchParams.get("redirect") || "/account";
      router.push(redirectUrl);
      router.refresh();
    } catch (err: any) {
      setError(err.message || "Registration failed");
      setLoading(false);
    }
  };

  return (
    <div className="w-full max-w-[420px] bg-white rounded-2xl shadow-xl border border-gray-100 p-8 md:p-10 animate-scaleUp">
      {/* Brand Header */}
      <div className="text-center mb-6">
        <div className="w-16 h-16 bg-neutral-900 rounded-lg p-1.5 border border-[#C9A84C]/25 mx-auto mb-4 flex items-center justify-center relative shadow-sm">
          <Image 
            src="/images/logo.png" 
            alt="Boutiique Vastraa" 
            fill 
            className="object-contain p-1"
          />
        </div>
        <h2 className="text-lg font-serif font-bold text-gray-900 uppercase tracking-widest">
          Boutiique Vastraa
        </h2>
      </div>

      {error && (
        <div className="bg-red-50 text-red-600 p-3.5 rounded-lg mb-6 text-xs font-semibold border border-red-100 text-center animate-fadeIn">
          {error}
        </div>
      )}

      {/* Form Fields */}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">First Name</label>
            <input 
              type="text" 
              name="firstName"
              required
              placeholder="First Name"
              className="w-full border border-gray-300 rounded px-4 py-3 text-xs text-gray-800 focus:outline-none focus:border-[#8D0B41] focus:ring-1 focus:ring-[#8D0B41] transition-all bg-[#FDFBF7]"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Last Name</label>
            <input 
              type="text" 
              name="lastName"
              required
              placeholder="Last Name"
              className="w-full border border-gray-300 rounded px-4 py-3 text-xs text-gray-800 focus:outline-none focus:border-[#8D0B41] focus:ring-1 focus:ring-[#8D0B41] transition-all bg-[#FDFBF7]"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Email ID</label>
          <input 
            type="email" 
            name="email"
            required
            placeholder="Enter your email address"
            className="w-full border border-gray-300 rounded px-4 py-3 text-xs text-gray-800 focus:outline-none focus:border-[#8D0B41] focus:ring-1 focus:ring-[#8D0B41] transition-all bg-[#FDFBF7]"
          />
        </div>
        
        <div>
          <label className="block text-xs font-bold text-gray-500 uppercase tracking-wider mb-1.5">Password</label>
          <div className="relative">
            <input 
              type={showPassword ? "text" : "password"} 
              name="password"
              required
              placeholder="Choose secure password"
              className="w-full border border-gray-300 rounded px-4 py-3 pr-10 text-xs text-gray-800 focus:outline-none focus:border-[#8D0B41] focus:ring-1 focus:ring-[#8D0B41] transition-all bg-[#FDFBF7]"
            />
            <button
              type="button"
              onClick={() => setShowPassword(!showPassword)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-gray-400 hover:text-[#8D0B41] transition-colors"
            >
              {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <button 
          type="submit" 
          disabled={loading}
          className="w-full bg-[#8D0B41] text-white py-3.5 rounded font-bold uppercase tracking-widest text-xs hover:bg-[#6A102A] transition-colors shadow-md hover:shadow-lg disabled:bg-gray-400 mt-4 flex items-center justify-center gap-2"
        >
          {loading ? (
            <>
              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
              Creating Account...
            </>
          ) : (
            "Create Account"
          )}
        </button>
      </form>

      {/* Divider */}
      <div className="relative flex py-2 items-center">
        <div className="flex-grow border-t border-gray-200"></div>
        <span className="flex-shrink mx-4 text-gray-400 text-[9px] uppercase font-bold tracking-wider">or continue with</span>
        <div className="flex-grow border-t border-gray-200"></div>
      </div>

      <GoogleSignInButton />

      {/* Terms and Policies */}
      <p className="text-[10px] text-gray-400 text-center mt-6 leading-relaxed">
        By continuing, you agree to our{" "}
        <a href="#" className="underline font-semibold hover:text-[#8D0B41]">Terms</a> and{" "}
        <a href="#" className="underline font-semibold hover:text-[#8D0B41]">Privacy Policy</a>.
      </p>

      {/* Toggle View */}
      <div className="mt-8 text-center text-xs text-gray-500 border-t border-gray-100 pt-6">
        Already have an account?{" "}
        <button 
          onClick={onToggleView} 
          className="text-[#8D0B41] hover:underline font-bold uppercase tracking-wider text-[10px]"
        >
          Sign In
        </button>
      </div>
    </div>
  );
}

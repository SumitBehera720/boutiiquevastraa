"use client";

import { useEffect, useRef, useState } from "react";
import { loginWithGoogle, syncSession } from "@/lib/api/auth-client";
import { useRouter } from "next/navigation";
import { useCartStore } from "@/store/cartStore";
import { useWishlistStore } from "@/store/wishlistStore";

declare global {
  interface Window {
    google?: any;
  }
}

export default function GoogleSignInButton() {
  const router = useRouter();
  const buttonRef = useRef<HTMLDivElement>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
    if (!clientId) {
      setError("Google Client ID is not configured.");
      return;
    }

    const handleCredentialResponse = async (response: any) => {
      setLoading(true);
      setError(null);
      try {
        const idToken = response.credential;
        const guestCartId = useCartStore.getState().cartId;
        const guestWishlist = useWishlistStore.getState().items;

        await loginWithGoogle(idToken);

        // Sync local guest session cart & wishlist
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
        setError(err.message || "Google Sign-In failed.");
        setLoading(false);
      }
    };

    const initializeGoogleSignIn = () => {
      if (window.google?.accounts?.id) {
        window.google.accounts.id.initialize({
          client_id: clientId,
          callback: handleCredentialResponse,
          auto_select: false,
        });

        if (buttonRef.current) {
          window.google.accounts.id.renderButton(buttonRef.current, {
            theme: "outline",
            size: "large",
            width: 340,
            text: "continue_with",
            shape: "rectangular",
          });
        }
      }
    };

    // Load GSI client script if not present
    if (!document.getElementById("google-gsi-script")) {
      const script = document.createElement("script");
      script.id = "google-gsi-script";
      script.src = "https://accounts.google.com/gsi/client";
      script.async = true;
      script.defer = true;
      script.onload = initializeGoogleSignIn;
      document.head.appendChild(script);
    } else {
      initializeGoogleSignIn();
    }
  }, [router]);

  return (
    <div className="w-full flex flex-col items-center gap-2 mt-4 select-none">
      {error && (
        <div className="text-[10px] font-bold text-red-500 bg-red-50 border border-red-100 rounded py-2 px-3 text-center w-full">
          {error}
        </div>
      )}
      
      <div className="w-full relative flex items-center justify-center min-h-[44px]">
        {loading && (
          <div className="absolute inset-0 flex items-center justify-center bg-white/70 z-10 rounded">
            <div className="w-4 h-4 border-2 border-[#8D0B41] border-t-transparent rounded-full animate-spin"></div>
          </div>
        )}
        <div 
          ref={buttonRef} 
          id="google-signin-button" 
          className="w-full max-w-[340px] flex justify-center" 
        />
      </div>
    </div>
  );
}

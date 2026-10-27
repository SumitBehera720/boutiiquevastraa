"use client";

declare global {
  interface Window {
    HeadlessCheckout?: {
      addToCart: (event: any, token: string, options?: { fallbackUrl?: string; isInitiatedFromApp?: boolean }, callback?: (res: any) => void) => void;
      buyNow?: (event: any) => void;
      checkout?: (event: any) => void;
    };
  }
}

async function ensureShiprocketScript(): Promise<boolean> {
  if (typeof window === "undefined") return false;
  if (window.HeadlessCheckout && typeof window.HeadlessCheckout.addToCart === "function") {
    return true;
  }

  // Ensure sellerDomain input exists
  if (!document.getElementById("sellerDomain")) {
    const hiddenInput = document.createElement("input");
    hiddenInput.type = "hidden";
    hiddenInput.id = "sellerDomain";
    hiddenInput.value = "boutiiquevastraa.com";
    document.body.appendChild(hiddenInput);
  }

  // Check if script tag is already in DOM
  const existingScript = document.querySelector('script[src*="shopify.js"]');
  if (!existingScript) {
    const script = document.createElement("script");
    script.src = "https://checkout-ui.shiprocket.com/assets/js/channels/shopify.js";
    script.async = true;
    document.body.appendChild(script);
  }

  // Wait up to 3 seconds for HeadlessCheckout to initialize
  return new Promise<boolean>((resolve) => {
    let elapsed = 0;
    const interval = setInterval(() => {
      elapsed += 150;
      if (window.HeadlessCheckout && typeof window.HeadlessCheckout.addToCart === "function") {
        clearInterval(interval);
        resolve(true);
      } else if (elapsed >= 3000) {
        clearInterval(interval);
        resolve(!!(window.HeadlessCheckout && typeof window.HeadlessCheckout.addToCart === "function"));
      }
    }, 150);
  });
}

export async function launchShiprocketCheckout({
  event,
  items,
  fallbackUrl = "/checkout",
}: {
  event?: any;
  items: Array<{
    id?: string;
    merchandiseId?: string;
    variantId?: string;
    quantity: number;
    selectedSize?: string;
    title?: string;
    handle?: string;
  }>;
  fallbackUrl?: string;
}): Promise<{ success: boolean; error?: string }> {
  try {
    if (!items || items.length === 0) {
      return { success: false, error: "Cart is empty" };
    }

    // Ensure SDK script is present
    await ensureShiprocketScript();

    // Map items ensuring merchandiseId / variantId / metadata is preserved
    const formattedItems = items.map((item: any) => ({
      id: item.id,
      merchandiseId: item.merchandiseId || item.variantId || item.id,
      variantId: item.variantId || item.merchandiseId || item.id,
      selectedSize: item.selectedSize || undefined,
      title: item.title || undefined,
      handle: item.handle || undefined,
      quantity: Math.max(1, Number(item.quantity) || 1),
    }));

    // Step 1: Request access token from Next.js backend
    const res = await fetch("/api/shiprocket/checkout/access-token", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        items: formattedItems,
        redirectUrl: `${window.location.origin}/checkout/success`,
      }),
    });

    const data = await res.json().catch(() => null);

    if (!res.ok || !data?.success || !data?.token) {
      const err = data?.error || "Failed to generate checkout access token";
      console.error("[Shiprocket Fastrr Token Error]:", err);
      return { success: false, error: err };
    }

    const token = data.token;

    // Step 2: Open HeadlessCheckout
    const isReady = await ensureShiprocketScript();
    if (isReady && window.HeadlessCheckout && typeof window.HeadlessCheckout.addToCart === "function") {
      const fullFallbackUrl = fallbackUrl.startsWith("http")
        ? fallbackUrl
        : `${window.location.origin}${fallbackUrl.startsWith("/") ? fallbackUrl : `/${fallbackUrl}`}`;

      window.HeadlessCheckout.addToCart(
        event || null,
        token,
        {
          fallbackUrl: fullFallbackUrl,
          isInitiatedFromApp: true,
        },
        (callbackResponse: any) => {
          console.log("[Shiprocket Checkout Callback]:", callbackResponse);
        }
      );
      return { success: true };
    }

    return {
      success: false,
      error: "Shiprocket Checkout SDK could not be loaded. Please check your internet connection and try again.",
    };
  } catch (err: any) {
    console.error("[Launch Shiprocket Checkout Error]:", err);
    return { success: false, error: err.message || "An unexpected error occurred" };
  }
}

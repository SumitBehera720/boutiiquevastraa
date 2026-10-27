import crypto from "crypto";
import { products } from "@/lib/data-store";

const SHIPROCKET_CHECKOUT_API_BASE = "https://checkout-api.shiprocket.com";

/**
 * Extracts or generates a consistent numeric variant ID for Shiprocket
 */
export function getShiprocketVariantId(variantIdOrNode: any, product?: any): string {
  let idStr = "";
  if (typeof variantIdOrNode === "object" && variantIdOrNode !== null) {
    const rawId = String(variantIdOrNode.id || "");
    const isLineId = rawId.includes("line") || rawId.startsWith("cart");
    idStr = String(
      variantIdOrNode.merchandiseId ||
      variantIdOrNode.variantId ||
      (!isLineId && rawId ? rawId : "") ||
      variantIdOrNode.handle ||
      ""
    );
  } else {
    idStr = String(variantIdOrNode || "");
  }

  const match = idStr.match(/\d+/g);
  if (match) {
    const digits = match.join("");
    return digits.slice(-9);
  }
  
  // Deterministic fallback hash
  let hash = 0;
  for (let i = 0; i < idStr.length; i++) {
    hash = (hash << 5) - hash + idStr.charCodeAt(i);
    hash |= 0;
  }
  return String(Math.abs(hash) % 800000000 + 100000000);
}

/**
 * Generates Base64 HMAC-SHA256 signature for Shiprocket Checkout API
 */
export function generateShiprocketHMAC(payloadString: string, secretKey: string): string {
  return crypto
    .createHmac("sha256", secretKey)
    .update(payloadString)
    .digest("base64");
}

export interface CheckoutCartItem {
  variant_id: string;
  quantity: number;
}

export interface GenerateAccessTokenParams {
  items: CheckoutCartItem[];
  redirectUrl?: string;
}

/**
 * Calls Shiprocket Checkout API to generate an access token for launching the iframe
 */
export async function generateCheckoutAccessToken(params: GenerateAccessTokenParams): Promise<{
  success: boolean;
  token?: string;
  orderId?: string;
  expiresAt?: string;
  error?: string;
}> {
  try {
    const apiKey = process.env.SHIPROCKET_API_KEY || "De7UR7pXnMXkKvqE";
    const secretKey = process.env.SHIPROCKET_SECRET_KEY || "6bxaWT9yHfy53oQZs5hF1usiAh1aiwr1";

    if (!apiKey || !secretKey) {
      throw new Error("Shiprocket Checkout API Key or Secret Key is missing in environment variables.");
    }

    if (!params.items || params.items.length === 0) {
      throw new Error("Cannot initiate checkout with an empty cart.");
    }

    const payload = {
      cart_data: {
        items: params.items.map((item) => ({
          variant_id: String(item.variant_id),
          quantity: Math.max(1, Number(item.quantity) || 1),
        })),
      },
      redirect_url: params.redirectUrl || "https://boutiiquevastraa.com/checkout/success",
      timestamp: new Date().toISOString(),
    };

    const payloadString = JSON.stringify(payload);
    const hmac = generateShiprocketHMAC(payloadString, secretKey);

    const response = await fetch(`${SHIPROCKET_CHECKOUT_API_BASE}/api/v1/access-token/checkout`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "X-Api-Key": apiKey,
        "X-Api-HMAC-SHA256": hmac,
      },
      body: payloadString,
      cache: "no-store",
    });

    const data = await response.json().catch(() => null);

    if (!response.ok || !data?.ok) {
      const errMsg = data?.error?.message || data?.error || `Failed to initiate Shiprocket checkout (Status ${response.status})`;
      console.error("[Shiprocket Checkout Token Error]:", errMsg, data);
      return { success: false, error: errMsg };
    }

    const token = data?.result?.token;
    const orderId = data?.result?.data?.order_id;
    const expiresAt = data?.result?.expires_at;

    if (!token) {
      return { success: false, error: "Access token not found in Shiprocket response." };
    }

    return {
      success: true,
      token,
      orderId,
      expiresAt,
    };
  } catch (err: any) {
    console.error("[Shiprocket Checkout Service Error]:", err.message);
    return { success: false, error: err.message || "Failed to generate checkout access token." };
  }
}

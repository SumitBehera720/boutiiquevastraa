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
 * Resolves any product or variant ID to the exact 9-digit variant ID known to Shiprocket's catalog
 */
export async function resolveSyncedShiprocketVariantId(item: any): Promise<string> {
  const rawId = String(
    item.merchandiseId ||
    item.variantId ||
    item.id ||
    ""
  );

  const selectedSize = String(
    item.selectedSize ||
    item.variantTitle ||
    item.title ||
    ""
  ).trim().toLowerCase();

  const rawHandle = String(item.handle || "").trim().toLowerCase();

  try {
    const allProds = await products.all();

    // 1. Check if rawId matches a variant node ID in any product
    for (const p of allProds) {
      let variantsObj = p.variants;
      if (typeof variantsObj === "string") {
        try { variantsObj = JSON.parse(variantsObj); } catch {}
      }
      const edges = variantsObj?.edges || [];
      for (const e of edges) {
        const node = e.node || {};
        const nodeId = String(node.id || "");
        if (nodeId === rawId || (rawId && nodeId.includes(rawId))) {
          const match = nodeId.match(/\d+/g);
          if (match) return match.join("").slice(-9);
        }
      }
    }

    // 2. Check if rawId or rawHandle matches product id or handle
    for (const p of allProds) {
      const pHandle = String(p.handle || "").toLowerCase();
      const pId = String(p.id || "");
      const isMatch =
        (rawHandle && (pHandle === rawHandle || rawHandle.includes(pHandle) || pHandle.includes(rawHandle))) ||
        (rawId && (pId === rawId || pHandle === rawId.toLowerCase() || pId.includes(rawId) || rawId.includes(pHandle)));

      if (isMatch) {
        let variantsObj = p.variants;
        if (typeof variantsObj === "string") {
          try { variantsObj = JSON.parse(variantsObj); } catch {}
        }
        const edges = variantsObj?.edges || [];
        if (edges.length > 0) {
          if (selectedSize && selectedSize !== "default title") {
            const matchedVariant = edges.find((e: any) => {
              const node = e.node || {};
              const title = String(node.title || "").toLowerCase();
              const opts = node.selectedOptions || [];
              return (
                title === selectedSize ||
                opts.some((o: any) => String(o.value || "").toLowerCase() === selectedSize)
              );
            });
            if (matchedVariant) {
              const match = String(matchedVariant.node?.id || "").match(/\d+/g);
              if (match) return match.join("").slice(-9);
            }
          }
          const firstMatch = String(edges[0]?.node?.id || "").match(/\d+/g);
          if (firstMatch) return firstMatch.join("").slice(-9);
        }
      }
    }
  } catch (err) {
    console.warn("[resolveSyncedShiprocketVariantId error]:", err);
  }

  // 3. Fallback
  return getShiprocketVariantId(rawId);
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

export async function createCart(lines: { merchandiseId: string; quantity: number; isGift?: boolean; selectedSize?: string }[]) {
    const res = await fetch("/api/cart", {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ lines }),
  });
  if (!res.ok) {
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Failed to create cart");
  }
  return res.json();
}

export async function addToCart(cartId: string, lines: { merchandiseId: string; quantity: number; isGift?: boolean; selectedSize?: string }[]) {
    const res = await fetch(`/api/cart/${cartId}/lines`, {
    method: "POST",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ lines }),
  });
  if (!res.ok) {
    if (res.status === 404) {
      return createCart(lines);
    }
    const data = await res.json().catch(() => null);
    throw new Error(data?.message || "Failed to add to cart");
  }
  return res.json();
}

export async function getCart(cartId: string) {
  try {
    const res = await fetch(`/api/cart/${cartId}`, {
      headers: { Accept: "application/json" },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("[cart-client] getCart error:", err);
    return null;
  }
}

export async function updateCartLines(cartId: string, lines: { id: string; quantity: number }[]) {
  try {
    const res = await fetch(`/api/cart/${cartId}/lines`, {
      method: "PUT",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ lines }),
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("[cart-client] updateCartLines error:", err);
    return null;
  }
}

export async function removeFromCart(cartId: string, lineIds: string[]) {
  try {
    const params = new URLSearchParams({ lineIds: JSON.stringify(lineIds) });
    const res = await fetch(`/api/cart/${cartId}/lines?${params}`, {
      method: "DELETE",
      headers: { Accept: "application/json" },
    });
    if (res.status === 404) return null;
    if (!res.ok) return null;
    return await res.json();
  } catch (err) {
    console.warn("[cart-client] removeFromCart error:", err);
    return null;
  }
}

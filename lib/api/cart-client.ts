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
    const res = await fetch(`/api/cart/${cartId}`, {
    method: "GET",
    headers: { Accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to fetch cart");
  return res.json();
}

export async function updateCartLines(cartId: string, lines: { id: string; quantity: number }[]) {
    const res = await fetch(`/api/cart/${cartId}/lines`, {
    method: "PUT",
    headers: { "Content-Type": "application/json", Accept: "application/json" },
    body: JSON.stringify({ lines }),
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to update cart");
  return res.json();
}

export async function removeFromCart(cartId: string, lineIds: string[]) {
  const params = new URLSearchParams({ lineIds: JSON.stringify(lineIds) });
  const res = await fetch(`/api/cart/${cartId}/lines?${params}`, {
    method: "DELETE",
    headers: { Accept: "application/json" },
  });
  if (res.status === 404) return null;
  if (!res.ok) throw new Error("Failed to remove from cart");
  return res.json();
}

import { apiPost, apiPut, apiDelete, apiGet } from "@/lib/api/client";

function formatCart(cart: any) {
  if (!cart) return null;
  
  // Safely calculate subtotal from lines if missing
  let subtotal = 0;
  let linesArray: any[] = [];
  if (Array.isArray(cart.lines)) {
    linesArray = cart.lines;
  } else if (cart.lines?.edges) {
    linesArray = cart.lines.edges.map((e: any) => e.node);
  }

  for (const line of linesArray) {
    const price = parseFloat(line.price || "0");
    const qty = line.quantity || 1;
    subtotal += price * qty;
  }

  const calculatedSubtotal = cart.cost?.subtotalAmount?.amount || cart.subtotal || subtotal.toFixed(2);
  const totalQty = cart.totalQuantity ?? linesArray.reduce((s: number, e: any) => s + (e.quantity || 0), 0) ?? 0;

  return {
    id: cart.id,
    checkoutUrl: cart.checkoutUrl || `/checkout?cartId=${cart.id}`,
    totalQuantity: totalQty,
    cost: {
      subtotalAmount: { amount: calculatedSubtotal, currencyCode: "INR" },
    },
    lines: Array.isArray(cart.lines) 
      ? { edges: cart.lines.map((l: any) => ({ node: l })) }
      : (cart.lines ?? { edges: [] }),
  };
}

export async function createCart(lines: { merchandiseId: string; quantity: number }[] = []) {
  const cart = await apiPost<any>("/cart", { lines });
  return formatCart(cart);
}

export async function addToCart(cartId: string, lines: { merchandiseId: string; quantity: number }[]) {
  const cart = await apiPost<any>(`/cart/${cartId}/lines`, { lines });
  return formatCart(cart);
}

export async function updateCartLines(cartId: string, lines: { id: string; quantity: number }[]) {
  const cart = await apiPut<any>(`/cart/${cartId}/lines`, { lines });
  return formatCart(cart);
}

export async function removeFromCart(cartId: string, lineIds: string[]) {
  const cart = await apiDelete<any>(`/cart/${cartId}/lines?lineIds=${encodeURIComponent(JSON.stringify(lineIds))}`);
  return formatCart(cart);
}

export async function getCart(cartId: string) {
  const cart = await apiGet<any>(`/cart/${cartId}`);
  return formatCart(cart);
}

export async function createCustomer(input: { firstName: string; lastName: string; email: string; password: string }) {
  try {
    const res = await apiPost<any>("/auth/register", input);
    return {
      customer: { id: res.customer?.id ?? res.id },
      customerUserErrors: [],
    };
  } catch (err: any) {
    const data = err.data;
    const message = data?.errors?.email?.[0] || data?.message || "Registration failed";
    return {
      customer: null,
      customerUserErrors: [{ code: "TAKEN", field: ["email"], message }],
    };
  }
}

export async function createCustomerAccessToken(input: { email: string; password: string }) {
  try {
    const res = await apiPost<any>("/auth/login", input);
    return {
      customerAccessToken: {
        accessToken: res.token,
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toISOString(),
      },
      customerUserErrors: [],
    };
  } catch (err: any) {
    const data = err.data;
    const message = data?.errors?.email?.[0] || data?.message || "Invalid credentials";
    return {
      customerAccessToken: null,
      customerUserErrors: [{ code: "UNAUTHORIZED", field: ["email", "password"], message }],
    };
  }
}

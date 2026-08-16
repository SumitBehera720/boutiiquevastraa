export async function applyPromoCode(code: string, subtotal: number) {
  try {
    const res = await fetch("/api/coupons/validate", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ code: code.trim(), cart_subtotal: subtotal }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message || "Failed to apply promo code.");
    }

    const data = await res.json();
    return {
      success: true,
      code: data.code,
      type: data.type,
      value: data.value,
      discountAmount: data.discountAmount,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to apply promo code." };
  }
}

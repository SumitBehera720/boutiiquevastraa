export async function getCartForCheckout(cartId: string) {
  try {
    const res = await fetch(`/api/cart/${cartId}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message || "Failed to fetch cart");
    }
    const cart = await res.json();
    return { success: true, cart };
  } catch {
    return { success: false, error: "Failed to load checkout cart details" };
  }
}

export async function submitOrder(formData: {
  cartId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  address1: string;
  address2?: string;
  city: string;
  province: string;
  zip: string;
  country: string;
  paymentMethod: "COD" | "RAZORPAY";
  promoCode?: string;
  discount?: number;
  // Fallback cart data in case DB cart lookup fails (stale cartId)
  lines?: any[];
  subtotal?: string;
}) {
  try {
    const res = await fetch("/api/orders", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({
        cart_id: formData.cartId,
        firstName: formData.firstName,
        lastName: formData.lastName,
        email: formData.email,
        phone: formData.phone,
        shippingAddress: {
          address1: formData.address1,
          address2: formData.address2 || "",
          city: formData.city,
          province: formData.province,
          country: formData.country,
          zip: formData.zip,
        },
        paymentMethod: formData.paymentMethod,
        promoCode: formData.promoCode || null,
        discount: formData.discount || 0,
        // Fallback cart data for when cart DB record is stale/missing
        lines: formData.lines,
        subtotal: formData.subtotal,
      }),
    });

    if (!res.ok) {
      const data = await res.json().catch(() => null);
      throw new Error(data?.message || "Failed to place order");
    }

    const data = await res.json();
    return {
      success: true,
      orderId: data.id,
      orderNumber: data.orderNumber,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "An error occurred while placing your order." };
  }
}

/**
 * Create a Razorpay order on the server for the given internal order.
 * Returns the razorpayOrderId, amount (paise), currency, and keyId for the popup.
 */
export async function createRazorpayOrder(orderId: string): Promise<{
  success: boolean;
  razorpayOrderId?: string;
  amount?: number;
  currency?: string;
  keyId?: string;
  error?: string;
}> {
  try {
    const res = await fetch("/api/payment/razorpay/create-order", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ orderId }),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || data?.message || "Failed to create Razorpay order");
    }
    return {
      success: true,
      razorpayOrderId: data.razorpayOrderId,
      amount: data.amount,
      currency: data.currency,
      keyId: data.keyId,
    };
  } catch (error: any) {
    return { success: false, error: error.message || "Razorpay order creation failed." };
  }
}

/**
 * Verify Razorpay payment on the server after the popup succeeds.
 */
export async function verifyRazorpayPayment(params: {
  orderId: string;
  razorpay_order_id: string;
  razorpay_payment_id: string;
  razorpay_signature: string;
}): Promise<{ success: boolean; orderId?: string; orderNumber?: string; error?: string }> {
  try {
    const res = await fetch("/api/payment/razorpay/verify", {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify(params),
    });
    const data = await res.json().catch(() => null);
    if (!res.ok || !data?.success) {
      throw new Error(data?.error || data?.message || "Payment verification failed");
    }
    return { success: true, orderId: data.orderId, orderNumber: data.orderNumber };
  } catch (error: any) {
    return { success: false, error: error.message || "Verification failed." };
  }
}

export async function trackOrder(orderNumber: string, email: string) {
  try {
    const params = new URLSearchParams({ order_number: orderNumber, email });
    const res = await fetch(`/api/orders/track?${params}`, {
      headers: { Accept: "application/json" },
    });
    if (!res.ok) throw new Error("Order not found");
    const order = await res.json();
    return { success: true, order };
  } catch {
    return { success: false, error: "No order found with that number and email combination." };
  }
}

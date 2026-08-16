"use server";

import { carts, orders } from "@/lib/data-store";

export async function getCartForCheckoutAction(cartId: string) {
  try {
    const cart = await carts.get(cartId);
    if (!cart) return { success: false, error: "Cart not found" };
    return { success: true, cart };
  } catch (error) {
    return { success: false, error: "Failed to load checkout cart details" };
  }
}

export async function trackOrderAction(orderNumber: string, email: string) {
  try {
    const all = await orders.all();
    const order = all.find((o: any) =>
      String(o.orderNumber) === orderNumber && o.email?.toLowerCase() === email.toLowerCase()
    );
    if (!order) return { success: false, error: "No order found with that number and email combination." };
    return { success: true, order };
  } catch {
    return { success: false, error: "No order found with that number and email combination." };
  }
}


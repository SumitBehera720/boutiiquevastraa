"use server";

import { createCart, addToCart, updateCartLines, removeFromCart } from "@/lib/shopify/mutations";

export async function addCartItemAction(cartId: string | null, merchandiseId: string, quantity: number) {
  try {
    if (!cartId) {
      // Create new cart
      const cart = await createCart([{ merchandiseId, quantity }]);
      return { success: true, cart };
    } else {
      // Add to existing cart
      const cart = await addToCart(cartId, [{ merchandiseId, quantity }]);
      return { success: true, cart };
    }
  } catch (error) {
    console.error("Cart Action Error:", error);
    return { success: false, error: "Failed to add item to cart" };
  }
}

export async function createCheckoutDirectlyAction(merchandiseId: string, quantity: number) {
  try {
    const cart = await createCart([{ merchandiseId, quantity }]);
    if (!cart) {
      return { success: false, error: "Failed to initialize checkout" };
    }
    return { success: true, checkoutUrl: cart.checkoutUrl };
  } catch (error) {
    console.error("Checkout Action Error:", error);
    return { success: false, error: "Failed to initialize checkout" };
  }
}

export async function updateCartItemAction(cartId: string, lineId: string, quantity: number) {
  try {
    const cart = await updateCartLines(cartId, [{ id: lineId, quantity }]);
    return { success: true, cart };
  } catch (error) {
    console.error("Update Cart Action Error:", error);
    return { success: false, error: "Failed to update item quantity" };
  }
}

export async function removeCartItemAction(cartId: string, lineId: string) {
  try {
    const cart = await removeFromCart(cartId, [lineId]);
    return { success: true, cart };
  } catch (error) {
    console.error("Remove Cart Action Error:", error);
    return { success: false, error: "Failed to remove item from cart" };
  }
}

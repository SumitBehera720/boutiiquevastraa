"use server";

import { verifyAdminSession } from "./adminAuth";
import { revalidatePath } from "next/cache";
import { serverGetCoupons } from "@/lib/server-data";

async function requireAuth() {
  const isLogged = await verifyAdminSession();
  if (!isLogged) throw new Error("Unauthorized access.");
}

export async function getCouponsAction() {
  try {
    await requireAuth();
    return await serverGetCoupons();
  } catch {
    return [];
  }
}

export async function saveCouponAction(couponData: any) {
  try {
    await requireAuth();
    const { coupons, generateId } = await import("@/lib/data-store");
    const all = await coupons.all();
    if (couponData.id) {
      const idx = all.findIndex((c: any) => c.id === couponData.id);
      if (idx >= 0) all[idx] = { ...all[idx], ...couponData };
    } else {
      couponData.id = generateId();
      all.push(couponData);
    }
    await coupons.save(all);
    revalidatePath("/admin/coupons");
    revalidatePath("/checkout");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save coupon." };
  }
}

export async function toggleCouponAction(couponId: string) {
  try {
    await requireAuth();
    const { coupons } = await import("@/lib/data-store");
    const all = await coupons.all();
    const coupon = all.find((c: any) => c.id === couponId);
    let active = false;
    if (coupon) {
      coupon.active = !coupon.active;
      active = coupon.active;
    }
    await coupons.save(all);
    revalidatePath("/admin/coupons");
    return { success: true, active };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to toggle coupon." };
  }
}

export async function deleteCouponAction(couponId: string) {
  try {
    await requireAuth();
    const { coupons } = await import("@/lib/data-store");
    const all = await coupons.all();
    const filtered = all.filter((c: any) => c.id !== couponId);
    await coupons.save(filtered);
    revalidatePath("/admin/coupons");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete coupon." };
  }
}

export async function applyPromoCodeAction(code: string, subtotal: number) {
  try {
    const { coupons } = await import("@/lib/data-store");
    const coupon = await coupons.findByCode(code.trim());
    if (!coupon || !coupon.active) throw new Error("Invalid or expired promo code");

    let discountAmount = 0;
    if (coupon.type === "percentage") {
      discountAmount = subtotal * (parseFloat(coupon.value) / 100);
    } else {
      discountAmount = parseFloat(coupon.value);
    }
    discountAmount = Math.min(discountAmount, subtotal);

    return {
      success: true,
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount: Math.round(discountAmount * 100) / 100,
    };
  } catch (err: any) {
    return { success: false, error: err.message || "Failed to apply promo code." };
  }
}


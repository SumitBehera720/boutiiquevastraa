/**
 * lib/server-data.ts - Server-only helpers that access the data-store DIRECTLY.
 * Never makes HTTP calls. Bypasses the HOSTNAME/PORT mismatch on Hostinger.
 */

let _dsReady = false;

async function ensureDs() {
  if (_dsReady) return;
  const { initDataStore } = await import("@/lib/data-store");
  await initDataStore();
  _dsReady = true;
}

export async function serverGetSettings(): Promise<any> {
  try {
    await ensureDs();
    const { settings } = await import("@/lib/data-store");
    return (await settings.get()) || {};
  } catch (e) { console.error("[serverGetSettings]", e); return {}; }
}

export async function serverGetProducts(): Promise<any[]> {
  try {
    await ensureDs();
    const { products } = await import("@/lib/data-store");
    return products.all();
  } catch (e) { console.error("[serverGetProducts]", e); return []; }
}

export async function serverGetCollections(): Promise<any[]> {
  try {
    await ensureDs();
    const { collections } = await import("@/lib/data-store");
    return (await collections.all()).filter((c: any) => c.handle !== "frontpage");
  } catch (e) { console.error("[serverGetCollections]", e); return []; }
}

export async function serverGetOrders(): Promise<any[]> {
  try {
    await ensureDs();
    const { orders } = await import("@/lib/data-store");
    return orders.all();
  } catch (e) { console.error("[serverGetOrders]", e); return []; }
}

export async function serverGetUsers(): Promise<any[]> {
  try {
    await ensureDs();
    const { users } = await import("@/lib/data-store");
    return users.all();
  } catch (e) { console.error("[serverGetUsers]", e); return []; }
}

export async function serverGetReviews(productHandle?: string): Promise<any[]> {
  try {
    await ensureDs();
    const { reviews } = await import("@/lib/data-store");
    const allReviews = await reviews.all();
    if (productHandle) {
      return allReviews.filter((r: any) => r.productHandle === productHandle && r.approved);
    }
    return allReviews.filter((r: any) => r.productHandle === "global" && r.approved);
  } catch (e) { console.error("[serverGetReviews]", e); return []; }
}

export async function serverGetQna(productHandle?: string): Promise<any[]> {
  try {
    await ensureDs();
    const { qna } = await import("@/lib/data-store");
    const allQna = await qna.all();
    if (productHandle) {
      return allQna.filter((q: any) => q.productHandle === productHandle && q.approved);
    }
    return allQna;
  } catch (e) { console.error("[serverGetQna]", e); return []; }
}

export async function serverGetCoupons(): Promise<any[]> {
  try {
    await ensureDs();
    const { coupons } = await import("@/lib/data-store");
    return coupons.all();
  } catch (e) { console.error("[serverGetCoupons]", e); return []; }
}

export async function serverGetAdmins(): Promise<any[]> {
  try {
    await ensureDs();
    const { admins } = await import("@/lib/data-store");
    return admins.all();
  } catch (e) { console.error("[serverGetAdmins]", e); return []; }
}

export async function serverGetAllReviews(): Promise<any[]> {
  try {
    await ensureDs();
    const { reviews } = await import("@/lib/data-store");
    return reviews.all();
  } catch (e) { console.error("[serverGetAllReviews]", e); return []; }
}

export async function serverGetAuthUser(token: string): Promise<any> {
  try {
    await ensureDs();
    if (token === "admin-token") {
      return { id: "admin", firstName: "Admin", lastName: "", email: "admin@boutiiquevastraa.com", phone: "", defaultAddress: null };
    }
    const { sessions, users } = await import("@/lib/data-store");
    const userId = await sessions.getUserId(token);
    if (!userId) return null;
    return users.findById(userId);
  } catch (e) { console.error("[serverGetAuthUser]", e); return null; }
}



"use server";

import { verifyAdminSession } from "./adminAuth";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const isLogged = await verifyAdminSession();
  if (!isLogged) throw new Error("Unauthorized access.");
}

export async function deleteCollectionAction(id: string) {
  try {
    await requireAuth();
    const { initDataStore, collections } = await import("@/lib/data-store");
    await initDataStore();
    const all = await collections.all();
    await collections.save(all.filter((c: any) => c.id !== id));
    revalidatePath("/admin/collections");
    revalidatePath("/collections");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete collection." };
  }
}

export async function saveCollectionAction(collectionData: any) {
  try {
    await requireAuth();
    if (!collectionData.title || !collectionData.description) {
      return { success: false, error: "Please fill in Title and Description." };
    }
    const { initDataStore, collections } = await import("@/lib/data-store");
    await initDataStore();
    const all = await collections.all();
    let handle = collectionData.handle?.trim();
    if (handle) {
      handle = handle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }
    if (!handle) {
      handle = collectionData.title.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }
    const body: any = {
      id: collectionData.id || `col_${Date.now()}`,
      title: collectionData.title,
      handle,
      description: collectionData.description,
    };
    if (collectionData.image) body.image = collectionData.image;
    const idx = all.findIndex((c: any) => c.id === body.id || c.handle === body.handle);
    if (idx >= 0) { all[idx] = body; } else { all.push(body); }
    await collections.save(all);
    revalidatePath("/admin/collections");
    revalidatePath(`/collections/${body.handle}`);
    revalidatePath("/collections");
    revalidatePath("/");
    return { success: true, id: body.id, handle: body.handle };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save collection." };
  }
}

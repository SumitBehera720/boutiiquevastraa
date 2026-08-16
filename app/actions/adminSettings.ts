"use server";

import { verifyAdminSession } from "./adminAuth";
import { revalidatePath } from "next/cache";

async function requireAuth() {
  const isLogged = await verifyAdminSession();
  if (!isLogged) throw new Error("Unauthorized access.");
}

async function getDs() {
  const { initDataStore, settings } = await import("@/lib/data-store");
  await initDataStore();
  return settings;
}

export async function saveSeoSettingsAction(seoData: any) {
  try {
    await requireAuth();
    const ds = await getDs();
    const current = (await ds.get()) || {};
    current.seo = seoData;
    await ds.save(current);
    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save SEO settings." };
  }
}

export async function saveBannersSettingsAction(bannersData: any) {
  try {
    await requireAuth();
    const ds = await getDs();
    const current = (await ds.get()) || {};
    current.banners = bannersData;
    await ds.save(current);
    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save homepage banners." };
  }
}

export async function saveHomepageSettingsAction(homepageData: any) {
  try {
    await requireAuth();
    const ds = await getDs();
    const current = (await ds.get()) || {};
    current.homepage = homepageData;
    await ds.save(current);
    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save homepage settings." };
  }
}

export async function saveFooterSettingsAction(footerData: any) {
  try {
    await requireAuth();
    const ds = await getDs();
    const current = (await ds.get()) || {};
    current.footer = footerData;
    await ds.save(current);
    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save footer settings." };
  }
}

export async function saveHeaderSettingsAction(headerData: any) {
  try {
    await requireAuth();
    const ds = await getDs();
    const current = (await ds.get()) || {};
    current.header = headerData;
    await ds.save(current);
    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save header settings." };
  }
}

export async function saveGiftsSettingsAction(giftsData: any[]) {
  try {
    await requireAuth();
    const ds = await getDs();
    const current = (await ds.get()) || {};
    current.gifts = giftsData;
    await ds.save(current);
    revalidatePath("/admin/settings");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save gifts settings." };
  }
}

export async function uploadFileAction(formData: FormData) {
  try {
    await requireAuth();
    const file = formData.get("file") as File;
    if (!file) return { success: false, error: "No file provided." };
    const buffer = Buffer.from(await file.arrayBuffer());
    const ext = file.name.split('.').pop() || 'jpg';
    const filename = `${Date.now()}.${ext}`;
    // On Hostinger, UPLOAD_DIR points to public_html/images so Apache serves the files.
    // Locally falls back to public/images/uploads.
    const path = await import('path');
    const fs = await import('fs');
    const uploadDir = process.env.UPLOAD_DIR
      ? path.join(process.env.UPLOAD_DIR, 'uploads')
      : path.join(process.cwd(), 'public', 'images', 'uploads');
    if (!fs.existsSync(uploadDir)) fs.mkdirSync(uploadDir, { recursive: true });
    fs.writeFileSync(path.join(uploadDir, filename), buffer);
    return { success: true, url: `/images/uploads/${filename}` };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to upload file." };
  }
}

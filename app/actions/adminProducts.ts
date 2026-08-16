"use server";

import { verifyAdminSession } from "./adminAuth";
import { revalidatePath } from "next/cache";
import fs from "fs";
import path from "path";

async function requireAuth() {
  const isLogged = await verifyAdminSession();
  if (!isLogged) {
    throw new Error("Unauthorized access. Admin session required.");
  }
}

export async function deleteProductAction(id: string) {
  try {
    await requireAuth();
    const { products } = await import("@/lib/data-store");
    const all = await products.all();
    const filtered = all.filter((p: any) => p.id !== id);
    await products.save(filtered);
    revalidatePath("/admin/products");
    revalidatePath("/products");
    revalidatePath("/collections");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete product." };
  }
}

export async function uploadImageAction(formData: FormData) {
  try {
    await requireAuth();
    const file = formData.get("file") || formData.get("image");
    if (!(file instanceof File)) throw new Error("No file uploaded");
    
    const ext = file.name.split(".").pop() || "png";
    const fileName = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    
    const uploadDir = process.env.UPLOAD_DIR
      ? path.join(process.env.UPLOAD_DIR, "uploads")
      : path.join(process.cwd(), "public", "images", "uploads");
      
    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }
    fs.writeFileSync(path.join(uploadDir, fileName), buffer);
    return { success: true, url: `/images/uploads/${fileName}` };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to upload image." };
  }
}

export async function saveProductAction(productData: any) {
  try {
    await requireAuth();

    if (!productData.title || !productData.price || !productData.description) {
      return { success: false, error: "Please fill in title, price, and description." };
    }

    const { products, generateId } = await import("@/lib/data-store");
    const all = await products.all();

    let id = productData.id;
    let handle = productData.handle;

    // Check handle collision and generate unique handle
    let baseHandle = handle?.trim();
    if (baseHandle) {
      baseHandle = baseHandle.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    }
    if (!baseHandle) {
      baseHandle = productData.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || "product";
    }
    handle = baseHandle;
    let counter = 1;
    while (all.some((p: any) => p.handle === handle && p.id !== id)) {
      handle = `${baseHandle}-${counter}`;
      counter++;
    }

    // Format images to Shopify edges structure
    let formattedImages = productData.images;
    if (Array.isArray(productData.images)) {
      formattedImages = {
        edges: productData.images.map((url: string) => ({
          node: { url, altText: productData.title }
        }))
      };
    }

    // Format variants to Shopify edges structure
    let formattedVariants = productData.variants;
    if (Array.isArray(productData.variants)) {
      formattedVariants = {
        edges: productData.variants.map((v: any, index: number) => {
          const varId = v.id || `gid://shopify/ProductVariant/${Date.now()}-${index}-${Math.floor(Math.random()*1000)}`;
          return {
            node: {
              id: varId,
              title: v.title || "Default Title",
              availableForSale: (productData.inventory !== undefined ? productData.inventory : 10) > 0,
              price: { amount: String(v.price || productData.price), currencyCode: "INR" },
              compareAtPrice: v.compareAtPrice ? { amount: String(v.compareAtPrice), currencyCode: "INR" } : null,
              selectedOptions: v.selectedOptions || [{ name: "Title", value: v.title || "Default Title" }],
              image: { url: (Array.isArray(productData.images) ? productData.images[0] : "") }
            }
          };
        })
      };
    }

    const priceRange = {
      minVariantPrice: { amount: String(productData.price), currencyCode: "INR" },
      maxVariantPrice: { amount: String(productData.price), currencyCode: "INR" }
    };
    const compareAtPriceRange = productData.compareAtPrice ? {
      minVariantPrice: { amount: String(productData.compareAtPrice), currencyCode: "INR" },
      maxVariantPrice: { amount: String(productData.compareAtPrice), currencyCode: "INR" }
    } : undefined;

    const normalizedData = {
      ...productData,
      handle,
      images: formattedImages,
      variants: formattedVariants,
      priceRange,
      compareAtPriceRange,
      sizesEnabled: productData.sizesEnabled !== undefined ? !!productData.sizesEnabled : null,
      selectedSizes: productData.selectedSizes || [],
      availableForSale: (productData.inventory !== undefined ? productData.inventory : 10) > 0
    };

    if (id) {
      const idx = all.findIndex((p: any) => p.id === id);
      if (idx >= 0) {
        all[idx] = { ...all[idx], ...normalizedData, id };
      }
    } else {
      id = generateId();
      const newProduct = {
        ...normalizedData,
        id,
        createdAt: new Date().toISOString(),
      };
      all.push(newProduct);
    }

    await products.save(all);

    revalidatePath("/admin/products");
    revalidatePath(`/products/${handle}`);
    revalidatePath("/products");
    revalidatePath("/collections");
    revalidatePath("/");
    
    return { success: true, id, handle };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to save product." };
  }
}


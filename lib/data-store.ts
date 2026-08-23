import fs from "fs";
import path from "path";
import crypto from "crypto";
import { dbAvailable, query, getOne, insert, update, upsert, remove, replaceAll, initDatabase, seedIfEmpty, runDbHousekeeping } from "./db";

const DATA_DIR = path.join(process.cwd(), "data");
const CACHE_TTL = 1500;
const USE_DB = dbAvailable();
let DB_READY = false;

// Shared initialization promise to prevent race conditions
let initPromise: Promise<void> | null = null;

export async function initDataStore(): Promise<void> {
  if (initPromise) return initPromise;
  
  initPromise = (async () => {
    if (USE_DB) {
      try {
        await initDatabase();
        await seedIfEmpty();
        await runDbHousekeeping();
        DB_READY = true;
        console.log("[DataStore] MongoDB ready");
      } catch (err: any) {
        console.error("[DataStore] MongoDB init failed:", err);
        initPromise = null; // Allow retry on subsequent attempts
        throw new Error(`MongoDB initialization failed: ${err.message || err}`);
      }
    } else {
      runJsonHousekeeping();
      if (typeof global !== 'undefined' && !(global as any)._jsonHousekeepingInterval) {
        (global as any)._jsonHousekeepingInterval = setInterval(runJsonHousekeeping, 60 * 60 * 1000);
      }
    }
  })();
  
  return initPromise;
}

async function db(): Promise<boolean> {
  await initDataStore();
  if (USE_DB && !DB_READY) {
    throw new Error("MongoDB connection is not ready. Operation failed.");
  }
  return DB_READY && USE_DB;
}

// ─── Simple TTL cache (only used in JSON mode) ─────────────────────────────
const cache = new Map<string, { data: any; expiresAt: number }>();

function cachedRead<T>(name: string, ttl = CACHE_TTL): T {
  const key = name;
  const now = Date.now();
  const entry = cache.get(key);
  if (entry && entry.expiresAt > now) return entry.data as T;
  const data = readRaw<T>(name);
  cache.set(key, { data, expiresAt: now + ttl });
  if (cache.size > 50) {
    const oldest = [...cache.entries()].sort((a, b) => a[1].expiresAt - b[1].expiresAt)[0];
    if (oldest) cache.delete(oldest[0]);
  }
  return data;
}

function filePath(name: string): string {
  return path.join(DATA_DIR, `${name}.json`);
}

function readRaw<T>(name: string): T {
  try {
    return JSON.parse(fs.readFileSync(filePath(name), "utf-8"));
  } catch {
    return ([] as any) as T;
  }
}

function writeJson<T>(name: string, data: T): void {
  const fp = filePath(name);
  const tmp = fp + ".tmp." + process.pid;
  fs.writeFileSync(tmp, JSON.stringify(data, null, 2), "utf-8");
  fs.renameSync(tmp, fp);
  cache.delete(name);
}

// ─── Database TTL Query Cache (Optimizes MongoDB queries) ────────────────────
const dbCache = new Map<string, { data: any; expiresAt: number }>();
const DB_CACHE_TTL = 3000; // 3 seconds cache

async function cachedDbQuery<T>(key: string, queryFn: () => Promise<T>, ttl = DB_CACHE_TTL): Promise<T> {
  const now = Date.now();
  const entry = dbCache.get(key);
  if (entry && entry.expiresAt > now) {
    return entry.data as T;
  }
  const data = await queryFn();
  dbCache.set(key, { data, expiresAt: now + ttl });
  return data;
}

// Clear relevant DB cache on mutations
export function clearDbCache() {
  dbCache.clear();
}

// ─── Users ──────────────────────────────────────────────────────────────────

export const users = {
  all: async () => {
    if (await db()) {
      const rows = await query<any[]>("SELECT * FROM users");
      return rows.map(mapUserFromDb);
    }
    return cachedRead<any[]>("users");
  },
  findByEmail: async (email: string) => {
    if (await db()) {
      const row = await getOne<any>("SELECT * FROM users WHERE email = ?", [email]);
      return row ? mapUserFromDb(row) : null;
    }
    return cachedRead<any[]>("users").find((u: any) => u.email.toLowerCase() === email.toLowerCase()) || null;
  },
  findById: async (id: string) => {
    if (await db()) {
      const row = await getOne<any>("SELECT * FROM users WHERE id = ?", [id]);
      return row ? mapUserFromDb(row) : null;
    }
    return cachedRead<any[]>("users").find((u: any) => u.id === id) || null;
  },
  create: async (user: any) => {
    if (await db()) {
      await insert("users", {
        id: user.id, first_name: user.firstName || "", last_name: user.lastName || "",
        email: user.email, phone: user.phone || "", password: user.password || user.passwordHash || "",
        default_address: JSON.stringify(user.defaultAddress || null),
        cart_id: user.cartId || null,
        wishlist: JSON.stringify(user.wishlist || null),
      });
      return user;
    }
    const all = cachedRead<any[]>("users");
    all.push(user);
    writeJson("users", all);
    return user;
  },
  update: async (id: string, updates: Partial<any>) => {
    if (await db()) {
      const mapped: Record<string, any> = {};
      if (updates.firstName !== undefined) mapped.first_name = updates.firstName;
      if (updates.lastName !== undefined) mapped.last_name = updates.lastName;
      if (updates.email !== undefined) mapped.email = updates.email;
      if (updates.phone !== undefined) mapped.phone = updates.phone;
      if (updates.defaultAddress !== undefined) mapped.default_address = JSON.stringify(updates.defaultAddress);
      if (updates.cartId !== undefined) mapped.cart_id = updates.cartId;
      if (updates.wishlist !== undefined) mapped.wishlist = JSON.stringify(updates.wishlist);
      if (updates.password !== undefined) mapped.password = updates.password;
      if (updates.passwordHash !== undefined) mapped.password = updates.passwordHash;
      if (updates.resetToken !== undefined) mapped.reset_token = updates.resetToken;
      if (updates.resetTokenExpires !== undefined) mapped.reset_token_expires = updates.resetTokenExpires;
      await update("users", "id", id, mapped);
      return;
    }
    const all = cachedRead<any[]>("users");
    const idx = all.findIndex((u: any) => u.id === id);
    if (idx >= 0) {
      all[idx] = { ...all[idx], ...updates };
      writeJson("users", all);
    }
  },
};

function mapUserFromDb(row: any): any {
  return {
    id: row.id,
    firstName: row.first_name,
    lastName: row.last_name,
    email: row.email,
    phone: row.phone || "",
    password: row.password,
    passwordHash: row.password,
    defaultAddress: row.default_address ? (typeof row.default_address === "string" ? JSON.parse(row.default_address) : row.default_address) : null,
    cartId: row.cart_id || null,
    wishlist: row.wishlist ? (typeof row.wishlist === "string" ? JSON.parse(row.wishlist) : row.wishlist) : null,
    resetToken: row.reset_token || null,
    resetTokenExpires: row.reset_token_expires || null,
  };
}

// ─── Admins ─────────────────────────────────────────────────────────────────

export const admins = {
  all: async () => {
    if (await db()) {
      const rows = await query<any[]>("SELECT * FROM admin");
      return rows.map((r: any) => ({ ...r, passwordHash: r.password }));
    }
    return cachedRead<any[]>("admin");
  },
  findByUsername: async (username: string) => {
    if (await db()) {
      const row = await getOne<any>("SELECT * FROM admin WHERE username = ?", [username]);
      return row ? { ...row, passwordHash: row.password } : null;
    }
    return cachedRead<any[]>("admin").find((a: any) => a.username === username) || null;
  },
};

// ─── Products ───────────────────────────────────────────────────────────────

export const products = {
  all: async () => {
    if (await db()) {
      return cachedDbQuery("products_all", async () => {
        const rows = await query<any[]>("SELECT * FROM products");
        return rows.map(mapProductFromDb);
      });
    }
    return cachedRead<any[]>("products").map(mapProductFromJson);
  },
  findByHandle: async (handle: string) => {
    const decoded = decodeURIComponent(handle);
    const slugified = decoded.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (await db()) {
      let row = await getOne<any>("SELECT * FROM products WHERE handle = ?", [slugified]);
      if (row) return mapProductFromDb(row);
      if (decoded !== slugified) {
        row = await getOne<any>("SELECT * FROM products WHERE handle = ?", [decoded]);
        if (row) return mapProductFromDb(row);
      }
      if (handle !== decoded && handle !== slugified) {
        row = await getOne<any>("SELECT * FROM products WHERE handle = ?", [handle]);
        if (row) return mapProductFromDb(row);
      }
      const all = await products.all();
      const found = all.find((p: any) => 
        p.handle?.toLowerCase() === decoded.toLowerCase() ||
        p.handle?.toLowerCase() === handle.toLowerCase()
      );
      if (found) return found;
      return null;
    }
    const found = cachedRead<any[]>("products").find((p: any) => 
      p.handle === handle || 
      p.handle === decoded || 
      p.handle === slugified ||
      p.handle?.toLowerCase() === decoded.toLowerCase()
    );
    return found ? mapProductFromJson(found) : null;
  },
  findById: async (id: string) => {
    if (await db()) {
      const row = await getOne<any>("SELECT * FROM products WHERE id = ?", [id]);
      return row ? mapProductFromDb(row) : null;
    }
    const found = cachedRead<any[]>("products").find((p: any) => p.id === id);
    return found ? mapProductFromJson(found) : null;
  },
  save: async (items: any[]) => {
    // 1. Fetch old products to check if they were out of stock
    let oldProducts: any[] = [];
    try {
      if (await db()) {
        const rows = await query<any[]>("SELECT * FROM products");
        oldProducts = rows.map(mapProductFromDb);
      } else {
        oldProducts = cachedRead<any[]>("products").map(mapProductFromJson);
      }
    } catch (e: any) {
      console.warn("[DataStore] Failed to retrieve old products for back-in-stock check:", e.message);
    }

    // Normalize and transform product data structure to Shopify compatibility schema
    const mappedItems = items.map((p: any) => {
      // 1. priceRange mapping
      let priceRange = p.priceRange || {};
      if (p.price !== undefined && p.price !== null) {
        const amt = typeof p.price === 'string' ? p.price : String(p.price || "0");
        priceRange = {
          minVariantPrice: { amount: amt, currencyCode: "INR" },
          maxVariantPrice: { amount: amt, currencyCode: "INR" }
        };
      } else if (!priceRange.minVariantPrice) {
        priceRange = {
          minVariantPrice: { amount: "0", currencyCode: "INR" },
          maxVariantPrice: { amount: "0", currencyCode: "INR" }
        };
      }
      
      // 2. compareAtPriceRange mapping
      let compareAtPriceRange = p.compareAtPriceRange || null;
      if (p.compareAtPrice !== undefined && p.compareAtPrice !== null && p.compareAtPrice !== "") {
        const amt = typeof p.compareAtPrice === 'string' ? p.compareAtPrice : String(p.compareAtPrice || "0");
        compareAtPriceRange = {
          minVariantPrice: { amount: amt, currencyCode: "INR" },
          maxVariantPrice: { amount: amt, currencyCode: "INR" }
        };
      } else if (!p.compareAtPrice && !compareAtPriceRange?.minVariantPrice) {
        compareAtPriceRange = null;
      }
      
      // 3. images mapping
      let images = p.images || { edges: [] };
      if (Array.isArray(p.images)) {
        images = {
          edges: p.images.map((url: string) => ({
            node: { url, altText: null }
          }))
        };
      }
      
      // 4. variants mapping
      const isAvailable = p.inventory === null || p.inventory === undefined || Number(p.inventory) > 0;
      let variants = p.variants || { edges: [] };
      if (Array.isArray(p.variants)) {
        variants = {
          edges: p.variants.map((v: any, index: number) => {
            const priceAmt = typeof v.price === 'string' ? v.price : String(v.price || p.price || "0");
            const compareAmt = v.compareAtPrice ? (typeof v.compareAtPrice === 'string' ? v.compareAtPrice : String(v.compareAtPrice)) : null;
            return {
              node: {
                id: v.id || `variant_${Date.now()}_${index}`,
                title: v.title || "Default Title",
                availableForSale: isAvailable,
                price: { amount: priceAmt, currencyCode: "INR" },
                compareAtPrice: compareAmt ? { amount: compareAmt, currencyCode: "INR" } : null,
                selectedOptions: v.selectedOptions || [],
                image: v.image || (Array.isArray(p.images) && p.images[0] ? { url: p.images[0] } : null)
              }
            };
          })
        };
      } else if (!variants.edges || variants.edges.length === 0) {
        // Fallback default variant
        const priceAmt = typeof p.price === 'string' ? p.price : String(p.price || "0");
        const compareAmt = p.compareAtPrice ? (typeof p.compareAtPrice === 'string' ? p.compareAtPrice : String(p.compareAtPrice)) : null;
        variants = {
          edges: [
            {
              node: {
                id: `variant_${Date.now()}_0`,
                title: "Default Title",
                availableForSale: isAvailable,
                price: { amount: priceAmt, currencyCode: "INR" },
                compareAtPrice: compareAmt ? { amount: compareAmt, currencyCode: "INR" } : null,
                selectedOptions: [{ name: "Title", value: "Default Title" }],
                image: Array.isArray(p.images) && p.images[0] ? { url: p.images[0] } : null
              }
            }
          ]
        };
      } else if (variants.edges && Array.isArray(variants.edges)) {
        variants.edges = variants.edges.map((edge: any) => {
          if (edge.node) {
            edge.node.availableForSale = isAvailable;
          }
          return edge;
        });
      }
      
      return {
        ...p,
        priceRange,
        compareAtPriceRange,
        images,
        variants,
        availableForSale: isAvailable,
        showSizeChart: p.showSizeChart === undefined ? !isSareeProduct(p) : !!p.showSizeChart,
        sizeChartImage: p.sizeChartImage || null,
        sizesEnabled: p.sizesEnabled !== undefined ? !!p.sizesEnabled : null,
        selectedSizes: p.selectedSizes || [],
      };
    });

    if (await db()) {
      const mapped = mappedItems.map(mapProductToDb);
      await replaceAll("products", mapped);
      clearDbCache();
    } else {
      writeJson("products", mappedItems);
    }

    // 2. Compare products to identify back-in-stock items
    try {
      for (const newP of mappedItems) {
        const oldP = oldProducts.find((op: any) => op.id === newP.id);
        if (!oldP) continue;

        const wasOutOfStock = !oldP.availableForSale || (oldP.inventory !== null && oldP.inventory <= 0);
        const isNowInStock = newP.availableForSale && (newP.inventory === null || newP.inventory > 0);

        if (wasOutOfStock && isNowInStock) {
          await triggerStockNotifications(newP);
        }
      }
    } catch (err: any) {
      console.error("[DataStore] Back-in-stock check failed:", err.message);
    }
  },
};

function isSareeProduct(p: any): boolean {
  const title = (p.title || "").toLowerCase();
  
  let tags: string[] = [];
  if (Array.isArray(p.tags)) {
    tags = p.tags;
  } else if (typeof p.tags === "string") {
    try {
      tags = JSON.parse(p.tags);
    } catch {}
  }
  const tagList = tags.map((t: any) => String(t).toLowerCase());

  let collectionHandles: string[] = [];
  if (Array.isArray(p.collectionHandles)) {
    collectionHandles = p.collectionHandles;
  } else if (p.collection_handles && Array.isArray(p.collection_handles)) {
    collectionHandles = p.collection_handles;
  } else if (typeof p.collectionHandles === "string") {
    try {
      collectionHandles = JSON.parse(p.collectionHandles);
    } catch {}
  } else if (typeof p.collection_handles === "string") {
    try {
      collectionHandles = JSON.parse(p.collection_handles);
    } catch {}
  }
  const collList = collectionHandles.map((c: any) => String(c).toLowerCase());

  return title.includes("saree") || tagList.includes("saree") || tagList.includes("sarees") || collList.includes("saree");
}

function mapProductFromJson(p: any): any {
  if (!p) return null;
  const isAvailable = p.inventory === null || p.inventory === undefined || Number(p.inventory) > 0;
  return {
    ...p,
    availableForSale: isAvailable,
    inventory: p.inventory !== null && p.inventory !== undefined ? Number(p.inventory) : null,
    showSizeChart: p.showSizeChart !== undefined ? !!p.showSizeChart : !isSareeProduct(p),
    sizeChartImage: p.sizeChartImage || null,
    sizesEnabled: p.sizesEnabled !== undefined ? !!p.sizesEnabled : null,
    selectedSizes: p.selectedSizes || [],
    specifications: p.specifications || {},
  };
}

function mapProductFromDb(row: any): any {
  const parse = (v: any) => (v ? (typeof v === "string" ? JSON.parse(v) : v) : {});
  const isAvailable = row.inventory === null || row.inventory === undefined || Number(row.inventory) > 0;
  const baseProd = {
    id: row.id,
    title: row.title,
    handle: row.handle,
    description: row.description || "",
    descriptionHtml: row.description || "",
    availableForSale: isAvailable,
    priceRange: parse(row.price_range),
    compareAtPriceRange: parse(row.compare_at_price_range),
    images: parse(row.images),
    variants: parse(row.variants),
    tags: parse(row.tags),
    collectionHandles: parse(row.collection_handles) || [],
    inventory: row.inventory !== null && row.inventory !== undefined ? Number(row.inventory) : null,
  };
  if (baseProd.variants && Array.isArray(baseProd.variants.edges)) {
    baseProd.variants.edges = baseProd.variants.edges.map((edge: any) => {
      if (edge.node) {
        edge.node.availableForSale = isAvailable;
      }
      return edge;
    });
  }
  return {
    ...baseProd,
    showSizeChart: row.show_size_chart !== null && row.show_size_chart !== undefined
      ? !!row.show_size_chart
      : !isSareeProduct(baseProd),
    sizeChartImage: row.size_chart_image || null,
    sizesEnabled: row.sizes_enabled !== null && row.sizes_enabled !== undefined ? !!row.sizes_enabled : null,
    selectedSizes: row.selected_sizes ? parse(row.selected_sizes) : [],
    specifications: row.specifications ? parse(row.specifications) : {},
  };
}

function mapProductToDb(p: any): any {
  const isAvailable = p.inventory === null || p.inventory === undefined || Number(p.inventory) > 0;
  return {
    id: p.id,
    title: p.title,
    handle: p.handle || p.id,
    description: p.description || "",
    available_for_sale: isAvailable,
    price_range: JSON.stringify(p.priceRange || {}),
    compare_at_price_range: JSON.stringify(p.compareAtPriceRange || {}),
    images: JSON.stringify(p.images || { edges: [] }),
    variants: JSON.stringify(p.variants || { edges: [] }),
    tags: JSON.stringify(p.tags || []),
    collection_handles: JSON.stringify(p.collectionHandles || []),
    inventory: p.inventory !== null && p.inventory !== undefined ? Number(p.inventory) : null,
    show_size_chart: p.showSizeChart === undefined ? !isSareeProduct(p) : !!p.showSizeChart,
    size_chart_image: p.sizeChartImage || null,
    sizes_enabled: p.sizesEnabled === undefined ? null : (p.sizesEnabled ? 1 : 0),
    selected_sizes: JSON.stringify(p.selectedSizes || []),
    specifications: JSON.stringify(p.specifications || {}),
  };
}

// ─── Collections ────────────────────────────────────────────────────────────

export const collections = {
  all: async () => {
    if (await db()) {
      return cachedDbQuery("collections_all", async () => {
        const rows = await query<any[]>("SELECT * FROM collections ORDER BY created_at DESC");
        return rows.map(mapCollectionFromDb);
      });
    }
    return cachedRead<any[]>("collections");
  },
  findByHandle: async (handle: string) => {
    const decoded = decodeURIComponent(handle);
    const slugified = decoded.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
    if (await db()) {
      let row = await getOne<any>("SELECT * FROM collections WHERE handle = ?", [slugified]);
      if (row) return mapCollectionFromDb(row);
      if (decoded !== slugified) {
        row = await getOne<any>("SELECT * FROM collections WHERE handle = ?", [decoded]);
        if (row) return mapCollectionFromDb(row);
      }
      if (handle !== decoded && handle !== slugified) {
        row = await getOne<any>("SELECT * FROM collections WHERE handle = ?", [handle]);
        if (row) return mapCollectionFromDb(row);
      }
      const all = await collections.all();
      const found = all.find((c: any) => 
        c.handle?.toLowerCase() === decoded.toLowerCase() ||
        c.handle?.toLowerCase() === handle.toLowerCase()
      );
      if (found) return found;
      return null;
    }
    const found = cachedRead<any[]>("collections").find((c: any) => 
      c.handle === handle || 
      c.handle === decoded || 
      c.handle === slugified || 
      c.handle?.toLowerCase() === decoded.toLowerCase()
    );
    return found ? found : null;
  },
  save: async (items: any[]) => {
    if (await db()) {
      const mapped = items.map(mapCollectionToDb);
      await replaceAll("collections", mapped);
      clearDbCache();
      return;
    }
    writeJson("collections", items);
  },
};

function mapCollectionFromDb(row: any): any {
  return {
    id: row.id,
    title: row.title,
    handle: row.handle,
    description: row.description || "",
    image: row.image ? (typeof row.image === "string" ? JSON.parse(row.image) : row.image) : null,
  };
}

function mapCollectionToDb(c: any): any {
  return {
    id: c.id,
    title: c.title,
    handle: c.handle || c.id,
    description: c.description || "",
    image: JSON.stringify(c.image || c.bannerImage || null),
  };
}

// ─── Coupons ────────────────────────────────────────────────────────────────

export const coupons = {
  all: async () => {
    if (await db()) {
      const rows = await query<any[]>("SELECT * FROM coupons ORDER BY created_at DESC");
      return rows.map(mapCouponFromDb);
    }
    return cachedRead<any[]>("coupons");
  },
  findByCode: async (code: string) => {
    if (await db()) {
      const row = await getOne<any>("SELECT * FROM coupons WHERE code = ?", [code]);
      return row ? mapCouponFromDb(row) : null;
    }
    return cachedRead<any[]>("coupons").find((c: any) => c.code?.toLowerCase() === code.toLowerCase()) || null;
  },
  save: async (items: any[]) => {
    if (await db()) {
      const mapped = items.map(mapCouponToDb);
      await replaceAll("coupons", mapped);
      return;
    }
    writeJson("coupons", items);
  },
};

function mapCouponFromDb(row: any): any {
  return {
    id: row.id,
    code: row.code,
    type: row.type || "percentage",
    value: Number(row.value) || 0,
    minPurchase: Number(row.min_purchase) || 0,
    maxUses: row.max_uses || 0,
    usedCount: row.used_count || 0,
    active: !!row.active,
    expiresAt: row.expires_at,
  };
}

function mapCouponToDb(c: any): any {
  return {
    id: c.id,
    code: c.code,
    type: c.type || "percentage",
    value: c.value || 0,
    min_purchase: c.minPurchase || 0,
    max_uses: c.maxUses || 0,
    used_count: c.usedCount || 0,
    active: c.active ?? true,
    expires_at: c.expiresAt || null,
  };
}

// ─── Reviews ────────────────────────────────────────────────────────────────

export const reviews = {
  all: async () => {
    if (await db()) {
      const rows = await query<any[]>("SELECT * FROM reviews ORDER BY created_at DESC");
      return rows.map(mapReviewFromDb);
    }
    return cachedRead<any[]>("reviews");
  },
  save: async (items: any[]) => {
    if (await db()) {
      const mapped = items.map(mapReviewToDb);
      await replaceAll("reviews", mapped);
      return;
    }
    writeJson("reviews", items);
  },
};

function mapReviewFromDb(row: any): any {
  return {
    id: row.id,
    productHandle: row.product_handle || "global",
    author: row.author,
    rating: row.rating || 5,
    comment: row.comment,
    approved: !!row.approved,
    createdAt: row.created_at,
  };
}

function mapReviewToDb(r: any): any {
  return {
    id: r.id,
    product_handle: r.productHandle || r.productId || "global",
    author: r.author,
    rating: r.rating || 5,
    comment: r.comment,
    approved: r.approved ?? true,
  };
}

// ─── Q&A (Questions & Answers) ──────────────────────────────────────────────

export const qna = {
  all: async () => {
    if (await db()) {
      const rows = await query<any[]>("SELECT * FROM qna ORDER BY created_at DESC");
      return rows.map(mapQnaFromDb);
    }
    return cachedRead<any[]>("qna");
  },
  save: async (items: any[]) => {
    if (await db()) {
      const mapped = items.map(mapQnaToDb);
      await replaceAll("qna", mapped);
      return;
    }
    writeJson("qna", items);
  },
};

function mapQnaFromDb(row: any): any {
  return {
    id: row.id,
    productHandle: row.product_handle || "global",
    author: row.author,
    email: row.email || "",
    question: row.question,
    answer: row.answer || null,
    approved: !!row.approved,
    createdAt: row.created_at,
  };
}

function mapQnaToDb(q: any): any {
  return {
    id: q.id,
    product_handle: q.productHandle || "global",
    author: q.author,
    email: q.email || "",
    question: q.question,
    answer: q.answer || null,
    approved: q.approved ?? false,
  };
}

// ─── Orders ─────────────────────────────────────────────────────────────────

function normalizeOrder(o: any): any {
  if (!o) return o;
  if (!o.totalPrice) {
    const raw = o.total ?? o.subtotal ?? o.total_amount ?? "0";
    o.totalPrice = {
      amount: typeof raw === "string" ? raw : String(raw),
      currencyCode: "INR",
    };
  }
  if (!o.shippingAddress && o.customer?.shippingAddress) {
    o.shippingAddress = o.customer.shippingAddress;
  }
  if (!o.customerName && o.customer) {
    o.customerName = o.customer.name || `${o.customer.firstName || ""} ${o.customer.lastName || ""}`.trim();
  }
  if (!o.email && o.customer?.email) o.email = o.customer.email;
  if (!o.phone && o.customer?.phone) o.phone = o.customer.phone;
  if (!o.processedAt && o.createdAt) o.processedAt = o.createdAt;
  if (!o.lineItems && o.items) o.lineItems = o.items;
  if (!o.items && o.lineItems) o.items = o.lineItems;
  if (!o.items && o.lines) { o.items = o.lines; o.lineItems = o.lines; }
  return o;
}

export const orders = {
  all: async () => {
    if (await db()) {
      const rows = await query<any[]>("SELECT * FROM orders ORDER BY created_at DESC");
      return rows.map(mapOrderFromDb);
    }
    return cachedRead<any[]>("orders").map(normalizeOrder);
  },
  save: async (items: any[]) => {
    if (await db()) {
      const mapped = items.map(mapOrderToDb);
      await replaceAll("orders", mapped);
      return;
    }
    writeJson("orders", items);
  },
};

function mapOrderFromDb(row: any): any {
  const parse = (v: any) => (v ? (typeof v === "string" ? JSON.parse(v) : v) : {});
  const customer = parse(row.customer);
  const items = parse(row.items);
  return {
    id: row.id,
    orderNumber: row.order_number,
    email: row.email,
    customer,
    customerName: customer.name || `${customer.firstName || ""} ${customer.lastName || ""}`.trim() || "",
    phone: customer.phone || "",
    items,
    lineItems: items,
    shippingAddress: parse(row.shipping_address),
    totalPrice: parse(row.total_price),
    fulfillmentStatus: row.fulfillment_status || "unfulfilled",
    createdAt: row.created_at || new Date().toISOString(),
    processedAt: row.created_at || new Date().toISOString(),
    
    shipmentId: row.shipment_id || null,
    awbNumber: row.awb_number || null,
    courierName: row.courier_name || null,
    shipmentStatus: row.shipment_status || null,
    pickupStatus: row.pickup_status || null,
    labelUrl: row.label_url || null,
    invoiceUrl: row.invoice_url || null,
    shipmentError: row.shipment_error || null,
    shipmentErrorAt: row.shipment_error_at || null,
    shipmentLastSynced: row.shipment_last_synced || null,
    shiprocketResponse: row.shiprocket_response ? parse(row.shiprocket_response) : null,
    shiprocketUpdatedAt: row.shiprocket_updated_at || null,

    paymentGateway: row.payment_gateway || "COD",
    financialStatus: row.financial_status || row.payment_status || "PENDING",
    paymentStatus: row.payment_status || "PENDING",
    merchantTransactionId: row.merchant_transaction_id || null,
    phonepeTransactionId: row.phonepe_transaction_id || null,
    razorpayOrderId: row.razorpay_order_id || null,
    razorpayPaymentId: row.razorpay_payment_id || null,
    paymentReference: row.payment_reference || null,
    paymentAmount: row.payment_amount || null,
    paymentTime: row.payment_time || null,
    paymentResponse: row.payment_response ? parse(row.payment_response) : null,
    paymentError: row.payment_error || null,
    inventoryReserved: row.inventory_reserved === true || row.inventory_reserved === "true",
    paymentEvents: row.payment_events ? parse(row.payment_events) : [],
    paymentUpdatedAt: row.payment_updated_at || null,
  };
}

function mapOrderToDb(o: any): any {
  const customerData = o.customer || { name: o.customerName || "", phone: o.phone || "" };
  return {
    id: o.id,
    order_number: o.orderNumber || "",
    email: o.email || "",
    customer: JSON.stringify(customerData),
    items: JSON.stringify(o.items || o.lineItems || []),
    shipping_address: JSON.stringify(o.shippingAddress || {}),
    total_price: JSON.stringify(o.totalPrice || { amount: "0", currencyCode: "INR" }),
    fulfillment_status: o.fulfillmentStatus || "unfulfilled",
    
    shipment_id: o.shipmentId || null,
    awb_number: o.awbNumber || null,
    courier_name: o.courierName || null,
    shipment_status: o.shipmentStatus || null,
    pickup_status: o.pickupStatus || null,
    label_url: o.labelUrl || null,
    invoice_url: o.invoiceUrl || null,
    shipment_error: o.shipmentError || null,
    shipment_error_at: o.shipmentErrorAt || null,
    shipment_last_synced: o.shipmentLastSynced || null,
    shiprocket_response: o.shiprocketResponse ? (typeof o.shiprocketResponse === "object" ? JSON.stringify(o.shiprocketResponse) : o.shiprocketResponse) : null,
    shiprocket_updated_at: o.shiprocketUpdatedAt || null,

    payment_gateway: o.paymentGateway || "COD",
    financial_status: o.financialStatus || o.paymentStatus || "PENDING",
    payment_status: o.paymentStatus || "PENDING",
    merchant_transaction_id: o.merchantTransactionId || null,
    phonepe_transaction_id: o.phonepeTransactionId || null,
    razorpay_order_id: o.razorpayOrderId || null,
    razorpay_payment_id: o.razorpayPaymentId || null,
    payment_reference: o.paymentReference || null,
    payment_amount: o.paymentAmount || null,
    payment_time: o.paymentTime || null,
    payment_response: o.paymentResponse ? (typeof o.paymentResponse === "object" ? JSON.stringify(o.paymentResponse) : o.paymentResponse) : null,
    payment_error: o.paymentError || null,
    inventory_reserved: o.inventoryReserved === true || o.inventory_reserved === "true",
    payment_events: JSON.stringify(o.paymentEvents || []),
    payment_updated_at: o.paymentUpdatedAt || null,
    created_at: o.createdAt || o.processedAt || new Date().toISOString(),
  };
}

// ─── Settings ───────────────────────────────────────────────────────────────

export const settings = {
  get: async () => {
    if (await db()) {
      const row = await getOne<any>("SELECT data FROM settings WHERE id = 1");
      if (row) return typeof row.data === "string" ? JSON.parse(row.data) : row.data;
      return {};
    }
    return cachedRead<any>("settings");
  },
  save: async (data: any) => {
    if (await db()) {
      await upsert("settings", "id", { id: 1, data: JSON.stringify(data) });
      return;
    }
    writeJson("settings", data);
  },
};

// ─── Carts ──────────────────────────────────────────────────────────────────

export const carts = {
  get: async (id: string) => {
    if (await db()) {
      const row = await getOne<any>("SELECT data FROM carts WHERE cart_id = ?", [id]);
      if (row) return typeof row.data === "string" ? JSON.parse(row.data) : row.data;
      return null;
    }
    const all = cachedRead<Record<string, any>>("carts");
    return all[id] || null;
  },
  save: async (id: string, data: any) => {
    if (await db()) {
      await upsert("carts", "cart_id", { cart_id: id, data: JSON.stringify(data) });
      return;
    }
    const all = cachedRead<Record<string, any>>("carts");
    all[id] = data;
    writeJson("carts", all);
  },
  remove: async (id: string) => {
    if (await db()) {
      await remove("carts", "cart_id", id);
      return;
    }
    const all = cachedRead<Record<string, any>>("carts");
    delete all[id];
    writeJson("carts", all);
  },
};

// ─── Sessions ───────────────────────────────────────────────────────────────

const SESSIONS_FILE = path.join(DATA_DIR, "sessions.json");

function readSessionsRaw(): Record<string, string> {
  try { return JSON.parse(fs.readFileSync(SESSIONS_FILE, "utf-8")); }
  catch { return {}; }
}

function writeSessionsRaw(s: Record<string, string>) {
  const tmp = SESSIONS_FILE + ".tmp." + process.pid;
  fs.writeFileSync(tmp, JSON.stringify(s, null, 2), "utf-8");
  fs.renameSync(tmp, SESSIONS_FILE);
}

export const sessions = {
  create: async (userId: string): Promise<string> => {
    const token = crypto.randomBytes(32).toString("hex");
    if (await db()) {
      await insert("sessions", { token, user_id: userId });
      return token;
    }
    const all = readSessionsRaw();
    all[token] = userId;
    writeSessionsRaw(all);
    return token;
  },
  getUserId: async (token: string): Promise<string | null> => {
    if (await db()) {
      const row = await getOne<any>("SELECT user_id FROM sessions WHERE token = ?", [token]);
      return row?.user_id || null;
    }
    const all = readSessionsRaw();
    return all[token] || null;
  },
  delete: async (token: string) => {
    if (await db()) {
      await remove("sessions", "token", token);
      return;
    }
    const all = readSessionsRaw();
    delete all[token];
    writeSessionsRaw(all);
  },
  set: async (token: string, userId: string) => {
    if (await db()) {
      await insert("sessions", { token, user_id: userId }).catch(() => {});
      return;
    }
    const all = readSessionsRaw();
    all[token] = userId;
    writeSessionsRaw(all);
  },
};

// ─── Auth helpers ───────────────────────────────────────────────────────────

export function hashPassword(password: string): string {
  return crypto.createHash("sha256").update(password).digest("hex");
}

const COOKIE_NAME = "boutiique_vastraa_customer_token";

export function getTokenFromRequest(request: Request): string | null {
  const url = new URL(request.url);
  const queryToken = url.searchParams.get("_token");
  if (queryToken) return queryToken;
  const cookieHeader = request.headers.get("cookie") || "";
  const match = cookieHeader.match(new RegExp(`(?:^|;\\s*)${COOKIE_NAME}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

export async function getAuthUser(request: Request): Promise<any> {
  const token = getTokenFromRequest(request);
  if (!token) return null;
  const userId = await sessions.getUserId(token);
  if (!userId) return null;
  return users.findById(userId);
}

export function generateId(): string {
  return `id_${Date.now()}_${crypto.randomBytes(4).toString("hex")}`;
}

function runJsonHousekeeping(): void {
  try {
    const allCarts = cachedRead<Record<string, any>>("carts");
    const now = Date.now();
    const DAY = 24 * 60 * 60 * 1000;
    let changed = false;
    for (const [id, cart] of Object.entries(allCarts)) {
      const t = new Date(cart.createdAt || cart.updatedAt || 0).getTime();
      if (now - t > DAY) { delete allCarts[id]; changed = true; }
    }
    if (changed) writeJson("carts", allCarts);

    const allSessions = readSessionsRaw();
    let sessChanged = false;
    for (const [token, uid] of Object.entries(allSessions)) {
      const userArr = cachedRead<any[]>("users");
      if (!userArr.find((u: any) => u.id === uid)) {
        delete allSessions[token];
        sessChanged = true;
      }
    }
    if (sessChanged) writeSessionsRaw(allSessions);
  } catch {}
}

// ─── Stock Notifications ────────────────────────────────────────────────────

export const stockNotifications = {
  all: async () => {
    if (await db()) {
      const rows = await query<any[]>("SELECT * FROM stock_notifications ORDER BY created_at DESC");
      return rows.map(mapStockNotificationFromDb);
    }
    return cachedRead<any[]>("stock_notifications").map(mapStockNotificationFromJson);
  },
  save: async (items: any[]) => {
    if (await db()) {
      const mapped = items.map(mapStockNotificationToDb);
      await replaceAll("stock_notifications", mapped);
      return;
    }
    writeJson("stock_notifications", items);
  },
};

function mapStockNotificationFromJson(n: any): any {
  if (!n) return null;
  return {
    ...n,
    notified: !!n.notified,
  };
}

function mapStockNotificationFromDb(row: any): any {
  return {
    id: row.id,
    productId: row.product_id,
    productHandle: row.product_handle,
    email: row.email,
    notified: !!row.notified,
    createdAt: row.created_at,
  };
}

function mapStockNotificationToDb(r: any): any {
  return {
    id: r.id,
    product_id: r.productId,
    product_handle: r.productHandle,
    email: r.email,
    notified: r.notified ?? false,
    created_at: r.createdAt || new Date().toISOString(),
  };
}

async function triggerStockNotifications(product: any) {
  try {
    const subs = await stockNotifications.all();
    const pending = subs.filter((s: any) => s.productId === product.id && !s.notified);
    if (pending.length === 0) return;

    const { sendBackInStockEmail } = await import("@/lib/services/email");
    const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || "https://boutiiquevastraa.com";
    const productUrl = `${siteUrl}/products/${product.handle}`;

    for (const sub of pending) {
      await sendBackInStockEmail(sub.email, product.title, productUrl);
      sub.notified = true;
    }

    await stockNotifications.save(subs);
    console.log(`[DataStore] Processed ${pending.length} stock notifications for "${product.title}"`);
  } catch (err: any) {
    console.error("[DataStore] triggerStockNotifications error:", err.message);
  }
}

// ─── Newsletter Subscribers ──────────────────────────────────────────────────

export const newsletterSubscribers = {
  all: async () => {
    if (await db()) {
      const rows = await query<any[]>("SELECT * FROM newsletter_subscribers ORDER BY created_at DESC");
      return rows.map((r: any) => ({
        id: r.id,
        email: r.email,
        createdAt: r.created_at || r.createdAt
      }));
    }
    return cachedRead<any[]>("newsletter_subscribers");
  },
  create: async (email: string) => {
    const cleanEmail = email.trim().toLowerCase();
    const all = await newsletterSubscribers.all();
    if (all.some((s: any) => s.email.toLowerCase() === cleanEmail)) {
      return { success: false, message: "Email is already subscribed to our newsletter." };
    }
    const item = {
      id: generateId(),
      email: cleanEmail,
      createdAt: new Date().toISOString()
    };
    if (await db()) {
      await insert("newsletter_subscribers", {
        id: item.id,
        email: item.email,
        created_at: item.createdAt
      });
    } else {
      all.push(item);
      writeJson("newsletter_subscribers", all);
    }
    return { success: true, item };
  }
};


import { NextRequest, NextResponse } from "next/server";
import fs from "fs";
import nodePath from "path";
import crypto from "crypto";
import {
  users, admins, products, collections, coupons, reviews, qna, orders, settings, carts,
  sessions, hashPassword, generateId, getAuthUser, getTokenFromRequest, initDataStore,
} from "@/lib/data-store";
import { ShiprocketService } from "@/lib/services/shiprocket";
import { PhonePeService } from "@/lib/services/phonepe";
import { sendOrderConfirmationEmail } from "@/lib/services/email";

// Initialise database / seed data on first load
let initialized = false;
async function ensureInit() {
  if (initialized) return;
  initialized = true;
  await initDataStore();
}

function json(data: any, status = 200) {
  return NextResponse.json(data, { status });
}

function error(msg: string, status = 400) {
  return NextResponse.json({ message: msg }, { status });
}

function parseBody(req: NextRequest): Promise<any> {
  return req.json().catch(() => null);
}

const COOKIE_NAME = "boutiique_vastraa_customer_token";

function setAuthCookie(token: string, req?: NextRequest) {
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toUTCString();
  const isSecure = req ? req.nextUrl.protocol === "https:" : false;
  return `${COOKIE_NAME}=${encodeURIComponent(token)}; expires=${expires}; path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;
}

function clearAuthCookie(req?: NextRequest) {
  const isSecure = req ? req.nextUrl.protocol === "https:" : false;
  return `${COOKIE_NAME}=; expires=Thu, 01 Jan 1970 00:00:00 GMT; path=/; SameSite=Lax${isSecure ? "; Secure" : ""}`;
}

// ─── Auth routes ─────────────────────────────────────────────────────────────

async function handleAuth(path: string[], req: NextRequest) {
  if (path[0] !== "auth") return null;

  const sub = path[1];

  if (sub === "register" && req.method === "POST") {
    const body = await parseBody(req);
    if (!body?.firstName || !body?.lastName || !body?.email || !body?.password)
      return error("All fields required");

    const existing = await users.findByEmail(body.email);
    if (existing) return error("Email already registered", 422);

    const user = {
      id: generateId(),
      firstName: body.firstName,
      lastName: body.lastName,
      email: body.email.toLowerCase(),
      passwordHash: hashPassword(body.password),
      createdAt: new Date().toISOString(),
    };
    await users.create(user);
    try {
      const { sendWelcomeEmail } = await import("@/lib/services/email");
      await sendWelcomeEmail(user);
    } catch (e: any) {
      console.error("Failed to send welcome email:", e.message);
    }
    const token = await sessions.create(user.id);
    return json({ token, user: { id: user.id, firstName: user.firstName, lastName: user.lastName, email: user.email } }, 201);
  }

  if (sub === "login" && req.method === "POST") {
    const body = await parseBody(req);
    if (!body?.email || !body?.password) return error("Email and password required");

    let user: any = await users.findByEmail(body.email);
    let isAdmin = false;

    // If the found user is the admin account, treat it as an admin login
    // (admin credentials are managed in admin.json / admin DB table, not users)
    if (user?.email === "admin@boutiiquevastraa.com") {
      user = null;
    }

    if (!user) {
      const uName = body.email.includes("@") ? body.email.split("@")[0] : body.email;
      const admin = await admins.findByUsername(body.email) || await admins.findByUsername(uName);
      const hash = hashPassword(body.password);
      if (admin && ((admin.passwordHash && admin.passwordHash === hash) || (admin.password && admin.password === hash))) {
        user = {
          id: "admin",
          firstName: "Admin",
          lastName: "",
          email: "admin@boutiiquevastraa.com",
          defaultAddress: null,
        };
        isAdmin = true;
      }
    } else {
      const hash = hashPassword(body.password);
      const pwOk = (!user.passwordHash && !user.password)
        || (user.passwordHash && user.passwordHash === hash)
        || (user.password && user.password === hash);
      if (!pwOk) {
        return error("Invalid credentials", 401);
      }
    }

    if (!user) return error("Invalid credentials", 401);

    const token = isAdmin ? "admin-token" : await sessions.create(user.id);
    if (isAdmin) {
      await sessions.set("admin-token", "admin");
    }

    const res = json({
      token,
      user: {
        id: user.id,
        firstName: user.firstName,
        lastName: user.lastName,
        email: user.email,
        phone: user.phone || "",
        defaultAddress: user.defaultAddress || null,
        cartId: user.cartId || null,
        wishlist: user.wishlist || null,
      },
    });
    res.headers.set("Set-Cookie", setAuthCookie(token, req));
    return res;
  }

  if (sub === "google" && req.method === "POST") {
    const body = await parseBody(req);
    const idToken = body?.idToken;
    if (!idToken) return error("Google ID token is required");

    try {
      const verifyRes = await fetch(`https://oauth2.googleapis.com/tokeninfo?id_token=${idToken}`);
      if (!verifyRes.ok) {
        return error("Invalid Google ID token", 401);
      }
      
      const payload = await verifyRes.json();
      const expectedAudience = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID;
      
      if (payload.aud !== expectedAudience) {
        console.warn(`[Google Auth] Audience mismatch: expected ${expectedAudience}, got ${payload.aud}`);
        return error("Unauthorized: Audience mismatch", 401);
      }

      const email = payload.email?.toLowerCase();
      if (!email) {
        return error("Email address not provided by Google account", 400);
      }

      const firstName = payload.given_name || "Customer";
      const lastName = payload.family_name || "";
      const googleId = payload.sub;

      let user = await users.findByEmail(email);
      if (!user) {
        const randomPassword = crypto.randomBytes(16).toString("hex");
        user = {
          id: generateId(),
          firstName,
          lastName,
          email,
          passwordHash: hashPassword(randomPassword),
          googleId,
          createdAt: new Date().toISOString(),
        };
        await users.create(user);
        try {
          const { sendWelcomeEmail } = await import("@/lib/services/email");
          await sendWelcomeEmail(user);
        } catch (e: any) {
          console.error("Failed to send welcome email on Google signup:", e.message);
        }
        console.log(`[Google Auth] Created new user: ${email}`);
      } else {
        if (!user.googleId) {
          await users.update(user.id, { googleId });
        }
        console.log(`[Google Auth] Existing user signed in: ${email}`);
      }

      const token = await sessions.create(user.id);
      const res = json({
        token,
        user: {
          id: user.id,
          firstName: user.firstName,
          lastName: user.lastName,
          email: user.email,
          phone: user.phone || "",
          defaultAddress: user.defaultAddress || null,
          cartId: user.cartId || null,
          wishlist: user.wishlist || null,
        },
      });
      res.headers.set("Set-Cookie", setAuthCookie(token, req));
      return res;
    } catch (err: any) {
      console.error("[Google Auth Error]:", err.message);
      return error("Internal server error during Google authentication", 500);
    }
  }

  if (sub === "logout" && req.method === "POST") {
    const token = getTokenFromRequest(req);
    if (token) await sessions.delete(token);
    const res = json({ success: true });
    res.headers.set("Set-Cookie", clearAuthCookie(req));
    return res;
  }

  if (sub === "me" && req.method === "GET") {
    const token = getTokenFromRequest(req);
    let user = await getAuthUser(req);
    if (!user && token === "admin-token") {
      user = { id: "admin", firstName: "Admin", lastName: "", email: "admin@boutiiquevastraa.com", phone: "", defaultAddress: null };
    }
    if (!user) return error("Unauthorized", 401);
    const allOrders = await orders.all();
    const userOrders = allOrders
      .filter((o: any) => o.email?.toLowerCase() === user.email?.toLowerCase())
      .sort((a: any, b: any) => {
        const tA = new Date(a.processedAt || a.createdAt || 0).getTime();
        const tB = new Date(b.processedAt || b.createdAt || 0).getTime();
        return tB - tA;
      });
    return json({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      email: user.email,
      phone: user.phone || "",
      defaultAddress: user.defaultAddress || null,
      cartId: user.cartId || null,
      wishlist: user.wishlist || null,
      orders: { edges: userOrders.map((o: any) => ({ node: o })) },
    });
  }

  if (path[1] === "me" && path[2] === "address" && req.method === "PUT") {
    const user = await getAuthUser(req);
    if (!user) return error("Unauthorized", 401);
    const body = await parseBody(req);
    if (!body) return error("Invalid request body");
    
    let defaultAddressData: any = null;
    if (body.addresses && Array.isArray(body.addresses)) {
      defaultAddressData = { addresses: body.addresses };
    } else {
      defaultAddressData = {
        address1: body.address1 || "",
        address2: body.address2 || "",
        city: body.city || "",
        province: body.province || "",
        zip: body.zip || "",
        country: body.country || "India",
        phone: body.phone || user.phone || "",
      };
    }
    await users.update(user.id, { defaultAddress: defaultAddressData });
    return json({ success: true, defaultAddress: defaultAddressData });
  }

  if (path[1] === "me" && path[2] === "wishlist" && req.method === "PUT") {
    const user = await getAuthUser(req);
    if (!user) return error("Unauthorized", 401);
    const body = await parseBody(req);
    if (!body) return error("Invalid request body");
    
    const wishlist = body.wishlist || [];
    await users.update(user.id, { wishlist });
    return json({ success: true, wishlist });
  }

  if (path[1] === "me" && path[2] === "sync" && req.method === "PUT") {
    const user = await getAuthUser(req);
    if (!user) return error("Unauthorized", 401);
    const body = await parseBody(req);
    
    // 1. Merge Wishlist
    const clientWishlist = body?.wishlist || [];
    const savedWishlist = user.wishlist || [];
    
    const mergedWishlist = [...savedWishlist];
    for (const item of clientWishlist) {
      if (!mergedWishlist.some((w: any) => w.id === item.id)) {
        mergedWishlist.push(item);
      }
    }
    
    // 2. Merge Cart
    const clientCartId = body?.cartId;
    let finalCartId = user.cartId || clientCartId;
    
    if (clientCartId && user.cartId && clientCartId !== user.cartId) {
      // Merge guest cart into user account cart
      const guestCart = await carts.get(clientCartId);
      const accountCart = await carts.get(user.cartId);
      
      if (guestCart && accountCart) {
        const mergedLines = [...(accountCart.lines || [])];
        for (const gLine of (guestCart.lines || [])) {
          const existingLineIdx = mergedLines.findIndex((l: any) => l.merchandiseId === gLine.merchandiseId);
          if (existingLineIdx >= 0) {
            mergedLines[existingLineIdx].quantity += gLine.quantity;
          } else {
            mergedLines.push(gLine);
          }
        }
        accountCart.lines = mergedLines;
        accountCart.updatedAt = new Date().toISOString();
        await carts.save(user.cartId, accountCart);
        
        // Delete the guest cart
        try {
          await carts.remove(clientCartId);
        } catch {}
      } else if (guestCart && !accountCart) {
        // Account cart deleted or missing, fallback to guest cart
        finalCartId = clientCartId;
      }
    } else if (clientCartId && !user.cartId) {
      // Set client guest cart as user's cart
      finalCartId = clientCartId;
    }
    
    // Update user profile with final references
    await users.update(user.id, {
      cartId: finalCartId || null,
      wishlist: mergedWishlist,
    });
    
    // Fetch and format final cart
    let finalCart = null;
    if (finalCartId) {
      const rawCart = await carts.get(finalCartId);
      if (rawCart) {
        finalCart = formatCartCheckout(rawCart);
      }
    }
    
    return json({
      success: true,
      cartId: finalCartId || null,
      cart: finalCart,
      wishlist: mergedWishlist,
    });
  }

  return error("Not found", 404);
}

// ─── Product routes ──────────────────────────────────────────────────────────

async function handleProducts(path: string[], req: NextRequest) {
  if (path[0] !== "products") return null;

  if (path.length === 1 && req.method === "GET") {
    const url = new URL(req.url);
    const perPage = parseInt(url.searchParams.get("per_page") || "50");
    const all = await products.all();
    return json(all.slice(0, perPage));
  }

  if (path[1] === "search" && req.method === "GET") {
    const url = new URL(req.url);
    const q = url.searchParams.get("q")?.toLowerCase() || "";
    const all = await products.all();
    return json(all.filter((p: any) => p.title?.toLowerCase().includes(q)));
  }

  if (path.length === 2 && req.method === "GET") {
    const item = await products.findByHandle(path[1]) || await products.findById(path[1]);
    if (!item) return error("Not found", 404);
    return json(item);
  }

  if (path.length === 3 && path[2] === "recommendations" && req.method === "GET") {
    const productId = path[1];
    const all = await products.all();
    const currentProduct = all.find((p: any) => p.id === productId);
    if (!currentProduct) return error("Not found", 404);
    let others = all.filter((p: any) => p.id !== productId);
    
    const getProductCoreCategory = (p: any) => {
      const title = (p.title || "").toLowerCase();
      const tags = (Array.isArray(p.tags) ? p.tags : []).map((t: any) => String(t).toLowerCase());
      const colHandles: string[] = (
        Array.isArray(p.collectionHandles)
          ? p.collectionHandles
          : Array.isArray(p.collections)
          ? p.collections
          : []
      ).map((c: any) => typeof c === "string" ? c.toLowerCase() : c.handle?.toLowerCase() || "");

      const hasWord = (word: string) => {
        return title.includes(word) || tags.includes(word) || colHandles.includes(word);
      };

      if (hasWord("saree") || hasWord("sarees") || title.includes("saree") || colHandles.some((c: string) => c.includes("saree"))) return "saree";
      if (hasWord("kurti") || hasWord("kurtis") || title.includes("kurti") || colHandles.some((c: string) => c.includes("kurti"))) return "kurti";
      if (hasWord("one-peace") || hasWord("one peace") || hasWord("onepiece") || title.includes("one peace")) return "one-peace";
      if (hasWord("two-peace") || hasWord("two peace") || hasWord("twopiece") || title.includes("two peace")) return "two-peace";
      if (hasWord("co-ords") || hasWord("coord") || hasWord("co-ord") || title.includes("coord")) return "co-ords";
      if (hasWord("lehenga") || hasWord("lehengas") || title.includes("lehenga") || colHandles.some((c: string) => c.includes("lehenga"))) return "lehenga";
      if (hasWord("jewellery") || hasWord("jewelry") || hasWord("jewel") || title.includes("jewel") || colHandles.some((c: string) => c.includes("jewel"))) return "jewellery";

      return null;
    };

    const openedCategory = getProductCoreCategory(currentProduct);
    if (openedCategory) {
      // Step 1: Must be in same core category
      others = others.filter((p: any) => getProductCoreCategory(p) === openedCategory);

      // Step 2: Strong matching on fabrics and style keywords
      const currentText = `${currentProduct.title || ""} ${currentProduct.description || ""} ${(Array.isArray(currentProduct.tags) ? currentProduct.tags : []).join(" ")}`.toLowerCase();
      
      const fabrics = ["silk", "organza", "cotton", "linen", "georgette", "chiffon", "rayon", "tissue", "net", "velvet"];
      const styles = ["banarasi", "kanjivaram", "chanderi", "bandhani", "chikankari", "patola", "kalamkari", "ajrakh", "jamdani", "leheriya", "embroidered", "printed", "handloom", "woven"];
      const jewelleryItems = ["necklace", "earring", "bangle", "ring", "choker", "pendant"];

      const activeFabrics = fabrics.filter(f => currentText.includes(f));
      const activeStyles = styles.filter(s => currentText.includes(s));
      const activeJewellery = jewelleryItems.filter(j => currentText.includes(j));

      // Score and Filter
      let scoredOthers = others.map((p: any) => {
        const pText = `${p.title || ""} ${p.description || ""} ${(Array.isArray(p.tags) ? p.tags : []).join(" ")}`.toLowerCase();
        let score = 0;

        // Fabric constraint
        if (activeFabrics.length > 0) {
          const hasMatchingFabric = activeFabrics.some(f => pText.includes(f));
          if (!hasMatchingFabric) return { product: p, score: -1 };
        }

        // Jewel constraint
        if (openedCategory === "jewellery" && activeJewellery.length > 0) {
          const hasMatchingJewel = activeJewellery.some(j => pText.includes(j));
          if (!hasMatchingJewel) return { product: p, score: -1 };
        }

        // Style bonus
        activeStyles.forEach(s => {
          if (pText.includes(s)) score += 2;
        });

        // Fabric overlap bonus
        activeFabrics.forEach(f => {
          if (pText.includes(f)) score += 1;
        });

        return { product: p, score };
      });

      let finalCandidates = scoredOthers.filter(o => o.score >= 0);
      if (finalCandidates.length === 0) {
        finalCandidates = others.map((p: any) => ({ product: p, score: 0 }));
      }

      finalCandidates.sort((a, b) => b.score - a.score);
      others = finalCandidates.map(c => c.product);
    }
    
    return json(others.slice(0, 8));
  }

  return error("Not found", 404);
}

// ─── Collection routes ────────────────────────────────────────────────────────

async function handleCollections(path: string[], req: NextRequest) {
  if (path[0] !== "collections") return null;

  if (path.length === 1 && req.method === "GET") {
    const url = new URL(req.url);
    const first = parseInt(url.searchParams.get("first") || "20");
    const all = await collections.all();
    return json(all.slice(0, first));
  }

  if (path.length === 2 && req.method === "GET") {
    const handle = path[1];
    const url = new URL(req.url);
    const first = parseInt(url.searchParams.get("first") || "24");
    const after = url.searchParams.get("after") || null;
    const filterParam = url.searchParams.get("filter");
    let activeFilters: any[] = [];
    if (filterParam) {
      try {
        activeFilters = JSON.parse(filterParam);
      } catch (e) {
        console.error("Failed to parse filter param in API:", e);
      }
    }
    const sortKey = url.searchParams.get("sort") || "COLLECTION_DEFAULT";
    const reverse = url.searchParams.get("reverse") === "true";

    const all = await products.all();

    let item: any = null;
    let colProducts: any[] = [];

    if (handle === "all") {
      item = {
        id: "all",
        title: "All Products",
        handle: "all",
        description: "Browse our complete collection of handcrafted ethnic wear.",
        image: null,
      };
      colProducts = all;
    } else {
      item = await collections.findByHandle(handle);
      if (!item) return error("Not found", 404);

      const decoded = decodeURIComponent(handle);
      const slugified = decoded.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
      colProducts = all.filter((p: any) => {
        const colHandles: string[] = Array.isArray(p.collectionHandles)
          ? p.collectionHandles
          : Array.isArray(p.collections)
          ? p.collections
          : [];
        return colHandles.includes(handle) || 
               colHandles.includes(decoded) || 
               colHandles.includes(slugified) || 
               (item && (colHandles.includes(item.id) || colHandles.includes(item.handle)));
      });
    }

    // 1. Calculate dynamic filter options based on unfiltered collection products
    let inStockCount = 0;
    let outOfStockCount = 0;
    colProducts.forEach((p: any) => {
      const isAvail = p.inventory === null || p.inventory === undefined || Number(p.inventory) > 0;
      if (isAvail) inStockCount++;
      else outOfStockCount++;
    });

    let price1 = 0;
    let price2 = 0;
    let price3 = 0;
    let price4 = 0;
    colProducts.forEach((p: any) => {
      const price = parseFloat(p.priceRange?.minVariantPrice?.amount || "0");
      if (price < 1000) price1++;
      else if (price >= 1000 && price < 2000) price2++;
      else if (price >= 2000 && price < 5000) price3++;
      else price4++;
    });

    const tagCounts: Record<string, number> = {};
    colProducts.forEach((p: any) => {
      if (Array.isArray(p.tags)) {
        p.tags.forEach((tag: string) => {
          const cleaned = tag.trim();
          if (cleaned) {
            const lower = cleaned.toLowerCase();
            tagCounts[lower] = (tagCounts[lower] || 0) + 1;
          }
        });
      }
    });

    const generatedFilters: any[] = [];
    generatedFilters.push({
      id: "filter.v.availability",
      label: "Availability",
      type: "LIST",
      values: [
        {
          id: "filter.v.availability.1",
          label: "In Stock",
          count: inStockCount,
          input: JSON.stringify({ available: true })
        },
        {
          id: "filter.v.availability.2",
          label: "Out of Stock",
          count: outOfStockCount,
          input: JSON.stringify({ available: false })
        }
      ]
    });

    generatedFilters.push({
      id: "filter.v.price",
      label: "Price",
      type: "PRICE_RANGE",
      values: [
        {
          id: "filter.v.price.1",
          label: "Under ₹1,000",
          count: price1,
          input: JSON.stringify({ price: { max: 1000 } })
        },
        {
          id: "filter.v.price.2",
          label: "₹1,000 - ₹2,000",
          count: price2,
          input: JSON.stringify({ price: { min: 1000, max: 2000 } })
        },
        {
          id: "filter.v.price.3",
          label: "₹2,000 - ₹5,000",
          count: price3,
          input: JSON.stringify({ price: { min: 2000, max: 5000 } })
        },
        {
          id: "filter.v.price.4",
          label: "₹5,000 & Above",
          count: price4,
          input: JSON.stringify({ price: { min: 5000 } })
        }
      ]
    });

    const sortedTags = Object.entries(tagCounts)
      .filter(([_, count]) => count > 0)
      .sort((a, b) => b[1] - a[1]);

    if (sortedTags.length > 0) {
      generatedFilters.push({
        id: "filter.v.tag",
        label: "Product Tag",
        type: "LIST",
        values: sortedTags.map(([tag, count], idx) => ({
          id: `filter.v.tag.${idx + 1}`,
          label: tag.charAt(0).toUpperCase() + tag.slice(1),
          count,
          input: JSON.stringify({ tag })
        }))
      });
    }

    // 2. Apply active filters
    let filteredProducts = [...colProducts];
    if (activeFilters && activeFilters.length > 0) {
      filteredProducts = filteredProducts.filter((p: any) => {
        const availabilityFilters = activeFilters.filter(f => f.available !== undefined);
        const priceFilters = activeFilters.filter(f => f.price !== undefined);
        const tagFilters = activeFilters.filter(f => f.tag !== undefined);

        if (availabilityFilters.length > 0) {
          const isAvail = p.inventory === null || p.inventory === undefined || Number(p.inventory) > 0;
          const matchesAny = availabilityFilters.some(f => isAvail === f.available);
          if (!matchesAny) return false;
        }

        if (priceFilters.length > 0) {
          const price = parseFloat(p.priceRange?.minVariantPrice?.amount || "0");
          const matchesAny = priceFilters.some(f => {
            const min = f.price.min ?? 0;
            const max = f.price.max ?? Infinity;
            return price >= min && price <= max;
          });
          if (!matchesAny) return false;
        }

        if (tagFilters.length > 0) {
          const pTags = (p.tags || []).map((t: string) => t.toLowerCase());
          const matchesAny = tagFilters.some(f => pTags.includes(f.tag.toLowerCase()));
          if (!matchesAny) return false;
        }

        return true;
      });
    }

    // 3. Apply sorting
    if (sortKey === "PRICE") {
      filteredProducts.sort((a, b) => {
        const priceA = parseFloat(a.priceRange?.minVariantPrice?.amount || "0");
        const priceB = parseFloat(b.priceRange?.minVariantPrice?.amount || "0");
        return reverse ? priceB - priceA : priceA - priceB;
      });
    } else if (sortKey === "CREATED_AT") {
      if (reverse) {
        filteredProducts.reverse();
      }
    } else if (sortKey === "BEST_SELLING") {
      filteredProducts.sort((a, b) => (b.inventory || 0) - (a.inventory || 0));
    }

    // 4. Apply pagination
    let startIndex = 0;
    if (after) {
      const idx = filteredProducts.findIndex((p: any) => p.id === after);
      if (idx >= 0) {
        startIndex = idx + 1;
      }
    }
    const paginatedProducts = filteredProducts.slice(startIndex, startIndex + first);
    const hasNextPage = filteredProducts.length > startIndex + first;
    const endCursor = paginatedProducts.length > 0 ? paginatedProducts[paginatedProducts.length - 1].id : "";

    return json({
      ...item,
      products: {
        edges: paginatedProducts.map((p: any) => ({ node: p })),
        filters: generatedFilters,
        pageInfo: { hasNextPage, endCursor },
      },
    });
  }

  return error("Not found", 404);
}

// ─── Cart routes ──────────────────────────────────────────────────────────────

async function handleCart(path: string[], req: NextRequest) {
  if (path[0] !== "cart") return null;

  if (path.length === 1 && req.method === "POST") {
    const body = await parseBody(req);
    const cartId = generateId();
    const allProducts = await products.all();
    const siteSettings = await settings.get() || {};
    const gifts = siteSettings.gifts || [];
    const rawLines = body?.lines?.map((l: any, i: number) => {
      const info = resolveProductInfo(l.merchandiseId, allProducts, gifts);
      if (l.selectedSize) {
        info.variantTitle = l.selectedSize;
      }
      return {
        id: `${cartId}-line-${i}`,
        merchandiseId: l.merchandiseId,
        quantity: l.quantity || 1,
        isGift: !!l.isGift,
        ...info,
      };
    }) || [];

    const lines: any[] = [];
    for (const rawLine of rawLines) {
      const existingIdx = lines.findIndex((item: any) =>
        item.merchandiseId === rawLine.merchandiseId &&
        item.variantTitle === rawLine.variantTitle &&
        !!item.isGift === !!rawLine.isGift
      );
      if (existingIdx >= 0) {
        lines[existingIdx].quantity += rawLine.quantity;
      } else {
        lines.push(rawLine);
      }
    }

    const cart = {
      id: cartId,
      lines,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    await carts.save(cartId, cart);
    const user = await getAuthUser(req);
    if (user) {
      await users.update(user.id, { cartId });
    }
    return json(formatCartCheckout(cart), 201);
  }

  if (path.length === 2 && req.method === "GET") {
    const cart = await carts.get(path[1]);
    if (!cart) return error("Not found", 404);
    return json(formatCartCheckout(cart));
  }

  if (path.length === 3 && path[2] === "lines") {
    const cart = await carts.get(path[1]);
    if (!cart) return error("Not found", 404);

    if (req.method === "POST") {
      const body = await parseBody(req);
      const allProducts = await products.all();
      const siteSettings = await settings.get() || {};
      const gifts = siteSettings.gifts || [];
      const newLines = body?.lines?.map((l: any, i: number) => {
        const info = resolveProductInfo(l.merchandiseId, allProducts, gifts);
        if (l.selectedSize) {
          info.variantTitle = l.selectedSize;
        }
        return {
          id: `${cart.id}-line-${Date.now()}-${i}`,
          merchandiseId: l.merchandiseId,
          quantity: l.quantity || 1,
          isGift: !!l.isGift,
          ...info,
        };
      }) || [];

      for (const newLine of newLines) {
        const existingIdx = cart.lines.findIndex((item: any) =>
          item.merchandiseId === newLine.merchandiseId &&
          item.variantTitle === newLine.variantTitle &&
          !!item.isGift === !!newLine.isGift
        );
        if (existingIdx >= 0) {
          cart.lines[existingIdx].quantity += newLine.quantity;
        } else {
          cart.lines.push(newLine);
        }
      }

      cart.updatedAt = new Date().toISOString();
      await carts.save(path[1], cart);
      return json(formatCartCheckout(cart));
    }

    if (req.method === "PUT") {
      const body = await parseBody(req);
      if (body?.lines) {
        for (const ln of body.lines) {
          const idx = cart.lines.findIndex((l: any) => l.id === ln.id);
          if (idx >= 0) {
            cart.lines[idx].quantity = ln.quantity;
            if (ln.isGift !== undefined) {
              cart.lines[idx].isGift = !!ln.isGift;
            }
          }
        }
        cart.updatedAt = new Date().toISOString();
        await carts.save(path[1], cart);
      }
      return json(formatCartCheckout(cart));
    }

    if (req.method === "DELETE") {
      const url = new URL(req.url);
      const lineIds = JSON.parse(url.searchParams.get("lineIds") || "[]");
      cart.lines = cart.lines.filter((l: any) => !lineIds.includes(l.id));
      cart.updatedAt = new Date().toISOString();
      await carts.save(path[1], cart);
      return json(formatCartCheckout(cart));
    }
  }

  return error("Not found", 404);
}

function resolveProductInfo(merchandiseId: string, allProducts: any[], gifts: any[] = []) {
  const all = allProducts;
  const prod = all.find((p: any) =>
    p.id === merchandiseId ||
    p.variants?.edges?.some((e: any) => e.node.id === merchandiseId)
  );
  if (prod) {
    const variant = prod.variants?.edges?.find((e: any) => e.node.id === merchandiseId)?.node || prod.variants?.edges?.[0]?.node;
    return {
      title: prod.title,
      handle: prod.handle || "",
      price: variant?.price?.amount || prod.priceRange?.minVariantPrice?.amount || "0",
      image: variant?.image?.url || prod.images?.edges?.[0]?.node?.url || null,
      variantTitle: variant?.title || "Default Title",
    };
  }

  // Fallback to settings gifts list
  const gift = gifts.find((g: any) => g.variantId === merchandiseId || g.id === merchandiseId);
  if (gift) {
    return {
      title: gift.title,
      handle: gift.handle || "",
      price: "0",
      image: gift.image || null,
      variantTitle: "Default Title",
    };
  }

  return { title: "Unknown", handle: "", price: "0", image: null, variantTitle: "Default" };
}

function formatCartCheckout(cart: any) {
  let subtotal = 0;
  const lines = (cart.lines || []).map((l: any) => {
    const isGift = !!l.isGift;
    const price = isGift ? 0 : parseFloat(l.price || "0");
    subtotal += price * l.quantity;
    return {
      id: l.id,
      title: l.title,
      variantTitle: l.variantTitle,
      quantity: l.quantity,
      price: price.toString(),
      image: l.image,
      isGift,
      handle: l.handle || "",
    };
  });
  return {
    id: cart.id,
    lines,
    subtotal: subtotal.toFixed(2),
    totalQuantity: lines.reduce((s: number, l: any) => s + l.quantity, 0),
    checkoutUrl: `/checkout?cartId=${cart.id}`,
  };
}

// ─── Order routes ─────────────────────────────────────────────────────────────

async function handleOrders(path: string[], req: NextRequest) {
  if (path[0] !== "orders") return null;

  if (path.length === 1 && req.method === "POST") {
    const body = await parseBody(req);
    if (!body?.cart_id && !body?.lines) return error("Cart ID or line items required");

    // Try to load cart from DB; fall back to lines sent in body (cart data from frontend)
    let formatted: { lines: any[]; subtotal: string } | null = null;
    const cart = body.cart_id ? await carts.get(body.cart_id) : null;

    if (cart) {
      formatted = formatCartCheckout(cart);
    } else if (Array.isArray(body.lines) && body.lines.length > 0) {
      // Fallback: use cart lines passed directly from the frontend
      formatted = {
        lines: body.lines,
        subtotal: body.subtotal || body.lines.reduce((s: number, l: any) => s + parseFloat(l.price || "0") * (l.quantity || 1), 0).toFixed(2),
      };
    } else {
      return error("Cart not found", 404);
    }

    const orderId = generateId();
    const orderNumber = Math.floor(10000 + Math.random() * 89999);
    const isRazorpay = (body.paymentMethod || "COD") === "RAZORPAY";

    // Server-side coupon/discount validation — never trust the client
    let verifiedDiscount = 0;
    if (body.promoCode && body.discount > 0) {
      const existingCoupon = await coupons.findByCode(body.promoCode);
      if (existingCoupon && existingCoupon.active) {
        const subtotal = parseFloat(formatted.subtotal);
        if (existingCoupon.type === "percentage") {
          verifiedDiscount = subtotal * (parseFloat(existingCoupon.value) / 100);
        } else {
          verifiedDiscount = parseFloat(existingCoupon.value);
        }
        verifiedDiscount = Math.min(verifiedDiscount, subtotal);
        verifiedDiscount = Math.round(verifiedDiscount * 100) / 100;
      }
    }
    const totalAmount = (parseFloat(formatted.subtotal) - verifiedDiscount);

    // ─── Inventory Check & Deduction ─────────────────────────────────
    const allProducts = await products.all();
    const updatedProducts = [...allProducts];
    for (const line of formatted.lines) {
      const lookupId = line.merchandiseId || line.id;
      const product = updatedProducts.find((p: any) =>
        p.id === lookupId ||
        p.variants?.edges?.some((e: any) => e.node.id === lookupId)
      );
      if (!product) continue;

      const qty = parseInt(line.quantity) || 1;
      const inv = product.inventory !== null && product.inventory !== undefined ? Number(product.inventory) : null;

      if (inv !== null && inv < qty) {
        return error(
          `Insufficient stock for "${product.title}". Only ${inv > 0 ? inv : 0} left, you ordered ${qty}.`,
          409
        );
      }

      if (inv !== null) {
        product.inventory = inv - qty;
        if (product.inventory <= 0) {
          product.inventory = 0;
          product.availableForSale = false;
        }
      }
    }
    await products.save(updatedProducts);

    const order = {
      id: orderId,
      orderNumber,
      customerName: `${body.firstName} ${body.lastName}`,
      email: body.email,
      phone: body.phone,
      customer: {
        name: `${body.firstName} ${body.lastName}`,
        firstName: body.firstName,
        lastName: body.lastName,
        phone: body.phone,
        email: body.email,
      },
      shippingAddress: body.shippingAddress || {},
      paymentMethod: body.paymentMethod || "COD",
      lineItems: formatted.lines,
      items: formatted.lines,
      totalPrice: { amount: Math.max(0, totalAmount).toFixed(2), currencyCode: "INR" },
      couponCode: body.promoCode || null,
      discount: verifiedDiscount,
      fulfillmentStatus: "UNFULFILLED",
      // Razorpay orders start PENDING; COD orders start UNPAID but fulfilled immediately
      financialStatus: isRazorpay ? "PENDING" : "UNPAID",
      inventoryReserved: true,
      processedAt: new Date().toISOString(),
      createdAt: new Date().toISOString(),
      paymentEvents: [],
    };

    const all = await orders.all();
    all.push(order);
    
    if (!isRazorpay) {
      (order as any).emailSent = true;
      await orders.save(all);
      try {
        await sendOrderConfirmationEmail(order);
      } catch (emailErr: any) {
        console.error(`[COD Order Email Error] Order #${order.orderNumber}:`, emailErr.message);
      }
    } else {
      await orders.save(all);
    }

    // Only remove cart for COD (order complete). Keep cart for RAZORPAY until payment verified.
    if (!isRazorpay && body.cart_id && cart) {
      await carts.remove(body.cart_id);
    }

    // Auto-trigger Shiprocket for COD orders only
    if (process.env.SHIPROCKET_AUTO_CREATE_SHIPMENT === "true" && !isRazorpay) {
      try {
        await ShiprocketService.bookShipmentForOrder(order.id);
      } catch (err) {
        console.error(`[Shiprocket Auto-Create Error] Order #VSTR-${order.orderNumber}:`, err);
      }
    }

    return json({ id: order.id, orderNumber: order.orderNumber }, 201);
  }

  if (path[1] === "track" && req.method === "GET") {
    const url = new URL(req.url);
    const orderNumber = url.searchParams.get("order_number");
    const email = url.searchParams.get("email");
    if (!orderNumber || !email) return error("Order number and email required");

    const normalizeOrderNumber = (numStr: string) => {
      return numStr.trim().replace(/^#/, "").replace(/^VSTR-/, "").replace(/^#VSTR-/, "").trim();
    };

    const normalizedInput = normalizeOrderNumber(orderNumber);
    const all = await orders.all();
    const order = all.find((o: any) => {
      const dbNum = normalizeOrderNumber(String(o.orderNumber || ""));
      return dbNum === normalizedInput && o.email?.toLowerCase() === email.toLowerCase();
    });
    if (!order) return error("Not found", 404);
    return json(order);
  }

  return error("Not found", 404);
}

// ─── Coupon routes ────────────────────────────────────────────────────────────

async function handleCoupons(path: string[], req: NextRequest) {
  if (path[0] !== "coupons") return null;

  if (path[1] === "validate" && req.method === "POST") {
    const body = await parseBody(req);
    if (!body?.code) return error("Code required");

    const coupon = await coupons.findByCode(body.code);
    if (!coupon || !coupon.active) return error("Invalid or expired promo code", 404);

    const subtotal = parseFloat(body.cart_subtotal || "0");
    let discountAmount = 0;
    if (coupon.type === "percentage") {
      discountAmount = subtotal * (parseFloat(coupon.value) / 100);
    } else {
      discountAmount = parseFloat(coupon.value);
    }
    discountAmount = Math.min(discountAmount, subtotal);

    return json({
      code: coupon.code,
      type: coupon.type,
      value: coupon.value,
      discountAmount: Math.round(discountAmount * 100) / 100,
    });
  }

  return error("Not found", 404);
}

// ─── Review routes ────────────────────────────────────────────────────────────

async function handleReviews(path: string[], req: NextRequest) {
  if (path[0] !== "reviews") return null;

  if (path.length === 1 && req.method === "GET") {
    const all = await reviews.all();
    return json(all);
  }

  if (path[1] === "global" && req.method === "GET") {
    const all = await reviews.all();
    const filtered = all.filter((r: any) => r.approved !== false);
    return json(filtered);
  }

  if (path.length === 1 && req.method === "POST") {
    const body = await parseBody(req);
    if (!body?.productId || !body?.author || !body?.comment) return error("Missing fields");

    const user = await getAuthUser(req);
    if (!user) return error("You must be logged in to leave a review.", 401);

    // Verify purchase
    const allOrders = await orders.all();
    const userOrders = allOrders.filter((o: any) => o.email?.toLowerCase() === user.email?.toLowerCase());
    let hasPurchased = false;
    const targetIdOrHandle = body.productId;

    for (const order of userOrders) {
      const itemsList = order.lineItems?.edges?.map((e: any) => e.node) || order.lineItems || order.items || [];
      for (const item of itemsList) {
        const matchId = String(item.merchandiseId || item.id || "");
        const matchHandle = String(item.productHandle || "");
        const matchTitle = String(item.title || "").toLowerCase();

        if (
          matchId === targetIdOrHandle ||
          matchHandle.toLowerCase() === targetIdOrHandle.toLowerCase() ||
          matchTitle === targetIdOrHandle.toLowerCase()
        ) {
          hasPurchased = true;
          break;
        }
      }
      if (hasPurchased) break;
    }

    if (!hasPurchased) {
      return error("Only verified buyers who have purchased this product can write a review.", 403);
    }

    const review = {
      id: generateId(),
      productHandle: body.productId,
      author: body.author,
      email: body.email || user.email,
      rating: body.rating || 5,
      comment: body.comment,
      approved: false,
      createdAt: new Date().toISOString(),
    };
    const all = await reviews.all();
    all.push(review);
    await reviews.save(all);
    return json(review, 201);
  }

  return error("Not found", 404);
}

// ─── Q&A routes ────────────────────────────────────────────────────────────────

async function handleQna(path: string[], req: NextRequest) {
  if (path[0] !== "qna") return null;

  if (path.length === 1 && req.method === "GET") {
    const all = await qna.all();
    return json(all);
  }

  if (path.length === 1 && req.method === "POST") {
    const body = await parseBody(req);
    if (!body?.productHandle || !body?.author || !body?.question) return error("Missing fields");

    const item = {
      id: generateId(),
      productHandle: body.productHandle,
      author: body.author,
      email: body.email || "",
      question: body.question,
      answer: null,
      approved: false,
      createdAt: new Date().toISOString(),
    };
    const all = await qna.all();
    all.push(item);
    await qna.save(all);
    return json(item, 201);
  }

  return error("Not found", 404);
}

// ─── Notify Me routes ─────────────────────────────────────────────────────────

async function handleNotifyMe(path: string[], req: NextRequest) {
  if (path[0] !== "notify-me") return null;

  if (req.method === "POST") {
    const body = await parseBody(req);
    const { email, productId, productHandle } = body || {};
    if (!email || !productId) {
      return error("Email and Product ID are required");
    }

    const { stockNotifications, generateId } = await import("@/lib/data-store");
    const all = await stockNotifications.all();
    
    // Check if subscription already exists
    const exists = all.some(
      (n: any) => n.email.toLowerCase() === email.toLowerCase() && n.productId === productId && !n.notified
    );

    if (exists) {
      return json({ success: true, message: "You are already subscribed to notifications for this product." });
    }

    const newSub = {
      id: generateId(),
      productId,
      productHandle: productHandle || "",
      email: email.toLowerCase(),
      notified: false,
      createdAt: new Date().toISOString(),
    };

    all.push(newSub);
    await stockNotifications.save(all);
    return json({ success: true, message: "Subscription added successfully." });
  }

  return error("Not found", 404);
}

// ─── Newsletter Subscription routes ──────────────────────────────────────────

async function handleNewsletterSubscribe(path: string[], req: NextRequest) {
  if (path[0] !== "newsletter" || path[1] !== "subscribe") return null;

  if (req.method === "POST") {
    const body = await parseBody(req);
    const { email } = body || {};
    if (!email || !email.includes("@")) {
      return error("A valid email address is required");
    }

    const { newsletterSubscribers } = await import("@/lib/data-store");
    const result = await newsletterSubscribers.create(email);
    if (!result.success) {
      return error(result.message || "Failed to subscribe", 400);
    }

    try {
      const { sendNewsletterWelcomeEmail } = await import("@/lib/services/email");
      await sendNewsletterWelcomeEmail(email);
    } catch (e: any) {
      console.error("Failed to send newsletter welcome email:", e.message);
    }

    return json({ success: true, message: "Thank you for subscribing to our newsletter!" });
  }

  return error("Not found", 404);
}


// ─── Settings route ────────────────────────────────────────────────────────────

async function handleSettings(path: string[], req: NextRequest) {
  if (path[0] !== "settings") return null;

  if (req.method === "GET") {
    return json(await settings.get() || {});
  }

  return error("Not found", 404);
}

// ─── Admin routes ─────────────────────────────────────────────────────────────

async function handleAdmin(path: string[], req: NextRequest) {
  if (path[0] !== "admin") return null;

  const user = await getAuthUser(req);
  const isAdmin = user?.email === "admin@boutiiquevastraa.com" || getTokenFromRequest(req) === "admin-token";
  if (!isAdmin) return error("Unauthorized", 401);

  const sub = path[1];

  if (sub === "dashboard" && req.method === "GET") {
    const all = await products.all();
    const colls = await collections.all();
    const ords = await orders.all();
    const custs = await users.all();
    return json({
      totalProducts: all.length,
      totalCollections: colls.length,
      totalOrders: ords.length,
      totalCustomers: custs.length,
      totalRevenue: ords.reduce((s: number, o: any) => s + parseFloat(o.totalPrice?.amount || "0"), 0),
    });
  }

  if (sub === "products") {
    if (req.method === "GET") return json(await products.all());
    if (req.method === "POST" || req.method === "PUT") {
      const body = await parseBody(req);
      const all = await products.all();
      if (body?.id) {
        const idx = all.findIndex((p: any) => p.id === body.id);
        if (idx >= 0) all[idx] = { ...all[idx], ...body };
      } else {
        body.id = generateId();
        if (!body.handle) body.handle = body.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
        body.createdAt = new Date().toISOString();
        all.push(body);
      }
      await products.save(all);
      return json({ success: true, id: body.id, handle: body.handle });
    }
    if (req.method === "DELETE") {
      const id = path[2];
      if (!id) return error("Missing id", 400);
      const all = await products.all();
      const filtered = all.filter((p: any) => p.id !== id);
      await products.save(filtered);
      return json({ success: true });
    }
  }

  if (sub === "collections") {
    if (req.method === "GET") return json(await collections.all());
    if (req.method === "POST" || req.method === "PUT") {
      const body = await parseBody(req);
      const all = await collections.all();
      if (body?.id) {
        const idx = all.findIndex((c: any) => c.id === body.id);
        if (idx >= 0) all[idx] = { ...all[idx], ...body };
      } else {
        body.id = generateId();
        if (!body.handle) body.handle = body.title?.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "") || body.id;
        all.push(body);
      }
      await collections.save(all);
      return json({ success: true, id: body.id, handle: body.handle });
    }
    if (req.method === "DELETE") {
      const id = path[2];
      if (!id) return error("Missing id", 400);
      const all = await collections.all();
      const filtered = all.filter((c: any) => c.id !== id);
      await collections.save(filtered);
      return json({ success: true });
    }
  }

  if (sub === "orders") {
    // 1. GET /api/admin/orders
    if (req.method === "GET" && path.length === 2) {
      return json(await orders.all());
    }

    // 2. PATCH /api/admin/orders (bulk or status update via body)
    if (req.method === "PATCH" && path.length === 2) {
      const body = await parseBody(req);
      const all = await orders.all();
      const order = all.find((o: any) => o.id === body?.id);
      if (order && body?.fulfillmentStatus && order.fulfillmentStatus !== body.fulfillmentStatus) {
        order.fulfillmentStatus = body.fulfillmentStatus;
        try {
          const { sendOrderStatusUpdateEmail } = await import("@/lib/services/email");
          const tracking = order.awbNumber ? { awb: order.awbNumber, courier: order.courierName, link: `https://track.shiprocket.co/${order.awbNumber}` } : undefined;
          await sendOrderStatusUpdateEmail(order, order.fulfillmentStatus, tracking);
        } catch (e: any) {
          console.error("Failed to send order status update email:", e.message);
        }
      }
      await orders.save(all);
      return json({ success: true });
    }

    // Endpoints for a specific order: /api/admin/orders/:id/...
    if (path.length >= 3) {
      const orderId = path[2];
      const action = path[3];

      if (action === "shipment" && req.method === "POST") {
        try {
          const order = await ShiprocketService.bookShipmentForOrder(orderId);
          if (!order) return error("Order already processed or locked", 409);
          if (order.shipmentError) return error(order.shipmentError, 400);
          return json({ success: true, order });
        } catch (err: any) {
          return error(err.message || "Failed to book shipment", 500);
        }
      }

      if (action === "awb" && req.method === "POST") {
        try {
          const all = await orders.all();
          const order = all.find((o: any) => o.id === orderId);
          if (!order) return error("Order not found", 404);
          if (!order.shipmentId) return error("Shipment not yet created", 400);

          const res = await ShiprocketService.assignAwb(order.shipmentId);
          const awbData = res.response?.data;
          if (awbData) {
            order.awbNumber = awbData.awb_code || null;
            order.courierName = awbData.courier_name || null;
            order.shiprocketResponse = { ...order.shiprocketResponse, awb_details: res };
            order.shiprocketUpdatedAt = new Date().toISOString();
            order.shipmentError = null;
            order.shipmentErrorAt = null;
            await orders.save(all);
            return json({ success: true, order });
          }
          return error("Failed to assign AWB from Shiprocket response", 400);
        } catch (err: any) {
          return error(err.message || "Failed to assign AWB", 500);
        }
      }

      if (action === "pickup" && req.method === "POST") {
        try {
          const all = await orders.all();
          const order = all.find((o: any) => o.id === orderId);
          if (!order) return error("Order not found", 404);
          if (!order.shipmentId) return error("Shipment not yet created", 400);

          const res = await ShiprocketService.schedulePickup(order.shipmentId);
          order.pickupStatus = "Scheduled";
          order.shiprocketResponse = { ...order.shiprocketResponse, pickup_details: res };
          order.shiprocketUpdatedAt = new Date().toISOString();
          await orders.save(all);
          return json({ success: true, order });
        } catch (err: any) {
          return error(err.message || "Failed to schedule pickup", 500);
        }
      }

      if (action === "label" && req.method === "POST") {
        try {
          const all = await orders.all();
          const order = all.find((o: any) => o.id === orderId);
          if (!order) return error("Order not found", 404);
          if (!order.shipmentId) return error("Shipment not yet created", 400);

          // Generate Label & Invoice in parallel
          const [labelRes, invoiceRes] = await Promise.all([
            ShiprocketService.generateLabel(order.shipmentId).catch(() => null),
            order.shiprocketResponse?.order_id
              ? ShiprocketService.generateInvoice(order.shiprocketResponse.order_id).catch(() => null)
              : Promise.resolve(null)
          ]);

          if (labelRes && labelRes.label_created) {
            order.labelUrl = labelRes.label_url || null;
          }
          if (invoiceRes && invoiceRes.invoice_created) {
            order.invoiceUrl = invoiceRes.invoice_url || null;
          }

          order.shiprocketResponse = { 
            ...order.shiprocketResponse, 
            label_details: labelRes, 
            invoice_details: invoiceRes 
          };
          order.shiprocketUpdatedAt = new Date().toISOString();
          await orders.save(all);

          return json({ success: true, order });
        } catch (err: any) {
          return error(err.message || "Failed to generate label", 500);
        }
      }

      if (action === "track" && req.method === "GET") {
        try {
          const all = await orders.all();
          const order = all.find((o: any) => o.id === orderId);
          if (!order) return error("Order not found", 404);
          if (!order.awbNumber) return error("AWB not assigned yet", 400);

          const res = await ShiprocketService.trackShipment(order.awbNumber);
          const trackData = res.tracking_data;
          
          if (trackData && trackData.track_status === 1) {
            const shipData = trackData.shipment_track?.[0];
            if (shipData) {
              order.shipmentStatus = shipData.current_status || order.shipmentStatus;
              order.shiprocketResponse = { ...order.shiprocketResponse, tracking_details: res };
              order.shiprocketUpdatedAt = new Date().toISOString();
              order.shipmentLastSynced = new Date().toISOString();
              
              // Map high-level tracking status to application's fulfillment status
              const statusUpper = String(shipData.current_status).toUpperCase();
              if (statusUpper.includes("DELIVERED")) {
                order.fulfillmentStatus = "DELIVERED";
              } else if (statusUpper.includes("SHIPPED") || statusUpper.includes("OUT FOR DELIVERY") || statusUpper.includes("IN TRANSIT")) {
                order.fulfillmentStatus = "SHIPPED";
              } else if (statusUpper.includes("CANCELLED")) {
                order.fulfillmentStatus = "CANCELLED";
              }
              
              await orders.save(all);
            }
          }
          return json({ success: true, order });
        } catch (err: any) {
          return error(err.message || "Failed to track shipment", 500);
        }
      }

      if (action === "verify-payment" && req.method === "POST") {
        try {
          const all = await orders.all();
          const order = all.find((o: any) => o.id === orderId);
          if (!order) return error("Order not found", 404);
          if (!order.merchantTransactionId) return error("No payment transaction ID found", 400);

          const statusCheck = await PhonePeService.verifyStatus(order.merchantTransactionId);
          order.paymentResponse = statusCheck.rawResponse;
          order.paymentUpdatedAt = new Date().toISOString();
          order.paymentEvents = order.paymentEvents || [];
          order.paymentEvents.push({
            event: `Admin Re-verification (${statusCheck.code})`,
            timestamp: new Date().toISOString(),
          });

          if (statusCheck.paymentState === "SUCCESS") {
            order.financialStatus = "PAID";
            order.paymentStatus = "PAID";
            order.phonepeTransactionId = statusCheck.phonepeTransactionId || order.phonepeTransactionId;

            if (process.env.SHIPROCKET_AUTO_CREATE_SHIPMENT === "true" && !order.shipmentId) {
              ShiprocketService.bookShipmentForOrder(order.id).catch(() => {});
            }
          } else if (statusCheck.paymentState === "FAILED") {
            order.financialStatus = "PENDING";
            order.paymentStatus = "FAILED";
          }

          await orders.save(all);
          return json({ success: true, order });
        } catch (err: any) {
          return error(err.message || "Failed to verify payment status", 500);
        }
      }

      // 3. PATCH /api/admin/orders/:id/status
      if (action === "status" && req.method === "PATCH") {
        const body = await parseBody(req);
        const all = await orders.all();
        const order = all.find((o: any) => o.id === orderId);
        const newStatus = body?.fulfillmentStatus || body?.status;
        if (order && newStatus) {
          order.fulfillmentStatus = newStatus;
          await orders.save(all);
          return json({ success: true, order });
        }
        return error("Failed to update status", 400);
      }
    }
  }

  if (sub === "customers" && req.method === "GET") return json(await users.all());

  if (sub === "coupons") {
    if (req.method === "GET") return json(await coupons.all());
    if (req.method === "POST") {
      const body = await parseBody(req);
      const all = await coupons.all();
      if (body?.id) {
        const idx = all.findIndex((c: any) => c.id === body.id);
        if (idx >= 0) all[idx] = { ...all[idx], ...body };
      } else {
        body.id = generateId();
        all.push(body);
      }
      await coupons.save(all);
      return json({ success: true });
    }
    if (req.method === "PATCH" && path[2] === "toggle") {
      const all = await coupons.all();
      const coupon = all.find((c: any) => c.id === path[3]);
      if (coupon) coupon.active = !coupon.active;
      await coupons.save(all);
      return json({ success: true, active: coupon?.active });
    }
    if (req.method === "DELETE") {
      const id = path[2];
      if (!id) return error("Missing id", 400);
      const all = await coupons.all();
      const filtered = all.filter((c: any) => c.id !== id);
      await coupons.save(filtered);
      return json({ success: true });
    }
  }

  if (sub === "reviews") {
    if (req.method === "GET") return json(await reviews.all());
    if (req.method === "PATCH" && path[2] === "toggle-approval") {
      const all = await reviews.all();
      const review = all.find((r: any) => r.id === path[3]);
      if (review) review.approved = !review.approved;
      await reviews.save(all);
      return json({ success: true });
    }
    if (req.method === "DELETE") {
      const id = path[2];
      if (!id) return error("Missing id", 400);
      const all = await reviews.all();
      const filtered = all.filter((r: any) => r.id !== id);
      await reviews.save(filtered);
      return json({ success: true });
    }
  }

  if (sub === "settings") {
    if (req.method === "GET") return json(await settings.get());
    if (req.method === "POST") {
      const body = await parseBody(req);
      const current = await settings.get();
      const section = path[2];
      if (section && ["seo","banners","homepage","footer","header"].includes(section)) {
        current[section] = body[section] ?? body;
      } else {
        Object.assign(current, body);
      }
      await settings.save(current);
      return json({ success: true });
    }
  }

  if (sub === "upload" && req.method === "POST") {
    const formData = await req.formData();
    const file = formData.get("file") || formData.get("image");
    if (!(file instanceof File)) return error("No file uploaded", 400);
    const ext = file.name.split(".").pop() || "png";
    const fileName = `upload-${Date.now()}-${Math.random().toString(36).slice(2, 8)}.${ext}`;
    const buffer = Buffer.from(await file.arrayBuffer());
    // On Hostinger, UPLOAD_DIR points to public_html/images so Apache serves files.
    // Locally falls back to public/images.
    const uploadBase = process.env.UPLOAD_DIR
      ? nodePath.join(process.env.UPLOAD_DIR, "uploads")
      : nodePath.join(process.cwd(), "public", "images", "uploads");
    if (!fs.existsSync(uploadBase)) fs.mkdirSync(uploadBase, { recursive: true });
    fs.writeFileSync(nodePath.join(uploadBase, fileName), buffer);
    return json({ success: true, url: `/images/uploads/${fileName}` });
  }

  return error("Not found", 404);
}

// ─── PhonePe Status (fallback if specific route doesn't match) ────────────

async function restoreInventoryForOrder(order: any) {
  try {
    const lineItems = order.lineItems || order.items || [];
    if (!lineItems.length) return;
    const allProducts = await products.all();
    let changed = false;
    for (const line of lineItems) {
      const lookupId = line.merchandiseId || line.id;
      const product = allProducts.find((p: any) =>
        p.id === lookupId || p.variants?.edges?.some((e: any) => e.node.id === lookupId)
      );
      if (!product) continue;
      const qty = parseInt(line.quantity) || 1;
      if (product.inventory !== null && product.inventory !== undefined) {
        product.inventory = Number(product.inventory) + qty;
        product.availableForSale = true;
        changed = true;
      }
    }
    if (changed) await products.save(allProducts);
  } catch (err: any) {
    console.error(`[CatchAll Inventory Restore] Order #${order.orderNumber}:`, err.message);
  }
}

async function handlePhonepeStatus(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const transactionId = searchParams.get("transactionId") || searchParams.get("id");
  const siteUrl = process.env.NEXT_PUBLIC_SITE_URL || `https://${req.headers.get("host") || "boutiiquevastraa.com"}`;

  function redirect(path: string) {
    return NextResponse.redirect(new URL(path, siteUrl));
  }

  if (!transactionId) {
    return redirect("/checkout?error=Missing+Transaction+ID");
  }
  try {
    const allOrders = await orders.all();
    const order = allOrders.find((o: any) => o.merchantTransactionId === transactionId);
    if (!order) {
      return redirect("/checkout?error=Order+not+found");
    }
    if (order.paymentStatus === "PAID") {
      return redirect(`/checkout/success?orderId=${order.id}`);
    }
    const statusCheck = await PhonePeService.verifyStatus(transactionId);
    order.paymentResponse = statusCheck.rawResponse;
    order.paymentUpdatedAt = new Date().toISOString();
    if (statusCheck.paymentState === "SUCCESS") {
      order.financialStatus = "PAID";
      order.paymentStatus = "PAID";
      order.phonepeTransactionId = statusCheck.phonepeTransactionId || order.phonepeTransactionId;
      order.paymentTime = new Date().toISOString();
      order.paymentEvents = order.paymentEvents || [];
      order.paymentEvents.push({ event: "Payment Verified via Return Redirect (SUCCESS)", timestamp: new Date().toISOString() });
      
      if (!order.emailSent) {
        order.emailSent = true;
        await orders.save(allOrders);
        try {
          await sendOrderConfirmationEmail(order);
        } catch (emailErr: any) {
          console.error(`[CatchAll Return Email Error] Order #${order.orderNumber}:`, emailErr.message);
        }
      } else {
        await orders.save(allOrders);
      }

      if (process.env.SHIPROCKET_AUTO_CREATE_SHIPMENT === "true" && !order.shipmentId) {
        ShiprocketService.bookShipmentForOrder(order.id).catch((err) => {
          console.error(`[CatchAll Shipment Error] Order #${order.orderNumber}:`, err.message);
        });
      }
      return redirect(`/checkout/success?orderId=${order.id}`);
    } else {
      order.financialStatus = "PENDING";
      order.paymentStatus = "FAILED";
      order.paymentError = `Payment status: ${statusCheck.code}`;
      order.paymentEvents = order.paymentEvents || [];
      order.paymentEvents.push({ event: `Payment Verified via Return Redirect (${statusCheck.code})`, timestamp: new Date().toISOString() });
      await restoreInventoryForOrder(order);
      await orders.save(allOrders);
      return redirect(`/checkout?error=Payment+was+not+completed+(${encodeURIComponent(statusCheck.code)})`);
    }
  } catch (err: any) {
    console.error("[CatchAll PhonePe Status Error]:", err.message);
    return redirect("/checkout?error=Verification+error");
  }
}

// ─── Error-safe wrapper ─────────────────────────────────────────────────────

function safe(fn: (req: NextRequest, params: any) => Promise<Response>) {
  return async (req: NextRequest, context: { params: any }): Promise<Response> => {
    try {
      await ensureInit();
      return await fn(req, context);
    } catch (err: any) {
      console.error(`[API ERROR] ${req.method} ${req.nextUrl.pathname}:`, err);
      return error("Internal server error", 500);
    }
  };
}

async function handleSearchSuggestions(path: string[], req: NextRequest) {
  if (path[0] !== "search" || path[1] !== "suggestions") return null;
  const url = new URL(req.url);
  const q = url.searchParams.get("q")?.toLowerCase() || "";
  if (!q.trim()) {
    return json({ products: [], categories: [] });
  }
  const allProducts = await products.all();
  const allCollections = await collections.all();

  const matchedProducts = allProducts.filter((p: any) =>
    p.title?.toLowerCase().includes(q) ||
    p.description?.toLowerCase().includes(q) ||
    (Array.isArray(p.tags) && p.tags.some((t: string) => t.toLowerCase().includes(q)))
  ).slice(0, 5);

  const matchedCollections = allCollections.filter((c: any) =>
    c.handle !== "frontpage" &&
    c.title?.toLowerCase().includes(q)
  ).slice(0, 3);

  return json({
    products: matchedProducts.map((p: any) => ({
      id: p.id,
      title: p.title,
      handle: p.handle,
      price: p.priceRange?.minVariantPrice?.amount || "0",
      image: Array.isArray(p.images)
        ? p.images[0]
        : p.images?.edges?.[0]?.node?.url || null
    })),
    categories: matchedCollections.map((c: any) => ({
      id: c.id,
      title: c.title,
      handle: c.handle
    }))
  });
}

// ─── Main router ──────────────────────────────────────────────────────────────

async function routeGET(req: NextRequest, { params }: any) {
  const path = (await params).path || [];
  // Shiprocket EDD
  if (path[0] === "shiprocket" && path[1] === "edd") {
    const url = new URL(req.url);
    const pincode = url.searchParams.get("pincode");
    const isCod = url.searchParams.get("isCod") === "true";
    if (!pincode || !/^\d{6}$/.test(pincode)) {
      return error("Valid 6-digit pincode required");
    }
    const edd = await ShiprocketService.getExpectedDeliveryDate(pincode, isCod);
    return json({ success: true, edd });
  }
  // PhonePe status — check by path prefix before falling through
  if (path[0] === "payment" && path[1] === "phonepe" && path[2] === "status") {
    return handlePhonepeStatus(req);
  }
  return (await handleAuth(path, req))
    || (await handleSearchSuggestions(path, req))
    || (await handleProducts(path, req))
    || (await handleCollections(path, req))
    || (await handleCart(path, req))
    || (await handleOrders(path, req))
    || (await handleCoupons(path, req))
    || (await handleReviews(path, req))
    || (await handleQna(path, req))
    || (await handleSettings(path, req))
    || (await handleAdmin(path, req))
    || error("Not found", 404);
}

async function routePOST(req: NextRequest, { params }: any) {
  const path = (await params).path || [];
  return (await handleAuth(path, req))
    || (await handleCart(path, req))
    || (await handleOrders(path, req))
    || (await handleCoupons(path, req))
    || (await handleReviews(path, req))
    || (await handleQna(path, req))
    || (await handleNotifyMe(path, req))
    || (await handleNewsletterSubscribe(path, req))
    || (await handleAdmin(path, req))
    || error("Not found", 404);
}

async function routePUT(req: NextRequest, { params }: any) {
  const path = (await params).path || [];
  return (await handleAuth(path, req))
    || (await handleCart(path, req))
    || (await handleAdmin(path, req))
    || error("Not found", 404);
}

async function routePATCH(req: NextRequest, { params }: any) {
  const path = (await params).path || [];
  return (await handleAdmin(path, req))
    || error("Not found", 404);
}

async function routeDELETE(req: NextRequest, { params }: any) {
  const path = (await params).path || [];
  return (await handleCart(path, req))
    || (await handleAdmin(path, req))
    || error("Not found", 404);
}

export const GET = safe(routeGET);
export const POST = safe(routePOST);
export const PUT = safe(routePUT);
export const PATCH = safe(routePATCH);
export const DELETE = safe(routeDELETE);

import { apiGet } from "@/lib/api/client";

function formatProduct(p: any) {
  if (!p) return p;
  return {
    ...p,
    descriptionHtml: p.descriptionHtml || p.description || "",
    variants: p.variants || {
      edges: [
        {
          node: {
            id: `${p.id}-default`,
            title: "Default Title",
            availableForSale: p.availableForSale,
            price: p.priceRange?.minVariantPrice || { amount: "0.0", currencyCode: "INR" },
            compareAtPrice: p.compareAtPriceRange?.minVariantPrice || null,
            selectedOptions: [{ name: "Title", value: "Default Title" }],
          },
        },
      ],
    },
  };
}

// ─── Server-side: call data-store directly (no HTTP round-trip) ──────────────
// Under Phusion Passenger, HOSTNAME/PORT differ from what the Next.js client
// expects, so we bypass HTTP entirely when running on the server.

let _dsReady = false;

async function ensureDs() {
  if (_dsReady) return;
  const { initDataStore } = await import("@/lib/data-store");
  await initDataStore();
  _dsReady = true;
}

async function dsProducts() {
  await ensureDs();
  const { products } = await import("@/lib/data-store");
  return products.all();
}

async function dsCollections() {
  await ensureDs();
  const { collections } = await import("@/lib/data-store");
  return collections.all();
}

// ─── Public query functions ───────────────────────────────────────────────────

export async function getProducts(first = 50) {
  if (typeof window === "undefined") {
    try {
      const items = await dsProducts();
      return items.slice(0, first).map(formatProduct);
    } catch (e) {
      console.error("[getProducts] direct DS error:", e);
      return [];
    }
  }
  try {
    const res = await apiGet<any[]>("/products", { per_page: String(first) });
    return res.map(formatProduct);
  } catch {
    return [];
  }
}

export async function getCollections(first = 20) {
  if (typeof window === "undefined") {
    try {
      const items = await dsCollections();
      return items.filter((col: any) => col.handle !== "frontpage").slice(0, first);
    } catch (e) {
      console.error("[getCollections] direct DS error:", e);
      return [];
    }
  }
  try {
    const res = await apiGet<any[]>("/collections", { first: String(first) });
    return res.filter((col: any) => col.handle !== "frontpage");
  } catch {
    return [];
  }
}

export async function getProductByHandle(handle: string) {
  const decoded = decodeURIComponent(handle);
  const slugified = decoded.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (typeof window === "undefined") {
    try {
      const items = await dsProducts();
      const found = items.find((p: any) => 
        p.handle === handle || 
        p.handle === decoded || 
        p.handle === slugified ||
        p.handle?.toLowerCase() === decoded.toLowerCase()
      );
      return found ? formatProduct(found) : null;
    } catch (e) {
      console.error("[getProductByHandle] direct DS error:", e);
      return null;
    }
  }
  try {
    const res = await apiGet<any>(`/products/${encodeURIComponent(decoded)}`);
    return formatProduct(res);
  } catch {
    try {
      const res = await apiGet<any>(`/products/${encodeURIComponent(handle)}`);
      return formatProduct(res);
    } catch {
      return null;
    }
  }
}

export async function getProductRecommendations(productId: string) {
  if (typeof window === "undefined") {
    try {
      const items = await dsProducts();
      const currentProduct = items.find((p: any) => p.id === productId);
      let others = items.filter((p: any) => p.id !== productId);
      
      if (currentProduct) {
        const currentProductCollections = Array.isArray(currentProduct.collectionHandles)
          ? currentProduct.collectionHandles
          : Array.isArray(currentProduct.collections)
          ? currentProduct.collections
          : [];
        
        const filteredOthers = others.filter((p: any) => {
          const pCols = Array.isArray(p.collectionHandles)
            ? p.collectionHandles
            : Array.isArray(p.collections)
            ? p.collections
            : [];
          return pCols.some((col: string) => currentProductCollections.includes(col));
        });
        
        if (filteredOthers.length > 0) {
          others = filteredOthers;
        }
      }
      return others.slice(0, 8).map(formatProduct);
    } catch (e) {
      console.error("[getProductRecommendations] direct DS error:", e);
      return [];
    }
  }
  try {
    const res = await apiGet<any[]>(`/products/${productId}/recommendations`);
    return res.map(formatProduct);
  } catch {
    return [];
  }
}

export async function getCollectionByHandle({
  handle,
  filters = [],
  sortKey = "COLLECTION_DEFAULT",
  reverse = false,
  first = 24,
  after = null,
}: {
  handle: string;
  filters?: any[];
  sortKey?: string;
  reverse?: boolean;
  first?: number;
  after?: string | null;
}) {
  const decoded = decodeURIComponent(handle);
  const slugified = decoded.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-|-$/g, "");
  if (typeof window === "undefined") {
    try {
      const allCols = await dsCollections();
      const col = allCols.find((c: any) => 
        c.handle === handle || 
        c.handle === decoded || 
        c.handle === slugified ||
        c.handle?.toLowerCase() === decoded.toLowerCase()
      );
      const allProds = await dsProducts();
      let colProducts = allProds.filter((p: any) => {
        const colHandles: string[] = Array.isArray(p.collectionHandles)
          ? p.collectionHandles
          : Array.isArray(p.collections)
          ? p.collections
          : [];
        return handle === "all" ||
               colHandles.includes(handle) || 
               colHandles.includes(decoded) || 
               colHandles.includes(slugified) || 
               (col && (colHandles.includes(col.id) || colHandles.includes(col.handle)));
      });

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
      if (filters && filters.length > 0) {
        filteredProducts = filteredProducts.filter((p: any) => {
          const availabilityFilters = filters.filter(f => f.available !== undefined);
          const priceFilters = filters.filter(f => f.price !== undefined);
          const tagFilters = filters.filter(f => f.tag !== undefined);

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

      const edges = paginatedProducts.map((p: any) => ({ node: formatProduct(p) }));
      return {
        id: col?.id || handle,
        handle,
        title: col?.title || handle,
        description: col?.description || "",
        image: col?.image || null,
        products: {
          edges,
          filters: generatedFilters,
          pageInfo: { hasNextPage, endCursor },
        },
      };
    } catch (e) {
      console.error("[getCollectionByHandle] direct DS error:", e);
      return null;
    }
  }
  const params: Record<string, string> = {
    first: String(first),
    sort: sortKey,
    reverse: String(reverse),
  };
  if (after) params.after = after;
  if (filters.length > 0) params.filter = JSON.stringify(filters);
  try {
    return await apiGet<any>(`/collections/${encodeURIComponent(decoded)}`, params);
  } catch {
    try {
      return await apiGet<any>(`/collections/${encodeURIComponent(handle)}`, params);
    } catch {
      return null;
    }
  }
}

export async function searchProducts(query: string, first = 24, after: string | null = null) {
  if (typeof window === "undefined") {
    try {
      const allProds = await dsProducts();
      const q = query.toLowerCase();
      const matched = allProds.filter((p: any) =>
        p.title?.toLowerCase().includes(q) ||
        p.description?.toLowerCase().includes(q) ||
        (Array.isArray(p.tags) && p.tags.some((t: string) => t.toLowerCase().includes(q)))
      );
      const edges = matched.slice(0, first).map((p: any) => ({ node: formatProduct(p) }));
      return {
        edges,
        pageInfo: { hasNextPage: matched.length > first, endCursor: "" },
      };
    } catch (e) {
      console.error("[searchProducts] direct DS error:", e);
      return { edges: [], pageInfo: { hasNextPage: false, endCursor: "" } };
    }
  }
  try {
    const params: Record<string, string> = { q: query, per_page: String(first) };
    if (after) params.after = after;
    const res = await apiGet<any[]>("/products/search", params);
    const edges = res.map((p: any) => ({ node: formatProduct(p) }));
    return {
      edges,
      pageInfo: {
        hasNextPage: res.length >= first,
        endCursor: res.length > 0 ? res[res.length - 1].id : "",
      },
    };
  } catch {
    return { edges: [], pageInfo: { hasNextPage: false, endCursor: "" } };
  }
}

export async function getCustomer(customerAccessToken: string) {
  if (typeof window === "undefined") {
    try {
      const { serverGetAuthUser } = await import("@/lib/server-data");
      const customer = await serverGetAuthUser(customerAccessToken);
      if (!customer) return null;
      await ensureDs();
      const { orders } = await import("@/lib/data-store");
      const userOrders = (await orders.all())
        .filter((o: any) => o.email?.toLowerCase() === customer.email?.toLowerCase())
        .sort((a: any, b: any) => {
          const tA = new Date(a.processedAt || a.createdAt || 0).getTime();
          const tB = new Date(b.processedAt || b.createdAt || 0).getTime();
          return tB - tA;
        });
      return { ...customer, orders: { edges: userOrders.map((o: any) => ({ node: o })) } };
    } catch (e) {
      console.error("[getCustomer] direct DS error:", e);
      return null;
    }
  }
  try {
    const customer = await apiGet<any>("/auth/me", { _token: customerAccessToken });
    return customer;
  } catch {
    return null;
  }
}



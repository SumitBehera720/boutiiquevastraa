import fs from "fs";
import path from "path";
import crypto from "crypto";
import { MongoClient, Db } from "mongodb";

// Try to load env files when running in standalone mode
// The standalone server runs from .next/standalone/ so .env.local is not auto-loaded
(function loadEnvFiles() {
  const envPaths = [
    path.join(process.cwd(), ".env.local"),
    path.join(process.cwd(), ".env"),
    path.join(process.cwd(), "..", ".env.local"),
    path.join(process.cwd(), "..", ".env"),
    path.join(process.cwd(), "..", "..", ".env.local"),
    path.join(process.cwd(), "..", "..", ".env"),
  ];
  for (const envPath of envPaths) {
    try {
      if (fs.existsSync(envPath)) {
        const content = fs.readFileSync(envPath, "utf-8");
        for (const line of content.split("\n")) {
          const trimmed = line.trim();
          if (!trimmed || trimmed.startsWith("#")) continue;
          const eqIdx = trimmed.indexOf("=");
          if (eqIdx === -1) continue;
          const key = trimmed.slice(0, eqIdx).trim();
          const val = trimmed.slice(eqIdx + 1).trim();
          if (!process.env[key]) {
            process.env[key] = val;
          }
        }
      }
    } catch {}
  }
})();

const MONGODB_URI = process.env.MONGODB_URI || "";
const MONGODB_DB_NAME = process.env.MONGODB_DB_NAME || "boutiique_vastraa";
const USE_DB = process.env.ENABLE_DATABASE === 'true' && !!MONGODB_URI;

export const dbAvailable = () => USE_DB;

let clientInstance: MongoClient | null = null;
let dbInstance: Db | null = null;

async function getDb(): Promise<Db> {
  if (!USE_DB) throw new Error("Database is not enabled (ENABLE_DATABASE is false or MONGODB_URI is missing)");
  if (!dbInstance) {
    if (!MONGODB_URI) throw new Error("MONGODB_URI is not set in environment variables");
    clientInstance = new MongoClient(MONGODB_URI);
    await clientInstance.connect();
    dbInstance = clientInstance.db(MONGODB_DB_NAME);
    console.log("[MongoDB] Connected to database:", MONGODB_DB_NAME);
  }
  return dbInstance;
}

export async function query<T = any>(sql: string, params?: any[]): Promise<T> {
  if (!USE_DB) return [] as any;
  const db = await getDb();

  // Clean the sql statement: normalize spacing, trim
  const cleanSql = sql.trim().replace(/\s+/g, " ");
  const p = params || [];

  // 1. SELECT COUNT(*) AS cnt FROM ??
  if (/SELECT COUNT\(\*\) AS cnt FROM \?\?/i.test(cleanSql)) {
    const tableName = p[0];
    const count = await db.collection(tableName).countDocuments();
    return [{ cnt: count }] as any;
  }

  // 2. SELECT COUNT(*) AS cnt FROM tableName
  const countTableMatch = cleanSql.match(/SELECT COUNT\(\*\) AS cnt FROM (\w+)/i);
  if (countTableMatch) {
    const tableName = countTableMatch[1];
    const count = await db.collection(tableName).countDocuments();
    return [{ cnt: count }] as any;
  }

  // 3. SELECT data FROM settings WHERE id = 1
  if (cleanSql.includes("SELECT data FROM settings WHERE id = 1")) {
    const results = await db.collection("settings").find({ id: 1 }).toArray();
    return results as any;
  }

  // 5. SELECT * FROM table WHERE field = ?
  const selectWhereMatch = cleanSql.match(/^SELECT \* FROM (\w+)\s+WHERE\s+(\w+)\s*=\s*\?$/i);
  if (selectWhereMatch) {
    const tableName = selectWhereMatch[1];
    const field = selectWhereMatch[2];
    const val = p[0];
    const results = await db.collection(tableName).find({ [field]: val }).toArray();
    return results as any;
  }

  // 6. SELECT data FROM table WHERE field = ?
  const selectDataWhereMatch = cleanSql.match(/^SELECT data FROM (\w+)\s+WHERE\s+(\w+)\s*=\s*\?$/i);
  if (selectDataWhereMatch) {
    const tableName = selectDataWhereMatch[1];
    const field = selectDataWhereMatch[2];
    const val = p[0];
    const results = await db.collection(tableName).find({ [field]: val }).toArray();
    return results as any;
  }

  // 7. SELECT user_id FROM sessions WHERE token = ?
  if (cleanSql.includes("SELECT user_id FROM sessions WHERE token = ?")) {
    const val = p[0];
    const results = await db.collection("sessions").find({ token: val }).toArray();
    return results as any;
  }

  // 8. SELECT 1 FROM table WHERE field = ?
  const select1Match = cleanSql.match(/^SELECT 1 FROM (\w+|\?\?)\s+WHERE\s+(\w+)\s*=\s*\?$/i);
  if (select1Match) {
    const tableName = select1Match[1] === "??" ? p[0] : select1Match[1];
    const field = select1Match[2];
    const val = p[1] !== undefined ? p[1] : p[0];
    const results = await db.collection(tableName).find({ [field]: val }).toArray();
    return results as any;
  }

  // 4. SELECT * FROM table ORDER BY field DESC/ASC
  const selectAllMatch = cleanSql.match(/^SELECT \* FROM (\w+|\?\?)(?:\s+ORDER BY\s+(\w+)\s+(DESC|ASC))?$/i);
  if (selectAllMatch) {
    const tableName = selectAllMatch[1] === "??" ? p[0] : selectAllMatch[1];
    const orderBy = selectAllMatch[2];
    const orderDir = selectAllMatch[3];
    let cursor = db.collection(tableName).find({});
    if (orderBy) {
      cursor = cursor.sort({ [orderBy]: orderDir === "DESC" ? -1 : 1 });
    }
    const results = await cursor.toArray();
    return results as any;
  }

  // Housekeeping: DELETE FROM carts WHERE updated_at < NOW() - INTERVAL 1 DAY
  if (cleanSql.includes("DELETE FROM carts WHERE updated_at")) {
    const limit = new Date(Date.now() - 24 * 60 * 60 * 1000);
    const res = await db.collection("carts").deleteMany({
      updated_at: { $lt: limit }
    });
    return res as any;
  }

  // Housekeeping: DELETE s FROM sessions s LEFT JOIN users u ...
  if (cleanSql.includes("DELETE s FROM sessions")) {
    const usersList = await db.collection("users").find({}, { projection: { id: 1 } }).toArray();
    const userIds = usersList.map(u => u.id);
    const res = await db.collection("sessions").deleteMany({
      user_id: { $nin: userIds }
    });
    return res as any;
  }

  console.warn(`[MongoDB] Unsupported SQL query pattern, returning empty: ${sql}`);
  return [] as any;
}

export async function getOne<T = any>(sql: string, params?: any[]): Promise<T | null> {
  const rows = await query<any[]>(sql, params);
  return rows && rows.length ? (rows[0] as T) : null;
}

export async function insert(table: string, data: Record<string, any>): Promise<void> {
  if (!USE_DB) return;
  const db = await getDb();
  
  const doc = { ...data };
  if (data.id) doc._id = data.id;
  else if (data.token) doc._id = data.token;
  else if (data.cart_id) doc._id = data.cart_id;
  
  if (!doc.created_at) doc.created_at = new Date();
  if (!doc.updated_at) doc.updated_at = new Date();
  
  try {
    await db.collection(table).insertOne(doc);
  } catch (err: any) {
    if (err.code === 11000) {
      // Duplicate key error - ignore in parallel builds
      console.log(`[MongoDB] Duplicate key insertion ignored for table ${table}`);
    } else {
      throw err;
    }
  }
}

export async function update(table: string, idCol: string, idVal: any, data: Record<string, any>): Promise<void> {
  if (!USE_DB) return;
  const db = await getDb();
  
  const updates = { ...data, updated_at: new Date() };
  await db.collection(table).updateOne({ [idCol]: idVal }, { $set: updates });
}

export async function upsert(table: string, idCol: string, data: Record<string, any>): Promise<void> {
  if (!USE_DB) return;
  const db = await getDb();
  const idVal = data[idCol];
  
  const doc = { ...data };
  if (!doc.created_at) doc.created_at = new Date();
  doc.updated_at = new Date();
  
  try {
    await db.collection(table).updateOne(
      { [idCol]: idVal },
      { $set: doc },
      { upsert: true }
    );
  } catch (err: any) {
    if (err.code === 11000) {
      console.log(`[MongoDB] Concurrent upsert duplicate key ignored for table ${table}`);
    } else {
      throw err;
    }
  }
}

export async function remove(table: string, idCol: string, idVal: any): Promise<void> {
  if (!USE_DB) return;
  const db = await getDb();
  await db.collection(table).deleteOne({ [idCol]: idVal });
}

export async function replaceAll(table: string, items: Record<string, any>[], idCol = "id"): Promise<void> {
  if (!USE_DB) return;
  const db = await getDb();
  
  // To avoid concurrent duplicate key conflicts in Next.js multi-worker builds,
  // we perform idempotent bulk upserts instead of deleting and inserting.
  if (items.length) {
    const bulkOps = items.map(item => {
      const doc = { ...item };
      delete doc._id; // Remove _id to prevent MongoDB immutable field modification errors
      const idVal = item[idCol];
      if (!doc.created_at) doc.created_at = new Date();
      doc.updated_at = new Date();
      return {
        updateOne: {
          filter: { [idCol]: idVal },
          update: { $set: doc },
          upsert: true
        }
      };
    });
    
    try {
      await db.collection(table).bulkWrite(bulkOps, { ordered: false });
    } catch (err: any) {
      // E11000 is duplicate key error, we can safely ignore it because it means
      // another worker has already written it.
      if (err.code === 11000 || (err.writeErrors && err.writeErrors.some((e: any) => e.code === 11000))) {
        console.log(`[MongoDB BulkWrite] Concurrent write duplicate key ignored for table ${table}`);
      } else {
        throw err;
      }
    }
    
    // Sync deletions: remove any document that is not in the new items list
    const keepIds = items.map(item => item[idCol]).filter(Boolean);
    await db.collection(table).deleteMany({ [idCol]: { $nin: keepIds } });
  } else {
    // If the list is empty, clear the collection
    await db.collection(table).deleteMany({});
  }
}

export async function initDatabase(): Promise<void> {
  if (!USE_DB) return;
  try {
    const db = await getDb();
    
    // Create collection indexes
    await db.collection("users").createIndex({ email: 1 }, { unique: true });
    await db.collection("products").createIndex({ handle: 1 });
    await db.collection("collections").createIndex({ handle: 1 });
    await db.collection("coupons").createIndex({ code: 1 });
    await db.collection("admin").createIndex({ username: 1 });
    await db.collection("sessions").createIndex({ token: 1 });
    await db.collection("carts").createIndex({ cart_id: 1 });
    await db.collection("stock_notifications").createIndex({ product_id: 1, email: 1 });
    
    console.log("[MongoDB] Collections and indexes verified");
  } catch (err) {
    console.error("[MongoDB] Database init error:", err);
    throw err;
  }
}

// ─── Data seeding from JSON files ───────────────────────────────────────────

const DATA_DIR = path.join(process.cwd(), "data");

function readJson<T>(name: string): T {
  try {
    return JSON.parse(fs.readFileSync(path.join(DATA_DIR, `${name}.json`), "utf-8"));
  } catch {
    return ([] as any) as T;
  }
}

async function countRows(table: string): Promise<number> {
  const row = await getOne<any>(`SELECT COUNT(*) AS cnt FROM ??`, [table]);
  return row?.cnt ?? 0;
}

export async function seedIfEmpty(): Promise<void> {
  if (!USE_DB) return;

  try {
    const data = readJson<any>("settings");
    if (data && Object.keys(data).length) {
      await upsert("settings", "id", { id: 1, data: typeof data === "string" ? data : JSON.stringify(data) });
    }

    const productCount = await countRows("products");
    if (productCount === 0) {
      const items = readJson<any[]>("products");
      if (items.length) {
        const mapped = items.map((p: any) => ({
          id: p.id,
          title: p.title,
          handle: p.handle || p.id,
          description: p.description || "",
          available_for_sale: p.availableForSale ?? true,
          price_range: JSON.stringify(p.priceRange || {}),
          compare_at_price_range: JSON.stringify(p.compareAtPriceRange || {}),
          images: JSON.stringify(p.images || { edges: [] }),
          variants: JSON.stringify(p.variants || { edges: [] }),
          tags: JSON.stringify(p.tags || []),
          collection_handles: JSON.stringify(p.collectionHandles || []),
          inventory: p.inventory !== null && p.inventory !== undefined ? Number(p.inventory) : null,
        }));
        await replaceAll("products", mapped);
      }
    }

    const collectionCount = await countRows("collections");
    if (collectionCount === 0) {
      const items = readJson<any[]>("collections");
      if (items.length) {
        const mapped = items.map((c: any) => ({
          id: c.id,
          title: c.title,
          handle: c.handle || c.id,
          description: c.description || "",
          image: JSON.stringify(c.image || c.bannerImage || null),
        }));
        await replaceAll("collections", mapped);
      }
    }

    const couponCount = await countRows("coupons");
    if (couponCount === 0) {
      const items = readJson<any[]>("coupons");
      if (items.length) {
        const mapped = items.map((c: any) => ({
          id: c.id,
          code: c.code,
          type: c.type || "percentage",
          value: c.value || 0,
          min_purchase: c.minPurchase || 0,
          max_uses: c.maxUses || 0,
          used_count: c.usedCount || 0,
          active: c.active ?? true,
          expires_at: c.expiresAt || null,
        }));
        await replaceAll("coupons", mapped);
      }
    }

    const reviewCount = await countRows("reviews");
    if (reviewCount === 0) {
      const items = readJson<any[]>("reviews");
      if (items.length) {
        const mapped = items.map((r: any) => ({
          id: r.id,
          product_handle: r.productHandle || "global",
          author: r.author,
          rating: r.rating || 5,
          comment: r.comment,
          approved: r.approved ?? true,
        }));
        await replaceAll("reviews", mapped);
      }
    }

    const userCount = await countRows("users");
    if (userCount === 0) {
      const items = readJson<any[]>("users");
      if (items.length) {
        const mapped = items.map((u: any) => ({
          id: u.id,
          first_name: u.firstName || "",
          last_name: u.lastName || "",
          email: u.email,
          phone: u.phone || "",
          password: u.password || "",
          default_address: JSON.stringify(u.defaultAddress || null),
        }));
        await replaceAll("users", mapped);
      }
    }

    const adminCount = await countRows("admin");
    if (adminCount === 0) {
      const items = readJson<any[]>("admin");
      if (items.length) {
        const mapped = items.map((a: any) => ({
          id: a.id || a.username || "admin",
          username: a.username,
          password: a.password || a.passwordHash || "",
        }));
        await replaceAll("admin", mapped);
      }
    }

    const orderCount = await countRows("orders");
    if (orderCount === 0) {
      const items = readJson<any[]>("orders");
      if (items.length) {
        const mapped = items.map((o: any) => ({
          id: o.id,
          order_number: o.orderNumber || "",
          email: o.email || "",
          customer: JSON.stringify(o.customer || {}),
          items: JSON.stringify(o.items || []),
          shipping_address: JSON.stringify(o.shippingAddress || {}),
          total_price: JSON.stringify(o.totalPrice || { amount: "0", currencyCode: "INR" }),
          fulfillment_status: o.fulfillmentStatus || "unfulfilled",
          payment_status: o.paymentStatus || "pending",
        }));
        await replaceAll("orders", mapped);
      }
    }

    const qnaCount = await countRows("qna");
    if (qnaCount === 0) {
      const items = readJson<any[]>("qna");
      if (items.length) {
        const mapped = items.map((q: any) => ({
          id: q.id,
          product_handle: q.productHandle || "global",
          author: q.author,
          email: q.email || "",
          question: q.question,
          answer: q.answer || null,
          approved: q.approved ?? false,
        }));
        await replaceAll("qna", mapped);
      }
    }

    console.log("[DB] Seed complete");
  } catch (err) {
    console.error("[DB] Seeding error (ignored to prevent build crash):", err);
  }
}

// ─── Housekeeping ───────────────────────────────────────────────────────────

export async function runDbHousekeeping(): Promise<void> {
  if (!USE_DB) return;
  try {
    // purge carts older than 24 hours
    await query(`DELETE FROM carts WHERE updated_at < NOW() - INTERVAL 1 DAY`);
    // purge orphan sessions
    await query(`DELETE s FROM sessions s LEFT JOIN users u ON s.user_id = u.id WHERE u.id IS NULL`);
  } catch {
    // never crash
  }
}

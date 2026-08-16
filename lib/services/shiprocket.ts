import { orders } from "../data-store";

const BASE_URL = "https://apiv2.shiprocket.in/v1/external";
const TIMEOUT_MS = 25000; // 25 seconds API timeout

// Memory cache for the authentication token
let cachedToken: string | null = null;
let tokenExpiry: number = 0; // Epoch timestamp in ms

/**
 * Helper delay function for backoff
 */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * Custom Error Class for Shiprocket API failures
 */
export class ShiprocketError extends Error {
  status?: number;
  response?: any;
  constructor(message: string, status?: number, response?: any) {
    super(message);
    this.name = "ShiprocketError";
    this.status = status;
    this.response = response;
  }
}

/**
 * Service to manage integrations with the Shiprocket API
 */
export class ShiprocketService {
  /**
   * Generates or retrieves the cached JWT Token (valid for 10 days, cached for 9 days)
   */
  private static async getToken(): Promise<string> {
    const now = Date.now();
    if (cachedToken && tokenExpiry > now + 60000) {
      return cachedToken;
    }

    const email = process.env.SHIPROCKET_EMAIL;
    const password = process.env.SHIPROCKET_PASSWORD;

    if (!email || !password) {
      throw new ShiprocketError("Shiprocket credentials are not configured in environment variables.");
    }

    console.log("[Shiprocket] Authenticating with Shiprocket API...");
    const data = await this.requestRaw("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
      headers: { "Content-Type": "application/json" },
    });

    if (!data.token) {
      throw new ShiprocketError("Authentication response did not contain a token.", 400, data);
    }

    cachedToken = data.token;
    // Set cache expiry to 9 days from now (token is valid for 10 days)
    tokenExpiry = now + 9 * 24 * 60 * 60 * 1000;
    console.log("[Shiprocket] Token successfully cached.");

    return cachedToken!;
  }

  /**
   * Raw request wrapper with Timeout
   */
  private static async requestRaw(endpoint: string, options: RequestInit): Promise<any> {
    const controller = new AbortController();
    const id = setTimeout(() => controller.abort(), TIMEOUT_MS);

    try {
      const res = await fetch(`${BASE_URL}${endpoint}`, {
        ...options,
        signal: controller.signal as any,
      });

      clearTimeout(id);

      const text = await res.text();
      let json: any = null;
      try {
        json = text ? JSON.parse(text) : {};
      } catch {
        throw new ShiprocketError(`Invalid JSON response: ${text}`, res.status);
      }

      if (!res.ok) {
        throw new ShiprocketError(
          json.message || `Shiprocket API failed with status ${res.status}`,
          res.status,
          json
        );
      }

      return json;
    } catch (err: any) {
      clearTimeout(id);
      if (err.name === "AbortError") {
        throw new ShiprocketError(`Shiprocket request timed out after ${TIMEOUT_MS / 1000}s`);
      }
      throw err;
    }
  }

  /**
   * Request wrapper with Token Injection, Timeout, and 3-Retry Exponential Backoff
   */
  private static async request(endpoint: string, options: RequestInit = {}, requiresAuth = true): Promise<any> {
    let retries = 3;
    let backoff = 500; // ms

    while (retries > 0) {
      try {
        const headers: Record<string, string> = {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(options.headers as Record<string, string>),
        };

        if (requiresAuth) {
          const token = await this.getToken();
          headers["Authorization"] = `Bearer ${token}`;
        }

        return await this.requestRaw(endpoint, {
          ...options,
          headers,
        });
      } catch (err: any) {
        retries--;
        // If we get an authentication failure (401), clear token cache and retry immediately once
        if (err.status === 401 && requiresAuth && retries > 0) {
          console.warn("[Shiprocket] 401 Unauthorized. Clearing token cache and retrying...");
          cachedToken = null;
          tokenExpiry = 0;
          continue;
        }

        if (retries === 0) {
          console.error(`[Shiprocket] Request to ${endpoint} failed after all retries:`, err.message);
          throw err;
        }

        console.warn(`[Shiprocket] Request to ${endpoint} failed. Retrying in ${backoff}ms... Error: ${err.message}`);
        await delay(backoff);
        backoff *= 2; // Exponential backoff
      }
    }
  }

  /**
   * Creates an adhoc shipment in Shiprocket
   */
  public static async createShipment(order: any): Promise<any> {
    console.log(`[Shiprocket] Creating shipment for Order #VSTR-${order.orderNumber}...`);
    
    // Parse order dates
    const dateStr = order.createdAt 
      ? new Date(order.createdAt).toISOString().replace("T", " ").substring(0, 16)
      : new Date().toISOString().replace("T", " ").substring(0, 16);

    const email = order.email || order.customer?.email || "customer@example.com";
    const rawPhone = order.phone || order.customer?.phone || "9999999999";
    const phone = rawPhone.replace(/[^0-9]/g, "").slice(-10);
    const customerName = order.customerName || `${order.customer?.firstName || ""} ${order.customer?.lastName || ""}`.trim() || "Customer";
    const [firstName, ...rest] = customerName.split(" ");
    const lastName = rest.join(" ") || "Customer";

    const shipping = order.shippingAddress || order.customer?.shippingAddress || {};
    const billingAddress = shipping.address1 || "No address provided";
    const billingAddress2 = shipping.address2 || "";
    const billingCity = shipping.city || "City";
    const billingPincode = shipping.zip || "110001";
    const billingState = shipping.province || "State";
    const billingCountry = shipping.country || "India";

    // Map order items
    const rawItems = order.lines || order.lineItems || order.items || [];
    const items = rawItems.map((item: any) => {
      const price = parseFloat(item.price || 0);
      return {
        name: item.title || item.name || "Item",
        sku: item.sku || item.id || `sku-${(item.title || "item").toLowerCase().replace(/[^a-z0-9]+/g, "-")}`,
        units: parseInt(item.quantity) || 1,
        selling_price: Math.max(1, price).toFixed(2),
      };
    });

    // Read config settings
    const pickupLocation = process.env.SHIPROCKET_PICKUP_LOCATION || "Primary";
    const defaultWeight = parseFloat(process.env.DEFAULT_PACKAGE_WEIGHT || "0.5");
    const defaultLength = parseFloat(process.env.DEFAULT_PACKAGE_LENGTH || "20");
    const defaultBreadth = parseFloat(process.env.DEFAULT_PACKAGE_BREADTH || "15");
    const defaultHeight = parseFloat(process.env.DEFAULT_PACKAGE_HEIGHT || "5");

    const totalPrice = parseFloat(order.total || order.subtotal || order.totalPrice?.amount || "0");
    const paymentMethod = order.paymentMethod === "CARD" || order.financialStatus === "PAID" ? "Prepaid" : "COD";

    const payload = {
      order_id: `VSTR-${order.orderNumber}-${Date.now().toString().slice(-4)}`, // Append timestamp tail to ensure unique IDs
      order_date: dateStr,
      pickup_location: pickupLocation,
      billing_customer_name: firstName || "Customer",
      billing_last_name: lastName || "Customer",
      billing_address: billingAddress,
      billing_address_2: billingAddress2,
      billing_city: billingCity,
      billing_pincode: billingPincode,
      billing_state: billingState,
      billing_country: billingCountry,
      billing_email: email,
      billing_phone: phone,
      shipping_is_billing: true,
      order_items: items,
      payment_method: paymentMethod,
      sub_total: totalPrice,
      length: defaultLength,
      breadth: defaultBreadth,
      height: defaultHeight,
      weight: defaultWeight,
    };

    const res = await this.request("/orders/create/adhoc", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    console.log(`[Shiprocket] Shipment created: Shipment ID = ${res.shipment_id}, Shiprocket Order ID = ${res.order_id}`);
    return res;
  }

  /**
   * Assigns an AWB to a shipment
   */
  public static async assignAwb(shipmentId: number, courierId?: number): Promise<any> {
    console.log(`[Shiprocket] Assigning AWB for Shipment ID ${shipmentId}...`);
    const payload: Record<string, any> = { shipment_id: shipmentId };
    if (courierId) {
      payload.courier_id = courierId;
    }

    const res = await this.request("/courier/assign/awb", {
      method: "POST",
      body: JSON.stringify(payload),
    });

    console.log(`[Shiprocket] AWB assigned: AWB = ${res.response?.data?.awb_code}, Courier = ${res.response?.data?.courier_name}`);
    return res;
  }

  /**
   * Schedules a pickup for a shipment
   */
  public static async schedulePickup(shipmentId: number): Promise<any> {
    console.log(`[Shiprocket] Scheduling pickup for Shipment ID ${shipmentId}...`);
    const res = await this.request("/courier/generate/pickup", {
      method: "POST",
      body: JSON.stringify({ shipment_id: [shipmentId] }),
    });

    console.log(`[Shiprocket] Pickup scheduled:`, res);
    return res;
  }

  /**
   * Generates a shipping label for a shipment
   */
  public static async generateLabel(shipmentId: number): Promise<any> {
    console.log(`[Shiprocket] Generating shipping label for Shipment ID ${shipmentId}...`);
    const res = await this.request("/courier/generate/label", {
      method: "POST",
      body: JSON.stringify({ shipment_id: [shipmentId] }),
    });

    console.log(`[Shiprocket] Label generated:`, res);
    return res;
  }

  /**
   * Generates an invoice for an order
   */
  public static async generateInvoice(orderId: number): Promise<any> {
    console.log(`[Shiprocket] Generating invoice for Shiprocket Order ID ${orderId}...`);
    const res = await this.request("/orders/print/invoice", {
      method: "POST",
      body: JSON.stringify({ order_ids: [orderId] }),
    });

    console.log(`[Shiprocket] Invoice generated:`, res);
    return res;
  }

  /**
   * Fetches the tracking updates using the AWB Code
   */
  public static async trackShipment(awbNumber: string): Promise<any> {
    console.log(`[Shiprocket] Fetching tracking status for AWB ${awbNumber}...`);
    const res = await this.request(`/courier/track/awb/${encodeURIComponent(awbNumber)}`, {
      method: "GET",
    }, true);

    return res;
  }

  // Concurrency lock Set to prevent double-booking
  private static activeBookings = new Set<string>();

  /**
   * Main orchestrator to book a shipment for an order, assign AWB, and update database.
   * Includes idempotency checks and concurrency locks.
   */
  public static async bookShipmentForOrder(orderId: string): Promise<any> {
    if (this.activeBookings.has(orderId)) {
      console.log(`[Shiprocket] Concurrency lock active for order ${orderId}. Skipping.`);
      return null;
    }
    this.activeBookings.add(orderId);

    try {
      const allOrders = (await orders.all()) ?? [];
      const orderIdx = allOrders.findIndex((o: any) => o.id === orderId);
      if (orderIdx === -1) {
        throw new Error(`Order ${orderId} not found in database.`);
      }
      const order = allOrders[orderIdx];

      // Prevent duplicate shipments
      if (order.shipmentId) {
        console.log(`[Shiprocket] Shipment already created for Order #VSTR-${order.orderNumber}. Skipping.`);
        return order;
      }

      try {
        // Clear any previous error
        order.shipmentError = null;
        order.shipmentErrorAt = null;

        // Step 1: Create Shipment in Shiprocket
        const createRes = await this.createShipment(order);
        order.shipmentId = createRes.shipment_id;
        order.shipmentStatus = "Booked";
        order.shiprocketResponse = createRes;
        order.shiprocketUpdatedAt = new Date().toISOString();
        order.shipmentLastSynced = new Date().toISOString();

        // Step 2: Auto-assign AWB
        try {
          const awbRes = await this.assignAwb(createRes.shipment_id);
          const awbData = awbRes.response?.data;
          if (awbData) {
            order.awbNumber = awbData.awb_code || null;
            order.courierName = awbData.courier_name || null;
            order.shiprocketResponse = { ...order.shiprocketResponse, awb_details: awbRes };
          }
        } catch (awbErr: any) {
          console.error(`[Shiprocket AWB Assignment Error] Order #VSTR-${order.orderNumber}:`, awbErr.message);
          order.shipmentError = `AWB Assignment Failed: ${awbErr.message}`;
          order.shipmentErrorAt = new Date().toISOString();
        }

        // Save order updates
        await orders.save(allOrders);
        return order;
      } catch (err: any) {
        console.error(`[Shiprocket Shipment Creation Error] Order #VSTR-${order.orderNumber}:`, err.message);
        
        // Persist the error details on the order
        order.shipmentError = err.message || "Shipment creation failed.";
        order.shipmentErrorAt = new Date().toISOString();
        order.shiprocketResponse = err.response || null;
        order.shiprocketUpdatedAt = new Date().toISOString();
        
        await orders.save(allOrders);
        throw err;
      }
    } finally {
      this.activeBookings.delete(orderId);
    }
  }

  /**
   * Fetches serviceability / EDD from Shiprocket
   */
  public static async getExpectedDeliveryDate(deliveryPincode: string, isCod = false): Promise<string | null> {
    try {
      console.log(`[Shiprocket] Checking serviceability for pincode ${deliveryPincode}...`);
      const pickupPincode = process.env.SHIPROCKET_PICKUP_PINCODE || "700001"; // Default Kolkata Pincode
      const weight = parseFloat(process.env.DEFAULT_PACKAGE_WEIGHT || "0.5");
      const codVal = isCod ? 1 : 0;

      const endpoint = `/courier/serviceability/?pickup_postcode=${pickupPincode}&delivery_postcode=${deliveryPincode}&weight=${weight}&cod=${codVal}`;
      const res = await this.request(endpoint, { method: "GET" });

      if (res.status === 200 || res.success || res.data) {
        const couriers = res.data?.available_courier_companies || [];
        if (couriers.length > 0) {
          const edds = couriers
            .map((c: any) => c.etd || c.estimated_delivery_date || c.courier_company_etd)
            .filter(Boolean)
            .map((dateStr: string) => new Date(dateStr))
            .filter((d: Date) => !isNaN(d.getTime()));

          if (edds.length > 0) {
            const earliest = new Date(Math.min(...edds.map((d: Date) => d.getTime())));
            return earliest.toISOString();
          }
        }
      }
      return null;
    } catch (err: any) {
      console.error("[Shiprocket Serviceability Error]:", err.message);
      return null;
    }
  }
}

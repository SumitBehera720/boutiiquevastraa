import crypto from "crypto";

const TIMEOUT_MS = 25000; // 25 seconds timeout

/**
 * Custom Error Class for PhonePe API operations
 */
export class PhonePeError extends Error {
  status?: number;
  response?: any;
  constructor(message: string, status?: number, response?: any) {
    super(message);
    this.name = "PhonePeError";
    this.status = status;
    this.response = response;
  }
}

/** Helper delay for retries */
const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

/**
 * PhonePe Hermes API uses OAuth2 client credentials.
 * Cache the access token to avoid requesting it on every payment.
 */
let _hermesToken: string | null = null;
let _hermesTokenExpiry = 0;

/**
 * Helper to dynamically determine host domain and endpoints.
 * Handles production vs sandbox.
 */
function getPhonePeConfig() {
  const clientId = process.env.PHONEPE_CLIENT_ID || process.env.PHONEPE_MERCHANT_ID;
  const clientSecret = process.env.PHONEPE_SECRET_KEY || process.env.PHONEPE_SALT_KEY;
  const rawHost = process.env.PHONEPE_HOST_URL || "https://api.phonepe.com/apis/hermes";

  // Check if it's sandbox (preprod)
  const isSandbox = rawHost.includes("preprod") || rawHost.includes("sandbox") || clientId?.startsWith("PGTEST");
  
  const hostDomain = "https://api.phonepe.com";
  const sandboxDomain = "https://api-preprod.phonepe.com";
  const domain = isSandbox ? sandboxDomain : hostDomain;

  // Identity Manager OAuth path
  const tokenUrl = isSandbox
    ? `${sandboxDomain}/apis/pg-sandbox/v1/oauth/token` // sandbox oauth path
    : `${hostDomain}/apis/identity-manager/v1/oauth/token`; // production oauth path

  // PG Pay / Status paths
  const pgBaseUrl = isSandbox
    ? `${sandboxDomain}/apis/pg-sandbox`
    : `${hostDomain}/apis/pg`;

  return {
    clientId,
    clientSecret,
    tokenUrl,
    pgBaseUrl,
    isSandbox
  };
}

async function getHermesAccessToken(): Promise<string> {
  const { clientId, clientSecret, tokenUrl } = getPhonePeConfig();

  if (!clientId || !clientSecret) {
    throw new PhonePeError("PhonePe credentials (PHONEPE_CLIENT_ID / PHONEPE_SECRET_KEY) are not configured.");
  }

  // Return cached token if still valid (with 60s buffer)
  if (_hermesToken && Date.now() < _hermesTokenExpiry - 60_000) {
    return _hermesToken;
  }

  const body = new URLSearchParams({
    client_id: clientId,
    client_version: "1",
    client_secret: clientSecret,
    grant_type: "client_credentials",
  });

  console.log(`[PhonePe PG] Requesting access token from ${tokenUrl}`);
  const res = await fetch(tokenUrl, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      "Accept": "application/json",
    },
    body: body.toString(),
    signal: AbortSignal.timeout(TIMEOUT_MS),
  });

  const json = await res.json().catch(() => null);

  if (!res.ok || !json?.access_token) {
    throw new PhonePeError(
      json?.message || json?.error_description || `PhonePe OAuth failed with HTTP ${res.status}`,
      res.status,
      json
    );
  }

  _hermesToken = json.access_token;
  _hermesTokenExpiry = Date.now() + (json.expires_in || 3600) * 1000;
  console.log(`[PhonePe PG] OAuth token obtained. Expires in ${json.expires_in}s`);
  return _hermesToken!;
}

/**
 * Service to manage integrations with the PhonePe PG Checkout v2 API
 */
export class PhonePeService {
  /**
   * Generates a cryptographically secure, unique transaction ID
   */
  public static generateTransactionId(orderNumber?: string | number): string {
    const timestamp = Date.now();
    const uuid = crypto.randomBytes(16).toString("hex").substring(0, 10);
    const prefix = orderNumber ? `TXN_VSTR_${orderNumber}` : `TXN_VSTR`;
    return `${prefix}_${timestamp}_${uuid}`;
  }

  /**
   * Legacy SHA256 checksum (retained for webhook signature verification if needed)
   */
  public static calculateXVerify(payloadString: string, endpoint: string, saltKey: string, saltIndex: string): string {
    const stringToHash = payloadString + endpoint + saltKey;
    const sha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
    return `${sha256}###${saltIndex}`;
  }

  /**
   * Verifies the signature of an incoming PhonePe server-to-server callback (Legacy V1)
   */
  public static verifyCallbackSignature(payloadString: string, signature: string, saltKey: string, saltIndex: string): boolean {
    const stringToHash = payloadString + saltKey;
    const expectedSha256 = crypto.createHash("sha256").update(stringToHash).digest("hex");
    const expectedSignature = `${expectedSha256}###${saltIndex}`;
    return signature === expectedSignature;
  }

  /**
   * Verifies a V2 webhook callback using SHA/Basic Auth.
   * The Authorization header contains: SHA256(<hex>) or just <hex>
   * We compute SHA256(username:password) and compare.
   */
  public static verifyWebhookV2(authHeader: string, username: string, password: string): boolean {
    if (!username || !password) {
      console.warn("[PhonePe Webhook V2] No webhook credentials configured — skipping verification.");
      return true;
    }
    const computed = crypto.createHash("sha256").update(`${username}:${password}`).digest("hex");
    const normalizedHeader = authHeader.replace(/^SHA256\(/i, "").replace(/\)$/, "").trim();
    return normalizedHeader === computed;
  }

  /**
   * Initiates a Payment Request with PhonePe PG Checkout v2 API
   */
  public static async initiatePayment(params: {
    merchantTransactionId: string;
    amountInINR: number;
    redirectUrl: string;
    callbackUrl: string;
    customerPhone?: string;
    customerEmail?: string;
    merchantUserId?: string;
  }): Promise<{ success: boolean; redirectUrl: string; merchantTransactionId: string; rawResponse: any }> {
    const { clientId, pgBaseUrl } = getPhonePeConfig();

    if (!clientId) {
      throw new PhonePeError("PhonePe client credentials are not configured.");
    }

    const amountInPaise = Math.round(params.amountInINR * 100);

    // Build the pay page request body
    const payBody = {
      merchantId: clientId,
      merchantOrderId: params.merchantTransactionId,
      merchantUserId: params.merchantUserId || `MUID_${params.merchantTransactionId}`,
      amount: amountInPaise,
      expireAfter: 1800, // 30 minutes
      metaInfo: {
        udf1: params.customerEmail || "",
        udf2: params.customerPhone || "",
      },
      paymentFlow: {
        type: "PG_CHECKOUT",
        message: "Boutiique Vastraa Payment",
        merchantUrls: {
          redirectUrl: params.redirectUrl,
        },
      },
    };

    console.log(`[PhonePe PG] Initiating payment for Transaction ID: ${params.merchantTransactionId}, Amount: ₹${params.amountInINR}`);

    let accessToken: string;
    try {
      accessToken = await getHermesAccessToken();
    } catch (tokenErr: any) {
      console.error("[PhonePe PG] Token fetch failed:", tokenErr.message);
      throw new PhonePeError(`PhonePe authentication failed: ${tokenErr.message}`, 401);
    }

    let lastError: any;
    let backoff = 500;

    for (let attempt = 1; attempt <= 3; attempt++) {
      try {
        const payUrl = `${pgBaseUrl}/checkout/v2/pay`;
        const res = await fetch(payUrl, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            "Authorization": `O-Bearer ${accessToken}`,
            "Accept": "application/json",
          },
          body: JSON.stringify(payBody),
          signal: AbortSignal.timeout(TIMEOUT_MS),
        });

        const text = await res.text();
        let json: any = {};
        try { json = text ? JSON.parse(text) : {}; } catch { /* ignore */ }

        if (!res.ok) {
          // If 401, clear token cache and retry with a fresh token
          if (res.status === 401 && attempt < 3) {
            _hermesToken = null;
            accessToken = await getHermesAccessToken();
            continue;
          }
          throw new PhonePeError(
            json.message || `PhonePe payment request failed with HTTP ${res.status}`,
            res.status,
            json
          );
        }

        const redirectUrl = json.redirectUrl || json.data?.instrumentResponse?.redirectInfo?.url;

        if (!redirectUrl) {
          throw new PhonePeError(
            json.message || "Failed to retrieve PhonePe payment redirect URL.",
            400,
            json
          );
        }

        console.log(`[PhonePe PG] Payment initiated successfully. Redirecting customer.`);
        return {
          success: true,
          redirectUrl,
          merchantTransactionId: params.merchantTransactionId,
          rawResponse: json,
        };
      } catch (err: any) {
        lastError = err;
        if (attempt < 3) {
          console.warn(`[PhonePe PG] Attempt ${attempt} failed: ${err.message}. Retrying in ${backoff}ms...`);
          await delay(backoff);
          backoff *= 2;
        }
      }
    }

    throw new PhonePeError(lastError?.message || "PhonePe payment initiation failed after retries.", lastError?.status || 500, lastError?.response);
  }

  /**
   * Verifies the status of a payment using PhonePe PG Status v2 API
   */
  public static async verifyStatus(merchantTransactionId: string): Promise<{
    success: boolean;
    code: string;
    paymentState: "SUCCESS" | "FAILED" | "PENDING";
    phonepeTransactionId?: string;
    rawResponse: any;
  }> {
    const { pgBaseUrl } = getPhonePeConfig();

    let accessToken: string;
    try {
      accessToken = await getHermesAccessToken();
    } catch (tokenErr: any) {
      throw new PhonePeError(`PhonePe authentication failed: ${tokenErr.message}`, 401);
    }

    console.log(`[PhonePe PG] Verifying order status for Transaction ID: ${merchantTransactionId}`);

    const statusUrl = `${pgBaseUrl}/checkout/v2/order/${merchantTransactionId}/status`;
    const res = await fetch(statusUrl, {
      method: "GET",
      headers: {
        "Authorization": `O-Bearer ${accessToken}`,
        "Accept": "application/json",
      },
      signal: AbortSignal.timeout(TIMEOUT_MS),
    });

    const text = await res.text();
    let json: any = {};
    try { json = text ? JSON.parse(text) : {}; } catch { /* ignore */ }

    if (!res.ok) {
      throw new PhonePeError(
        json.message || `PhonePe status check failed with HTTP ${res.status}`,
        res.status,
        json
      );
    }

    // state can be COMPLETED, FAILED, PENDING, or EXPIRED
    const state = json.state || "";
    const code = json.paymentDetails?.[0]?.paymentMode || state || "UNKNOWN";
    const phonepeTransactionId = json.orderId || json.merchantOrderId;

    let paymentState: "SUCCESS" | "FAILED" | "PENDING" = "PENDING";
    if (state === "COMPLETED") {
      paymentState = "SUCCESS";
    } else if (state === "FAILED" || state === "EXPIRED") {
      paymentState = "FAILED";
    }

    console.log(`[PhonePe PG] Status for ${merchantTransactionId}: state=${state}, paymentState=${paymentState}`);

    return {
      success: paymentState === "SUCCESS",
      code,
      paymentState,
      phonepeTransactionId,
      rawResponse: json,
    };
  }
}

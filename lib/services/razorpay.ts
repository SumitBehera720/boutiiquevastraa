import crypto from "crypto";

export class RazorpayService {
  private static get keyId() {
    return process.env.RAZORPAY_KEY_ID || "";
  }
  private static get keySecret() {
    return process.env.RAZORPAY_KEY_SECRET || "";
  }

  /**
   * Create a Razorpay order on their server.
   * Returns { id, amount, currency }
   */
  static async createOrder(amountInINR: number, receiptId: string): Promise<{
    id: string;
    amount: number;
    currency: string;
  }> {
    const amountInPaise = Math.round(amountInINR * 100);
    const auth = Buffer.from(`${RazorpayService.keyId}:${RazorpayService.keySecret}`).toString("base64");

    const res = await fetch("https://api.razorpay.com/v1/orders", {
      method: "POST",
      headers: {
        Authorization: `Basic ${auth}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        amount: amountInPaise,
        currency: "INR",
        receipt: receiptId.slice(0, 40), // Razorpay receipt max 40 chars
        payment_capture: 1,
      }),
    });

    if (!res.ok) {
      const err = await res.json().catch(() => ({}));
      throw new Error(err?.error?.description || `Razorpay order creation failed: ${res.status}`);
    }

    const data = await res.json();
    return { id: data.id, amount: data.amount, currency: data.currency };
  }

  /**
   * Verify Razorpay payment signature after successful client-side payment.
   * razorpay_order_id + "|" + razorpay_payment_id signed with key_secret
   */
  static verifySignature(params: {
    razorpay_order_id: string;
    razorpay_payment_id: string;
    razorpay_signature: string;
  }): boolean {
    try {
      const body = `${params.razorpay_order_id}|${params.razorpay_payment_id}`;
      const expected = crypto
        .createHmac("sha256", RazorpayService.keySecret)
        .update(body)
        .digest("hex");
      return expected === params.razorpay_signature;
    } catch {
      return false;
    }
  }

  /**
   * Verify Razorpay webhook signature.
   * Header: X-Razorpay-Signature
   */
  static verifyWebhookSignature(rawBody: string, signature: string, webhookSecret: string): boolean {
    try {
      const expected = crypto
        .createHmac("sha256", webhookSecret)
        .update(rawBody)
        .digest("hex");
      return expected === signature;
    } catch {
      return false;
    }
  }
}

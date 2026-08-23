import nodemailer from "nodemailer";

// Create Nodemailer Transporter using Gmail SMTP config from env
const getTransporter = () => {
  const host = process.env.EMAIL_HOST || "smtp.gmail.com";
  const port = parseInt(process.env.EMAIL_PORT || "465");
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!user || !pass) {
    console.warn("[Email Service] Missing EMAIL_USER or EMAIL_PASS environment variables.");
  }

  return nodemailer.createTransport({
    host,
    port,
    secure: port === 465, // true for 465, false for other ports
    auth: {
      user,
      pass,
    },
    tls: {
      rejectUnauthorized: false
    }
  });
};

interface SendMailOptions {
  from: string;
  to: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  subject: string;
  html: string;
}

async function sendMail(options: SendMailOptions): Promise<void> {
  const pass = process.env.EMAIL_PASS || "";

  if (pass.startsWith("xkeysib-")) {
    console.log("[Email Service] Detected Brevo API Key. Sending email via Brevo HTTP API...");

    let senderName = "Boutiique Vastraa";
    let senderEmail = process.env.EMAIL_FROM || "boutiquevastra80@gmail.com";

    const fromMatch = options.from.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
    if (fromMatch) {
      if (fromMatch[1]) senderName = fromMatch[1].trim();
      if (fromMatch[2]) senderEmail = fromMatch[2].trim();
    }

    const formatRecipients = (recipients: string | string[]): { email: string; name?: string }[] => {
      const list = Array.isArray(recipients) ? recipients : [recipients];
      return list.map(item => {
        const match = item.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
        if (match) {
          return {
            email: match[2].trim(),
            name: match[1] ? match[1].trim() : undefined
          };
        }
        return { email: item.trim() };
      });
    };

    const toList = formatRecipients(options.to);
    const bccList = options.bcc ? formatRecipients(options.bcc) : undefined;

    let replyToObj = undefined;
    if (options.replyTo) {
      const replyMatch = options.replyTo.match(/^(?:"?([^"]*)"?\s)?<?([^>]+)>?$/);
      if (replyMatch) {
        replyToObj = {
          email: replyMatch[2].trim(),
          name: replyMatch[1] ? replyMatch[1].trim() : undefined
        };
      } else {
        replyToObj = { email: options.replyTo.trim() };
      }
    }

    const payload: any = {
      sender: { name: senderName, email: senderEmail },
      to: toList,
      subject: options.subject,
      htmlContent: options.html,
    };

    if (bccList && bccList.length > 0) {
      payload.bcc = bccList;
    }

    if (replyToObj) {
      payload.replyTo = replyToObj;
    }

    const res = await fetch("https://api.brevo.com/v3/smtp/email", {
      method: "POST",
      headers: {
        "accept": "application/json",
        "api-key": pass,
        "content-type": "application/json",
      },
      body: JSON.stringify(payload),
    });

    if (!res.ok) {
      const errorData = await res.json().catch(() => ({}));
      throw new Error(`Brevo API returned status ${res.status}: ${JSON.stringify(errorData)}`);
    }

    const data = await res.json();
    console.log(`[Email Service] Email successfully sent via Brevo HTTP API. Message ID: ${data.messageId}`);
    return;
  }

  console.log("[Email Service] Fallback: Sending via Nodemailer SMTP...");
  const transporter = getTransporter();
  await transporter.sendMail(options);
}

/**
 * Format currency in INR format
 */
const formatINR = (amount: any): string => {
  const num = parseFloat(amount);
  if (isNaN(num)) return "₹0.00";
  return new Intl.NumberFormat("en-IN", {
    style: "currency",
    currency: "INR",
    maximumFractionDigits: 0,
  }).format(num);
};

/**
 * Send an order confirmation email to the customer and a copy to the admin
 */
export async function sendOrderConfirmationEmail(order: any): Promise<void> {
  const fromName = process.env.EMAIL_FROM_NAME || "Boutiique Vastraa";
  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const customerEmail = order.email;

  if (!customerEmail) {
    console.error(`[Email Service] Cannot send order email: Customer email is missing for Order #${order.orderNumber}`);
    return;
  }

  // Calculate delivery date range: 5 to 7 days from order date
  const processedDate = new Date(order.processedAt || order.createdAt || new Date());
  const estMin = new Date(processedDate);
  estMin.setDate(processedDate.getDate() + 5);
  const estMax = new Date(processedDate);
  estMax.setDate(processedDate.getDate() + 7);
  const options: Intl.DateTimeFormatOptions = { month: "short", day: "numeric", year: "numeric" };
  const estDeliveryStr = `${estMin.toLocaleDateString("en-US", options)} - ${estMax.toLocaleDateString("en-US", options)}`;

  const lineItems = order.lineItems || order.items || [];
  const totalAmount = order.totalPrice?.amount || order.totalAmount || "0";
  const subtotal = lineItems.reduce((acc: number, item: any) => {
    return acc + (parseFloat(item.price) * (parseInt(item.quantity) || 1));
  }, 0);
  const discount = parseFloat(order.discount || "0");

  // Construct items HTML table
  let itemsHtml = "";
  for (const item of lineItems) {
    itemsHtml += `
      <tr style="border-bottom: 1px solid #f3f4f6;">
        <td style="padding: 12px 8px; text-align: left; vertical-align: middle;">
          <div style="font-weight: 600; color: #171717; font-size: 14px;">${item.title}</div>
          <div style="font-size: 12px; color: #737373; margin-top: 2px;">Variant: ${item.variantTitle || "Default"}</div>
        </td>
        <td style="padding: 12px 8px; text-align: center; color: #525252; font-size: 14px;">${item.quantity}</td>
        <td style="padding: 12px 8px; text-align: right; font-weight: 700; color: #171717; font-size: 14px;">
          ${item.isGift ? '<span style="color: #16a34a; font-size: 11px; background-color: #f0fdf4; padding: 2px 6px; border-radius: 4px; border: 1px solid #dcfce7;">FREE</span>' : formatINR(item.price)}
        </td>
      </tr>
    `;
  }

  // HTML Email Template matching the premium boutique aesthetic
  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Order Confirmed - Boutiique Vastraa</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #FFFDF9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFDF9; padding: 20px 0;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #FFF8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(141, 11, 65, 0.03);">
              
              <!-- Header Section -->
              <tr>
                <td style="background-color: #8D0B41; padding: 40px 20px; text-align: center; border-bottom: 4px solid #C9A84C;">
                  <h1 style="color: #FFF8F0; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Boutiique Vastraa</h1>
                  <p style="color: #C9A84C; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">Heritage & Handloom</p>
                </td>
              </tr>
              
              <!-- Thank You Note -->
              <tr>
                <td style="padding: 40px 30px 20px 30px; text-align: center;">
                  <div style="width: 48px; height: 48px; background-color: #fcf6e8; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; text-align: center; border: 1px solid #f6e8c7;">
                    <span style="font-size: 24px; color: #C9A84C; line-height: 48px;">✓</span>
                  </div>
                  <h2 style="color: #8D0B41; margin: 0 0 10px 0; font-size: 22px; font-weight: 700;">Order Confirmed!</h2>
                  <p style="color: #525252; margin: 0; font-size: 15px; line-height: 1.6;">
                    Thank you, <strong>${order.customerName || "Customer"}</strong>. Your order has been placed successfully and is being handcrafted by our weavers.
                  </p>
                </td>
              </tr>

              <!-- Order Reference Info -->
              <tr>
                <td style="padding: 10px 30px 20px 30px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; padding: 20px 0;">
                    <tr>
                      <td style="width: 50%; vertical-align: top; padding-right: 10px;">
                        <span style="color: #a3a3a3; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Order Number</span>
                        <span style="font-family: monospace; font-size: 14px; font-weight: 700; color: #171717;">#VSTR-${order.orderNumber}</span>
                      </td>
                      <td style="width: 50%; vertical-align: top; padding-left: 10px;">
                        <span style="color: #a3a3a3; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Est. Delivery</span>
                        <span style="font-size: 14px; font-weight: 700; color: #171717;">${estDeliveryStr}</span>
                      </td>
                    </tr>
                    <tr style="height: 15px;"><td></td><td></td></tr>
                    <tr>
                      <td style="width: 50%; vertical-align: top; padding-right: 10px;">
                        <span style="color: #a3a3a3; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Payment Gateway</span>
                        <span style="font-size: 14px; font-weight: 600; color: #525252;">${order.paymentGateway === "COD" ? "Cash on Delivery" : "PhonePe Gateway"}</span>
                      </td>
                      <td style="width: 50%; vertical-align: top; padding-left: 10px;">
                        <span style="color: #a3a3a3; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Fulfillment</span>
                        <span style="font-size: 14px; font-weight: 600; color: #525252;">Free Express Shipping</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Items Table -->
              <tr>
                <td style="padding: 10px 30px 20px 30px;">
                  <h3 style="color: #8D0B41; margin: 0 0 12px 0; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Items Ordered</h3>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-collapse: collapse;">
                    <thead>
                      <tr style="border-bottom: 2px solid #FFF8F0;">
                        <th style="padding: 8px; text-align: left; color: #a3a3a3; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Product</th>
                        <th style="padding: 8px; text-align: center; color: #a3a3a3; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; width: 60px;">Qty</th>
                        <th style="padding: 8px; text-align: right; color: #a3a3a3; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; width: 90px;">Price</th>
                      </tr>
                    </thead>
                    <tbody>
                      ${itemsHtml}
                    </tbody>
                  </table>
                </td>
              </tr>

              <!-- Cost breakdown -->
              <tr>
                <td style="padding: 10px 30px 25px 30px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFF8F0; border-radius: 12px; padding: 20px; border: 1px solid #fbf2e5;">
                    <tr>
                      <td style="color: #525252; font-size: 14px; padding-bottom: 8px;">Subtotal</td>
                      <td align="right" style="color: #171717; font-size: 14px; font-weight: 600; padding-bottom: 8px;">${formatINR(subtotal)}</td>
                    </tr>
                    ${discount > 0 ? `
                    <tr>
                      <td style="color: #525252; font-size: 14px; padding-bottom: 8px;">Promo Discount</td>
                      <td align="right" style="color: #16a34a; font-size: 14px; font-weight: 600; padding-bottom: 8px;">-${formatINR(discount)}</td>
                    </tr>
                    ` : ""}
                    <tr>
                      <td style="color: #525252; font-size: 14px; padding-bottom: 8px;">Shipping</td>
                      <td align="right" style="color: #16a34a; font-size: 13px; font-weight: 700; text-transform: uppercase; padding-bottom: 8px;">Free</td>
                    </tr>
                    <tr style="border-top: 1px solid #f6e8c7;">
                      <td style="color: #171717; font-weight: 700; font-size: 15px; padding-top: 12px; text-transform: uppercase; letter-spacing: 0.5px;">Total Paid</td>
                      <td align="right" style="color: #8D0B41; font-weight: 700; font-size: 18px; padding-top: 12px;">${formatINR(totalAmount)}</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Address Details -->
              <tr>
                <td style="padding: 10px 30px 40px 30px;">
                  <h3 style="color: #8D0B41; margin: 0 0 12px 0; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Delivery Address</h3>
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #f3f4f6;">
                    <tr>
                      <td style="font-size: 14px; line-height: 1.6; color: #525252;">
                        <strong style="color: #171717; font-size: 15px; display: block; margin-bottom: 5px;">${order.customerName}</strong>
                        ${order.shippingAddress?.address1 || ""}<br>
                        ${order.shippingAddress?.address2 ? order.shippingAddress.address2 + "<br>" : ""}
                        ${order.shippingAddress?.city || ""}, ${order.shippingAddress?.province || ""} ${order.shippingAddress?.zip || ""}<br>
                        ${order.shippingAddress?.country || "India"}<br>
                        <span style="font-size: 12px; color: #737373; display: block; margin-top: 8px;">Phone: ${order.phone || "N/A"}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Footer Section -->
              <tr>
                <td style="background-color: #FFF8F0; padding: 30px 20px; text-align: center; border-top: 1px solid #fbeed2;">
                  <p style="color: #8D0B41; margin: 0 0 8px 0; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">Need Help?</p>
                  <p style="color: #525252; margin: 0 0 20px 0; font-size: 13px; line-height: 1.5;">
                    If you have any questions regarding your order, feel free to reply directly to this email or contact support at <a href="mailto:boutiiquevastraa@gmail.com" style="color: #8D0B41; text-decoration: none; font-weight: 600;">boutiiquevastraa@gmail.com</a>.
                  </p>
                  <p style="color: #a3a3a3; margin: 0; font-size: 11px;">
                    © ${new Date().getFullYear()} Boutiique Vastraa. All rights reserved.<br>
                    Nabadwip, West Bengal, Nadia, 741302, India.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: customerEmail,
    bcc: fromEmail, // send a copy to the shop admin
    subject: `Order Confirmed - #VSTR-${order.orderNumber}`,
    html: htmlContent,
  };

  try {
    await sendMail(mailOptions);
    console.log(`[Email Service] Order confirmation email successfully sent for Order #VSTR-${order.orderNumber} to ${customerEmail}`);
  } catch (err: any) {
    console.error(`[Email Service] Failed to send email for Order #VSTR-${order.orderNumber}:`, err.message);
    throw err; // rethrow to let callers log appropriately
  }
}

/**
 * Send a contact form response directly to the admin
 */
export async function sendContactFormEmail(name: string, email: string, message: string): Promise<void> {
  const fromName = process.env.EMAIL_FROM_NAME || "Boutiique Vastraa Support";
  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const toEmail = process.env.EMAIL_USER || fromEmail; // Send to admin email

  if (!toEmail) {
    console.error("[Email Service] Cannot send contact form email: Admin recipient address is missing.");
    return;
  }

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>New Message received - Boutiique Vastraa</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #FFFDF9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFDF9; padding: 20px 0;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #FFF8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(141, 11, 65, 0.03);">
              
              <!-- Header Section -->
              <tr>
                <td style="background-color: #8D0B41; padding: 30px 20px; text-align: center; border-bottom: 4px solid #C9A84C;">
                  <h1 style="color: #FFF8F0; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Boutiique Vastraa</h1>
                  <p style="color: #C9A84C; margin: 5px 0 0 0; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">Customer Query Notification</p>
                </td>
              </tr>
              
              <!-- Notification Info -->
              <tr>
                <td style="padding: 40px 30px 10px 30px;">
                  <h2 style="color: #8D0B41; margin: 0 0 15px 0; font-size: 20px; font-weight: 700;">New Contact Form Message</h2>
                  <p style="color: #525252; margin: 0; font-size: 14px; line-height: 1.6;">
                    Hello Admin, a customer has filled out the contact form on boutiiquevastraa.com. Below are the details:
                  </p>
                </td>
              </tr>

              <!-- Customer Details Card -->
              <tr>
                <td style="padding: 10px 30px 20px 30px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFF8F0; border-radius: 12px; padding: 20px; border: 1px solid #fbf2e5;">
                    <tr>
                      <td style="width: 25%; font-weight: 700; color: #8D0B41; font-size: 13px; text-transform: uppercase; padding-bottom: 8px;">Name:</td>
                      <td style="color: #171717; font-size: 14px; padding-bottom: 8px;">${name}</td>
                    </tr>
                    <tr>
                      <td style="width: 25%; font-weight: 700; color: #8D0B41; font-size: 13px; text-transform: uppercase; padding-bottom: 8px;">Email:</td>
                      <td style="color: #171717; font-size: 14px; padding-bottom: 8px;">
                        <a href="mailto:${email}" style="color: #8D0B41; font-weight: 600; text-decoration: none;">${email}</a>
                      </td>
                    </tr>
                    <tr>
                      <td style="width: 25%; font-weight: 700; color: #8D0B41; font-size: 13px; text-transform: uppercase;">Sent At:</td>
                      <td style="color: #737373; font-size: 13px;">${new Date().toLocaleString("en-US", { timeZone: "Asia/Kolkata" })} IST</td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Message Body -->
              <tr>
                <td style="padding: 10px 30px 40px 30px;">
                  <h3 style="color: #8D0B41; margin: 0 0 10px 0; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px;">Message:</h3>
                  <div style="background-color: #ffffff; border-radius: 12px; padding: 20px; border: 1px solid #e5e5e5; color: #171717; font-size: 14px; line-height: 1.6; white-space: pre-wrap;">${message}</div>
                </td>
              </tr>

              <!-- Action Prompt -->
              <tr>
                <td style="background-color: #FFF8F0; padding: 30px 20px; text-align: center; border-top: 1px solid #fbeed2;">
                  <p style="color: #525252; margin: 0 0 15px 0; font-size: 13px; line-height: 1.5;">
                    To reply to this customer, click the button below to compose a direct response.
                  </p>
                  <a href="mailto:${email}?subject=Re:%20Boutiique%20Vastraa%20Query" style="background-color: #8D0B41; color: #ffffff; padding: 12px 24px; border-radius: 8px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; display: inline-block;">Reply to Customer</a>
                  <p style="color: #a3a3a3; margin: 20px 0 0 0; font-size: 10px;">
                    © ${new Date().getFullYear()} Boutiique Vastraa. Generated automatically.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: toEmail,
    replyTo: email, // Admin can click "Reply" to write directly to customer
    subject: `New Contact Submission from ${name}`,
    html: htmlContent,
  };

  try {
    await sendMail(mailOptions);
    console.log(`[Email Service] Contact form notification email sent to admin (${toEmail}) for query from ${name}`);
  } catch (err: any) {
    console.error(`[Email Service] Failed to send contact form notification to admin:`, err.message);
    throw err;
  }
}

/**
 * Send a password reset link to the customer
 */
export async function sendPasswordResetEmail(email: string, resetLink: string): Promise<void> {
  const fromName = process.env.EMAIL_FROM_NAME || "Boutiique Vastraa";
  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Reset Your Password - Boutiique Vastraa</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #FFFDF9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFDF9; padding: 20px 0;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #FFF8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(141, 11, 65, 0.03);">
              
              <!-- Header Section -->
              <tr>
                <td style="background-color: #8D0B41; padding: 30px 20px; text-align: center; border-bottom: 4px solid #C9A84C;">
                  <h1 style="color: #FFF8F0; margin: 0; font-size: 24px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Boutiique Vastraa</h1>
                  <p style="color: #C9A84C; margin: 5px 0 0 0; font-size: 11px; letter-spacing: 3px; text-transform: uppercase;">Password Reset Request</p>
                </td>
              </tr>
              
              <!-- Content Body -->
              <tr>
                <td style="padding: 40px 30px 30px 30px; text-align: center;">
                  <h2 style="color: #8D0B41; margin: 0 0 15px 0; font-size: 20px; font-weight: 700;">Reset Your Password</h2>
                  <p style="color: #525252; margin: 0 0 30px 0; font-size: 14px; line-height: 1.6;">
                    We received a request to reset the password for your Boutiique Vastraa account. Click the button below to choose a new password. This link is valid for 15 minutes.
                  </p>
                  
                  <!-- Reset Button -->
                  <a href="${resetLink}" style="background-color: #8D0B41; color: #ffffff; padding: 14px 28px; border-radius: 8px; font-size: 13px; font-weight: 700; text-transform: uppercase; letter-spacing: 1.5px; text-decoration: none; display: inline-block; box-shadow: 0 4px 10px rgba(141, 11, 65, 0.2);">Reset Password</a>
                  
                  <p style="color: #737373; margin: 30px 0 0 0; font-size: 13px; line-height: 1.5;">
                    If you did not request a password reset, you can safely ignore this email. Your password will remain unchanged.
                  </p>
                </td>
              </tr>

              <!-- Troubleshooting Link -->
              <tr>
                <td style="padding: 0 30px 30px 30px; text-align: center;">
                  <p style="color: #a3a3a3; margin: 0 0 10px 0; font-size: 11px;">
                    If the button above doesn't work, copy and paste the URL below into your web browser:
                  </p>
                  <p style="color: #8D0B41; margin: 0; font-size: 12px; word-break: break-all;">
                    <a href="${resetLink}" style="color: #8D0B41; text-decoration: underline;">${resetLink}</a>
                  </p>
                </td>
              </tr>

              <!-- Footer Section -->
              <tr>
                <td style="background-color: #FFF8F0; padding: 30px 20px; text-align: center; border-top: 1px solid #fbeed2;">
                  <p style="color: #8D0B41; margin: 0 0 8px 0; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">Need Help?</p>
                  <p style="color: #525252; margin: 0 0 20px 0; font-size: 13px; line-height: 1.5;">
                    If you have any issues resetting your password, reply directly to this email or contact support at <a href="mailto:boutiiquevastraa@gmail.com" style="color: #8D0B41; text-decoration: none; font-weight: 600;">boutiiquevastraa@gmail.com</a>.
                  </p>
                  <p style="color: #a3a3a3; margin: 0; font-size: 11px;">
                    © ${new Date().getFullYear()} Boutiique Vastraa. All rights reserved.<br>
                    Nabadwip, West Bengal, Nadia, 741302, India.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: email,
    subject: "Reset Your Password - Boutiique Vastraa",
    html: htmlContent,
  };

  try {
    await sendMail(mailOptions);
    console.log(`[Email Service] Password reset email sent to ${email}`);
  } catch (err: any) {
    console.error(`[Email Service] Failed to send password reset email to ${email}:`, err.message);
    throw err;
  }
}

/**
 * Send an order status update email to the customer
 */
export async function sendOrderStatusUpdateEmail(order: any, status: string, trackingDetails?: any): Promise<void> {
  const fromName = process.env.EMAIL_FROM_NAME || "Boutiique Vastraa";
  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const customerEmail = order.email;

  if (!customerEmail) {
    console.error(`[Email Service] Cannot send status update email: Customer email is missing for Order #${order.orderNumber}`);
    return;
  }

  // Normalize status text for display
  const statusUpper = status.toUpperCase();
  let statusTitle = "Order Updated";
  let statusDescription = `Your order status has been updated.`;
  let icon = "🔔";
  let subjectText = `Order Update - #VSTR-${order.orderNumber}`;

  if (statusUpper.includes("SHIPPED")) {
    statusTitle = "Order Shipped!";
    statusDescription = "Exciting news! Your handcrafted items have been shipped and are on the way to you.";
    icon = "✈️";
    subjectText = `Your Order Has Been Shipped! - #VSTR-${order.orderNumber}`;
  } else if (statusUpper.includes("OUT_FOR_DELIVERY") || statusUpper.includes("OUT FOR DELIVERY")) {
    statusTitle = "Out for Delivery!";
    statusDescription = "Your order is with our courier partner and will be delivered to your doorstep today.";
    icon = "🚚";
    subjectText = `Your Order is Out for Delivery! - #VSTR-${order.orderNumber}`;
  } else if (statusUpper.includes("DELIVERED")) {
    statusTitle = "Delivered!";
    statusDescription = "Your handcrafted products have been delivered. We hope you love them!";
    icon = "🎁";
    subjectText = `Your Order Has Been Delivered! - #VSTR-${order.orderNumber}`;
  } else if (statusUpper.includes("CANCELLED")) {
    statusTitle = "Order Cancelled";
    statusDescription = "Your order has been cancelled. If payment was made, your refund is being processed.";
    icon = "❌";
    subjectText = `Your Order Has Been Cancelled - #VSTR-${order.orderNumber}`;
  }

  const trackingHtml = trackingDetails && trackingDetails.awb ? `
    <tr>
      <td style="padding: 10px 30px 20px 30px;">
        <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFF8F0; border-radius: 12px; padding: 20px; border: 1px solid #fbf2e5;">
          <tr>
            <td style="color: #8D0B41; font-weight: 700; font-size: 13px; text-transform: uppercase; padding-bottom: 8px;">Courier Service</td>
            <td align="right" style="color: #171717; font-size: 14px; font-weight: 600; padding-bottom: 8px;">${trackingDetails.courier || "Shiprocket"}</td>
          </tr>
          <tr>
            <td style="color: #8D0B41; font-weight: 700; font-size: 13px; text-transform: uppercase; padding-bottom: 8px;">AWB/Tracking Number</td>
            <td align="right" style="color: #171717; font-size: 14px; font-weight: 600; padding-bottom: 8px; font-family: monospace;">${trackingDetails.awb}</td>
          </tr>
          ${trackingDetails.link ? `
          <tr>
            <td colspan="2" style="text-align: center; padding-top: 12px;">
              <a href="${trackingDetails.link}" style="background-color: #8D0B41; color: #ffffff; padding: 8px 16px; border-radius: 6px; font-size: 12px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; display: inline-block;">Track Shipment</a>
            </td>
          </tr>
          ` : ""}
        </table>
      </td>
    </tr>
  ` : "";

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>${statusTitle} - Boutiique Vastraa</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #FFFDF9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFDF9; padding: 20px 0;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #FFF8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(141, 11, 65, 0.03);">
              
              <!-- Header Section -->
              <tr>
                <td style="background-color: #8D0B41; padding: 40px 20px; text-align: center; border-bottom: 4px solid #C9A84C;">
                  <h1 style="color: #FFF8F0; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Boutiique Vastraa</h1>
                  <p style="color: #C9A84C; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">Heritage & Handloom</p>
                </td>
              </tr>
              
              <!-- Status Update Note -->
              <tr>
                <td style="padding: 40px 30px 20px 30px; text-align: center;">
                  <div style="width: 48px; height: 48px; background-color: #fcf6e8; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; text-align: center; border: 1px solid #f6e8c7; line-height: 48px;">
                    <span style="font-size: 24px;">${icon}</span>
                  </div>
                  <h2 style="color: #8D0B41; margin: 0 0 10px 0; font-size: 22px; font-weight: 700;">${statusTitle}</h2>
                  <p style="color: #525252; margin: 0; font-size: 15px; line-height: 1.6;">
                    Hello <strong>${order.customerName || "Customer"}</strong>, ${statusDescription}
                  </p>
                </td>
              </tr>

              <!-- Order Summary Block -->
              <tr>
                <td style="padding: 10px 30px 20px 30px;">
                  <table border="0" cellpadding="0" cellspacing="0" width="100%" style="border-top: 1px solid #f3f4f6; border-bottom: 1px solid #f3f4f6; padding: 20px 0;">
                    <tr>
                      <td style="width: 50%; vertical-align: top; padding-right: 10px;">
                        <span style="color: #a3a3a3; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Order Number</span>
                        <span style="font-family: monospace; font-size: 14px; font-weight: 700; color: #171717;">#VSTR-${order.orderNumber}</span>
                      </td>
                      <td style="width: 50%; vertical-align: top; padding-left: 10px;">
                        <span style="color: #a3a3a3; font-size: 11px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; display: block; margin-bottom: 4px;">Total Price</span>
                        <span style="font-size: 14px; font-weight: 700; color: #8D0B41;">${formatINR(order.totalPrice?.amount || order.totalAmount || "0")}</span>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>

              <!-- Tracking Info -->
              ${trackingHtml}

              <!-- Footer Section -->
              <tr>
                <td style="background-color: #FFF8F0; padding: 30px 20px; text-align: center; border-top: 1px solid #fbeed2;">
                  <p style="color: #8D0B41; margin: 0 0 8px 0; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">Need Help?</p>
                  <p style="color: #525252; margin: 0 0 20px 0; font-size: 13px; line-height: 1.5;">
                    If you have any questions regarding your shipment, feel free to reply directly to this email or contact support at <a href="mailto:boutiiquevastraa@gmail.com" style="color: #8D0B41; text-decoration: none; font-weight: 600;">boutiiquevastraa@gmail.com</a>.
                  </p>
                  <p style="color: #a3a3a3; margin: 0; font-size: 11px;">
                    © ${new Date().getFullYear()} Boutiique Vastraa. All rights reserved.<br>
                    Nabadwip, West Bengal, Nadia, 741302, India.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: customerEmail,
    subject: subjectText,
    html: htmlContent,
  };

  try {
    await sendMail(mailOptions);
    console.log(`[Email Service] Status update email sent successfully to ${customerEmail} for Order #VSTR-${order.orderNumber}`);
  } catch (err: any) {
    console.error(`[Email Service] Failed to send status update email for Order #VSTR-${order.orderNumber}:`, err.message);
  }
}

/**
 * Send back in stock email notification to customer
 */
export async function sendBackInStockEmail(customerEmail: string, productTitle: string, productUrl: string): Promise<void> {
  const fromName = process.env.EMAIL_FROM_NAME || "Boutiique Vastraa";
  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  if (!customerEmail) {
    console.error("[Email Service] Cannot send back-in-stock email: customerEmail is missing");
    return;
  }

  const subjectText = `Back In Stock: "${productTitle}" - Boutiique Vastraa`;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Back in Stock! - Boutiique Vastraa</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #FFFDF9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Helvetica, Arial, sans-serif; -webkit-font-smoothing: antialiased;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFDF9; padding: 20px 0;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #FFF8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(141, 11, 65, 0.03);">
              
              <!-- Header Section -->
              <tr>
                <td style="background-color: #8D0B41; padding: 40px 20px; text-align: center; border-bottom: 4px solid #C9A84C;">
                  <h1 style="color: #FFF8F0; margin: 0; font-size: 28px; font-weight: 700; letter-spacing: 2px; text-transform: uppercase;">Boutiique Vastraa</h1>
                  <p style="color: #C9A84C; margin: 5px 0 0 0; font-size: 12px; letter-spacing: 3px; text-transform: uppercase;">Heritage & Handloom</p>
                </td>
              </tr>
              
              <!-- Content Section -->
              <tr>
                <td style="padding: 40px 30px 30px 30px; text-align: center;">
                  <div style="width: 48px; height: 48px; background-color: #fcf6e8; border-radius: 50%; display: inline-flex; align-items: center; justify-content: center; margin-bottom: 20px; text-align: center; border: 1px solid #f6e8c7; line-height: 48px;">
                    <span style="font-size: 24px;">✨</span>
                  </div>
                  <h2 style="color: #8D0B41; margin: 0 0 10px 0; font-size: 22px; font-weight: 700;">It's Back in Stock!</h2>
                  <p style="color: #525252; margin: 0 0 24px 0; font-size: 15px; line-height: 1.6; text-align: left;">
                    Hello,
                    <br><br>
                    Great news! The product you wanted, <strong>${productTitle}</strong>, is now back in stock and ready to order. 
                    <br><br>
                    Since our premium handloom designs are carefully curated and available in very limited quantities, they often sell out quickly. We recommend completing your purchase soon to ensure you don't miss out.
                  </p>
                  
                  <!-- CTA Button -->
                  <a href="${productUrl}" style="background-color: #8D0B41; color: #ffffff; padding: 12px 28px; border-radius: 6px; font-size: 14px; font-weight: 700; text-transform: uppercase; letter-spacing: 1px; text-decoration: none; display: inline-block; box-shadow: 0 2px 4px rgba(141, 11, 65, 0.2);">View Product</a>
                </td>
              </tr>

              <!-- Footer Section -->
              <tr>
                <td style="background-color: #FFF8F0; padding: 30px 20px; text-align: center; border-top: 1px solid #fbeed2;">
                  <p style="color: #8D0B41; margin: 0 0 8px 0; font-size: 13px; font-weight: 700; letter-spacing: 0.5px;">Need Help?</p>
                  <p style="color: #525252; margin: 0 0 20px 0; font-size: 13px; line-height: 1.5;">
                    If you have any questions or need assistance, feel free to reply directly to this email or contact support at <a href="mailto:boutiiquevastraa@gmail.com" style="color: #8D0B41; text-decoration: none; font-weight: 600;">boutiiquevastraa@gmail.com</a>.
                  </p>
                  <p style="color: #a3a3a3; margin: 0; font-size: 11px;">
                    © ${new Date().getFullYear()} Boutiique Vastraa. All rights reserved.<br>
                    Nabadwip, West Bengal, Nadia, 741302, India.
                  </p>
                </td>
              </tr>

            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: customerEmail,
    subject: subjectText,
    html: htmlContent,
  };

  try {
    await sendMail(mailOptions);
    console.log(`[Email Service] Back-in-stock notification sent to ${customerEmail} for "${productTitle}"`);
  } catch (err: any) {
    console.error(`[Email Service] Failed to send back-in-stock email for "${productTitle}":`, err.message);
  }
}

/**
 * Send a welcome email to a newly registered user
 */
export async function sendWelcomeEmail(user: any): Promise<void> {
  const fromName = process.env.EMAIL_FROM_NAME || "Boutiique Vastraa";
  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;
  const customerEmail = user.email;

  if (!customerEmail) return;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to Boutiique Vastraa</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #FFFDF9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFDF9; padding: 20px 0;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #FFF8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(141, 11, 65, 0.03);">
              <tr>
                <td style="background-color: #8D0B41; padding: 40px 20px; text-align: center; border-bottom: 4px solid #C9A84C;">
                  <h1 style="color: #C9A84C; margin: 0; font-size: 28px; font-family: Georgia, serif; letter-spacing: 2px;">BOUTIIQUE VASTRAA</h1>
                  <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px; font-weight: 300; letter-spacing: 1px; text-transform: uppercase;">Welcome to our Family</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #171717; font-size: 20px; font-weight: 700; margin: 0 0 16px 0; font-family: Georgia, serif;">Namaste, ${user.firstName || "Customer"}!</p>
                  <p style="color: #525252; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                    Thank you for creating an account with Boutiique Vastraa. We are delighted to have you with us. Explore our curated selection of handloom sarees, designer kurtis, lehengas, and fine jewellery sourced directly from skilled weavers across India.
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://boutiiquevastraa.com/collections/all" style="background-color: #8D0B41; color: #ffffff; padding: 14px 28px; border-radius: 6px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 6px rgba(141, 11, 65, 0.15);">Explore Collection</a>
                  </div>
                  <p style="color: #525252; font-size: 14px; line-height: 1.6; margin: 0;">
                    Enjoy free shipping on all orders delivered within India. If you need any assistance, feel free to contact us via Call/WhatsApp at <strong>+91 - 9205238666</strong> or reply directly to this email.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #FFF8F0; padding: 30px 20px; text-align: center; border-top: 1px solid #fbeed2;">
                  <p style="color: #a3a3a3; margin: 0; font-size: 11px;">
                    © ${new Date().getFullYear()} Boutiique Vastraa. All rights reserved.<br>
                    Nabadwip, West Bengal, Nadia, 741302, India.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: customerEmail,
    bcc: "boutiiquevastraa@gmail.com",
    subject: "Welcome to Boutiique Vastraa!",
    html: htmlContent,
  };

  try {
    await sendMail(mailOptions);
    console.log(`[Email Service] Welcome email successfully sent to ${customerEmail}`);
  } catch (err: any) {
    console.error(`[Email Service] Failed to send welcome email to ${customerEmail}:`, err.message);
  }
}

/**
 * Send a welcome newsletter subscription email to the subscriber
 */
export async function sendNewsletterWelcomeEmail(email: string): Promise<void> {
  const fromName = process.env.EMAIL_FROM_NAME || "Boutiique Vastraa";
  const fromEmail = process.env.EMAIL_FROM || process.env.EMAIL_USER;

  const htmlContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <meta charset="utf-8">
      <title>Welcome to our Newsletter - Boutiique Vastraa</title>
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
    </head>
    <body style="margin: 0; padding: 0; background-color: #FFFDF9; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;">
      <table border="0" cellpadding="0" cellspacing="0" width="100%" style="background-color: #FFFDF9; padding: 20px 0;">
        <tr>
          <td align="center">
            <table border="0" cellpadding="0" cellspacing="0" width="100%" style="max-width: 600px; background-color: #ffffff; border-radius: 16px; border: 1px solid #FFF8F0; overflow: hidden; box-shadow: 0 4px 12px rgba(141, 11, 65, 0.03);">
              <tr>
                <td style="background-color: #8D0B41; padding: 40px 20px; text-align: center; border-bottom: 4px solid #C9A84C;">
                  <h1 style="color: #C9A84C; margin: 0; font-size: 28px; font-family: Georgia, serif; letter-spacing: 2px;">BOUTIIQUE VASTRAA</h1>
                  <p style="color: #ffffff; margin: 10px 0 0 0; font-size: 14px; font-weight: 300; letter-spacing: 1px; text-transform: uppercase;">Newsletter Subscription Confirmed</p>
                </td>
              </tr>
              <tr>
                <td style="padding: 40px 30px;">
                  <p style="color: #171717; font-size: 20px; font-weight: 700; margin: 0 0 16px 0; font-family: Georgia, serif;">Namaste!</p>
                  <p style="color: #525252; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                    Thank you for subscribing to the Boutiique Vastraa newsletter. You are now part of our exclusive circle!
                  </p>
                  <p style="color: #525252; font-size: 15px; line-height: 1.6; margin: 0 0 24px 0;">
                    From now on, you'll be the first to receive updates on our latest handloom collections, direct weaver partnerships, exclusive privilege savings, and cultural stories from our legacy weavers across Bengal and Banaras.
                  </p>
                  <div style="text-align: center; margin: 30px 0;">
                    <a href="https://boutiiquevastraa.com/collections/all" style="background-color: #8D0B41; color: #ffffff; padding: 14px 28px; border-radius: 6px; font-weight: bold; text-decoration: none; display: inline-block; font-size: 14px; text-transform: uppercase; letter-spacing: 1px; box-shadow: 0 4px 6px rgba(141, 11, 65, 0.15);">Shop New Arrivals</a>
                  </div>
                  <p style="color: #525252; font-size: 14px; line-height: 1.6; margin: 0;">
                    If you did not sign up for this newsletter, you can safely unsubscribe at any time by contacting us at <a href="mailto:boutiiquevastraa@gmail.com" style="color: #8D0B41; text-decoration: none; font-weight: 600;">boutiiquevastraa@gmail.com</a>.
                  </p>
                </td>
              </tr>
              <tr>
                <td style="background-color: #FFF8F0; padding: 30px 20px; text-align: center; border-top: 1px solid #fbeed2;">
                  <p style="color: #a3a3a3; margin: 0; font-size: 11px;">
                    © ${new Date().getFullYear()} Boutiique Vastraa. All rights reserved.<br>
                    Nabadwip, West Bengal, Nadia, 741302, India.
                  </p>
                </td>
              </tr>
            </table>
          </td>
        </tr>
      </table>
    </body>
    </html>
  `;

  const mailOptions = {
    from: `"${fromName}" <${fromEmail}>`,
    to: email,
    subject: "Welcome to Boutiique Vastraa Newsletter!",
    html: htmlContent,
  };

  try {
    await sendMail(mailOptions);
    console.log(`[Email Service] Newsletter welcome email successfully sent to ${email}`);
  } catch (err: any) {
    console.error(`[Email Service] Failed to send newsletter welcome email to ${email}:`, err.message);
  }
}



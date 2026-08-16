"use server";

import { verifyAdminSession } from "./adminAuth";
import { revalidatePath } from "next/cache";
import { apiPatch, apiPost, apiGet } from "@/lib/api/client";

async function requireAuth() {
  const isLogged = await verifyAdminSession();
  if (!isLogged) throw new Error("Unauthorized access.");
}

export async function updateOrderStatusAction(orderId: string, status: string) {
  try {
    await requireAuth();
    const { initDataStore, orders } = await import("@/lib/data-store");
    await initDataStore();
    const all = await orders.all();
    const cleanId = String(orderId);

    const order = all.find(
      (o: any) =>
        String(o.id) === cleanId ||
        String(o.orderNumber) === cleanId ||
        String(o.id) === cleanId.replace("order_", "")
    );

    if (!order) {
      throw new Error(`Order #${orderId} not found in database.`);
    }

    const oldStatus = order.fulfillmentStatus;
    order.fulfillmentStatus = status;
    if (status === "DELIVERED" && order.paymentMethod === "COD") {
      order.financialStatus = "PAID";
      order.paymentStatus = "PAID";
    }

    await orders.save(all);

    // Send email notification for status changes done by admin
    if (status !== oldStatus) {
      try {
        const { sendOrderStatusUpdateEmail } = await import("@/lib/services/email");
        const trackingDetails = {
          courier: order.courierName || "Shiprocket",
          awb: order.awbNumber || "",
          link: order.awbNumber ? `https://shiprocket.co/tracking/${order.awbNumber}` : ""
        };
        await sendOrderStatusUpdateEmail(order, status, trackingDetails);
      } catch (err: any) {
        console.error("[Admin Status Update Email Error]:", err.message);
      }
    }

    revalidatePath("/admin/orders");
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin");
    revalidatePath("/track-order");
    revalidatePath("/account");
    return { success: true, order };
  } catch (error: any) {
    console.error("[updateOrderStatusAction error]:", error);
    return { success: false, error: error.message || "Failed to update order status." };
  }
}

export async function createShipmentAction(orderId: string) {
  try {
    await requireAuth();
    const res = await apiPost<any>(`/admin/orders/${encodeURIComponent(orderId)}/shipment`);
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/admin");
    return { success: true, order: res.order };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to book shipment." };
  }
}

export async function assignAwbAction(orderId: string) {
  try {
    await requireAuth();
    const res = await apiPost<any>(`/admin/orders/${encodeURIComponent(orderId)}/awb`);
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    return { success: true, order: res.order };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to assign AWB." };
  }
}

export async function schedulePickupAction(orderId: string) {
  try {
    await requireAuth();
    const res = await apiPost<any>(`/admin/orders/${encodeURIComponent(orderId)}/pickup`);
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    return { success: true, order: res.order };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to schedule pickup." };
  }
}

export async function generateLabelAction(orderId: string) {
  try {
    await requireAuth();
    const res = await apiPost<any>(`/admin/orders/${encodeURIComponent(orderId)}/label`);
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    return { success: true, order: res.order };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to generate label." };
  }
}

export async function trackShipmentAction(orderId: string) {
  try {
    await requireAuth();
    const res = await apiGet<any>(`/admin/orders/${encodeURIComponent(orderId)}/track`);
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    revalidatePath("/track-order");
    revalidatePath("/account");
    return { success: true, order: res.order };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to track shipment." };
  }
}

export async function verifyPaymentStatusAction(orderId: string) {
  try {
    await requireAuth();
    const res = await apiPost<any>(`/admin/orders/${encodeURIComponent(orderId)}/verify-payment`);
    revalidatePath(`/admin/orders/${orderId}`);
    revalidatePath("/admin/orders");
    return { success: true, order: res.order };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to verify payment status." };
  }
}

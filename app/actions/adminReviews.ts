"use server";

import { verifyAdminSession } from "./adminAuth";
import { revalidatePath } from "next/cache";
import { serverGetAllReviews } from "@/lib/server-data";

async function requireAuth() {
  const isLogged = await verifyAdminSession();
  if (!isLogged) throw new Error("Unauthorized access.");
}

export async function getReviewsAction() {
  try {
    await requireAuth();
    return await serverGetAllReviews();
  } catch {
    return [];
  }
}

export async function toggleReviewApprovalAction(reviewId: string) {
  try {
    await requireAuth();
    const { reviews } = await import("@/lib/data-store");
    const all = await reviews.all();
    const review = all.find((r: any) => r.id === reviewId);
    let approved = false;
    if (review) {
      review.approved = !review.approved;
      approved = review.approved;
    }
    await reviews.save(all);
    revalidatePath("/admin/reviews");
    revalidatePath("/");
    return { success: true, approved };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to toggle review approval." };
  }
}

export async function deleteReviewAction(reviewId: string) {
  try {
    await requireAuth();
    const { reviews } = await import("@/lib/data-store");
    const all = await reviews.all();
    const filtered = all.filter((r: any) => r.id !== reviewId);
    await reviews.save(filtered);
    revalidatePath("/admin/reviews");
    revalidatePath("/");
    return { success: true };
  } catch (error: any) {
    return { success: false, error: error.message || "Failed to delete review." };
  }
}

export async function submitProductReviewAction(formData: {
  productHandle: string;
  author: string;
  rating: number;
  comment: string;
}) {
  try {
    const { reviews, generateId } = await import("@/lib/data-store");
    const review = {
      id: generateId(),
      productId: formData.productHandle,
      author: formData.author,
      email: "",
      rating: formData.rating,
      comment: formData.comment,
      approved: false,
      createdAt: new Date().toISOString(),
    };
    const all = await reviews.all();
    all.push(review);
    await reviews.save(all);
    return {
      success: true,
      message: "Thank you! Your review has been submitted and is pending moderation.",
    };
  } catch (error: any) {
    return { success: false, error: "Failed to submit review. Please try again." };
  }
}


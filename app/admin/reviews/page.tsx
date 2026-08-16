import { verifyAdminSession } from "@/app/actions/adminAuth";
import { redirect } from "next/navigation";
import { serverGetAllReviews } from "@/lib/server-data";
import ReviewsListClient from "@/components/admin/ReviewsListClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Reviews & Feedback | Boutiique Vastraa",
  description: "Approve, moderate, or remove customer feedback and testimonials.",
};

export default async function AdminReviewsPage() {
  const isLogged = await verifyAdminSession();
  if (!isLogged) {
    redirect("/account/login");
  }

  const reviews = await serverGetAllReviews();

  return (
    <ReviewsListClient 
      initialReviews={reviews} 
    />
  );
}

import { verifyAdminSession } from "@/app/actions/adminAuth";
import { redirect } from "next/navigation";
import { serverGetCoupons } from "@/lib/server-data";
import CouponsListClient from "@/components/admin/CouponsListClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Coupon Codes | Boutiique Vastraa",
  description: "Create, activate, or toggle pricing promo codes for checkout.",
};

export default async function AdminCouponsPage() {
  const isLogged = await verifyAdminSession();
  if (!isLogged) {
    redirect("/account/login");
  }

  const coupons = await serverGetCoupons();

  return (
    <CouponsListClient 
      initialCoupons={coupons} 
    />
  );
}

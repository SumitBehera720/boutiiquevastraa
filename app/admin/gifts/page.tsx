import { verifyAdminSession } from "@/app/actions/adminAuth";
import { redirect } from "next/navigation";
import { serverGetSettings, serverGetProducts } from "@/lib/server-data";
import GiftsListClient from "@/components/admin/GiftsListClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Free Gifts | Boutiique Vastraa",
  description: "Configure gift products to offer customers who shop for more than ₹3000.",
};

export default async function AdminGiftsPage() {
  const isLogged = await verifyAdminSession();
  if (!isLogged) {
    redirect("/account/login");
  }

  const [settings, products] = await Promise.all([
    serverGetSettings(),
    serverGetProducts(),
  ]);

  const initialGifts = settings?.gifts || [];

  return (
    <GiftsListClient 
      initialGifts={initialGifts} 
      allProducts={products}
    />
  );
}

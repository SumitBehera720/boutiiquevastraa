import { verifyAdminSession } from "@/app/actions/adminAuth";
import { redirect } from "next/navigation";
import { serverGetSettings } from "@/lib/server-data";
import SettingsFormClient from "@/components/admin/SettingsFormClient";
import { getProducts, getCollections } from "@/lib/shopify/queries";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Configure Site Settings | Boutiique Vastraa",
  description: "Configure search tags, SEO template strings, and homepage hero slides.",
};

export default async function AdminSettingsPage() {
  const isLogged = await verifyAdminSession();
  if (!isLogged) {
    redirect("/account/login");
  }

  const settings = await serverGetSettings();
  const products = await getProducts(100);
  const collections = await getCollections(100);

  return (
    <SettingsFormClient 
      initialSettings={settings} 
      products={products}
      collections={collections}
    />
  );
}

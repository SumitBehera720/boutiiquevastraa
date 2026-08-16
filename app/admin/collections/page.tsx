import { verifyAdminSession } from "@/app/actions/adminAuth";
import { redirect } from "next/navigation";
import { serverGetCollections } from "@/lib/server-data";
import CollectionsListClient from "@/components/admin/CollectionsListClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Collections | Boutiique Vastraa",
  description: "Create and edit collections and categories in the storefront catalog.",
};

export default async function AdminCollectionsPage() {
  const isLogged = await verifyAdminSession();
  if (!isLogged) {
    redirect("/account/login");
  }

  const collections = await serverGetCollections();

  return (
    <CollectionsListClient 
      initialCollections={collections} 
    />
  );
}

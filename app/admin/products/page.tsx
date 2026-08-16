import { verifyAdminSession } from "@/app/actions/adminAuth";
import { redirect } from "next/navigation";
import { serverGetProducts, serverGetCollections } from "@/lib/server-data";
import ProductsListClient from "@/components/admin/ProductsListClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Manage Products | Boutiique Vastraa",
  description: "Products management portal for Boutiique Vastraa staff.",
};

export default async function AdminProductsPage() {
  const isLogged = await verifyAdminSession();
  if (!isLogged) {
    redirect("/account/login");
  }

  const [products, collections] = await Promise.all([serverGetProducts(), serverGetCollections()]);

  return (
    <ProductsListClient 
      initialProducts={products} 
      collections={collections} 
    />
  );
}

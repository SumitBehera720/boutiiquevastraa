import { verifyAdminSession } from "@/app/actions/adminAuth";
import { redirect, notFound } from "next/navigation";
import { serverGetProducts, serverGetCollections } from "@/lib/server-data";
import ProductFormClient from "@/components/admin/ProductFormClient";
import { Metadata } from "next";

export const metadata: Metadata = {
  title: "Edit Product | Boutiique Vastraa",
  description: "Modify an existing product listing.",
};

export default async function AdminEditProductPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const isLogged = await verifyAdminSession();
  if (!isLogged) {
    redirect("/account/login");
  }

  const resolvedParams = await params;
  const id = resolvedParams.id;

  const [products, collections] = await Promise.all([serverGetProducts(), serverGetCollections()]);
  const product = products.find(
    p => p.id === id || p.id === `gid://shopify/Product/${id}`
  );

  if (!product) {
    notFound();
  }

  return (
    <ProductFormClient 
      product={product} 
      collections={collections} 
    />
  );
}

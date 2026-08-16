import { getProducts } from "@/lib/shopify/queries";
import ProductsClient from "@/components/collection/ProductsClient";
export const dynamic = 'force-dynamic';

export const metadata = {
  title: "All Products | Boutiique Vastraa",
  description: "Browse our complete collection of handcrafted sarees, kurtis, lehengas, and jewellery.",
};

export default async function ProductsPage() {
  // Fetch a large number of products for client-side filtering
  const allProducts = await getProducts(250);

  return (
    <ProductsClient initialProducts={allProducts} />
  );
}

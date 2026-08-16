import { searchProducts } from "@/lib/shopify/queries";
import ProductGrid from "@/components/collection/ProductGrid";
import Link from "next/link";

export default async function SearchPage({
  searchParams,
}: {
  searchParams: Promise<{ [key: string]: string | undefined }>;
}) {
  const resolvedParams = await searchParams;
  const query = resolvedParams.q || "";

  if (!query) {
    return (
      <div className="min-h-[50vh] flex flex-col items-center justify-center bg-[#FDFBF7] px-4 text-center">
        <h1 className="text-3xl font-serif text-gray-800 mb-4">Please enter a search term</h1>
        <p className="text-gray-500">Use the search bar in the header to find products.</p>
      </div>
    );
  }

  const searchResults = await searchProducts(query);
  const products = searchResults.edges.map((edge: any) => edge.node).filter((node: any) => node.title); // Ensure it's a product

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-20 pt-10">
      <div className="container mx-auto px-4 text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-serif text-gray-900 font-bold mb-4">
          Search Results
        </h1>
        <p className="text-gray-600">
          {products.length} {products.length === 1 ? "result" : "results"} found for <span className="font-bold text-primary">"{query}"</span>
        </p>
      </div>

      <div className="container mx-auto px-4">
        {products.length > 0 ? (
          <ProductGrid products={searchResults.edges.filter((e: any) => e.node.title)} />
        ) : (
          <div className="py-20 flex flex-col items-center text-center">
            <p className="text-xl text-gray-700 font-medium mb-6">We couldn't find anything matching your search.</p>
            <Link 
              href="/collections/all"
              className="bg-primary text-white px-8 py-3 rounded font-bold uppercase tracking-widest text-sm hover:bg-[#6A102A] transition-colors"
            >
              Continue Shopping
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

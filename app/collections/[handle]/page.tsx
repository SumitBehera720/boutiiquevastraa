import { notFound } from "next/navigation";
import { getCollectionByHandle } from "@/lib/shopify/queries";
import CollectionHeader from "@/components/collection/CollectionHeader";
import FilterSidebar from "@/components/collection/FilterSidebar";
import SortDropdown from "@/components/collection/SortDropdown";
import ProductGrid from "@/components/collection/ProductGrid";
import Link from "next/link";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const resolvedParams = await params;
  const collection = await getCollectionByHandle({ handle: resolvedParams.handle });
  
  if (!collection) {
    return { title: 'Collection Not Found' };
  }

  return {
    title: `${collection.title} | Boutiique Vastraa`,
    description: collection.description || `Shop ${collection.title} at Boutiique Vastraa`,
  };
}

export default async function CollectionPage({ 
  params,
  searchParams 
}: { 
  params: Promise<{ handle: string }>,
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>
}) {
  const resolvedParams = await params;
  const resolvedSearchParams = await searchParams;

  // Extract filters from searchParams (which could be an array if multiple are selected)
  let filters: any[] = [];
  if (resolvedSearchParams.filter) {
    const filterArray = Array.isArray(resolvedSearchParams.filter) 
      ? resolvedSearchParams.filter 
      : [resolvedSearchParams.filter];
    filters = filterArray.map(f => JSON.parse(f));
  }

  // Extract sort options
  const sortKey = (resolvedSearchParams.sort as string) || "COLLECTION_DEFAULT";
  const reverse = resolvedSearchParams.reverse === "true";

  // Fetch from Shopify
  const collection = await getCollectionByHandle({
    handle: resolvedParams.handle,
    filters,
    sortKey,
    reverse
  });

  if (!collection) {
    notFound();
  }

  return (
    <div className="bg-[#FDFBF7] min-h-screen pb-20">
      <CollectionHeader collection={collection} />

      <div className="container mx-auto px-4">
        {/* Top Bar */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-8 border-b border-gray-200 pb-4">
          <p className="text-gray-600 text-sm font-medium mb-4 md:mb-0">
            Showing {collection.products.edges.length} products
          </p>
          <div className="flex items-center justify-between md:justify-end w-full md:w-auto">
            {/* Filter Toggle for Mobile is inside FilterSidebar */}
            <SortDropdown />
          </div>
        </div>

        {/* Main Content Layout */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          
          {/* Sidebar */}
          <FilterSidebar filters={collection.products.filters} />

          {/* Product Grid */}
          <div className="flex-1 w-full">
            <ProductGrid products={collection.products.edges} />
            
            {/* Pagination / Load More could go here if needed */}
            {collection.products.pageInfo.hasNextPage && (
              <div className="mt-12 flex justify-center">
                <Link 
                  href={`?after=${collection.products.pageInfo.endCursor}`}
                  className="bg-transparent border border-primary text-primary px-8 py-3 rounded uppercase tracking-widest text-sm font-bold hover:bg-primary hover:text-white transition-colors"
                >
                  Load More
                </Link>
              </div>
            )}
          </div>

        </div>
      </div>
    </div>
  );
}

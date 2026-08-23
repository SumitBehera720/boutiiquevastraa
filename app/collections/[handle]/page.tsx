import { notFound } from "next/navigation";
import { getCollectionByHandle } from "@/lib/shopify/queries";
import CollectionHeader from "@/components/collection/CollectionHeader";
import CollectionProductsClient from "@/components/collection/CollectionProductsClient";

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

  // Fetch up to 250 products from Shopify without active filters to support client-side filtering
  const collection = await getCollectionByHandle({
    handle: resolvedParams.handle,
    filters: [],
    sortKey: "COLLECTION_DEFAULT",
    reverse: false,
    first: 250
  });

  if (!collection) {
    notFound();
  }

  return (
    <div className="bg-[#FDFBF7] min-h-screen pb-20">
      <CollectionHeader collection={collection} />

      <div className="container mx-auto px-4">
        <CollectionProductsClient 
          initialProducts={collection.products.edges} 
          filters={collection.products.filters} 
        />
      </div>
    </div>
  );
}

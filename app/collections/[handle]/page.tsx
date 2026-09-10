import { notFound } from "next/navigation";
import { getCollectionByHandle } from "@/lib/shopify/queries";
import CollectionHeader from "@/components/collection/CollectionHeader";
import CollectionProductsClient from "@/components/collection/CollectionProductsClient";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const resolvedParams = await params;
  const collection = await getCollectionByHandle({ handle: resolvedParams.handle });

  if (!collection) {
    return { title: "Collection Not Found | Boutiique Vastraa" };
  }

  const titleStr = collection.title || resolvedParams.handle;
  const desc =
    collection.description && collection.description.length >= 120
      ? collection.description.substring(0, 210)
      : `Explore handcrafted ${titleStr} collection at Boutiique Vastraa. Discover premium Banarasi silk sarees, designer ethnic wear, silk mark quality & free shipping across India.`;

  const canonicalUrl = `https://boutiiquevastraa.com/collections/${collection.handle}`;

  return {
    title: `${titleStr} Collection – Handcrafted Sarees | Boutiique Vastraa`,
    description: desc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: `${titleStr} | Boutiique Vastraa`,
      description: desc,
      url: canonicalUrl,
      images: collection.image?.url ? [{ url: collection.image.url, alt: titleStr }] : [],
    },
  };
}

export default async function CollectionPage({
  params,
  searchParams,
}: {
  params: Promise<{ handle: string }>;
  searchParams: Promise<{ [key: string]: string | string[] | undefined }>;
}) {
  const resolvedParams = await params;

  // Fetch up to 250 products from Shopify without active filters to support client-side filtering
  const collection = await getCollectionByHandle({
    handle: resolvedParams.handle,
    filters: [],
    sortKey: "COLLECTION_DEFAULT",
    reverse: false,
    first: 250,
  });

  if (!collection) {
    notFound();
  }

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      {
        "@type": "ListItem",
        position: 1,
        name: "Home",
        item: "https://boutiiquevastraa.com",
      },
      {
        "@type": "ListItem",
        position: 2,
        name: "Collections",
        item: "https://boutiiquevastraa.com/collections",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: collection.title,
        item: `https://boutiiquevastraa.com/collections/${collection.handle}`,
      },
    ],
  };

  return (
    <div className="bg-[#FDFBF7] min-h-screen pb-20">
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
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

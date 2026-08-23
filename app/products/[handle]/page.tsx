import { notFound } from "next/navigation";
import { getProductByHandle } from "@/lib/shopify/queries";
import { serverGetAllReviews, serverGetQna } from "@/lib/server-data";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import RelatedProducts from "@/components/product/RelatedProducts";
import ScrollToTop from "@/components/product/ScrollToTop";
import ProductReviewsQnA from "@/components/product/ProductReviewsQnA";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const resolvedParams = await params;
  const product = await getProductByHandle(resolvedParams.handle);
  
  if (!product) {
    return { title: 'Product Not Found' };
  }

  return {
    title: `${product.title} | Boutiique Vastraa`,
    description: product.descriptionHtml.replace(/<[^>]*>?/gm, '').substring(0, 160),
    openGraph: {
      images: product.images.edges.length > 0 ? [product.images.edges[0].node.url] : [],
    }
  };
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const resolvedParams = await params;
  const product = await getProductByHandle(resolvedParams.handle);

  if (!product) {
    notFound();
  }

  // Import dynamically here to avoid having to change imports at the top
  const { getProductRecommendations } = await import("@/lib/shopify/queries");
  const recommendedProducts = await getProductRecommendations(product.id);

  const initialReviews = await serverGetAllReviews();
  const initialQnas = await serverGetQna();

  const jsonLd = {
    '@context': 'https://schema.org',
    '@type': 'Product',
    name: product.title,
    image: product.images.edges[0]?.node.url,
    description: product.descriptionHtml.replace(/<[^>]*>?/gm, '').substring(0, 160),
    brand: {
      '@type': 'Brand',
      name: 'Boutiique Vastraa',
    },
    offers: {
      '@type': 'Offer',
      url: `https://boutiiquevastraa.com/products/${product.handle}`,
      priceCurrency: product.priceRange.minVariantPrice.currencyCode,
      price: product.priceRange.minVariantPrice.amount,
      itemCondition: 'https://schema.org/NewCondition',
      availability: product.availableForSale ? 'https://schema.org/InStock' : 'https://schema.org/OutOfStock',
    },
  };

  return (
    <div className="bg-white min-h-screen pb-4">
      <ScrollToTop />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(jsonLd) }}
      />
      {/* Breadcrumb could go here */}
      <div className="container mx-auto px-4 pt-4 md:pt-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          
          {/* Left: Gallery */}
          <div className="w-full lg:w-[45%]">
            <div className="sticky top-24">
              <ProductGallery images={product.images.edges} />
            </div>
          </div>

          {/* Right: Product Info */}
          <div className="w-full lg:w-[55%]">
            <ProductInfo product={product} recommendedProducts={recommendedProducts} />
          </div>

        </div>
      </div>

      {/* Customer Reviews & QnA */}
      <ProductReviewsQnA
        productHandle={product.handle}
        productId={product.id}
        initialReviews={initialReviews}
        initialQnas={initialQnas}
      />

      {/* Explore Similar Styles at bottom */}
      <div className="mt-10 border-t border-gray-200">
        <RelatedProducts productId={product.id} />
      </div>
    </div>
  );
}

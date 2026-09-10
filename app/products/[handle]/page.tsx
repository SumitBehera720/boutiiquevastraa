import { notFound } from "next/navigation";
import { getProductByHandle } from "@/lib/shopify/queries";
import { serverGetAllReviews, serverGetQna } from "@/lib/server-data";
import ProductGallery from "@/components/product/ProductGallery";
import ProductInfo from "@/components/product/ProductInfo";
import RelatedProducts from "@/components/product/RelatedProducts";
import ScrollToTop from "@/components/product/ScrollToTop";
import ProductReviewsQnA from "@/components/product/ProductReviewsQnA";
import FabricCareFAQ from "@/components/product/FabricCareFAQ";

export async function generateMetadata({ params }: { params: Promise<{ handle: string }> }) {
  const resolvedParams = await params;
  const product = await getProductByHandle(resolvedParams.handle);

  if (!product) {
    return { title: "Product Not Found | Boutiique Vastraa" };
  }

  const rawDesc = product.descriptionHtml.replace(/<[^>]*>?/gm, "").trim();
  const desc =
    rawDesc.length >= 150
      ? rawDesc.substring(0, 210) + "..."
      : `${product.title} - Handcrafted Banarasi silk saree & authentic ethnic wear from Boutiique Vastraa. Premium silk mark certified quality, free shipping & easy returns across India.`;

  const canonicalUrl = `https://boutiiquevastraa.com/products/${product.handle}`;
  const firstImage = product.images.edges[0]?.node.url;

  return {
    title: `${product.title} – Handcrafted Sarees | Boutiique Vastraa`,
    description: desc,
    alternates: {
      canonical: canonicalUrl,
    },
    openGraph: {
      title: product.title,
      description: desc,
      url: canonicalUrl,
      images: firstImage ? [{ url: firstImage, alt: product.title }] : [],
      type: "article",
    },
  };
}

export default async function ProductPage({ params }: { params: Promise<{ handle: string }> }) {
  const resolvedParams = await params;
  const product = await getProductByHandle(resolvedParams.handle);

  if (!product) {
    notFound();
  }

  const { getProductRecommendations } = await import("@/lib/shopify/queries");
  const recommendedProducts = await getProductRecommendations(product.id);

  const initialReviews = await serverGetAllReviews();
  const initialQnas = await serverGetQna();

  const productPrice = product.priceRange.minVariantPrice.amount;
  const currency = product.priceRange.minVariantPrice.currencyCode || "INR";
  const firstImageUrl = product.images.edges[0]?.node.url;

  const productJsonLd = {
    "@context": "https://schema.org",
    "@type": "Product",
    name: product.title,
    image: product.images.edges.map((e: any) => e.node.url),
    description: product.descriptionHtml.replace(/<[^>]*>?/gm, "").substring(0, 220),
    sku: product.id || product.handle,
    brand: {
      "@type": "Brand",
      name: "Boutiique Vastraa",
    },
    offers: {
      "@type": "Offer",
      url: `https://boutiiquevastraa.com/products/${product.handle}`,
      priceCurrency: currency,
      price: productPrice,
      priceValidUntil: "2027-12-31",
      itemCondition: "https://schema.org/NewCondition",
      availability: product.availableForSale
        ? "https://schema.org/InStock"
        : "https://schema.org/OutOfStock",
      seller: {
        "@type": "Organization",
        name: "Boutiique Vastraa",
      },
    },
  };

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
        name: "Products",
        item: "https://boutiiquevastraa.com/collections/all",
      },
      {
        "@type": "ListItem",
        position: 3,
        name: product.title,
        item: `https://boutiiquevastraa.com/products/${product.handle}`,
      },
    ],
  };

  return (
    <div className="bg-white min-h-screen pb-4">
      <ScrollToTop />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(productJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />

      <div className="container mx-auto px-4 pt-4 md:pt-8 max-w-7xl">
        <div className="flex flex-col lg:flex-row gap-8 lg:gap-12">
          {/* Left: Gallery */}
          <div className="w-full lg:w-[45%]">
            <div className="sticky top-24">
              <ProductGallery images={product.images.edges} />
            </div>
          </div>

          {/* Right: Product Info & Care FAQ */}
          <div className="w-full lg:w-[55%]">
            <ProductInfo product={product} recommendedProducts={recommendedProducts} />
            <FabricCareFAQ productTitle={product.title} />
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

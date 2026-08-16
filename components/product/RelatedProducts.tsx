import { getProductRecommendations, getProducts } from "@/lib/shopify/queries";
import ProductCarousel from "@/components/home/ProductCarousel";

export default async function RelatedProducts({ productId }: { productId: string }) {
  let recommendedProducts = await getProductRecommendations(productId);

  if (!recommendedProducts || recommendedProducts.length === 0) {
    recommendedProducts = await getProducts(8);
  }

  if (!recommendedProducts || recommendedProducts.length === 0) {
    return null;
  }

  return (
    <div className="py-12">
      <div className="text-center mb-10">
        <h2 className="text-2xl md:text-3xl font-bold text-maroonClr mb-3">Explore Similar Styles</h2>
        <p className="text-gray-500 text-sm max-w-2xl mx-auto px-4">
          Discover more sarees that match your style and preferences. Handpicked collections to complement your elegance.
        </p>
      </div>
      <ProductCarousel 
        title="" 
        products={recommendedProducts} 
      />
    </div>
  );
}

import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "About Us",
  description: "Discover the story behind Boutiique Vastraa — your destination for timeless elegance, handcrafted sarees, kurtis, and jewellery.",
};

export default function AboutPage() {
  return (
    <div className="bg-white min-h-screen">
      <div className="container mx-auto px-4 py-12 md:py-20 max-w-4xl">
        <h1 className="text-3xl md:text-4xl font-serif font-bold text-center text-gray-900 mb-8">
          About Boutiique Vastraa
        </h1>
        
        <div className="space-y-6 text-gray-600 leading-relaxed">
          <p>
            Welcome to <strong>Boutiique Vastraa</strong> — where tradition meets contemporary elegance. 
            We are a premier destination for women who appreciate the artistry of Indian fashion, 
            offering a carefully curated collection of sarees, kurtis, and jewellery that celebrates 
            the rich heritage of Indian craftsmanship.
          </p>

          <p>
            Our journey began with a simple vision: to make exquisite, handcrafted fashion accessible 
            to every woman. Each piece in our collection is thoughtfully selected, blending timeless 
            traditions with modern aesthetics to create something truly special.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8">Our Mission</h2>
          <p>
            We are committed to empowering women through fashion that inspires confidence and 
            celebrates individuality. Every product at Boutiique Vastraa is a testament to our 
            dedication to quality, authenticity, and customer satisfaction.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8">Quality & Craftsmanship</h2>
          <p>
            From the finest fabrics to the most intricate embroideries, we work closely with skilled 
            artisans across India to bring you products that are not just beautiful, but built to last. 
            We believe in sustainable fashion that respects both the craft and the craftspeople behind it.
          </p>

          <h2 className="text-xl font-semibold text-gray-800 mt-8">Why Choose Us</h2>
          <ul className="list-disc pl-6 space-y-2">
            <li>Authentic, handpicked collections sourced directly from trusted artisans</li>
            <li>Premium quality fabrics with meticulous attention to detail</li>
            <li>Easy 7-day exchange policy for a hassle-free shopping experience</li>
            <li>Free shipping across India on all orders</li>
            <li>Secure payments with cash on delivery option</li>
            <li>Dedicated customer support to assist you at every step</li>
          </ul>

          <p className="mt-8 text-center italic text-gray-500">
            Thank you for choosing Boutiique Vastraa. We look forward to being a part of your 
            special moments.
          </p>
        </div>
      </div>
    </div>
  );
}

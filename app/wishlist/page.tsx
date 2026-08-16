"use client";

import { useWishlistStore } from "@/store/wishlistStore";
import Link from "next/link";
import Image from "next/image";
import { Trash2 } from "lucide-react";

export default function WishlistPage() {
  const { items, removeItem } = useWishlistStore();

  return (
    <div className="min-h-screen bg-[#FDFBF7] pb-20 pt-10">
      <div className="container mx-auto px-4 text-center mb-12">
        <h1 className="text-3xl md:text-5xl font-serif text-gray-900 font-bold mb-4">
          Your Wishlist
        </h1>
        <p className="text-gray-600">
          {items.length} {items.length === 1 ? "item" : "items"} saved
        </p>
      </div>

      <div className="container mx-auto px-4">
        {items.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 md:gap-6">
            {items.map((item) => (
              <div key={item.id} className="group flex flex-col bg-white rounded-lg shadow-sm relative border border-gray-100">
                <button 
                  onClick={() => removeItem(item.id)}
                  className="absolute top-2 right-2 z-10 bg-white/80 p-2 rounded-full text-gray-500 hover:text-red-500 hover:bg-white transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                </button>
                
                <Link href={`/products/${item.handle}`} className="relative w-full aspect-[3/4] overflow-hidden rounded-t-lg bg-gray-100">
                  {item.image && (
                    <Image
                      src={item.image}
                      alt={item.title}
                      fill
                      className="object-cover transition-transform duration-500 group-hover:scale-105"
                    />
                  )}
                </Link>

                <div className="p-4 flex flex-col flex-grow text-center">
                  <Link href={`/products/${item.handle}`}>
                    <h3 className="text-sm font-semibold text-gray-800 line-clamp-2 min-h-[40px] hover:text-primary transition-colors">
                      {item.title}
                    </h3>
                  </Link>
                  <div className="mt-2 text-primary font-bold text-lg">
                    ₹{parseFloat(item.price).toFixed(2)}
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="py-20 flex flex-col items-center text-center">
            <p className="text-xl text-gray-700 font-medium mb-6">Your wishlist is currently empty.</p>
            <Link 
              href="/collections/all"
              className="bg-primary text-white px-8 py-3 rounded font-bold uppercase tracking-widest text-sm hover:bg-[#6A102A] transition-colors"
            >
              Discover Styles
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { deleteProductAction } from "@/app/actions/adminProducts";
import { Search, Plus, Edit, Trash2, AlertCircle, ShoppingBag, FolderHeart, Sparkles } from "lucide-react";

interface ProductsListClientProps {
  initialProducts: any[];
  collections: any[];
}

export default function ProductsListClient({ initialProducts, collections }: ProductsListClientProps) {
  const [products, setProducts] = useState(initialProducts);
  const [search, setSearch] = useState("");
  const [selectedCollection, setSelectedCollection] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this product?")) {
      return;
    }

    setDeletingId(id);
    setError("");

    try {
      const res = await deleteProductAction(id);
      if (res.success) {
        setProducts(products.filter(p => p.id !== id));
      } else {
        setError(res.error || "Failed to delete product.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setDeletingId(null);
    }
  };

  // Filter products based on search & collection selection
  const filteredProducts = (products || []).filter(p => {
    if (!p) return false;
    const title = p.title || "";
    const handle = p.handle || "";
    const tags = Array.isArray(p.tags) ? p.tags : (typeof p.tags === "string" ? [p.tags] : []);
    const collectionHandles = Array.isArray(p.collectionHandles) ? p.collectionHandles : [];

    const matchesSearch = title.toLowerCase().includes(search.toLowerCase()) || 
                          handle.toLowerCase().includes(search.toLowerCase()) ||
                          tags.some((t: any) => String(t).toLowerCase().includes(search.toLowerCase()));
    
    const matchesCollection = !selectedCollection || collectionHandles.includes(selectedCollection);

    return matchesSearch && matchesCollection;
  });

  const getStockStatus = (qty: number) => {
    if (qty === 0) return { label: "Out of Stock", class: "bg-red-500/10 text-red-400 border-red-500/20" };
    if (qty <= 5) return { label: `Low Stock (${qty})`, class: "bg-amber-500/10 text-amber-400 border-amber-500/20" };
    return { label: `In Stock (${qty})`, class: "bg-green-500/10 text-green-400 border-green-500/20" };
  };

  return (
    <div className="space-y-6">
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            Products Directory <Sparkles className="w-4 h-4 text-[#C9A84C]" />
          </h1>
          <p className="text-xs text-neutral-400">Total listed items: {filteredProducts.length}</p>
        </div>
        <Link
          href="/admin/products/new"
          className="bg-maroonClr text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#6A102A] transition-colors flex items-center gap-2 shadow-md shadow-maroonClr/15 border border-[#C9A84C]/10"
        >
          <Plus className="w-4 h-4 text-[#C9A84C]" /> Add New Product
        </Link>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-900/50 text-red-400 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4 h-4" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and search bar */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 bg-neutral-950 p-4 rounded-xl border border-neutral-800 shadow-sm">
        <div className="relative col-span-2">
          <Search className="absolute left-3.5 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
          <input
            type="text"
            placeholder="Search by title, handle, tags..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-maroonClr transition-all"
          />
        </div>
        
        <div>
          <select
            value={selectedCollection}
            onChange={(e) => setSelectedCollection(e.target.value)}
            className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3.5 py-2.5 text-xs text-neutral-400 focus:outline-none focus:border-maroonClr"
          >
            <option value="">All Collections</option>
            {collections.map((col) => (
              <option key={col.handle} value={col.handle}>{col.title}</option>
            ))}
          </select>
        </div>
      </div>

      {/* Products table card */}
      <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-400">
            <thead className="bg-neutral-900 text-xs font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-800">
              <tr>
                <th className="py-3.5 px-4 w-16">Image</th>
                <th className="py-3.5 px-4">Title / Handle</th>
                <th className="py-3.5 px-4">Collections</th>
                <th className="py-3.5 px-4">Price</th>
                <th className="py-3.5 px-4">Inventory Status</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {filteredProducts.length === 0 ? (
                <tr>
                  <td colSpan={6} className="py-12 text-center text-neutral-600 font-medium">
                    No products found matching filters.
                  </td>
                </tr>
              ) : (
                filteredProducts.map((p) => {
                  const firstImg = p.images?.edges?.[0]?.node?.url || "";
                  const price = parseFloat(p.priceRange?.minVariantPrice?.amount ?? "0").toFixed(2);
                  const stock = getStockStatus(p.inventory);

                  return (
                    <tr key={p.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="w-10 h-14 bg-neutral-900 relative rounded border border-neutral-800 overflow-hidden flex items-center justify-center">
                          {firstImg ? (
                            <Image
                              src={firstImg}
                              alt={p.title}
                              fill
                              className="object-cover"
                              sizes="40px"
                            />
                          ) : (
                            <ShoppingBag className="w-4 h-4 text-neutral-600" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white truncate max-w-[200px]">{p.title}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">{p.handle}</div>
                      </td>
                      <td className="py-3 px-4">
                        {p.collectionHandles && p.collectionHandles.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {p.collectionHandles.map((handle: string) => {
                              const col = collections.find(c => c.handle === handle);
                              return (
                                <span key={handle} className="px-1.5 py-0.5 bg-neutral-900 text-neutral-400 border border-neutral-800 rounded text-[9px] font-bold">
                                  {col ? col.title : handle}
                                </span>
                              );
                            })}
                          </div>
                        ) : (
                          <span className="text-[10px] text-neutral-600 italic">None</span>
                        )}
                      </td>
                      <td className="py-3 px-4 font-bold text-white font-mono">₹{parseFloat(price).toFixed(0)}</td>
                      <td className="py-3 px-4">
                        <span className={`px-2 py-0.5 border rounded text-[10px] font-bold uppercase tracking-wider ${stock.class}`}>
                          {stock.label}
                        </span>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <Link
                            href={`/admin/products/${(p.id || "").split("/").pop()}`}
                            className="p-1.5 bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-850 hover:border-neutral-700 rounded-md transition-colors"
                            title="Edit Product"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </Link>
                          <button
                            onClick={() => handleDelete(p.id)}
                            disabled={deletingId === p.id}
                            className="p-1.5 bg-neutral-900 text-neutral-400 hover:text-red-400 border border-neutral-850 hover:border-red-950/30 rounded-md transition-colors disabled:opacity-50"
                            title="Delete Product"
                          >
                            <Trash2 className="w-3.5 h-3.5" />
                          </button>
                        </div>
                      </td>
                    </tr>
                  );
                })
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

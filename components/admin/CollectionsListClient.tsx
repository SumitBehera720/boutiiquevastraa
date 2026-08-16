"use client";

import { useState } from "react";
import Image from "next/image";
import { saveCollectionAction, deleteCollectionAction } from "@/app/actions/adminCollections";
import { uploadImageAction } from "@/app/actions/adminProducts";
import { Search, Plus, Edit, Trash2, X, AlertCircle, FolderHeart, Sparkles, Upload } from "lucide-react";

interface CollectionsListClientProps {
  initialCollections: any[];
}

export default function CollectionsListClient({ initialCollections }: CollectionsListClientProps) {
  const [collections, setCollections] = useState(initialCollections);
  const [search, setSearch] = useState("");
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState("");

  // Modal form states
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [modalMode, setModalMode] = useState<"create" | "edit">("create");
  const [editId, setEditId] = useState("");
  const [title, setTitle] = useState("");
  const [handle, setHandle] = useState("");
  const [description, setDescription] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [uploading, setUploading] = useState(false);

  const openCreateModal = () => {
    setModalMode("create");
    setEditId("");
    setTitle("");
    setHandle("");
    setDescription("");
    setImageUrl("");
    setError("");
    setIsModalOpen(true);
  };

  const openEditModal = (col: any) => {
    setModalMode("edit");
    setEditId(col.id);
    setTitle(col.title);
    setHandle(col.handle);
    setDescription(col.description || "");
    setImageUrl(col.image?.url || "");
    setError("");
    setIsModalOpen(true);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Are you sure you want to permanently delete this collection? Products in this collection will not be deleted, but they will be removed from this collection category.")) {
      return;
    }

    setDeletingId(id);
    setError("");

    try {
      const res = await deleteCollectionAction(id);
      if (res.success) {
        setCollections(collections.filter(c => c.id !== id));
      } else {
        setError(res.error || "Failed to delete collection.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setDeletingId(null);
    }
  };

  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files || files.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const formData = new FormData();
      formData.append("image", files[0]);

      const res = await uploadImageAction(formData);
      if (res.success && res.url) {
        setImageUrl(res.url);
      } else {
        setError(res.error || "Image upload failed.");
      }
    } catch (err) {
      console.error(err);
      setError("Failed to upload image.");
    } finally {
      setUploading(false);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSubmitting(true);

    if (!title || !description) {
      setError("Title and description are required.");
      setSubmitting(false);
      return;
    }

    try {
      const res = await saveCollectionAction({
        id: modalMode === "edit" ? editId : undefined,
        title,
        handle: handle.trim() || undefined,
        description,
        image: imageUrl ? { url: imageUrl, altText: title } : null,
      });

      if (res.success && res.id) {
        const updatedCollections = [...collections];
        const formattedCol = {
          id: res.id,
          title,
          handle: res.handle,
          description,
          image: imageUrl ? { url: imageUrl, altText: title } : null,
        };

        if (modalMode === "edit") {
          const idx = updatedCollections.findIndex(c => c.id === editId);
          if (idx !== -1) {
            updatedCollections[idx] = formattedCol;
          }
        } else {
          updatedCollections.push(formattedCol);
        }

        setCollections(updatedCollections);
        setIsModalOpen(false);
      } else {
        setError(res.error || "Failed to save collection.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setSubmitting(false);
    }
  };

  const filteredCollections = collections.filter(c => 
    c.title.toLowerCase().includes(search.toLowerCase()) || 
    c.handle.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      
      {/* Top action header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h1 className="text-2xl font-serif font-bold text-white flex items-center gap-2">
            Collections Manager <Sparkles className="w-4 h-4 text-[#C9A84C]" />
          </h1>
          <p className="text-xs text-neutral-400">Total active categories: {filteredCollections.length}</p>
        </div>
        <button
          onClick={openCreateModal}
          className="bg-maroonClr text-white px-4 py-2.5 rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#6A102A] transition-colors flex items-center gap-2 shadow-md shadow-maroonClr/15 border border-[#C9A84C]/10"
        >
          <Plus className="w-4 h-4 text-[#C9A84C]" /> Add Collection
        </button>
      </div>

      {error && !isModalOpen && (
        <div className="p-4 bg-red-950/40 border border-red-900/50 text-red-400 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Filter and search bar */}
      <div className="bg-neutral-950 p-4 rounded-xl border border-neutral-800 shadow-sm relative">
        <Search className="absolute left-7 top-1/2 -translate-y-1/2 w-4.5 h-4.5 text-neutral-500" />
        <input
          type="text"
          placeholder="Search collections by title or handle..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="w-full bg-neutral-900 border border-neutral-800 rounded-lg pl-10 pr-4 py-2.5 text-xs text-white focus:outline-none focus:border-maroonClr transition-all"
        />
      </div>

      {/* Table grid */}
      <div className="bg-neutral-950 rounded-xl border border-neutral-800 overflow-hidden shadow-sm">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-neutral-400">
            <thead className="bg-neutral-900 text-xs font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-800">
              <tr>
                <th className="py-3.5 px-4 w-20">Banner</th>
                <th className="py-3.5 px-4">Title / Handle</th>
                <th className="py-3.5 px-4">Description</th>
                <th className="py-3.5 px-4 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-900">
              {filteredCollections.length === 0 ? (
                <tr>
                  <td colSpan={4} className="py-12 text-center text-neutral-600 font-medium">
                    No collections found.
                  </td>
                </tr>
              ) : (
                filteredCollections.map((c) => {
                  const hasImage = c.image?.url;
                  return (
                    <tr key={c.id} className="hover:bg-neutral-900/40 transition-colors">
                      <td className="py-3 px-4">
                        <div className="w-12 h-12 bg-neutral-900 relative rounded border border-neutral-800 overflow-hidden flex items-center justify-center">
                          {hasImage ? (
                            <Image
                              src={c.image.url}
                              alt={c.title}
                              fill
                              className="object-cover"
                              sizes="48px"
                            />
                          ) : (
                            <FolderHeart className="w-5 h-5 text-neutral-600" />
                          )}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <div className="font-semibold text-white truncate max-w-[180px]">{c.title}</div>
                        <div className="text-[10px] text-neutral-500 font-mono">{c.handle}</div>
                      </td>
                      <td className="py-3 px-4 max-w-[280px]">
                        <p className="text-xs text-neutral-400 truncate">{c.description}</p>
                      </td>
                      <td className="py-3 px-4 text-right">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => openEditModal(c)}
                            className="p-1.5 bg-neutral-900 text-neutral-400 hover:text-white border border-neutral-850 hover:border-neutral-700 rounded-md transition-colors"
                            title="Edit Collection"
                          >
                            <Edit className="w-3.5 h-3.5" />
                          </button>
                          <button
                            onClick={() => handleDelete(c.id)}
                            disabled={deletingId === c.id}
                            className="p-1.5 bg-neutral-900 text-neutral-400 hover:text-red-400 border border-neutral-850 hover:border-red-950/30 rounded-md transition-colors disabled:opacity-50"
                            title="Delete Collection"
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

      {/* Modal overlays for Create / Edit */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4 animate-fadeIn">
          <div className="w-full max-w-lg bg-neutral-900 border border-neutral-800 rounded-2xl shadow-2xl overflow-hidden">
            
            {/* Modal Header */}
            <div className="px-6 py-4 bg-neutral-950 border-b border-neutral-850 flex justify-between items-center">
              <h3 className="font-serif text-base font-bold text-white">
                {modalMode === "create" ? "Add New Category Collection" : "Modify Collection Details"}
              </h3>
              <button onClick={() => setIsModalOpen(false)} className="text-neutral-500 hover:text-white">
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body */}
            <form onSubmit={handleSave} className="p-6 space-y-4">
              {error && (
                <div className="p-3 bg-red-950/40 border border-red-900/50 text-red-400 text-xs rounded-lg flex items-center gap-2">
                  <AlertCircle className="w-4 h-4" />
                  <span>{error}</span>
                </div>
              )}

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Collection Title</label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Linen Sarees"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-maroonClr"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Collection Handle (Optional)</label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="linen-sarees"
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg px-4 py-2 text-xs text-white focus:outline-none focus:border-maroonClr"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
                <textarea
                  required
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Write a brief category description that appears on the storefront..."
                  className="w-full bg-neutral-950 border border-neutral-800 rounded-lg p-3 text-xs text-white focus:outline-none focus:border-maroonClr resize-none"
                />
              </div>

              {/* Image File Upload */}
              <div className="pt-2 border-t border-neutral-850">
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Upload Image File</label>
                <label className={`w-full border border-dashed border-neutral-800 bg-neutral-950 rounded-lg p-3 flex items-center justify-center gap-2 cursor-pointer hover:border-neutral-700 ${uploading ? "opacity-50" : ""}`}>
                  <Upload className="w-4 h-4 text-neutral-500" />
                  <span className="text-[10px] text-neutral-400 font-bold uppercase">
                    {uploading ? "Uploading..." : "Browse Image"}
                  </span>
                  <input type="file" accept="image/*" onChange={handleImageUpload} className="hidden" />
                </label>
              </div>

              {/* Image Preview */}
              {imageUrl && (
                <div className="relative w-full h-24 rounded-lg overflow-hidden border border-neutral-800 bg-neutral-950">
                  <Image src={imageUrl} alt="Preview" fill className="object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageUrl("")}
                    className="absolute top-2 right-2 bg-red-950 text-red-400 p-1.5 rounded-full hover:bg-red-900 transition-colors"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}

              {/* Submit Buttons */}
              <div className="flex gap-3 justify-end pt-4 border-t border-neutral-850">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 border border-neutral-800 text-neutral-400 hover:text-white rounded-lg text-xs font-bold uppercase transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting || uploading}
                  className="px-5 py-2 bg-maroonClr text-white rounded-lg text-xs font-bold uppercase tracking-wider hover:bg-[#6A102A] transition-colors flex items-center gap-2 disabled:bg-neutral-800"
                >
                  {submitting ? "Saving Category..." : "Save Collection"}
                </button>
              </div>

            </form>
          </div>
        </div>
      )}

    </div>
  );
}

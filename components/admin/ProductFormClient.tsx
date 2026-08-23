"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { saveProductAction, uploadImageAction } from "@/app/actions/adminProducts";
import { ArrowLeft, Plus, Trash2, Upload, Sparkles, AlertCircle, Check } from "lucide-react";
import Image from "next/image";
import Link from "next/link";

interface ProductFormClientProps {
  product?: any; // Undefined if creating new
  collections: any[];
}

export default function ProductFormClient({ product, collections }: ProductFormClientProps) {
  const router = useRouter();
  const isEdit = !!product;
  
  // Basic Info States
  const [title, setTitle] = useState(product?.title || "");
  const [handle, setHandle] = useState(product?.handle || "");
  const [price, setPrice] = useState(product?.priceRange?.minVariantPrice?.amount || "");
  const [compareAtPrice, setCompareAtPrice] = useState(product?.compareAtPriceRange?.minVariantPrice?.amount || "");
  const [description, setDescription] = useState(product?.description || "");
  const [inventory, setInventory] = useState(product?.inventory !== undefined ? product?.inventory : 10);
  const [tagsInput, setTagsInput] = useState(product?.tags?.join(", ") || "");
  const [selectedCollections, setSelectedCollections] = useState<string[]>(product?.collectionHandles || []);

  // Images States (Supports multiple image URLs)
  const [images, setImages] = useState<string[]>(
    product?.images?.edges?.map((e: any) => e.node.url) || []
  );
  const [uploading, setUploading] = useState(false);

  // Options & Variants States
  // Options: [ { name: "Size", values: ["S", "M"] } ]
  const [options, setOptions] = useState<any[]>(
    product?.options?.filter((o: any) => o.name !== "Standard") || []
  );
  const [newOptionName, setNewOptionName] = useState("");
  const [newOptionValues, setNewOptionValues] = useState("");

  // Variants list: [ { title: "S", price: "1200.00", compareAtPrice: "1500.00", selectedOptions: [ { name: "Size", value: "S" } ] } ]
  const [variants, setVariants] = useState<any[]>(
    product?.variants?.edges
      ?.filter((e: any) => e.node.title !== "Default Title")
      ?.map((e: any) => ({
        title: e.node.title,
        price: e.node.price.amount,
        compareAtPrice: e.node.compareAtPrice?.amount || "",
        selectedOptions: e.node.selectedOptions
      })) || []
  );

  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  // Size Chart States
  const [showSizeChart, setShowSizeChart] = useState<boolean>(
    product?.showSizeChart !== undefined ? product.showSizeChart : true
  );
  const [sizeChartImage, setSizeChartImage] = useState<string>(product?.sizeChartImage || "");
  const [sizeChartUploading, setSizeChartUploading] = useState<boolean>(false);

  // Dedicated Product Size Management States
  const PRESET_SIZES = ["Free Size", "XS", "S", "M", "L", "XL", "2XL", "3XL", "4XL"];
  const initialSizeOpt = (product?.options || []).find((o: any) => o.name?.toLowerCase() === "size");
  const [sizesEnabled, setSizesEnabled] = useState<boolean>(
    product?.sizesEnabled !== undefined ? !!product.sizesEnabled : (initialSizeOpt ? true : false)
  );
  const [selectedSizes, setSelectedSizes] = useState<string[]>(
    initialSizeOpt ? initialSizeOpt.values : ["Free Size", "S", "M", "L", "XL"]
  );
  const [customSizeText, setCustomSizeText] = useState("");

  // Specifications States
  const DEFAULT_SPECS = [
    { key: "Made of", value: "" },
    { key: "Pattern", value: "" },
    { key: "Fit Type", value: "" },
    { key: "Color", value: "" },
    { key: "Pocket", value: "" },
    { key: "Care Instruction", value: "" },
    { key: "Available sizes", value: "" },
    { key: "SKU", value: "" },
    { key: "Country of Origin", value: "" },
  ];

  const initialSpecs = (() => {
    if (product?.specifications && typeof product.specifications === "object") {
      const keys = Object.keys(product.specifications);
      if (keys.length > 0) {
        const keyMap: Record<string, string> = {
          madeOf: "Made of",
          "🧵 Made of": "Made of",
          pattern: "Pattern",
          "📐 Pattern": "Pattern",
          fitType: "Fit Type",
          "🕺 Fit Type": "Fit Type",
          color: "Color",
          "🎨 Color": "Color",
          pocket: "Pocket",
          "🎒 Pocket": "Pocket",
          careInstruction: "Care Instruction",
          "🧼 Care Instruction": "Care Instruction",
          availableSizes: "Available sizes",
          "📏 Available sizes": "Available sizes",
          sku: "SKU",
          "🏷️ SKU": "SKU",
          country: "Country of Origin",
          "🌍 Country of Origin": "Country of Origin"
        };

        const list: { key: string; value: string }[] = [];
        keys.forEach(k => {
          if (k !== "manufacturedBy" && k !== "shippedBy") {
            list.push({
              key: keyMap[k] || k,
              value: String(product.specifications[k] || "")
            });
          }
        });
        return list.length > 0 ? list : DEFAULT_SPECS;
      }
    }
    return DEFAULT_SPECS;
  })();

  const [specs, setSpecs] = useState<{ key: string; value: string }[]>(initialSpecs);
  const [specManufacturedBy, setSpecManufacturedBy] = useState(
    product?.specifications?.manufacturedBy || 
    "Boutiique Vastraa\n2 No Gouranga Colony Koler Danga Road Nabadwip, West Bengal, Nadia, 741302"
  );
  const [specShippedBy, setSpecShippedBy] = useState(
    product?.specifications?.shippedBy || 
    "Boutiique Vastraa"
  );

  const updateSizeOptions = (enabled: boolean, sizeList: string[]) => {
    let updatedOpts = options.filter((o: any) => o.name?.toLowerCase() !== "size");
    if (enabled && sizeList.length > 0) {
      updatedOpts = [{ name: "Size", values: sizeList }, ...updatedOpts];
    }
    setOptions(updatedOpts);
    generateVariantsFromOptions(updatedOpts);
  };

  const handleToggleSizesEnabled = (enabled: boolean) => {
    setSizesEnabled(enabled);
    updateSizeOptions(enabled, selectedSizes);
  };

  const handleToggleSizeValue = (sizeVal: string) => {
    let nextSizes: string[];
    if (selectedSizes.includes(sizeVal)) {
      nextSizes = selectedSizes.filter(s => s !== sizeVal);
    } else {
      nextSizes = [...selectedSizes, sizeVal];
    }
    setSelectedSizes(nextSizes);
    if (sizesEnabled) {
      updateSizeOptions(true, nextSizes);
    }
  };

  const handleAddCustomSize = () => {
    const trimmed = customSizeText.trim();
    if (!trimmed) return;
    if (!selectedSizes.includes(trimmed)) {
      const nextSizes = [...selectedSizes, trimmed];
      setSelectedSizes(nextSizes);
      if (sizesEnabled) {
        updateSizeOptions(true, nextSizes);
      }
    }
    setCustomSizeText("");
  };

  const handleSelectAllSizes = () => {
    const allPresets = [...PRESET_SIZES];
    setSelectedSizes(allPresets);
    if (sizesEnabled) {
      updateSizeOptions(true, allPresets);
    }
  };

  const handleClearAllSizes = () => {
    setSelectedSizes([]);
    if (sizesEnabled) {
      updateSizeOptions(true, []);
    }
  };



  // Handler: Remove image
  const handleRemoveImage = (index: number) => {
    setImages(images.filter((_, idx) => idx !== index));
  };

  // Handler: File Upload local
  const handleImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setUploading(true);
    setError("");

    try {
      const filesArray = Array.from(fileList);
      const uploadPromises = filesArray.map(async (file) => {
        const formData = new FormData();
        formData.append("image", file);
        const res = await uploadImageAction(formData);
        if (res.success && res.url) {
          return res.url;
        } else {
          throw new Error(res.error || `Failed to upload ${file.name}`);
        }
      });

      const urls = await Promise.all(uploadPromises);
      setImages([...images, ...urls]);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "An unexpected error occurred during image upload.");
    } finally {
      setUploading(false);
      e.target.value = "";
    }
  };

  // Handler: Size Chart Image Upload local
  const handleSizeChartImageUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const fileList = e.target.files;
    if (!fileList || fileList.length === 0) return;

    setSizeChartUploading(true);
    setError("");

    try {
      const file = fileList[0];
      const formData = new FormData();
      formData.append("image", file);

      const res = await uploadImageAction(formData);
      if (res.success && res.url) {
        setSizeChartImage(res.url);
      } else {
        setError(res.error || "Size chart upload failed.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred during size chart upload.");
    } finally {
      setSizeChartUploading(false);
    }
  };

  // Handler: Add Options Types
  const handleAddOption = () => {
    if (!newOptionName.trim() || !newOptionValues.trim()) {
      setError("Please specify both an option name and its comma-separated values.");
      return;
    }

    const name = newOptionName.trim();
    const values = newOptionValues.split(",").map(v => v.trim()).filter(Boolean);

    if (options.some(o => o.name.toLowerCase() === name.toLowerCase())) {
      setError(`Option group "${name}" already exists.`);
      return;
    }

    const updatedOptions = [...options, { name, values }];
    setOptions(updatedOptions);
    setNewOptionName("");
    setNewOptionValues("");
    setError("");

    // Re-generate variants based on updated options
    generateVariantsFromOptions(updatedOptions);
  };

  // Handler: Remove Option group
  const handleRemoveOption = (index: number) => {
    const updatedOptions = options.filter((_, idx) => idx !== index);
    setOptions(updatedOptions);
    generateVariantsFromOptions(updatedOptions);
  };

  // Helper: Cartesian product of arrays to generate all combinations
  const generateVariantsFromOptions = (opts: any[]) => {
    if (opts.length === 0) {
      setVariants([]);
      return;
    }

    // Cartesian helper
    const cartesian = (arrays: any[][]): any[][] => {
      return arrays.reduce((acc, curr) => {
        return acc.flatMap(d => curr.map(e => [...d, e]));
      }, [[]]);
    };

    const optionArrays = opts.map(o => o.values.map((v: string) => ({ name: o.name, value: v })));
    const combinations = cartesian(optionArrays);

    const generated = combinations.map((comb: any[]) => {
      const variantTitle = comb.map((o: any) => o.value).join(" / ");
      
      // Try to find if a variant with this combination already exists to preserve its price
      const existing = variants.find(v => {
        return comb.every(c => v.selectedOptions.some((o: any) => o.name === c.name && o.value === c.value));
      });

      return {
        title: variantTitle,
        price: existing?.price || price || "0.00",
        compareAtPrice: existing?.compareAtPrice || compareAtPrice || "",
        selectedOptions: comb
      };
    });

    setVariants(generated);
  };

  // Handler: Update specific variant price
  const handleVariantPriceChange = (index: number, field: "price" | "compareAtPrice", val: string) => {
    const updated = [...variants];
    updated[index][field] = val;
    setVariants(updated);
  };

  // Handler: Collection selection toggle
  const handleCollectionToggle = (handle: string) => {
    if (selectedCollections.includes(handle)) {
      setSelectedCollections(selectedCollections.filter(h => h !== handle));
    } else {
      setSelectedCollections([...selectedCollections, handle]);
    }
  };

  // Dynamic Specs Row Management
  const handleAddSpecRow = () => {
    setSpecs([...specs, { key: "", value: "" }]);
  };

  const handleRemoveSpecRow = (idx: number) => {
    setSpecs(specs.filter((_, i) => i !== idx));
  };

  const handleSpecChange = (idx: number, field: "key" | "value", val: string) => {
    const next = [...specs];
    next[idx][field] = val;
    setSpecs(next);
  };

  // Submit Handler
  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setSaving(true);

    if (!title || !price || !description) {
      setError("Please fill in basic fields: Title, Base Price, and Description.");
      setSaving(false);
      return;
    }

    if (images.length === 0) {
      setError("Please add at least one product image.");
      setSaving(false);
      return;
    }

    const tags = tagsInput.split(",").map((t: string) => t.trim()).filter(Boolean);

    try {
      const res = await saveProductAction({
        id: product?.id,
        title,
        handle: handle.trim() || undefined,
        price,
        compareAtPrice: compareAtPrice || undefined,
        description,
        inventory: parseInt(inventory as any, 10) || 0,
        images,
        options: options.length > 0 ? options : [{ name: "Standard", values: ["Default Title"] }],
        variants: variants.length > 0 ? variants : [{ title: "Default Title", price, compareAtPrice: compareAtPrice || undefined, selectedOptions: [{ name: "Standard", value: "Default Title" }] }],
        tags,
        collectionHandles: selectedCollections,
        showSizeChart,
        sizeChartImage: sizeChartImage || "",
        sizesEnabled,
        selectedSizes,
        specifications: (() => {
          const obj: Record<string, string> = {};
          specs.forEach(s => {
            const tk = s.key.trim();
            const tv = s.value.trim();
            if (tk) {
              obj[tk] = tv;
            }
          });
          obj.manufacturedBy = specManufacturedBy;
          obj.shippedBy = specShippedBy;
          return obj;
        })()
      });

      if (res.success) {
        router.push("/admin/products");
      } else {
        setError(res.error || "Failed to save product.");
      }
    } catch (err) {
      console.error(err);
      setError("An unexpected error occurred.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6 max-w-4xl mx-auto">
      {/* Header back */}
      <div className="flex items-center gap-4 justify-between pb-4 border-b border-neutral-800">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 bg-neutral-950 border border-neutral-800 rounded-lg text-neutral-400 hover:text-white transition-colors"
          >
            <ArrowLeft className="w-4 h-4" />
          </Link>
          <div>
            <h1 className="text-xl md:text-2xl font-serif font-bold text-white flex items-center gap-2">
              {isEdit ? "Edit Saree Detail" : "Create New Saree Listing"}{" "}
              <Sparkles className="w-4 h-4 text-[#C9A84C]" />
            </h1>
            <p className="text-[10px] text-neutral-500 uppercase tracking-widest font-semibold">
              {isEdit ? `ID: ${(product.id || "").split("/").pop()}` : "Catalog Addition"}
            </p>
          </div>
        </div>
      </div>

      {error && (
        <div className="p-4 bg-red-950/40 border border-red-900/50 text-red-400 text-xs rounded-lg flex items-center gap-2">
          <AlertCircle className="w-4.5 h-4.5" />
          <span>{error}</span>
        </div>
      )}

      {/* Main product form */}
      <form onSubmit={handleSave} className="grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column (Main Info, Options, Variants) */}
        <div className="md:col-span-2 space-y-6">
          
          {/* Section 1: Basic Information */}
          <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Basic Info</h3>
            
            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Product Title</label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Emerald Silk Brocade Banarasi Saree"
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-maroonClr"
              />
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Custom Handle (Optional)</label>
                <input
                  type="text"
                  value={handle}
                  onChange={(e) => setHandle(e.target.value)}
                  placeholder="emerald-silk-saree"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-maroonClr"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Tags (Comma-separated)</label>
                <input
                  type="text"
                  value={tagsInput}
                  onChange={(e) => setTagsInput(e.target.value)}
                  placeholder="Silk, Banarasi, Wedding, Crimson"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-maroonClr"
                />
              </div>
            </div>

            <div>
              <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Description</label>
              <textarea
                required
                rows={5}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Write detailed information about the fabric, weaving style, border details, and care guidelines..."
                className="w-full bg-neutral-900 border border-neutral-800 rounded-lg p-4 text-xs text-white focus:outline-none focus:border-maroonClr resize-none"
              />
            </div>
          </div>

          {/* Section 1.5: Specifications Details */}
          <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 space-y-4">
            <div className="flex justify-between items-center pb-2 border-b border-neutral-900">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Specifications & Manufacturing Info</h3>
                <p className="text-[11px] text-neutral-500 mt-1">Configure specification details (emoji friendly!). Admin can dynamically add or delete rows.</p>
              </div>
              <button
                type="button"
                onClick={handleAddSpecRow}
                className="bg-neutral-800 text-[#C9A84C] hover:bg-neutral-700 px-3 py-1.5 rounded text-xs font-bold uppercase transition-colors flex items-center gap-1 shrink-0"
              >
                <Plus className="w-3.5 h-3.5" />
                Add Row
              </button>
            </div>

            {specs.length > 0 && (
              <div className="grid grid-cols-12 gap-3 mb-1 text-[10px] font-bold text-neutral-500 uppercase tracking-wider">
                <div className="col-span-5 pl-1">Specification Name (Key)</div>
                <div className="col-span-6 pl-1">Value Description</div>
                <div className="col-span-1"></div>
              </div>
            )}

            <div className="space-y-3">
              {specs.map((item, idx) => (
                <div key={idx} className="grid grid-cols-12 gap-3 items-center">
                  <div className="col-span-5">
                    <input
                      type="text"
                      required
                      placeholder="e.g. 🧵 Made of"
                      value={item.key}
                      onChange={(e) => handleSpecChange(idx, "key", e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-maroonClr"
                    />
                  </div>
                  <div className="col-span-6">
                    <input
                      type="text"
                      placeholder="e.g. 88% Nylon 12% Spandex"
                      value={item.value}
                      onChange={(e) => handleSpecChange(idx, "value", e.target.value)}
                      className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-maroonClr"
                    />
                  </div>
                  <div className="col-span-1 flex justify-center">
                    <button
                      type="button"
                      onClick={() => handleRemoveSpecRow(idx)}
                      className="text-neutral-500 hover:text-red-500 p-2 transition-colors"
                      title="Remove Row"
                    >
                      <Trash2 className="w-4.5 h-4.5" />
                    </button>
                  </div>
                </div>
              ))}
            </div>

            {specs.length === 0 && (
              <p className="text-neutral-600 text-xs italic py-2">No specifications added. Click "Add Row" above to create one.</p>
            )}

            <div className="space-y-4 pt-4 border-t border-neutral-900">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Manufactured & Packed By</label>
                <textarea
                  value={specManufacturedBy}
                  onChange={(e) => setSpecManufacturedBy(e.target.value)}
                  placeholder="Company Name&#10;Address Details..."
                  rows={3}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-maroonClr font-sans"
                />
              </div>

              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Shipped & Marketed By</label>
                <textarea
                  value={specShippedBy}
                  onChange={(e) => setSpecShippedBy(e.target.value)}
                  placeholder="Company Name&#10;Address Details..."
                  rows={2}
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-maroonClr font-sans"
                />
              </div>
            </div>
          </div>

          {/* Section 2: Pricing & Stock */}
          <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Base Pricing & Inventory</h3>
            
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Base Price (INR)</label>
                <input
                  type="number"
                  required
                  value={price}
                  onChange={(e) => setPrice(e.target.value)}
                  placeholder="14500"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-maroonClr font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Compare at Price (INR)</label>
                <input
                  type="number"
                  value={compareAtPrice}
                  onChange={(e) => setCompareAtPrice(e.target.value)}
                  placeholder="18000"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-maroonClr font-mono"
                />
              </div>
              <div>
                <label className="block text-[10px] font-bold text-neutral-400 uppercase tracking-wider mb-1.5">Initial Stock</label>
                <input
                  type="number"
                  required
                  value={inventory}
                  onChange={(e) => setInventory(parseInt(e.target.value) || 0)}
                  placeholder="10"
                  className="w-full bg-neutral-900 border border-neutral-800 rounded-lg px-4 py-2.5 text-xs text-white focus:outline-none focus:border-maroonClr font-mono"
                />
              </div>
            </div>
          </div>

          {/* Section 2.5: Product Size Management */}
          <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 space-y-4">
            <div className="flex items-center justify-between pb-3 border-b border-neutral-900">
              <div>
                <h3 className="text-sm font-bold text-white uppercase tracking-wider">Product Size Management</h3>
                <p className="text-[11px] text-neutral-400 mt-0.5">Enable or disable sizes for this product, select available sizes (like Free Size), or add custom sizes.</p>
              </div>
              <button
                type="button"
                onClick={() => handleToggleSizesEnabled(!sizesEnabled)}
                className={`px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wider transition-all flex items-center gap-1.5 ${
                  sizesEnabled
                    ? "bg-emerald-500/20 text-emerald-400 border border-emerald-500/40"
                    : "bg-neutral-800 text-neutral-400 border border-neutral-700"
                }`}
              >
                <span className={`w-2 h-2 rounded-full ${sizesEnabled ? "bg-emerald-400 animate-pulse" : "bg-neutral-500"}`} />
                {sizesEnabled ? "Sizes Active" : "Sizes Disabled"}
              </button>
            </div>

            {sizesEnabled ? (
              <div className="space-y-4 pt-1">
                <div className="flex items-center justify-between">
                  <label className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">Available Sizes</label>
                  <div className="flex gap-2">
                    <button
                      type="button"
                      onClick={handleSelectAllSizes}
                      className="text-[10px] text-[#C9A84C] hover:underline font-semibold uppercase"
                    >
                      Select All
                    </button>
                    <span className="text-neutral-700 text-xs">|</span>
                    <button
                      type="button"
                      onClick={handleClearAllSizes}
                      className="text-[10px] text-red-400 hover:underline font-semibold uppercase"
                    >
                      Clear All
                    </button>
                  </div>
                </div>

                {/* Preset Size Chips */}
                <div className="flex flex-wrap gap-2.5">
                  {PRESET_SIZES.map((sz) => {
                    const isSelected = selectedSizes.includes(sz);
                    return (
                      <button
                        key={sz}
                        type="button"
                        onClick={() => handleToggleSizeValue(sz)}
                        className={`px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all border ${
                          isSelected
                            ? "bg-maroonClr text-white border-maroonClr shadow-sm scale-105"
                            : "bg-neutral-900 text-neutral-400 border-neutral-800 hover:border-neutral-700 hover:text-white"
                        }`}
                      >
                        {sz === "Free Size" ? "🎁 Free Size" : sz}
                      </button>
                    );
                  })}
                </div>

                {/* Extra custom sizes chips if user added non-preset ones */}
                {selectedSizes.filter(s => !PRESET_SIZES.includes(s)).length > 0 && (
                  <div className="pt-2 border-t border-neutral-900/50">
                    <span className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-2">Custom Sizes</span>
                    <div className="flex flex-wrap gap-2">
                      {selectedSizes.filter(s => !PRESET_SIZES.includes(s)).map(sz => (
                        <button
                          key={sz}
                          type="button"
                          onClick={() => handleToggleSizeValue(sz)}
                          className="px-3 py-1 rounded-lg text-xs font-semibold bg-maroonClr/40 text-white border border-maroonClr/60 flex items-center gap-1.5 hover:bg-red-950 transition-colors"
                        >
                          {sz}
                          <span className="text-neutral-400 hover:text-white">&times;</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Add Custom Size Form */}
                <div className="flex gap-2 pt-2 items-center">
                  <input
                    type="text"
                    placeholder="Add custom size (e.g. 5XL, Unstitched)"
                    value={customSizeText}
                    onChange={(e) => setCustomSizeText(e.target.value)}
                    onKeyDown={(e) => { if (e.key === "Enter") { e.preventDefault(); handleAddCustomSize(); } }}
                    className="flex-1 bg-neutral-900 border border-neutral-800 rounded-lg px-3 py-1.5 text-xs text-white focus:outline-none focus:border-maroonClr"
                  />
                  <button
                    type="button"
                    onClick={handleAddCustomSize}
                    className="bg-neutral-800 text-[#C9A84C] hover:bg-neutral-700 px-3.5 py-1.5 rounded-lg text-xs font-bold uppercase transition-colors"
                  >
                    + Add Size
                  </button>
                </div>
              </div>
            ) : (
              <div className="p-3 bg-neutral-900/50 rounded-lg border border-neutral-850 text-neutral-500 text-xs italic text-center">
                Size selection is currently OFF for this product. Customers will buy without picking a size.
              </div>
            )}
          </div>

          {/* Section 3: Options (Sizes, stitching) */}
          <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 space-y-4">
            <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Other Custom Options (e.g. Blouse Stitching)</h3>
            
            {/* Added options list */}
            {options.length > 0 && (
              <div className="space-y-2 mb-4">
                {options.map((opt, idx) => (
                  <div key={idx} className="flex justify-between items-center bg-neutral-900 p-3 rounded-lg border border-neutral-850">
                    <div>
                      <span className="text-xs font-semibold text-white uppercase tracking-wider">{opt.name}: </span>
                      <span className="text-xs text-neutral-400 font-mono">{opt.values.join(", ")}</span>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleRemoveOption(idx)}
                      className="text-neutral-500 hover:text-red-400 transition-colors p-1"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* Option adder form */}
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 items-end bg-neutral-900/50 p-4 rounded-lg border border-neutral-850">
              <div>
                <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Option Name</label>
                <input
                  type="text"
                  placeholder="e.g. Size, Stitching"
                  value={newOptionName}
                  onChange={(e) => setNewOptionName(e.target.value)}
                  className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                />
              </div>
              <div className="sm:col-span-2 flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider mb-1">Values (Comma-separated)</label>
                  <input
                    type="text"
                    placeholder="e.g. S, M, L or Standard, Custom"
                    value={newOptionValues}
                    onChange={(e) => setNewOptionValues(e.target.value)}
                    className="w-full bg-neutral-950 border border-neutral-800 rounded px-3 py-1.5 text-xs text-white focus:outline-none"
                  />
                </div>
                <button
                  type="button"
                  onClick={handleAddOption}
                  className="bg-neutral-800 text-[#C9A84C] hover:bg-neutral-700 px-3 py-2 rounded text-xs font-bold uppercase transition-colors"
                >
                  Add
                </button>
              </div>
            </div>
          </div>

          {/* Section 4: Variants Table (Conditional) */}
          {variants.length > 0 && (
            <div className="bg-neutral-950 p-6 rounded-xl border border-neutral-800 space-y-4">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-2">Variant Price Adjustments</h3>
              
              <div className="overflow-x-auto">
                <table className="w-full text-left text-xs text-neutral-400">
                  <thead className="bg-neutral-900 font-bold uppercase tracking-wider text-neutral-500 border-b border-neutral-800">
                    <tr>
                      <th className="py-2.5 px-3">Variant Combination</th>
                      <th className="py-2.5 px-3 w-32">Price (INR)</th>
                      <th className="py-2.5 px-3 w-32">Compare Price (INR)</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-900">
                    {variants.map((v, idx) => (
                      <tr key={idx} className="hover:bg-neutral-900/30">
                        <td className="py-2.5 px-3 text-white font-semibold">{v.title}</td>
                        <td className="py-1 px-3">
                          <input
                            type="number"
                            required
                            value={v.price}
                            onChange={(e) => handleVariantPriceChange(idx, "price", e.target.value)}
                            className="bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 w-full text-xs text-white font-mono"
                          />
                        </td>
                        <td className="py-1 px-3">
                          <input
                            type="number"
                            value={v.compareAtPrice}
                            onChange={(e) => handleVariantPriceChange(idx, "compareAtPrice", e.target.value)}
                            placeholder="None"
                            className="bg-neutral-900 border border-neutral-800 rounded px-2.5 py-1 w-full text-xs text-white font-mono"
                          />
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

        </div>

        {/* Right Column (Images, Collections, Save Actions) */}
        <div className="space-y-6">
          
          {/* Block 1: Save Trigger */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-4">
            <button
              type="submit"
              disabled={saving}
              className="w-full bg-maroonClr text-white py-3.5 rounded-lg font-bold uppercase tracking-widest text-xs hover:bg-[#6A102A] transition-colors flex items-center justify-center gap-2 shadow-md disabled:bg-neutral-800 disabled:text-neutral-500"
            >
              {saving ? (
                <>
                  <div className="w-4 h-4 border-2 border-white border-t-transparent rounded-full animate-spin"></div>
                  Saving Listing...
                </>
              ) : (
                "Save Product"
              )}
            </button>
            <Link
              href="/admin/products"
              className="w-full border border-neutral-800 text-neutral-400 hover:text-white py-3 rounded-lg text-xs font-bold uppercase tracking-widest block text-center transition-colors"
            >
              Cancel
            </Link>
          </div>

          {/* Block 2: Collection Placement */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest pb-2 border-b border-neutral-900">
              Collections Placement
            </h3>
            
            <div className="space-y-2 max-h-48 overflow-y-auto custom-scrollbar">
              {collections.length === 0 ? (
                <p className="text-neutral-600 text-xs italic">No collections available.</p>
              ) : (
                collections.map((col) => {
                  const checked = selectedCollections.includes(col.handle);
                  return (
                    <label key={col.handle} className="flex items-center gap-3 cursor-pointer group">
                      <div className="relative flex items-center justify-center">
                        <input
                          type="checkbox"
                          checked={checked}
                          onChange={() => handleCollectionToggle(col.handle)}
                          className="peer appearance-none w-4 h-4 border border-neutral-800 bg-neutral-900 rounded checked:bg-maroonClr checked:border-maroonClr transition-all cursor-pointer"
                        />
                        <Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
                      </div>
                      <span className="text-xs text-neutral-400 group-hover:text-white transition-colors">
                        {col.title}
                      </span>
                    </label>
                  );
                })
              )}
            </div>
          </div>

          {/* Block 2.5: Size Chart Settings */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest pb-2 border-b border-neutral-900">
              Size Chart Settings
            </h3>
            
            <label className="flex items-center gap-3 cursor-pointer group">
              <div className="relative flex items-center justify-center">
                <input
                  type="checkbox"
                  checked={showSizeChart}
                  onChange={(e) => setShowSizeChart(e.target.checked)}
                  className="peer appearance-none w-4 h-4 border border-neutral-800 bg-neutral-900 rounded checked:bg-maroonClr checked:border-maroonClr transition-all cursor-pointer"
                />
                <Check className="absolute w-3 h-3 text-white opacity-0 peer-checked:opacity-100 pointer-events-none" />
              </div>
              <span className="text-xs text-neutral-400 group-hover:text-white transition-colors">
                Show Size Chart
              </span>
            </label>

            {showSizeChart && (
              <div className="space-y-4 pt-2 border-t border-neutral-900">
                <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider">
                  Size Chart Image
                </label>

                {sizeChartImage ? (
                  <div className="relative aspect-[4/3] rounded-lg border border-neutral-800 overflow-hidden bg-neutral-900 group">
                    <Image
                      src={sizeChartImage}
                      alt="Size Chart"
                      fill
                      className="object-contain"
                      sizes="200px"
                    />
                    <button
                      type="button"
                      onClick={() => setSizeChartImage("")}
                      className="absolute inset-0 bg-red-950/80 flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ) : (
                  <p className="text-[10px] text-neutral-500 italic">No custom chart uploaded. Standard size table will be shown as default.</p>
                )}

                {/* File Upload Selector for size chart */}
                <div className="space-y-2">
                  <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Upload Chart Image</label>
                  <label className={`w-full border border-dashed border-neutral-800 rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-neutral-900/40 hover:border-neutral-700 ${sizeChartUploading ? "opacity-50 pointer-events-none" : ""}`}>
                    <Upload className="w-4 h-4 text-neutral-500 mb-1" />
                    <span className="text-[9px] text-neutral-400 font-bold uppercase">
                      {sizeChartUploading ? "Uploading..." : "Browse Chart File"}
                    </span>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleSizeChartImageUpload}
                      className="hidden"
                    />
                  </label>
                </div>

              </div>
            )}
          </div>

          {/* Block 3: Images Catalog */}
          <div className="bg-neutral-950 border border-neutral-800 rounded-xl p-6 space-y-4">
            <h3 className="text-xs font-bold text-white uppercase tracking-widest pb-2 border-b border-neutral-900">
              Product Images
            </h3>

            {/* Existing Images Thumbnails */}
            {images.length > 0 && (
              <div className="grid grid-cols-3 gap-2">
                {images.map((url, idx) => (
                  <div key={idx} className="relative aspect-[3/4] rounded-lg border border-neutral-800 overflow-hidden bg-neutral-900 group">
                    <Image
                      src={url}
                      alt="Thumbnail"
                      fill
                      className="object-cover"
                      sizes="80px"
                    />
                    <button
                      type="button"
                      onClick={() => handleRemoveImage(idx)}
                      className="absolute inset-0 bg-red-950/80 flex items-center justify-center text-red-400 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            )}

            {/* File Upload Selector */}
            <div className="space-y-2">
              <label className="block text-[9px] font-bold text-neutral-500 uppercase tracking-wider">Local Image File Upload</label>
              <label className={`w-full border border-dashed border-neutral-800 rounded-lg p-4 flex flex-col items-center justify-center cursor-pointer transition-all hover:bg-neutral-900/40 hover:border-neutral-700 ${uploading ? "opacity-50 pointer-events-none" : ""}`}>
                <Upload className="w-5 h-5 text-neutral-500 mb-1" />
                <span className="text-[10px] text-neutral-400 font-bold uppercase">
                  {uploading ? "Uploading file..." : "Browse Local File"}
                </span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                />
              </label>
            </div>

          </div>

        </div>

      </form>
    </div>
  );
}

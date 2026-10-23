"use client";

import React, { useState } from "react";
import { useRouter } from "next/navigation";
import { Product, ProductVariant, AyurvedicFormulation } from "@/types";
import {
  Plus,
  Trash2,
  Save,
  ArrowLeft,
  AlertCircle,
  CheckCircle2,
  UploadCloud,
  X,
  Star,
  GripVertical,
} from "lucide-react";
import Link from "next/link";
import Image from "next/image";

function slugifyProductName(value: string) {
  return value
    .toLowerCase()
    .trim()
    .replace(/&/g, " ")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");
}

interface ProductFormProps {
  initialProduct?: Product | null;
  categories: { id: string; name: string }[];
}

export function ProductForm({ initialProduct, categories }: ProductFormProps) {
  const router = useRouter();
  const isEditing = !!initialProduct;

  const [name, setName] = useState(initialProduct?.name || "");
  const [categoryId, setCategoryId] = useState(
    initialProduct?.categoryId || categories[0]?.id || "",
  );
  const [ayurvedicFormulation, setAyurvedicFormulation] =
    useState<AyurvedicFormulation>(
      initialProduct?.ayurvedicFormulation || AyurvedicFormulation.CHURNA,
    );
  const [description, setDescription] = useState(
    initialProduct?.fullDescription || initialProduct?.description || "",
  );
  const [ingredients, setIngredients] = useState(
    initialProduct?.ingredients || "",
  );
  const [dosage, setDosage] = useState(
    initialProduct?.usageInstructions || initialProduct?.dosage || "",
  );
  const [benefits, setBenefits] = useState(initialProduct?.benefits || "");
  const [isBestseller, setIsBestseller] = useState(
    initialProduct?.isBestseller || false,
  );
  const [isFeatured, setIsFeatured] = useState(
    initialProduct?.isFeatured || false,
  );
  const [isActive, setIsActive] = useState(
    initialProduct ? initialProduct.isActive : true,
  );

  // Images are URL records after an authenticated Neon-backed upload. Existing URLs remain supported.
  type FormImage = { imageUrl: string; altText: string; isPrimary: boolean; sortOrder: number; filename?: string; status?: 'complete' | 'uploading' | 'error' };
  const [images, setImages] = useState<FormImage[]>((initialProduct?.images || []).map((image, index) => ({ imageUrl: image.imageUrl, altText: image.altText || '', isPrimary: image.isPrimary || index === 0, sortOrder: image.sortOrder ?? index, status: 'complete' })));
  const [dragActive, setDragActive] = useState(false); const [uploading, setUploading] = useState(false); const maxImageBytes = 5 * 1024 * 1024; const allowedTypes = new Set(['image/jpeg', 'image/png', 'image/webp']);
  const uploadFiles = async (files: FileList | File[]) => { const selected = Array.from(files); if (!selected.length) return; setUploading(true); for (const file of selected) { if (!allowedTypes.has(file.type)) { setErrorMsg(`${file.name}: only JPG, PNG, and WEBP files are allowed.`); continue; } if (file.size > maxImageBytes) { setErrorMsg(`${file.name}: maximum size is 5 MB.`); continue; } const temp = { imageUrl: '', altText: '', isPrimary: images.length === 0, sortOrder: images.length, filename: file.name, status: 'uploading' as const }; setImages((current) => [...current, temp]); try { const body = new FormData(); body.append('file', file); const response = await fetch('/api/admin/uploads', { method: 'POST', body }); const result = await response.json(); if (!response.ok || !result.success) throw new Error(result.error?.message || 'Upload failed'); setImages((current) => current.map((image) => image.filename === file.name && image.status === 'uploading' ? { ...image, imageUrl: result.data.url, status: 'complete' } : image)); } catch (error: any) { setErrorMsg(error.message || `Could not upload ${file.name}`); setImages((current) => current.filter((image) => image.filename !== file.name || image.status !== 'uploading')); } } setUploading(false); };
  const removeImage = (index: number) => setImages((current) => current.filter((_, i) => i !== index).map((image, i) => ({ ...image, sortOrder: i, isPrimary: i === 0 ? image.isPrimary || true : image.isPrimary })));
  const setPrimary = (index: number) => setImages((current) => current.map((image, i) => ({ ...image, isPrimary: i === index })));
  const moveImage = (index: number, direction: -1 | 1) => setImages((current) => { const next = [...current]; const target = index + direction; if (target < 0 || target >= next.length) return current; [next[index], next[target]] = [next[target], next[index]]; return next.map((image, i) => ({ ...image, sortOrder: i })); });

  // Variants Array
  const [variants, setVariants] = useState<
    {
      id?: string;
      sku: string;
      sizeLabel: string;
      weightInGrams: number;
      mrp: number;
      sellingPrice: number;
      costPrice: number;
      stockQuantity: number;
      reorderThreshold: number;
    }[]
  >(
    initialProduct?.variants?.map((v) => ({
      id: v.id,
      sku: v.sku,
      sizeLabel: v.sizeLabel,
      weightInGrams: v.weightInGrams || 100,
      mrp: v.mrp,
      sellingPrice: v.sellingPrice,
      costPrice: v.costPrice || Math.round(v.sellingPrice * 0.5),
      stockQuantity: v.stockQuantity,
      reorderThreshold: v.lowStockThreshold ?? v.reorderThreshold ?? 5,
    })) || [
      {
        sku: "HERB-100G",
        sizeLabel: "100g Jar",
        weightInGrams: 100,
        mrp: 350,
        sellingPrice: 299,
        costPrice: 150,
        stockQuantity: 50,
        reorderThreshold: 10,
      },
    ],
  );

  const [saving, setSaving] = useState(false);
  const [errorMsg, setErrorMsg] = useState("");
  const [successMsg, setSuccessMsg] = useState("");

  const handleNameChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setName(e.target.value);
  };

  const handleAddVariant = () => {
    setVariants([
      ...variants,
      {
        sku: `SKU-${Date.now().toString().slice(-4)}`,
        sizeLabel: "250g Jar",
        weightInGrams: 250,
        mrp: 500,
        sellingPrice: 420,
        costPrice: 200,
        stockQuantity: 30,
        reorderThreshold: 5,
      },
    ]);
  };

  const handleRemoveVariant = (index: number) => {
    if (variants.length <= 1) {
      alert("A product must have at least one variant.");
      return;
    }
    setVariants(variants.filter((_, idx) => idx !== index));
  };

  const handleVariantChange = (index: number, field: string, val: any) => {
    const updated = [...variants];
    updated[index] = { ...updated[index], [field]: val };
    setVariants(updated);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMsg("");
    setSuccessMsg("");

    if (!name.trim()) return setErrorMsg("Product name is required.");
    const productSlug = initialProduct?.slug || slugifyProductName(name);
    if (productSlug.length < 2) return setErrorMsg("Product name must contain at least two letters or numbers.");
    const imagesList = images.filter((image) => image.imageUrl && image.status !== 'uploading').map((image, index) => ({ imageUrl: image.imageUrl, altText: image.altText.trim() || `${name.trim()} product image`, isPrimary: image.isPrimary || (index === 0 && !images.some((item) => item.isPrimary)), sortOrder: index }));
    if (uploading) return setErrorMsg('Please wait for all images to finish uploading.');
    if (!isEditing && imagesList.length === 0) return setErrorMsg('Please upload at least one product image.');

    const payload = {
      name: name.trim(),
      skuPrefix: (variants[0]?.sku || productSlug).split('-')[0].toUpperCase().slice(0, 30),
      // Edit saves omit slug so an existing product's public link never changes.
      ...(initialProduct ? {} : { slug: productSlug }),
      categoryId,
      ayurvedicFormulation,
      shortDescription: description.trim().slice(0, 500),
      fullDescription: description.trim(),
      ingredients: ingredients.trim() || "",
      usageInstructions: dosage.trim() || "",
      benefits: benefits.trim() || "",
      isBestseller,
      isFeatured,
      isActive,
      ...(imagesList.length > 0 ? { images: imagesList } : {}),
      variants: variants.map((v) => ({
        ...v,
        mrp: Number(v.mrp),
        sellingPrice: Number(v.sellingPrice),
        costPrice: Number(v.costPrice),
        stockQuantity: Number(v.stockQuantity),
        weightInGrams: Number(v.weightInGrams),
        lowStockThreshold: Number(v.reorderThreshold),
      })),
    };

    setSaving(true);

    try {
      const url = isEditing
        ? `/api/admin/products/${initialProduct.id}`
        : "/api/admin/products";
      const method = isEditing ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      const data = await res.json();
      if (!res.ok || !data.success) {
        throw new Error(data.error?.message || "Failed to save product");
      }

      setSuccessMsg("Ayurvedic formulation saved successfully!");
      setTimeout(() => {
        router.push("/admin/products");
        router.refresh();
      }, 1000);
    } catch (err: any) {
      setErrorMsg(err.message || "Error saving formulation");
    } finally {
      setSaving(false);
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-8">
      {/* Top Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm">
        <div className="flex items-center gap-3">
          <Link
            href="/admin/products"
            className="p-2 text-gray-500 hover:text-gray-900 rounded-xl hover:bg-gray-100"
          >
            <ArrowLeft className="w-5 h-5" />
          </Link>
          <div>
            <h1 className="font-serif text-2xl font-bold text-gray-900">
              {isEditing
                ? `Edit: ${initialProduct.name}`
                : "New Classical Formulation"}
            </h1>
            <p className="text-xs text-gray-500">
              Hathras Botanical Pharmacopeia & Variant Architecture
            </p>
          </div>
        </div>

        <button
          type="submit"
          disabled={saving}
          className="px-6 py-2.5 rounded-xl bg-[#1B4332] text-white font-bold text-xs uppercase tracking-wider hover:bg-[#2D6A4F] transition-all flex items-center gap-2 shadow-md disabled:opacity-50"
        >
          <Save className="w-4 h-4" />
          <span>{saving ? "Saving..." : "Save Formulation"}</span>
        </button>
      </div>

      {errorMsg && (
        <div className="p-4 bg-red-50 border border-red-200 rounded-2xl text-red-700 text-xs font-medium flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {successMsg && (
        <div className="p-4 bg-emerald-50 border border-emerald-200 rounded-2xl text-emerald-800 text-xs font-medium flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          <span>{successMsg}</span>
        </div>
      )}

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* MAIN METADATA & DESCRIPTIONS */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm space-y-4">
            <h2 className="font-serif text-lg font-bold text-gray-900">
              General Information
            </h2>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Product Name *
                </label>
                <input
                  type="text"
                  required
                  value={name}
                  onChange={handleNameChange}
                  placeholder="e.g. Classical Ashwagandha Churna"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Ayurvedic Category *
                </label>
                <select
                  value={categoryId}
                  onChange={(e) => setCategoryId(e.target.value)}
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] bg-white"
                >
                  {categories.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Shastriya Formulation Type *
                </label>
                <select
                  value={ayurvedicFormulation}
                  onChange={(e) =>
                    setAyurvedicFormulation(e.target.value as any)
                  }
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332] bg-white"
                >
                  <option value="AWALEHA">
                    AWALEHA (Herbal Jam / Chyawanprash)
                  </option>
                  <option value="CHURNA">CHURNA (Herbal Powder)</option>
                  <option value="TAILA">TAILA (Medicated Oil)</option>
                  <option value="VATI">VATI / GUTIKA (Ayurvedic Tablet)</option>
                  <option value="ASAVA_ARISHTA">
                    ASAVA / ARISHTA (Naturally Fermented Tonic)
                  </option>
                  <option value="GHRITA">GHRITA (Medicated Cow Ghee)</option>
                  <option value="KWATHA">KWATHA (Decoction Blend)</option>
                  <option value="BHASMA">
                    BHASMA / RASAYANA (Classical Mineral Calx)
                  </option>
                  <option value="LEPA">LEPA (Topical Herbal Paste)</option>
                  <option value="OTHER">OTHER Classical Preparation</option>
                </select>
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Description & Classical Reference *
                </label>
                <textarea
                  rows={4}
                  required
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Comprehensive description, historical references, and Shastriya preparation highlights..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>

              <div className="sm:col-span-2">
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Herbal Ingredients & Composition
                </label>
                <textarea
                  rows={2}
                  value={ingredients}
                  onChange={(e) => setIngredients(e.target.value)}
                  placeholder="e.g. Pure Withania somnifera (Ashwagandha Root) 100%..."
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Dosage & Anupana
                </label>
                <input
                  type="text"
                  value={dosage}
                  onChange={(e) => setDosage(e.target.value)}
                  placeholder="e.g. 3-6g twice daily with warm milk"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>

              <div>
                <label className="block text-xs font-bold uppercase tracking-wider text-gray-700 mb-1">
                  Health Benefits & Indications
                </label>
                <input
                  type="text"
                  value={benefits}
                  onChange={(e) => setBenefits(e.target.value)}
                  placeholder="e.g. Rasayana, Balya, Ojas builder"
                  className="w-full px-4 py-2.5 rounded-xl border border-gray-300 text-sm focus:outline-none focus:ring-2 focus:ring-[#1B4332]"
                />
              </div>
            </div>
          </div>

          {/* MULTI-VARIANT INVENTORY MATRIX */}
          <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="font-serif text-lg font-bold text-gray-900">
                  Multi-Variant SKUs & Pricing
                </h2>
                <p className="text-xs text-gray-500">
                  Define distinct packaging weights, pricing tiers, and stock
                  limits
                </p>
              </div>
              <button
                type="button"
                onClick={handleAddVariant}
                className="px-3 py-1.5 rounded-lg bg-[#1B4332] text-white text-xs font-bold hover:bg-[#2D6A4F] flex items-center gap-1"
              >
                <Plus className="w-3.5 h-3.5" />
                <span>Add Variant</span>
              </button>
            </div>

            <div className="space-y-4">
              {variants.map((v, idx) => (
                <div
                  key={idx}
                  className="p-4 rounded-2xl bg-[#FAF7F2] border border-[#F3EFE6] grid grid-cols-2 sm:grid-cols-4 md:grid-cols-8 gap-3 items-end"
                >
                  <div className="sm:col-span-2 md:col-span-2">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Size Label
                    </label>
                    <input
                      type="text"
                      required
                      value={v.sizeLabel}
                      onChange={(e) =>
                        handleVariantChange(idx, "sizeLabel", e.target.value)
                      }
                      placeholder="e.g. 250g Jar"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none"
                    />
                  </div>

                  <div className="sm:col-span-2 md:col-span-1">
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      SKU
                    </label>
                    <input
                      type="text"
                      required
                      value={v.sku}
                      onChange={(e) =>
                        handleVariantChange(idx, "sku", e.target.value)
                      }
                      placeholder="SKU-01"
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs bg-white font-mono focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      MRP (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={v.mrp}
                      onChange={(e) =>
                        handleVariantChange(idx, "mrp", Number(e.target.value))
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Selling (₹)
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={v.sellingPrice}
                      onChange={(e) =>
                        handleVariantChange(
                          idx,
                          "sellingPrice",
                          Number(e.target.value),
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs bg-white font-bold text-[#1B4332] focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Stock Qty
                    </label>
                    <input
                      type="number"
                      required
                      min={0}
                      value={v.stockQuantity}
                      onChange={(e) =>
                        handleVariantChange(
                          idx,
                          "stockQuantity",
                          Number(e.target.value),
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none"
                    />
                  </div>

                  <div>
                    <label className="block text-[10px] font-bold uppercase tracking-wider text-gray-600 mb-1">
                      Threshold
                    </label>
                    <input
                      type="number"
                      required
                      min={1}
                      value={v.reorderThreshold}
                      onChange={(e) =>
                        handleVariantChange(
                          idx,
                          "reorderThreshold",
                          Number(e.target.value),
                        )
                      }
                      className="w-full px-2.5 py-1.5 rounded-lg border border-gray-300 text-xs bg-white focus:outline-none"
                    />
                  </div>

                  <div className="flex justify-end pb-0.5">
                    <button
                      type="button"
                      onClick={() => handleRemoveVariant(idx)}
                      className="p-1.5 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                      title="Remove variant"
                    >
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* SIDEBAR: MEDIA & STATUS CONTROLS */}
        <div className="space-y-6">
          {/* Product image upload */}
          <div className="bg-white p-6 rounded-3xl border border-[#F3EFE6] shadow-sm space-y-4">
            <div><h2 className="font-serif text-lg font-bold text-gray-900">Product Images</h2><p className="text-xs text-gray-500">Upload JPG, PNG or WEBP files. Maximum 5 MB per image.</p></div>
            <label onDragOver={(e) => { e.preventDefault(); setDragActive(true); }} onDragLeave={() => setDragActive(false)} onDrop={(e) => { e.preventDefault(); setDragActive(false); uploadFiles(e.dataTransfer.files); }} className={`block cursor-pointer rounded-2xl border-2 border-dashed p-8 text-center ${dragActive ? 'border-[#1B4332] bg-emerald-50' : 'border-gray-300 hover:border-[#1B4332]'}`}><UploadCloud className="mx-auto h-8 w-8 text-[#1B4332]" /><p className="mt-2 text-sm font-bold text-gray-800">Upload Product Images</p><p className="text-xs text-gray-500">Drag & drop images here or <span className="text-[#1B4332] underline">Choose Files</span></p><input type="file" accept="image/jpeg,image/png,image/webp" multiple className="sr-only" onChange={(e) => { if (e.target.files) uploadFiles(e.target.files); e.currentTarget.value = ''; }} /></label>
            {images.length > 0 && <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">{images.map((image, index) => <div key={`${image.imageUrl}-${index}`} className="relative rounded-xl border border-gray-200 bg-gray-50 p-2">{image.imageUrl ? <Image src={image.imageUrl} alt={image.altText || `${name} product image`} width={320} height={224} className="h-28 w-full rounded-lg object-contain bg-white" /> : <div className="h-28 flex items-center justify-center text-xs text-gray-500">Uploading...</div>}<p className="mt-1 truncate text-[10px] text-gray-600">{image.filename || 'Existing image'}</p><div className="flex items-center justify-between mt-1"><button type="button" onClick={() => setPrimary(index)} className={`text-[10px] font-bold ${image.isPrimary ? 'text-amber-600' : 'text-gray-500'}`}><Star className="inline h-3 w-3" /> {image.isPrimary ? 'Primary' : 'Set primary'}</button><button type="button" onClick={() => removeImage(index)} className="text-red-600" aria-label="Delete image"><X className="h-4 w-4" /></button></div><div className="flex gap-1 mt-1"><button type="button" onClick={() => moveImage(index, -1)} disabled={index === 0} className="text-gray-500 disabled:opacity-30"><GripVertical className="h-3 w-3 rotate-90" /></button><button type="button" onClick={() => moveImage(index, 1)} disabled={index === images.length - 1} className="text-gray-500 disabled:opacity-30"><GripVertical className="h-3 w-3 rotate-90" /></button></div><input value={image.altText} onChange={(e) => setImages((current) => current.map((item, i) => i === index ? { ...item, altText: e.target.value } : item))} placeholder={`${name || 'Product'} product image`} className="mt-1 w-full rounded border border-gray-200 px-2 py-1 text-[10px]" /></div>)}</div>}
          </div>
        </div>
      </div>
    </form>
  );
}

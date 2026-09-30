"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { Plus, Pencil, Trash2, X, Package, Upload } from "lucide-react";

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  category: string;
  brand: string;
  images: string[];
  description: string;
  specifications: Record<string, string>;
  warrantyType: string;
  warrantyDuration: number;
  warrantyTerms: string;
  inStock: boolean;
  featured: boolean;
}

const emptyProduct = {
  name: "",
  price: 0,
  mrp: 0,
  category: "",
  brand: "",
  description: "",
  images: [] as string[],
  specifications: {} as Record<string, string>,
  warrantyType: "none",
  warrantyDuration: 0,
  warrantyTerms: "",
  inStock: true,
  featured: false,
};

export default function AdminProductsPage() {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editing, setEditing] = useState<string | null>(null);
  const [form, setForm] = useState(emptyProduct);
  const [uploading, setUploading] = useState(false);
  const [uploadError, setUploadError] = useState("");
  const [specKey, setSpecKey] = useState("");
  const [specVal, setSpecVal] = useState("");
  const [categories, setCategories] = useState<string[]>([]);
  const [newCategory, setNewCategory] = useState("");

  const loadCategories = () => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []));
  };

  const addCategory = async () => {
    if (!newCategory.trim()) return;
    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: newCategory.trim() }),
    });
    if (!res.ok) {
      alert("Could not add the category. Please try again.");
      return;
    }
    setNewCategory("");
    loadCategories();
  };

  const deleteCategory = async (name: string) => {
    if (!confirm(`Delete category "${name}"?`)) return;
    const res = await fetch("/api/categories", {
      method: "DELETE",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name }),
    });
    if (!res.ok) {
      alert("Could not delete the category. Please try again.");
      return;
    }
    loadCategories();
  };

  const loadProducts = () => {
    setLoading(true);
    fetch("/api/products?limit=200")
      .then((r) => r.json())
      .then((data) => setProducts(data.products || []))
      .finally(() => setLoading(false));
  };

  useEffect(() => { loadProducts(); loadCategories(); }, []);

  const openNew = () => {
    setForm(emptyProduct);
    setEditing(null);
    setShowForm(true);
  };

  const openEdit = (p: Product) => {
    setForm({
      name: p.name,
      price: p.price,
      mrp: p.mrp,
      category: p.category,
      brand: p.brand,
      description: p.description,
      images: p.images,
      specifications: p.specifications || {},
      warrantyType: p.warrantyType,
      warrantyDuration: p.warrantyDuration,
      warrantyTerms: p.warrantyTerms,
      inStock: p.inStock,
      featured: p.featured,
    });
    setEditing(p._id);
    setShowForm(true);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const method = editing ? "PUT" : "POST";
    const url = editing ? `/api/products/${editing}` : "/api/products";
    const res = await fetch(url, {
      method,
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    if (!res.ok) {
      alert("Could not save the product. Please try again.");
      return;
    }
    const saved: Product = await res.json();
    setProducts((prev) =>
      editing ? prev.map((p) => (p._id === editing ? saved : p)) : [saved, ...prev]
    );
    setShowForm(false);
  };

  const handleDelete = async (id: string) => {
    if (!confirm("Delete this product?")) return;
    const res = await fetch(`/api/products/${id}`, { method: "DELETE" });
    if (!res.ok) {
      alert("Could not delete the product. Please try again.");
      return;
    }
    setProducts((prev) => prev.filter((p) => p._id !== id));
  };

  const uploadImages = async (files: FileList | null) => {
    if (!files || files.length === 0) return;
    setUploading(true);
    setUploadError("");
    const uploaded: string[] = [];
    for (const file of Array.from(files)) {
      const body = new FormData();
      body.append("file", file);
      const res = await fetch("/api/upload", { method: "POST", body });
      const data = await res.json();
      if (!res.ok) {
        setUploadError(data.error || "Upload failed");
        break;
      }
      uploaded.push(data.url);
    }
    setForm((f) => ({ ...f, images: [...f.images, ...uploaded] }));
    setUploading(false);
  };

  const removeImage = (idx: number) => {
    setForm({ ...form, images: form.images.filter((_, i) => i !== idx) });
  };

  const addSpec = () => {
    if (specKey.trim() && specVal.trim()) {
      setForm({
        ...form,
        specifications: { ...form.specifications, [specKey.trim()]: specVal.trim() },
      });
      setSpecKey("");
      setSpecVal("");
    }
  };

  const removeSpec = (key: string) => {
    const specs = { ...form.specifications };
    delete specs[key];
    setForm({ ...form, specifications: specs });
  };

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <h1 className="text-2xl font-bold">Products</h1>
        <button
          onClick={openNew}
          className="flex items-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          <Plus className="size-4" />
          Add Product
        </button>
      </div>

      {/* Product Form Modal */}
      {showForm && (
        <div className="fixed inset-0 z-50 flex items-start justify-center overflow-y-auto bg-black/50 p-4 pt-20">
          <div className="w-full max-w-2xl rounded-xl border border-border bg-background p-6">
            <div className="mb-4 flex items-center justify-between">
              <h2 className="text-lg font-bold">
                {editing ? "Edit Product" : "Add Product"}
              </h2>
              <button
                onClick={() => setShowForm(false)}
                className="p-1 text-muted-foreground hover:text-foreground"
              >
                <X className="size-5" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium">Name *</label>
                  <input
                    value={form.name}
                    onChange={(e) => setForm({ ...form, name: e.target.value })}
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Brand</label>
                  <input
                    value={form.brand}
                    onChange={(e) => setForm({ ...form, brand: e.target.value })}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Price (₹) *</label>
                  <input
                    type="number"
                    value={form.price}
                    onChange={(e) =>
                      setForm({ ...form, price: Number(e.target.value) })
                    }
                    required
                    min={0}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">MRP (₹) *</label>
                  <input
                    type="number"
                    value={form.mrp}
                    onChange={(e) =>
                      setForm({ ...form, mrp: Number(e.target.value) })
                    }
                    required
                    min={0}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Category *</label>
                  <select
                    value={form.category}
                    onChange={(e) =>
                      setForm({ ...form, category: e.target.value })
                    }
                    required
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="">Select</option>
                    {categories.map((c) => (
                      <option key={c} value={c}>{c}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label className="mb-1 block text-sm font-medium">Description</label>
                <textarea
                  value={form.description}
                  onChange={(e) =>
                    setForm({ ...form, description: e.target.value })
                  }
                  rows={3}
                  className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                />
              </div>

              {/* Images */}
              <div>
                <label className="mb-1 block text-sm font-medium">Images</label>
                <div className="flex flex-wrap gap-2">
                  {form.images.map((img, i) => (
                    <div
                      key={img}
                      className="relative size-20 overflow-hidden rounded-lg border border-border bg-muted"
                    >
                      <Image
                        src={img}
                        alt={`Product image ${i + 1}`}
                        fill
                        unoptimized
                        className="object-cover"
                      />
                      {i === 0 && (
                        <span className="absolute bottom-0 left-0 right-0 bg-black/60 py-0.5 text-center text-[10px] text-white">
                          Main
                        </span>
                      )}
                      <button
                        type="button"
                        onClick={() => removeImage(i)}
                        aria-label="Remove image"
                        className="absolute right-0.5 top-0.5 rounded-full bg-black/60 p-0.5 text-white hover:bg-destructive"
                      >
                        <X className="size-3" />
                      </button>
                    </div>
                  ))}
                  <label className="flex size-20 cursor-pointer flex-col items-center justify-center gap-1 rounded-lg border border-dashed border-input text-xs text-muted-foreground hover:bg-muted">
                    <Upload className="size-4" />
                    {uploading ? "Uploading…" : "Upload"}
                    <input
                      type="file"
                      accept="image/jpeg,image/png,image/webp,image/gif"
                      multiple
                      disabled={uploading}
                      className="hidden"
                      onChange={(e) => {
                        uploadImages(e.target.files);
                        e.target.value = "";
                      }}
                    />
                  </label>
                </div>
                {uploadError && (
                  <p className="mt-1 text-xs text-destructive">{uploadError}</p>
                )}
              </div>

              {/* Specifications */}
              <div>
                <label className="mb-1 block text-sm font-medium">Specifications</label>
                <div className="flex gap-2">
                  <input
                    value={specKey}
                    onChange={(e) => setSpecKey(e.target.value)}
                    placeholder="Key (e.g. Wattage)"
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <input
                    value={specVal}
                    onChange={(e) => setSpecVal(e.target.value)}
                    placeholder="Value (e.g. 40W)"
                    className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                  <button
                    type="button"
                    onClick={addSpec}
                    className="rounded-lg bg-muted px-3 py-2 text-sm hover:bg-muted/80"
                  >
                    Add
                  </button>
                </div>
                {Object.entries(form.specifications).length > 0 && (
                  <div className="mt-2 space-y-1">
                    {Object.entries(form.specifications).map(([k, v]) => (
                      <div
                        key={k}
                        className="flex items-center justify-between rounded-md bg-muted px-3 py-1.5 text-sm"
                      >
                        <span>
                          {k}: <strong>{v}</strong>
                        </span>
                        <button
                          type="button"
                          onClick={() => removeSpec(k)}
                          className="text-muted-foreground hover:text-destructive"
                        >
                          <X className="size-3" />
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Warranty */}
              <div className="grid gap-4 sm:grid-cols-3">
                <div>
                  <label className="mb-1 block text-sm font-medium">Warranty Type</label>
                  <select
                    value={form.warrantyType}
                    onChange={(e) =>
                      setForm({ ...form, warrantyType: e.target.value })
                    }
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  >
                    <option value="none">None</option>
                    <option value="shop">Shop Warranty</option>
                    <option value="brand">Brand Warranty</option>
                  </select>
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Duration (months)</label>
                  <input
                    type="number"
                    value={form.warrantyDuration}
                    onChange={(e) =>
                      setForm({ ...form, warrantyDuration: Number(e.target.value) })
                    }
                    min={0}
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium">Terms</label>
                  <input
                    value={form.warrantyTerms}
                    onChange={(e) =>
                      setForm({ ...form, warrantyTerms: e.target.value })
                    }
                    className="w-full rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                  />
                </div>
              </div>

              {/* Toggles */}
              <div className="flex gap-6">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.inStock}
                    onChange={(e) =>
                      setForm({ ...form, inStock: e.target.checked })
                    }
                    className="accent-primary"
                  />
                  In Stock
                </label>
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={form.featured}
                    onChange={(e) =>
                      setForm({ ...form, featured: e.target.checked })
                    }
                    className="accent-primary"
                  />
                  Featured
                </label>
              </div>

              <div className="flex gap-2">
                <button
                  type="submit"
                  className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90"
                >
                  {editing ? "Update Product" : "Add Product"}
                </button>
                <button
                  type="button"
                  onClick={() => setShowForm(false)}
                  className="rounded-lg border border-border px-6 py-2.5 text-sm font-medium hover:bg-muted"
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Category Management */}
      <div className="mb-6 rounded-xl border border-border p-4">
        <h3 className="mb-3 text-sm font-semibold">Manage Categories</h3>
        <div className="mb-3 flex gap-2">
          <input
            value={newCategory}
            onChange={(e) => setNewCategory(e.target.value)}
            placeholder="New category name..."
            className="flex-1 rounded-lg border border-input bg-background px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
            onKeyDown={(e) => e.key === "Enter" && addCategory()}
          />
          <button
            onClick={addCategory}
            className="rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground hover:bg-primary/90"
          >
            Add
          </button>
        </div>
        <div className="flex flex-wrap gap-1.5">
          {categories.map((cat) => (
            <span
              key={cat}
              className="flex items-center gap-1 rounded-full bg-muted px-3 py-1 text-xs font-medium"
            >
              {cat}
              <button
                onClick={() => deleteCategory(cat)}
                className="ml-0.5 text-muted-foreground hover:text-destructive"
              >
                <X className="size-3" />
              </button>
            </span>
          ))}
        </div>
      </div>

      {/* Products Table */}
      {loading ? (
        <div className="py-10 text-center text-muted-foreground">Loading...</div>
      ) : products.length === 0 ? (
        <div className="py-10 text-center">
          <Package className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="text-muted-foreground">No products yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Product</th>
                <th className="px-4 py-3 text-left font-medium">Category</th>
                <th className="px-4 py-3 text-right font-medium">Price</th>
                <th className="px-4 py-3 text-center font-medium">Stock</th>
                <th className="px-4 py-3 text-right font-medium">Actions</th>
              </tr>
            </thead>
            <tbody>
              {products.map((p) => (
                <tr key={p._id} className="border-b border-border last:border-0">
                  <td className="px-4 py-3">
                    <p className="font-medium">{p.name}</p>
                    {p.brand && (
                      <p className="text-xs text-muted-foreground">{p.brand}</p>
                    )}
                  </td>
                  <td className="px-4 py-3 text-muted-foreground">
                    {p.category}
                  </td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    ₹{p.price}
                    {p.mrp > p.price && (
                      <span className="ml-1 text-xs text-muted-foreground line-through">
                        ₹{p.mrp}
                      </span>
                    )}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`inline-block h-2 w-2 rounded-full ${
                        p.inStock ? "bg-green-500" : "bg-destructive"
                      }`}
                    />
                  </td>
                  <td className="px-4 py-3 text-right">
                    <div className="flex items-center justify-end gap-1">
                      <button
                        onClick={() => openEdit(p)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-foreground"
                      >
                        <Pencil className="size-4" />
                      </button>
                      <button
                        onClick={() => handleDelete(p._id)}
                        className="rounded-md p-1.5 text-muted-foreground hover:bg-muted hover:text-destructive"
                      >
                        <Trash2 className="size-4" />
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

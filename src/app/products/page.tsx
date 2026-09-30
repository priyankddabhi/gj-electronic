"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Search } from "lucide-react";


import ProductCard from "@/components/ProductCard";

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  images: string[];
  category: string;
  inStock: boolean;
  warrantyDuration: number;
}

export default function ProductsPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">…</div>}>
      <ProductsContent />
    </Suspense>
  );
}

function ProductsContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const router = useRouter();
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  // Filters live in the URL so footer/category links, Back and refresh all keep them
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "All";
  const sort = searchParams.get("sort") || "";

  const setFilter = (key: "category" | "sort", value: string) => {
    const params = new URLSearchParams(searchParams.toString());
    if (!value || value === "All") params.delete(key);
    else params.set(key, value);
    const qs = params.toString();
    router.replace(qs ? `/products?${qs}` : "/products", { scroll: false });
  };
  const [categories, setCategories] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    const params = new URLSearchParams();
    if (search) params.set("search", search);
    if (category !== "All") params.set("category", category);
    if (sort) params.set("sort", sort);
    params.set("limit", "100");

    fetch(`/api/products?${params}`)
      .then((r) => r.json())
      .then((data) => setProducts(data.products || []))
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, category, sort]);

  const allCategories = ["All", ...categories];

  return (
    <div className="mx-auto max-w-7xl px-4 pt-4 pb-8">
      {search && (
        <p className="mb-3 flex min-w-0 items-center gap-2 text-sm text-muted-foreground">
          <Search className="size-4 flex-shrink-0" />
          <span className="truncate">
            {t("products.resultsFor")} <b className="text-foreground">&ldquo;{search}&rdquo;</b>
          </span>
          <Link href="/products" className="flex-shrink-0 font-semibold text-crimson hover:underline">
            {t("products.clearSearch")}
          </Link>
        </p>
      )}

      <div className="mb-4 flex items-center gap-3">
        <div className="flex min-w-0 flex-1 gap-1.5 overflow-x-auto pb-1 [scrollbar-width:none]">
          {allCategories.map((cat) => (
            <button
              key={cat}
              onClick={() => setFilter("category", cat)}
              className={`flex-shrink-0 rounded-md px-3 py-1.5 text-xs font-medium transition-colors ${
                category === cat
                  ? "bg-foreground text-background"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {cat === "All" ? t("products.all") : t(`categories.${cat}`, { defaultValue: cat })}
            </button>
          ))}
        </div>
        <select
          value={sort}
          onChange={(e) => setFilter("sort", e.target.value)}
          aria-label={t("products.sortPrice")}
          className="flex-shrink-0 rounded-lg border border-input bg-background px-2 py-1.5 text-xs focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <option value="">{t("products.latest")}</option>
          <option value="price_asc">{t("products.lowToHigh")}</option>
          <option value="price_desc">{t("products.highToLow")}</option>
        </select>
      </div>

      {loading ? (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {Array.from({ length: 8 }).map((_, i) => (
            <div
              key={i}
              className="aspect-[3/4] animate-pulse rounded-xl border border-border bg-muted"
            />
          ))}
        </div>
      ) : products.length === 0 ? (
        <div className="py-20 text-center text-muted-foreground">
          <p className="text-lg">{t("products.noResults")}</p>
        </div>
      ) : (
        <div className="grid gap-4 grid-cols-2 sm:grid-cols-3 lg:grid-cols-4">
          {products.map((product) => (
            <div key={product._id} className="reveal">
              <ProductCard product={product} />
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

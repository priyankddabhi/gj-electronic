"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { useParams } from "next/navigation";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import {
  ShoppingCart,
  Check,
  ChevronLeft,
  ChevronRight,
  Shield,
  Package,
} from "lucide-react";
import { useCartStore } from "@/store/cart";
import ProductCard from "@/components/ProductCard";

interface Product {
  _id: string;
  name: string;
  slug: string;
  description: string;
  price: number;
  mrp: number;
  category: string;
  brand: string;
  images: string[];
  specifications: Record<string, string>;
  warrantyType: string;
  warrantyDuration: number;
  warrantyTerms: string;
  inStock: boolean;
}

export default function ProductDetailPage() {
  const { t } = useTranslation();
  const params = useParams();
  const addItem = useCartStore((s) => s.addItem);
  const [product, setProduct] = useState<Product | null>(null);
  const [related, setRelated] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);
  const [added, setAdded] = useState(false);
  const [selectedImage, setSelectedImage] = useState(0);
  const touchStartX = useRef<number | null>(null);

  const swipeImage = useCallback(
    (dir: "next" | "prev") => {
      if (!product) return;
      const len = product.images.length;
      if (len <= 1) return;
      setSelectedImage((i) =>
        dir === "next" ? (i + 1) % len : (i - 1 + len) % len
      );
    },
    [product]
  );

  useEffect(() => {
    setLoading(true);
    fetch(`/api/products/${params.id}`)
      .then((r) => r.json())
      .then((data) => {
        if (data.error) return;
        setProduct(data);
        return fetch(`/api/products?category=${data.category}&limit=4`);
      })
      .then((r) => r?.json())
      .then((data) => {
        if (data?.products) {
          setRelated(
            data.products.filter((p: Product) => p._id !== product?._id).slice(0, 4)
          );
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [params.id]);

  const handleAdd = () => {
    if (!product || !product.inStock) return;
    addItem({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.images[0] || "",
    });
    setAdded(true);
    setTimeout(() => setAdded(false), 1500);
  };

  if (loading) {
    return (
      <div className="mx-auto max-w-5xl px-4 py-8">
        <div className="grid gap-8 md:grid-cols-2">
          <div className="aspect-square animate-pulse rounded-xl bg-muted" />
          <div className="space-y-4">
            <div className="h-8 w-3/4 animate-pulse rounded bg-muted" />
            <div className="h-6 w-1/4 animate-pulse rounded bg-muted" />
            <div className="h-24 animate-pulse rounded bg-muted" />
          </div>
        </div>
      </div>
    );
  }

  if (!product) {
    return (
      <div className="py-20 text-center">
        <p className="text-lg text-muted-foreground">Product not found</p>
        <Link href="/products" className="mt-4 inline-block text-primary hover:underline">
          {t("common.back")}
        </Link>
      </div>
    );
  }

  const discount =
    product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const specs = Object.entries(product.specifications || {});

  return (
    <div className="mx-auto max-w-5xl px-4 py-8">
      <Link
        href="/products"
        className="mb-6 inline-flex items-center gap-1 text-sm text-muted-foreground hover:text-foreground"
      >
        <ChevronLeft className="size-4" />
        {t("common.back")}
      </Link>

      <div className="grid gap-8 md:grid-cols-2">
        <div>
          <div
            className="relative aspect-square overflow-hidden rounded-xl border border-border bg-white"
            onTouchStart={(e) => { touchStartX.current = e.touches[0].clientX; }}
            onTouchEnd={(e) => {
              if (touchStartX.current === null) return;
              const endX = e.changedTouches[0].clientX;
              const diff = touchStartX.current - endX;
              if (Math.abs(diff) > 50) swipeImage(diff > 0 ? "next" : "prev");
              touchStartX.current = null;
            }}
          >
            {product.images[selectedImage] ? (
              <Image
                src={product.images[selectedImage]}
                alt={product.name}
                fill
                className="object-contain p-4 transition-opacity duration-200"
                sizes="(max-width: 768px) 100vw, 50vw"
                priority
              />
            ) : (
              <div className="flex h-full items-center justify-center text-muted-foreground">
                <Package className="size-16" />
              </div>
            )}
            {product.images.length > 1 && (
              <>
                <button
                  onClick={() => swipeImage("prev")}
                  className="absolute left-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow backdrop-blur-sm hover:bg-background"
                >
                  <ChevronLeft className="size-5" />
                </button>
                <button
                  onClick={() => swipeImage("next")}
                  className="absolute right-2 top-1/2 -translate-y-1/2 rounded-full bg-background/80 p-1.5 shadow backdrop-blur-sm hover:bg-background"
                >
                  <ChevronRight className="size-5" />
                </button>
                <div className="absolute bottom-3 left-1/2 flex -translate-x-1/2 gap-1.5">
                  {product.images.map((_, i) => (
                    <button
                      key={i}
                      onClick={() => setSelectedImage(i)}
                      className={`h-2 rounded-full transition-all ${
                        selectedImage === i ? "w-6 bg-primary" : "w-2 bg-white/60"
                      }`}
                    />
                  ))}
                </div>
              </>
            )}
          </div>
          {product.images.length > 1 && (
            <div className="mt-3 flex gap-2 overflow-x-auto">
              {product.images.map((img, i) => (
                <button
                  key={i}
                  onClick={() => setSelectedImage(i)}
                  className={`relative h-16 w-16 flex-shrink-0 overflow-hidden rounded-lg border-2 ${
                    selectedImage === i
                      ? "border-primary"
                      : "border-border"
                  }`}
                >
                  <Image
                    src={img}
                    alt=""
                    fill
                    className="object-contain p-1"
                    sizes="64px"
                  />
                </button>
              ))}
            </div>
          )}
        </div>

        <div>
          <p className="mb-1 text-sm text-muted-foreground">{product.category}</p>
          <h1 className="mb-1 text-2xl font-bold">{product.name}</h1>
          {product.brand && (
            <p className="mb-4 text-sm text-muted-foreground">{product.brand}</p>
          )}

          <div className="mb-4 flex items-baseline gap-2">
            <span className="text-3xl font-bold">
              {t("common.rupee")}{product.price}
            </span>
            {discount > 0 && (
              <>
                <span className="text-lg text-muted-foreground line-through">
                  {t("common.rupee")}{product.mrp}
                </span>
                <span className="rounded-md bg-peach px-2 py-0.5 text-sm font-bold text-wine">
                  {discount}% off
                </span>
              </>
            )}
          </div>

          <p className={`mb-4 text-sm font-medium ${product.inStock ? "text-green-600" : "text-destructive"}`}>
            {product.inStock ? t("products.inStock") : t("products.outOfStock")}
          </p>

          {product.description && (
            <p className="mb-6 text-sm leading-relaxed text-muted-foreground">
              {product.description}
            </p>
          )}

          <button
            onClick={handleAdd}
            disabled={!product.inStock}
            className={`mb-6 flex w-full items-center justify-center gap-2 rounded-[10px] px-6 py-3 text-sm font-semibold transition-colors ${
              added
                ? "bg-wine text-white"
                : product.inStock
                  ? "bg-crimson text-white hover:bg-wine"
                  : "cursor-not-allowed bg-muted text-muted-foreground"
            }`}
          >
            {added ? (
              <>
                <Check className="size-4" />
                {t("products.added")}
              </>
            ) : (
              <>
                <ShoppingCart className="size-4" />
                {t("products.addToCart")}
              </>
            )}
          </button>

          {product.warrantyDuration > 0 && (
            <div className="mb-6 flex items-center gap-3 rounded-lg border border-border p-3">
              <Shield className="size-5 text-crimson" />
              <div>
                <p className="text-sm font-medium">
                  {t("products.warranty")}: {product.warrantyDuration}{" "}
                  {t("products.months")}
                </p>
                <p className="text-xs text-muted-foreground">
                  {product.warrantyType === "shop"
                    ? "Shop warranty"
                    : "Brand warranty"}
                  {product.warrantyTerms && ` — ${product.warrantyTerms}`}
                </p>
              </div>
            </div>
          )}

          {specs.length > 0 && (
            <div>
              <h3 className="mb-3 font-semibold">{t("products.specifications")}</h3>
              <div className="space-y-2">
                {specs.map(([key, val]) => (
                  <div
                    key={key}
                    className="flex justify-between border-b border-border py-2 text-sm"
                  >
                    <span className="text-muted-foreground">{key}</span>
                    <span className="font-medium">{val}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {related.length > 0 && (
        <section className="mt-12">
          <h2 className="mb-6 text-lg font-bold">{t("products.relatedProducts")}</h2>
          <div className="grid gap-4 grid-cols-2 sm:grid-cols-4">
            {related.map((p) => (
              <ProductCard key={p._id} product={p} />
            ))}
          </div>
        </section>
      )}
    </div>
  );
}

"use client";

import { useState, useRef } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { ShoppingCart, Check, ShieldCheck, Package } from "lucide-react";
import { useCartStore } from "@/store/cart";

interface Product {
  _id: string;
  name: string;
  slug: string;
  price: number;
  mrp: number;
  images: string[];
  category: string;
  brand?: string;
  inStock: boolean;
  warrantyDuration: number;
}

export default function ProductCard({ product }: { product: Product }) {
  const { t } = useTranslation();
  const addItem = useCartStore((s) => s.addItem);
  const [justAdded, setJustAdded] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const discount =
    product.mrp > product.price
      ? Math.round(((product.mrp - product.price) / product.mrp) * 100)
      : 0;

  const handleAdd = (e: React.MouseEvent) => {
    e.preventDefault();
    e.stopPropagation();
    if (!product.inStock) return;

    addItem({
      id: product._id,
      name: product.name,
      price: product.price,
      image: product.images[0] || "",
    });

    setJustAdded(true);
    if (timerRef.current) clearTimeout(timerRef.current);
    timerRef.current = setTimeout(() => setJustAdded(false), 2000);
  };

  return (
    <Link
      href={`/products/${product.slug}`}
      className="group relative flex h-full flex-col overflow-hidden rounded-xl border border-border bg-card transition-[border-color,box-shadow,translate] duration-200 hover:-translate-y-0.5 hover:border-navy-700 hover:shadow-[0_6px_16px_-8px_rgba(22,30,47,0.25)]"
    >
      <div className="relative aspect-square border-b border-border bg-white">
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            className="object-contain p-4 transition-transform duration-300 group-hover:scale-[1.04]"
            sizes="(max-width: 640px) 50vw, (max-width: 1024px) 33vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/60">
            <Package className="size-10" strokeWidth={1.5} />
          </div>
        )}
        {discount > 0 && (
          <span className="absolute left-3 top-3 rounded-md bg-peach px-2 py-0.5 text-xs font-bold text-wine">
            {t("products.off", { percent: discount })}
          </span>
        )}
        {!product.inStock && (
          <div className="absolute inset-0 flex items-center justify-center bg-background/70">
            <span className="rounded-md bg-muted px-3 py-1 text-xs font-medium">
              {t("products.outOfStock")}
            </span>
          </div>
        )}
      </div>

      <div className="flex flex-1 flex-col gap-1 p-3 sm:p-4">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {product.brand || product.category}
        </p>
        <h3 className="line-clamp-2 text-sm font-semibold leading-snug sm:text-[15px]">{product.name}</h3>

        <div className="mt-auto pt-2">
          <div className="flex flex-wrap items-baseline gap-x-2">
            <span className="text-lg font-bold sm:text-xl">
              {t("common.rupee")}{product.price.toLocaleString("en-IN")}
            </span>
            {discount > 0 && (
              <>
                <span className="text-xs text-muted-foreground line-through">
                  {t("common.rupee")}{product.mrp.toLocaleString("en-IN")}
                </span>
                <span className="text-xs font-semibold text-crimson">
                  {t("products.save")} {t("common.rupee")}{(product.mrp - product.price).toLocaleString("en-IN")}
                </span>
              </>
            )}
          </div>

          {product.warrantyDuration > 0 && (
            <p className="mt-1 flex items-center gap-1.5 text-xs text-muted-foreground">
              <ShieldCheck className="size-3.5 text-crimson" />
              {t("products.warrantyMonths", { count: product.warrantyDuration })}
            </p>
          )}

          {product.inStock && (
            <button
              onClick={handleAdd}
              className={`mt-3 flex h-10 w-full items-center justify-center gap-2 rounded-[10px] text-sm font-semibold text-white transition-colors active:scale-[0.97] ${
                justAdded ? "bg-wine" : "bg-navy hover:bg-crimson"
              }`}
            >
              {justAdded ? (
                <>
                  <Check className="pop size-4" />
                  {t("products.added")}
                </>
              ) : (
                <>
                  <ShoppingCart className="size-4" />
                  {t("products.addToCart")}
                </>
              )}
            </button>
          )}
        </div>
      </div>
    </Link>
  );
}

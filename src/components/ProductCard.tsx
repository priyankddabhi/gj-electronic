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

/* Rich-theme product card: crimson edge draws across the top on hover, cursor spotlight, sharp corners */
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

  const rupee = t("common.rupee");

  return (
    <Link href={`/products/${product.slug}`} className="card spot">
      <div className="im">
        {discount > 0 && <span className="off">{t("products.off", { percent: discount })}</span>}
        {product.images[0] ? (
          <Image
            src={product.images[0]}
            alt={product.name}
            fill
            sizes="(max-width: 640px) 50vw, (max-width: 1100px) 50vw, 25vw"
          />
        ) : (
          <div className="flex h-full items-center justify-center text-muted-foreground/60">
            <Package className="size-10" strokeWidth={1.5} />
          </div>
        )}
        {!product.inStock && (
          <div className="soldout"><span>{t("products.outOfStock")}</span></div>
        )}
      </div>

      <div className="bd">
        <div className="brand">{product.brand || product.category}</div>
        <h3>{product.name}</h3>

        <div className="price">
          <b>{rupee}{product.price.toLocaleString("en-IN")}</b>
          {discount > 0 && (
            <>
              <s>{rupee}{product.mrp.toLocaleString("en-IN")}</s>
              <em>{t("products.save")} {rupee}{(product.mrp - product.price).toLocaleString("en-IN")}</em>
            </>
          )}
        </div>

        {product.warrantyDuration > 0 && (
          <p className="warranty">
            <ShieldCheck className="size-3.5 text-crimson" />
            {t("products.warrantyMonths", { count: product.warrantyDuration })}
          </p>
        )}

        {product.inStock && (
          <button type="button" onClick={handleAdd} className={`add${justAdded ? " ok" : ""}`}>
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
    </Link>
  );
}

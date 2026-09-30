"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { Minus, Plus, Trash2, ShoppingCart, ArrowRight } from "lucide-react";
import { useCartStore } from "@/store/cart";
import PageHero from "@/components/PageHero";

export default function CartPage() {
  const { t } = useTranslation();
  const { items, removeItem, updateQuantity, getTotal } = useCartStore();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-2xl px-4 py-20 text-center">
        <ShoppingCart className="mx-auto mb-4 size-12 text-muted-foreground" />
        <h1 className="mb-2 text-xl font-bold">{t("cart.empty")}</h1>
        <Link
          href="/products"
          className="mt-4 inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t("cart.continueShopping")}
          <ArrowRight className="size-4" />
        </Link>
      </div>
    );
  }

  return (
    <>
    <PageHero eyebrow={t("rich.pCart")} title={t("cart.title")} />
    <div className="mx-auto max-w-3xl px-4 py-8">
      <div className="space-y-3">
        {items.map((item) => (
          <div
            key={item.id}
            className="flex gap-4 rounded-xl border border-border p-4"
          >
            <div className="relative h-20 w-20 flex-shrink-0 overflow-hidden rounded-lg border border-border bg-white">
              {item.image ? (
                <Image
                  src={item.image}
                  alt={item.name}
                  fill
                  className="object-contain p-1"
                  sizes="80px"
                />
              ) : (
                <div className="flex h-full items-center justify-center text-muted-foreground">
                  <ShoppingCart className="size-5" />
                </div>
              )}
            </div>

            <div className="flex flex-1 flex-col justify-between">
              <div className="flex items-start justify-between gap-2">
                <h3 className="text-sm font-medium leading-tight">{item.name}</h3>
                <button
                  onClick={() => removeItem(item.id)}
                  className="p-1 text-muted-foreground hover:text-destructive"
                  aria-label={t("cart.remove")}
                >
                  <Trash2 className="size-4" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2 rounded-lg border border-border">
                  <button
                    onClick={() =>
                      updateQuantity(item.id, item.quantity - 1)
                    }
                    className="rounded-l-lg px-2.5 py-1.5 hover:bg-muted"
                  >
                    <Minus className="size-3.5" />
                  </button>
                  <span className="min-w-[2rem] text-center text-sm font-medium">
                    {item.quantity}
                  </span>
                  <button
                    onClick={() =>
                      updateQuantity(item.id, item.quantity + 1)
                    }
                    className="rounded-r-lg px-2.5 py-1.5 hover:bg-muted"
                  >
                    <Plus className="size-3.5" />
                  </button>
                </div>
                <span className="font-semibold">
                  {t("common.rupee")}{item.price * item.quantity}
                </span>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="mt-6 rounded-xl border border-border p-4">
        <div className="flex items-center justify-between text-lg font-bold">
          <span>{t("cart.total")}</span>
          <span>{t("common.rupee")}{getTotal()}</span>
        </div>
        <Link
          href="/checkout"
          className="mt-4 flex w-full items-center justify-center gap-2 rounded-lg bg-primary px-6 py-3 text-sm font-medium text-primary-foreground hover:bg-primary/90"
        >
          {t("cart.placeOrder")}
          <ArrowRight className="size-4" />
        </Link>
        <Link
          href="/products"
          className="mt-2 flex w-full items-center justify-center py-2 text-sm text-muted-foreground hover:text-foreground"
        >
          {t("cart.continueShopping")}
        </Link>
      </div>
    </div>
    </>
  );
}

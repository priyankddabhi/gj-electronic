"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useTranslation } from "react-i18next";
import { ShoppingCart } from "lucide-react";
import { useCartStore } from "@/store/cart";

export default function StickyCartBar() {
  const { t } = useTranslation();
  const count = useCartStore((s) => s.getCount());
  const total = useCartStore((s) => s.getTotal());

  const pathname = usePathname();
  const hidden = ["/cart", "/checkout", "/admin"].some((p) => pathname.startsWith(p));

  if (count === 0 || hidden) return null;

  return (
    <>
    <div className="h-14" aria-hidden />
    <div className="slide-up-in fixed bottom-0 left-0 right-0 z-40 border-t border-border bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/85">
      <div className="mx-auto flex h-14 max-w-7xl items-center justify-between gap-4 px-4">
        <div className="flex items-center gap-3">
          <div className="relative">
            <ShoppingCart className="size-5 text-foreground" />
            <span className="absolute -right-1.5 -top-1.5 flex size-4 items-center justify-center rounded-full bg-primary text-[10px] font-bold text-primary-foreground">
              {count > 99 ? "99+" : count}
            </span>
          </div>
          <div className="text-sm">
            <span className="text-muted-foreground">{t(count === 1 ? "cart.item" : "cart.items", { count })}</span>
            <span className="mx-1.5 text-muted-foreground">·</span>
            <span className="font-semibold">₹{total.toLocaleString("en-IN")}</span>
          </div>
        </div>
        <Link
          href="/cart"
          className="rounded-lg bg-primary px-5 py-2 text-sm font-semibold text-primary-foreground transition-colors hover:bg-primary/90 active:scale-[0.97]"
        >
          {t("cart.viewCart")}
        </Link>
      </div>
    </div>
    </>
  );
}

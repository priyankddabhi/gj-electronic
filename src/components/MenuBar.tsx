"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ShoppingCart, Settings, Wrench } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { SHOP_NAME } from "@/lib/constants";

export const NAV_LINKS = [
  { href: "/",             key: "home" },
  { href: "/products",     key: "products" },
  { href: "/book-repair",  key: "bookRepair" },
  { href: "/track-repair", key: "trackRepair" },
  { href: "/track-order",  key: "trackOrder" },
  { href: "/about",        key: "about" },
];

/*
  The menu bar. It sticks to the top of the window; once it is docked there ("stuck"), the logo drops in
  from the upper left and Settings/Cart from the upper right.
  home: on the home page it sits under the full-screen hero and its links are hidden until it docks,
  then they drop in from above one by one.
*/
export default function MenuBar({ home = false }: { home?: boolean }) {
  const { t } = useTranslation();
  const pathname = usePathname();
  const cartCount = useCartStore((s) => s.getCount());
  const ref = useRef<HTMLDivElement>(null);
  const [stuck, setStuck] = useState(false);

  useEffect(() => {
    const dock = () => {
      const el = ref.current;
      if (el) setStuck(el.getBoundingClientRect().top <= 0.5);
    };
    dock();
    window.addEventListener("scroll", dock, { passive: true });
    window.addEventListener("resize", dock);
    return () => {
      window.removeEventListener("scroll", dock);
      window.removeEventListener("resize", dock);
    };
  }, []);

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <div ref={ref} className={`bar${home ? " home" : ""}${stuck ? " stuck" : ""}`}>
      <div className="wrap">
        <Link className="mini-logo" href="/" aria-label={`${SHOP_NAME} home`} tabIndex={stuck ? 0 : -1}>
          <i><Wrench size={16} /></i>
          <b>{SHOP_NAME}</b>
        </Link>
        <nav aria-label="Main">
          {NAV_LINKS.map((link) => (
            <Link key={link.href} href={link.href} className={isActive(link.href) ? "on" : undefined}>
              {t(`nav.${link.key}`)}
            </Link>
          ))}
        </nav>
        <div className="mini-tools">
          <Link href="/settings" aria-label={t("settings.title")} tabIndex={stuck ? 0 : -1}>
            <Settings size={20} />
          </Link>
          <Link href="/cart" aria-label={t("nav.cart")} tabIndex={stuck ? 0 : -1}>
            <ShoppingCart size={20} />
            {cartCount > 0 && <span key={cartCount} className="badge pop">{cartCount > 99 ? "99+" : cartCount}</span>}
          </Link>
        </div>
      </div>
    </div>
  );
}

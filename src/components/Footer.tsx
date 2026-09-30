"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Wrench } from "lucide-react";
import { SHOP_NAME, SHOP_PHONE, SHOP_HOURS } from "@/lib/constants";

export default function Footer() {
  const { t } = useTranslation();

  return (
    <footer className="mt-auto border-t-[3px] border-crimson bg-navy text-sm text-on-dark-muted">
      <div className="mx-auto grid max-w-7xl gap-7 px-4 py-9 sm:grid-cols-2 lg:grid-cols-[1.5fr_1fr_1fr_1fr]">
        <div>
          <Link href="/" className="flex items-center gap-2.5 text-white">
            <span className="flex size-9 items-center justify-center rounded-[10px] bg-crimson">
              <Wrench className="size-[18px]" />
            </span>
            <span className="text-lg font-bold tracking-tight">{SHOP_NAME}</span>
          </Link>
          <p className="mt-3 max-w-[32ch]">{t("footer.tagline")}</p>
        </div>

        <div>
          <h3 className="mb-2.5 font-semibold text-white">{t("nav.products")}</h3>
          <ul className="space-y-1.5">
            {["Fans", "Lights", "Switches", "Wires"].map((cat) => (
              <li key={cat}>
                <Link href={`/products?category=${cat}`} className="hover:text-white">{t(`categories.${cat}`)}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h3 className="mb-2.5 font-semibold text-white">{t("footer.services")}</h3>
          <ul className="space-y-1.5">
            <li><Link href="/book-repair" className="hover:text-white">{t("nav.bookRepair")}</Link></li>
            <li><Link href="/track-repair" className="hover:text-white">{t("nav.trackRepair")}</Link></li>
            <li><Link href="/track-order" className="hover:text-white">{t("nav.trackOrder")}</Link></li>
            <li><Link href="/about" className="hover:text-white">{t("nav.about")}</Link></li>
          </ul>
        </div>

        <div>
          <h3 className="mb-2.5 font-semibold text-white">{t("footer.contact")}</h3>
          <ul className="space-y-1.5">
            <li><a href={`tel:${SHOP_PHONE.replace(/\s/g, "")}`} className="hover:text-white">{SHOP_PHONE}</a></li>
            <li>{SHOP_HOURS}</li>
          </ul>
        </div>
      </div>

      <div className="border-t border-white/10">
        <p className="mx-auto max-w-7xl px-4 py-3.5 text-xs">
          &copy; {new Date().getFullYear()} {SHOP_NAME}. {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}

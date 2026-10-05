"use client";

import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Wrench } from "lucide-react";
import { SHOP_NAME, SHOP_PHONE } from "@/lib/constants";
import { useShopInfo } from "@/lib/shopInfo";

export default function Footer() {
  const shop = useShopInfo();
  const { t } = useTranslation();

  return (
    <footer className="site-footer mt-auto">
      <div className="wrap cols">
        <div>
          <Link href="/" className="logo" style={{ color: "#fff" }}>
            <i><Wrench size={18} /></i>
            <span><b>{SHOP_NAME}</b></span>
          </Link>
          <p style={{ marginTop: 12, maxWidth: "32ch" }}>{t("footer.tagline")}</p>
        </div>

        <div>
          <h4>{t("nav.products")}</h4>
          <ul>
            {["Fans", "Lights", "Switches", "Wires"].map((cat) => (
              <li key={cat}>
                <Link href={`/products?category=${cat}`}>{t(`categories.${cat}`)}</Link>
              </li>
            ))}
          </ul>
        </div>

        <div>
          <h4>{t("footer.services")}</h4>
          <ul>
            <li><Link href="/book-repair">{t("nav.bookRepair")}</Link></li>
            <li><Link href="/track-repair">{t("nav.trackRepair")}</Link></li>
            <li><Link href="/track-order">{t("nav.trackOrder")}</Link></li>
            <li><Link href="/about">{t("nav.about")}</Link></li>
          </ul>
        </div>

        <div>
          <h4>{t("footer.contact")}</h4>
          <ul>
            <li><a href={`tel:${SHOP_PHONE.replace(/\s/g, "")}`}>{SHOP_PHONE}</a></li>
            <li>{shop.hours}</li>
          </ul>
        </div>
      </div>

      <div className="wrap wordmark" aria-hidden>GJ ELECTRONIC</div>

      <div className="copyright">
        <p className="wrap">
          &copy; {new Date().getFullYear()} {SHOP_NAME}. {t("footer.rights")}
        </p>
      </div>
    </footer>
  );
}

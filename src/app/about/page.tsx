"use client";

import { useTranslation } from "react-i18next";
import {
  MapPin,
  Phone,
  Clock,
  MessageCircle,
  Star,
  Wrench,
  ShieldCheck,
  Zap,
} from "lucide-react";
import {
  SHOP_PHONE,
  SHOP_WHATSAPP,
  SHOP_ADDRESS,
  SHOP_HOURS,
  GOOGLE_REVIEW_URL,
} from "@/lib/constants";
import PageHero from "@/components/PageHero";

export default function AboutPage() {
  const { t } = useTranslation();

  return (
    <>
    <PageHero eyebrow={t("rich.pAbout")} title={t("about.title")} sub={t("about.description")} />
    <div className="mx-auto max-w-3xl px-4 py-8">

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border p-5 text-center">
          <ShieldCheck className="mx-auto mb-3 size-8 text-primary" />
          <h3 className="mb-1 font-semibold">{t("home.quality")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("home.qualityDesc")}
          </p>
        </div>
        <div className="rounded-xl border border-border p-5 text-center">
          <Wrench className="mx-auto mb-3 size-8 text-primary" />
          <h3 className="mb-1 font-semibold">{t("home.expertRepair")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("home.expertRepairDesc")}
          </p>
        </div>
        <div className="rounded-xl border border-border p-5 text-center">
          <Zap className="mx-auto mb-3 size-8 text-primary" />
          <h3 className="mb-1 font-semibold">{t("home.fastService")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("home.fastServiceDesc")}
          </p>
        </div>
      </div>

      <div id="contact" className="rounded-xl border border-border p-6">
        <h2 className="mb-5 text-lg font-bold">Contact Us</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-5 flex-shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">{t("about.address")}</p>
              <p className="text-sm text-muted-foreground">{SHOP_ADDRESS}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 size-5 flex-shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">{t("about.phone")}</p>
              <p className="text-sm text-muted-foreground">{SHOP_PHONE}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 size-5 flex-shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">{t("about.hours")}</p>
              <p className="text-sm text-muted-foreground">{SHOP_HOURS}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`https://wa.me/${SHOP_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#25D366]/90"
          >
            <MessageCircle className="size-4" />
            {t("about.whatsapp")}
          </a>
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted"
          >
            <Star className="size-4" />
            {t("about.reviewUs")}
          </a>
        </div>
      </div>
    </div>
    </>
  );
}

"use client";

import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { useEffect, useState } from "react";
import {
  Wrench,
  ShieldCheck,
  Zap,
  Star,
  Package,
  Truck,
  MapPin,
  Clock,
  Phone,
  MessageCircle,
  ChevronRight,
  Fan,
  Lightbulb,
  LampCeiling,
  ToggleRight,
  Cable,
  Cog,
  BatteryCharging,
  Heater,
  type LucideIcon,
} from "lucide-react";
import {
  SHOP_NAME,
  SHOP_ADDRESS,
  SHOP_HOURS,
  SHOP_PHONE,
  SHOP_WHATSAPP,
  GOOGLE_REVIEW_URL,
} from "@/lib/constants";
import ProductCard from "@/components/ProductCard";
import PromoCarousel from "@/components/PromoCarousel";

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

// Categories with a photo in public/categories/<name>.jpg; others (added later in admin) fall back to an icon
const CATEGORY_PHOTOS = new Set(["Fans", "Lights", "Bulbs", "Switches", "Wires", "Motors", "Inverters", "Heaters", "Other"]);

const CATEGORY_ICONS: Record<string, LucideIcon> = {
  Fans: Fan,
  Lights: LampCeiling,
  Bulbs: Lightbulb,
  Switches: ToggleRight,
  Wires: Cable,
  Motors: Cog,
  Inverters: BatteryCharging,
  Heaters: Heater,
};

const QUICK_LINKS = [
  { href: "/products", icon: Package, key: "quickShop" },
  { href: "/book-repair", icon: Wrench, key: "quickRepair" },
  { href: "/track-order", icon: Truck, key: "quickTrack" },
];

const REPAIR_DEVICES = ["fan", "mixer", "iron", "inverter"];

export default function HomePage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<string[]>([]);
  const [popular, setPopular] = useState<Product[]>([]);
  const [maxDiscount, setMaxDiscount] = useState(0);

  useEffect(() => {
    fetch("/api/categories")
      .then((r) => r.json())
      .then((data) => setCategories(data.categories || []))
      .catch(() => {});
    fetch("/api/products?featured=true&limit=4")
      .then((r) => r.json())
      .then((data) => setPopular(data.products || []))
      .catch(() => {});
    fetch("/api/products?limit=100")
      .then((r) => r.json())
      .then((data: { products?: Product[] }) => {
        const best = (data.products || []).reduce(
          (max, p) => (p.mrp > p.price ? Math.max(max, Math.round(((p.mrp - p.price) / p.mrp) * 100)) : max),
          0
        );
        setMaxDiscount(best);
      })
      .catch(() => {});
  }, []);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${SHOP_NAME} ${SHOP_ADDRESS}`)}`;

  return (
    <div className="bg-surface">
      {/* Promotions: first thing on the page, visible without scrolling */}
      <section className="mx-auto max-w-7xl px-4 py-5">
        <PromoCarousel maxDiscount={maxDiscount} />
      </section>

      {/* Hero */}
      <section className="border-b border-border bg-card py-8">
        <div className="mx-auto grid max-w-7xl gap-6 px-4 md:grid-cols-[1.2fr_1fr]">
          <div className="enter-up pb-2 pt-1 md:py-10 md:pr-12">
            <span className="inline-flex items-center gap-1.5 rounded-md border border-peach-line bg-accent px-2.5 py-1 text-[13px] font-semibold text-wine">
              <MapPin className="size-3.5" />
              {t("home.heroTag")}
            </span>
            <h1 className="mt-4 max-w-[16ch] text-[30px] font-bold leading-[1.15] tracking-tight md:text-[38px]">
              {t("home.hero")}
            </h1>
            <p className="mt-3 max-w-[40ch] text-[17px] text-muted-foreground">{t("home.heroSub")}</p>
            <div className="mt-7 flex flex-wrap gap-3">
              <Link
                href="/products"
                className="inline-flex h-[46px] items-center gap-2 rounded-[10px] bg-crimson px-[22px] text-[15px] font-semibold text-white transition-colors hover:bg-wine active:scale-[0.97]"
              >
                {t("home.shopNow")}
                <ChevronRight className="size-4" />
              </Link>
              <Link
                href="/book-repair"
                className="inline-flex h-[46px] items-center gap-2 rounded-[10px] border-[1.5px] border-foreground bg-card px-[22px] text-[15px] font-semibold text-foreground transition-colors hover:bg-foreground hover:text-background active:scale-[0.97]"
              >
                <Wrench className="size-4" />
                {t("home.bookRepair")}
              </Link>
            </div>
            <div className="mt-7 flex flex-wrap gap-x-5 gap-y-2 text-sm text-muted-foreground">
              <span className="flex items-center gap-1.5"><Clock className="size-4 text-crimson" />{SHOP_HOURS}</span>
              <span className="flex items-center gap-1.5"><ShieldCheck className="size-4 text-crimson" />{t("home.heroWarranty")}</span>
            </div>
          </div>

          <div className="enter-up enter-up-delay flex flex-col justify-center gap-2.5 rounded-[10px] bg-hero-panel p-7 text-white">
            <h2 className="mb-1.5 text-[13px] font-semibold uppercase tracking-[0.08em] text-peach">{t("home.quickLinks")}</h2>
            {QUICK_LINKS.map(({ href, icon: Icon, key }) => (
              <Link
                key={href}
                href={href}
                className="group flex items-center gap-3.5 rounded-xl border border-white/[0.09] bg-white/[0.04] p-4 transition-colors hover:border-peach hover:bg-white/[0.09]"
              >
                <span className="grid size-[42px] flex-shrink-0 place-items-center rounded-[10px] bg-peach/[0.14] text-peach">
                  <Icon className="size-5" />
                </span>
                <span className="flex-1">
                  <span className="block font-semibold">{t(`home.${key}Title`)}</span>
                  <span className="block text-[13px] text-on-dark-muted">{t(`home.${key}Desc`)}</span>
                </span>
                <ChevronRight className="size-4 text-peach transition-transform duration-200 group-hover:translate-x-1" />
              </Link>
            ))}
          </div>
        </div>
      </section>


      {/* Categories */}
      {categories.length > 0 && (
        <section className="reveal mx-auto max-w-7xl px-4 py-7">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[22px] font-bold tracking-tight">{t("home.shopByCategory")}</h2>
            <Link href="/products" className="text-sm font-semibold text-crimson hover:underline">{t("home.viewAllShort")}</Link>
          </div>
          {/* One row whatever the category count: scrolls on phones, shares the width on desktop */}
          {/* pt-1/-mt-1: headroom inside the scroll box so the hover lift isn't clipped, without shifting the row */}
          <div className="-mt-1 flex gap-2 overflow-x-auto pb-1 pt-1 [scrollbar-width:none] sm:gap-3">
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat] || Package;
              const photo = CATEGORY_PHOTOS.has(cat) ? `/categories/${cat.toLowerCase()}.jpg` : null;
              return (
                <Link
                  key={cat}
                  href={`/products?category=${encodeURIComponent(cat)}`}
                  className="group flex w-[104px] flex-shrink-0 flex-col overflow-hidden rounded-xl border border-border bg-card text-center text-xs font-semibold transition-[border-color,translate] duration-200 hover:-translate-y-0.5 hover:border-crimson sm:w-[120px] sm:text-sm lg:w-auto lg:min-w-0 lg:flex-1"
                >
                  <span className="relative grid aspect-square place-items-center overflow-hidden bg-[#e2dfdc] text-wine">
                    {photo ? (
                      <Image
                        src={photo}
                        alt=""
                        fill
                        sizes="(max-width: 640px) 104px, (max-width: 1024px) 120px, 140px"
                        className="object-cover transition-transform duration-300 group-hover:scale-[1.06]"
                      />
                    ) : (
                      <Icon className="size-8" strokeWidth={1.5} />
                    )}
                  </span>
                  <span className="px-1.5 py-2.5">{t(`categories.${cat}`, { defaultValue: cat })}</span>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Popular products */}
      {popular.length > 0 && (
        <section className="reveal mx-auto max-w-7xl px-4 py-7">
          <div className="mb-4 flex items-baseline justify-between">
            <h2 className="text-[22px] font-bold tracking-tight">{t("home.popular")}</h2>
            <Link href="/products" className="text-sm font-semibold text-crimson hover:underline">{t("home.viewAll")}</Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:gap-4 lg:grid-cols-4">
            {popular.map((product) => (
              <ProductCard key={product._id} product={product} />
            ))}
          </div>
        </section>
      )}

      {/* Repair service */}
      <section className="reveal mx-auto max-w-7xl px-4 py-7">
        <div className="grid items-center gap-8 rounded-2xl border border-border bg-card p-6 md:p-8 lg:grid-cols-[1fr_1.4fr]">
          <div>
            <h2 className="text-[22px] font-bold tracking-tight">{t("home.repairService")}</h2>
            <p className="mt-2 max-w-[40ch] text-muted-foreground">{t("home.repairServiceDesc")}</p>
            <Link
              href="/book-repair"
              className="mt-5 inline-flex h-[46px] items-center gap-2 rounded-[10px] bg-crimson px-[22px] text-[15px] font-semibold text-white transition-colors hover:bg-wine active:scale-[0.97]"
            >
              <Wrench className="size-4" />
              {t("home.bookRepair")}
            </Link>
          </div>
          <div className="grid grid-cols-2 gap-2.5 sm:grid-cols-4">
            {REPAIR_DEVICES.map((type) => (
              <Link
                key={type}
                href="/book-repair"
                className="group overflow-hidden rounded-xl border border-border bg-card transition-[border-color,translate] duration-200 hover:-translate-y-0.5 hover:border-crimson"
              >
                <span className="relative block aspect-[4/3] overflow-hidden bg-muted">
                  <Image
                    src={`/repair/${type}.jpg`}
                    alt={t(`repair.devices.${type}`)}
                    fill
                    sizes="(max-width: 640px) 45vw, (max-width: 1024px) 22vw, 180px"
                    className="object-cover transition-transform duration-300 group-hover:scale-[1.04]"
                  />
                </span>
                <span className="flex items-center justify-between gap-1 px-3 py-2.5 text-[13.5px] font-semibold">
                  {t(`repair.devices.${type}`)}
                  <ChevronRight className="size-4 text-crimson transition-transform duration-200 group-hover:translate-x-0.5" />
                </span>
              </Link>
            ))}
          </div>
        </div>
      </section>

      {/* Why customers choose us */}
      <section className="reveal mx-auto max-w-7xl px-4 py-7">
        <h2 className="mb-4 text-[22px] font-bold tracking-tight">{t("home.whyUs")}</h2>
        <div className="grid gap-4 lg:grid-cols-[1fr_2fr]">
          <div className="flex flex-col justify-center rounded-2xl border-l-4 border-crimson bg-navy p-7 text-white">
            <div className="flex gap-0.5 text-peach">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="size-5 fill-current" />
              ))}
            </div>
            <p className="mt-3 text-lg font-semibold">{t("home.reviewedTitle")}</p>
            <p className="mt-1 text-sm text-on-dark-muted">{t("home.reviewedDesc")}</p>
            <a
              href={GOOGLE_REVIEW_URL}
              target="_blank"
              rel="noopener noreferrer"
              className="mt-4 text-sm font-semibold text-peach hover:underline"
            >
              {t("home.reviewCta")} →
            </a>
          </div>
          <div className="grid gap-4 sm:grid-cols-3">
            {[
              { icon: ShieldCheck, title: t("home.quality"), desc: t("home.qualityDesc") },
              { icon: Wrench, title: t("home.expertRepair"), desc: t("home.expertRepairDesc") },
              { icon: Zap, title: t("home.fastService"), desc: t("home.fastServiceDesc") },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="rounded-xl border border-border bg-card p-5">
                <span className="grid size-10 place-items-center rounded-[10px] bg-accent text-wine">
                  <Icon className="size-5" />
                </span>
                <h3 className="mt-3 font-semibold">{title}</h3>
                <p className="mt-1 text-sm text-muted-foreground">{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Visit the shop */}
      <section className="reveal mx-auto max-w-7xl px-4 pb-10 pt-7">
        <h2 className="mb-4 text-[22px] font-bold tracking-tight">{t("home.visitShop")}</h2>
        <div className="grid overflow-hidden rounded-2xl border border-border bg-card lg:grid-cols-[1fr_1.3fr]">
          <div className="flex flex-col gap-4 p-6 md:p-8">
            {[
              { icon: MapPin, label: t("home.address"), value: SHOP_ADDRESS },
              { icon: Clock, label: t("home.hours"), value: SHOP_HOURS },
              { icon: Phone, label: t("home.call"), value: SHOP_PHONE, href: `tel:${SHOP_PHONE.replace(/\s/g, "")}` },
              { icon: MessageCircle, label: t("home.whatsapp"), value: t("home.whatsappDesc"), href: `https://wa.me/${SHOP_WHATSAPP}` },
            ].map(({ icon: Icon, label, value, href }) => (
              <div key={label} className="flex items-start gap-3">
                <span className="grid size-[38px] flex-shrink-0 place-items-center rounded-[10px] bg-accent text-wine">
                  <Icon className="size-[18px]" />
                </span>
                <div className="text-sm">
                  <b className="block">{label}</b>
                  {href ? (
                    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer" className="text-muted-foreground hover:text-crimson">
                      {value}
                    </a>
                  ) : (
                    <span className="text-muted-foreground">{value}</span>
                  )}
                </div>
              </div>
            ))}
          </div>
          <a
            href={mapsUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="group grid min-h-[220px] place-items-center border-t border-border bg-muted text-center text-sm text-muted-foreground lg:border-l lg:border-t-0"
          >
            <span>
              <MapPin className="mx-auto mb-2 size-9 text-crimson" />
              {SHOP_ADDRESS}
              <span className="mt-1 block font-semibold text-crimson group-hover:underline">{t("home.directions")}</span>
            </span>
          </a>
        </div>
      </section>
    </div>
  );
}

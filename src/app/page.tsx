"use client";

import Link from "next/link";
import Image from "next/image";
import { preload } from "react-dom";
import { useTranslation } from "react-i18next";
import { useEffect, useRef, useState, type CSSProperties } from "react";
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
  ChevronLeft,
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
import MenuBar from "@/components/MenuBar";
import {
  loadMotion,
  prefersReducedMotion,
  setupCountUp,
  setupPointerEffects,
  setupReveals,
  showAllReveals,
} from "@/lib/richMotion";

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

const REPAIR_DEVICES = ["fan", "mixer", "iron", "inverter"];
const BRANDS = ["Havells", "Philips", "Wipro", "Bajaj", "Anchor", "Polycab", "Orient", "Luminous", "Crompton", "Syska"];
const DELAY_MS = 3000;

// The intro curtain plays once per page load, not every time the visitor comes back to Home
let introPlayed = false;

/* BlurText: each word sharpens in one after another */
function Words({ text }: { text: string }) {
  return (
    <>
      {text.trim().split(/\s+/).map((w, i) => (
        <span key={i}>
          <span className="w" style={{ "--i": i } as CSSProperties}>{w}</span>{" "}
        </span>
      ))}
    </>
  );
}

function Arrow() {
  return <ChevronRight size={16} strokeWidth={2.5} />;
}

export default function HomePage() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState<string[]>([]);
  const [popular, setPopular] = useState<Product[]>([]);
  const [maxDiscount, setMaxDiscount] = useState(0);
  const rootRef = useRef<HTMLDivElement>(null);

  preload("/hero/hero-1.jpg", { as: "image", fetchPriority: "high" });

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

  /* ---------- Intro curtain: navy panel with the wordmark lifts, then the hero text animates in ---------- */
  const [curtain, setCurtain] = useState(() => !introPlayed);
  const curtainRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const root = document.documentElement;
    introPlayed = true;
    // No curtain (came back to Home) or reduced motion (CSS hides the curtain): show the hero text now
    if (!curtain || prefersReducedMotion()) {
      root.classList.add("ready");
      return;
    }
    const a = setTimeout(() => curtainRef.current?.classList.add("lift"), 900);
    const b = setTimeout(() => root.classList.add("ready"), 1050);
    const c = setTimeout(() => setCurtain(false), 2000);
    return () => { clearTimeout(a); clearTimeout(b); clearTimeout(c); root.classList.add("ready"); };
  }, [curtain]);

  /* ---------- Hero carousel ---------- */
  const slides = [
    { tag: t("home.heroTag"), title: t("home.hero"), text: t("rich.s1Text"), image: "/hero/hero-1.jpg", focus: "62% 50%",
      ctas: [{ label: t("home.shopNow"), href: "/products", red: true }, { label: t("home.bookRepair"), href: "/book-repair", red: false }] },
    { tag: t("promo.s2Tag"), title: maxDiscount > 0 ? t("promo.dealTitle", { percent: maxDiscount }) : t("promo.dealTitleNone"),
      text: t("promo.s2Text"), image: "/hero/hero-2.jpg", focus: "72% 50%", ctas: [{ label: t("promo.s2Cta"), href: "/products", red: true }] },
    { tag: t("promo.s3Tag"), title: t("promo.s3Title"), text: t("promo.s3Text"), image: "/hero/hero-3.jpg", focus: "70% 45%",
      ctas: [{ label: t("promo.s3Cta"), href: "/book-repair", red: true }] },
    { tag: t("promo.s4Tag"), title: t("promo.s4Title"), text: t("promo.s4Text"), image: "/hero/hero-4.jpg", focus: "76% 50%",
      ctas: [{ label: t("promo.s4Cta"), href: "/about", red: true }] },
  ];
  const count = slides.length;
  const [index, setIndex] = useState(0);
  const [round, setRound] = useState(0); // restarts the progress bar animation
  const [dragging, setDragging] = useState(false);
  const startX = useRef<number | null>(null);
  const heroRef = useRef<HTMLElement>(null);

  const show = (i: number) => {
    setIndex(((i % count) + count) % count);
    setRound((r) => r + 1);
  };

  useEffect(() => {
    const id = setInterval(() => {
      if (!document.hidden) { setIndex((i) => (i + 1) % count); setRound((r) => r + 1); }
    }, DELAY_MS);
    return () => clearInterval(id);
  }, [round, count]);

  // swipe / drag, and the arrow keys (not while typing in a field)
  useEffect(() => {
    const up = (e: PointerEvent) => {
      if (startX.current === null) return;
      const dx = e.clientX - startX.current;
      startX.current = null;
      setDragging(false);
      if (Math.abs(dx) > 50) {
        setIndex((i) => (((i + (dx < 0 ? 1 : -1)) % count) + count) % count);
        setRound((r) => r + 1);
      }
    };
    const key = (e: KeyboardEvent) => {
      if ((e.target as HTMLElement).closest?.("input,textarea,select,[contenteditable]")) return;
      if (e.key === "ArrowRight") { setIndex((i) => (i + 1) % count); setRound((r) => r + 1); }
      if (e.key === "ArrowLeft") { setIndex((i) => (i - 1 + count) % count); setRound((r) => r + 1); }
    };
    window.addEventListener("pointerup", up);
    window.addEventListener("keydown", key);
    return () => { window.removeEventListener("pointerup", up); window.removeEventListener("keydown", key); };
  }, [count]);

  /* ---------- Parallax: hero photo and banner photo drift slower than the page ---------- */
  const bannerRef = useRef<HTMLElement>(null);
  const bannerPhRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    if (prefersReducedMotion()) return;
    let ticking = false;
    const draw = () => {
      ticking = false;
      const y = window.scrollY, hero = heroRef.current, banner = bannerRef.current;
      if (hero && y < hero.offsetHeight) hero.style.setProperty("--py", `${(y * 0.14).toFixed(1)}px`);
      if (banner && bannerPhRef.current) {
        const r = banner.getBoundingClientRect();
        if (r.bottom > 0 && r.top < window.innerHeight) {
          bannerPhRef.current.style.setProperty("--by", `${((r.top + r.height / 2 - window.innerHeight / 2) * -0.12).toFixed(1)}px`);
        }
      }
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(draw); } };
    draw();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  /* ---------- Spring reveals, magnetic buttons, tilt, spotlight (re-run when products/categories arrive) ---------- */
  const cleanups = useRef<(() => void)[]>([]);
  useEffect(() => {
    let cancelled = false;
    loadMotion().then((M) => {
      const root = rootRef.current;
      if (cancelled || !root) return;
      if (M) setupReveals(root, M);
      else showAllReveals(root);
      cleanups.current.push(setupPointerEffects(root, M));
    });
    return () => { cancelled = true; };
  }, [categories.length, popular.length]);
  useEffect(() => {
    const root = rootRef.current;
    if (root) cleanups.current.push(setupCountUp(root));
    const list = cleanups.current;
    return () => { list.forEach((c) => c()); list.length = 0; };
  }, []);

  const mapsUrl = `https://www.google.com/maps/search/?api=1&query=${encodeURIComponent(`${SHOP_NAME} ${SHOP_ADDRESS}`)}`;
  let n = 0;
  const num = () => String(++n).padStart(2, "0");

  return (
    <div ref={rootRef}>
      {curtain && <div ref={curtainRef} className="curtain" aria-hidden><b>{SHOP_NAME}</b></div>}

      {/* Full-screen hero carousel */}
      <section
        ref={heroRef}
        className={`hero${dragging ? " dragging" : ""}`}
        aria-roledescription="carousel"
        aria-label={t("promo.label")}
        style={{ "--delay": `${DELAY_MS / 1000}s` } as CSSProperties}
        onPointerDown={(e) => {
          if ((e.target as HTMLElement).closest("a,button")) return;
          startX.current = e.clientX;
          setDragging(true);
        }}
      >
        {slides.map((s, i) => {
          const Title = i === 0 ? "h1" : "h2";
          return (
            <article
              key={i}
              className={`slide${i === index ? " on" : ""}`}
              style={{ "--focus": s.focus } as CSSProperties}
              aria-roledescription="slide"
              aria-label={t("promo.slideOf", { n: i + 1, total: count })}
              aria-hidden={i !== index}
              inert={i !== index}
            >
              <div className="ph" style={{ backgroundImage: `url(${s.image})` }} />
              <div className="copy"><div className="wrap"><div className="inner">
                <div className="tag rv">{s.tag}</div>
                <Title className="rv bt"><Words text={s.title} /></Title>
                <p className="rv">{s.text}</p>
                <div className="cta rv">
                  {s.ctas.map((c) => (
                    <Link key={c.href} className={`btn ${c.red ? "btn-red" : "btn-ghost"}${i === 0 ? " mag" : ""}`} href={c.href} draggable={false}>
                      {c.label}{c.red && <Arrow />}
                    </Link>
                  ))}
                </div>
              </div></div></div>
            </article>
          );
        })}

        <aside className="quick">
          <h3>{t("home.quickLinks")}</h3>
          {[
            { href: "/products", icon: Package, key: "quickShop" },
            { href: "/book-repair", icon: Wrench, key: "quickRepair" },
            { href: "/track-order", icon: Truck, key: "quickTrack" },
          ].map(({ href, icon: Icon, key }) => (
            <Link key={href} href={href} draggable={false}>
              <span className="ic"><Icon size={20} /></span>
              <span><b>{t(`home.${key}Title`)}</b><small>{t(`home.${key}Desc`)}</small></span>
            </Link>
          ))}
        </aside>

        <div className="ctrl"><div className="wrap">
          <div className="bars">
            {slides.map((_, i) => (
              <button
                key={i}
                type="button"
                aria-label={t("promo.slideN", { n: i + 1 })}
                aria-current={i === index}
                className={i === index ? "on" : i < index ? "done" : undefined}
                onClick={() => show(i)}
              >
                <i key={i === index ? `r${round}` : "idle"} />
              </button>
            ))}
          </div>
          <div className="arrows">
            <button type="button" className="mag" aria-label={t("promo.prev")} onClick={() => show(index - 1)}><ChevronLeft size={18} strokeWidth={2.5} /></button>
            <button type="button" className="mag" aria-label={t("promo.next")} onClick={() => show(index + 1)}><ChevronRight size={18} strokeWidth={2.5} /></button>
          </div>
        </div></div>
      </section>

      <MenuBar home />

      {/* Trust strip */}
      <div className="trust"><div className="wrap"><div className="row stagger">
        {[
          { icon: ShieldCheck, k: "genuine" },
          { icon: Wrench, k: "repairs" },
          { icon: Truck, k: "delivery" },
          { icon: Clock, k: "tracking" },
        ].map(({ icon: Icon, k }) => (
          <div key={k} className="it">
            <span className="ic"><Icon size={20} /></span>
            <span><b>{t(`rich.${k}`)}</b><small>{t(`rich.${k}Desc`)}</small></span>
          </div>
        ))}
      </div></div></div>

      {/* Brand marquee (the list is repeated so the loop is seamless) */}
      <div className="marquee" aria-label={t("rich.brands")}>
        <div className="track">
          {[0, 1].map((copy) => (
            <div key={copy} className="set" aria-hidden={copy === 1}>
              {BRANDS.map((b) => <span key={b}>{b}</span>)}
            </div>
          ))}
        </div>
      </div>

      {/* Categories */}
      {categories.length > 0 && (
        <section className="sec"><div className="wrap">
          <div className="head rise">
            <div><div className="eyebrow">{num()}&nbsp;{t("rich.eyBrowse")}</div><h2>{t("home.shopByCategory")}</h2></div>
            <Link className="link" href="/products">{t("home.viewAllShort")} →</Link>
          </div>
          <div className="cats stagger">
            {categories.map((cat) => {
              const Icon = CATEGORY_ICONS[cat] || Package;
              const photo = CATEGORY_PHOTOS.has(cat) ? `/categories/${cat.toLowerCase()}.jpg` : null;
              return (
                <Link key={cat} className="cat" href={`/products?category=${encodeURIComponent(cat)}`}>
                  <span className="im" data-explore={t("rich.explore")}>
                    {photo ? (
                      <Image src={photo} alt="" fill sizes="(max-width: 700px) 33vw, (max-width: 1100px) 20vw, 140px" />
                    ) : (
                      <Icon className="size-8" strokeWidth={1.5} />
                    )}
                  </span>
                  <span>{t(`categories.${cat}`, { defaultValue: cat })}</span>
                </Link>
              );
            })}
          </div>
        </div></section>
      )}

      {/* Popular products */}
      {popular.length > 0 && (
        <section className="sec"><div className="wrap">
          <div className="head rise">
            <div><div className="eyebrow">{num()}&nbsp;{t("rich.eyBest")}</div><h2>{t("home.popular")}</h2></div>
            <Link className="link" href="/products">{t("home.viewAll")} →</Link>
          </div>
          <div className="prods stagger">
            {popular.map((product) => <ProductCard key={product._id} product={product} />)}
          </div>
        </div></section>
      )}

      {/* Numbers band */}
      <section className="stats"><div className="wrap">
        <div className="eyebrow rise">{num()}&nbsp;{t("rich.eyNumbers")}</div>
        <h2 className="rise">{t("rich.statsTitle")}</h2>
        <div className="stat-row stagger">
          <div className="stat"><b><span data-count="12000">0</span><em>+</em></b><small>{t("rich.statSold")}</small></div>
          <div className="stat"><b><span data-count="3500">0</span><em>+</em></b><small>{t("rich.statRepairs")}</small></div>
          <div className="stat"><b><span data-count="4.8" data-dec="1">0</span><em>★</em></b><small>{t("rich.statRating")}</small></div>
          <div className="stat"><b><span data-count="48">0</span><em>h</em></b><small>{t("rich.statTurnaround")}</small></div>
        </div>
      </div></section>

      {/* Repair service */}
      <section className="sec"><div className="wrap">
        <div className="repair rise spot">
          <div>
            <div className="eyebrow">{num()}&nbsp;{t("rich.eyRepair")}</div>
            <h2>{t("rich.repairTitle")}</h2>
            <p>{t("home.repairServiceDesc")}</p>
            <div className="steps">
              <div><i>1</i>{t("rich.step1")}</div>
              <div><i>2</i>{t("rich.step2")}</div>
              <div><i>3</i>{t("rich.step3")}</div>
            </div>
            <Link className="btn btn-red" style={{ marginTop: 28 }} href="/book-repair">{t("home.bookRepair")} <Arrow /></Link>
          </div>
          <div className="devices stagger">
            {REPAIR_DEVICES.map((type) => (
              <Link key={type} className="dev" href="/book-repair">
                <span className="im">
                  <Image src={`/repair/${type}.jpg`} alt={t(`repair.devices.${type}`)} fill sizes="(max-width: 700px) 45vw, (max-width: 1100px) 22vw, 180px" />
                </span>
                <span>{t(`repair.devices.${type}`)} <ChevronRight size={16} className="text-crimson" /></span>
              </Link>
            ))}
          </div>
        </div>
      </div></section>

      {/* Full-bleed banner with parallax photo */}
      <section ref={bannerRef} className="banner">
        <div ref={bannerPhRef} className="ph" />
        <div className="wrap rise">
          <div className="eyebrow">{t("rich.bannerEyebrow")}</div>
          <h2>{t("rich.bannerTitle")}</h2>
          <p>{t("rich.bannerText")}</p>
          <div className="cta">
            <Link className="btn btn-red mag" href="/book-repair">{t("home.bookRepair")} <Arrow /></Link>
            <Link className="btn btn-ghost mag" href="/track-repair">{t("nav.trackRepair")}</Link>
          </div>
        </div>
      </section>

      {/* Why us */}
      <section className="sec"><div className="wrap">
        <div className="head rise"><div><div className="eyebrow">{num()}&nbsp;{t("rich.eyWhy")}</div><h2>{t("home.whyUs")}</h2></div></div>
        <div className="why">
          <div className="rating rise">
            <div className="stars">{[...Array(5)].map((_, i) => <Star key={i} size={22} fill="currentColor" />)}</div>
            <b>{t("rich.trustedLocally")}</b>
            <p>{t("home.reviewedDesc")}</p>
            <a className="link" style={{ color: "var(--peach)", marginTop: 16 }} href={GOOGLE_REVIEW_URL} target="_blank" rel="noopener noreferrer">
              {t("home.reviewCta")} →
            </a>
          </div>
          <div className="feats stagger">
            {[
              { icon: ShieldCheck, title: t("home.quality"), desc: t("home.qualityDesc") },
              { icon: Wrench, title: t("home.expertRepair"), desc: t("home.expertRepairDesc") },
              { icon: Zap, title: t("home.fastService"), desc: t("home.fastServiceDesc") },
            ].map(({ icon: Icon, title, desc }) => (
              <div key={title} className="feat spot">
                <span className="ic"><Icon size={22} /></span>
                <h3>{title}</h3>
                <p>{desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div></section>

      {/* Visit the shop */}
      <section className="sec"><div className="wrap">
        <div className="head rise"><div><div className="eyebrow">{num()}&nbsp;{t("rich.eyVisit")}</div><h2>{t("home.visitShop")}</h2></div></div>
        <div className="visit rise">
          <ul>
            {[
              { icon: MapPin, label: t("home.address"), value: SHOP_ADDRESS },
              { icon: Clock, label: t("home.hours"), value: SHOP_HOURS },
              { icon: Phone, label: t("home.call"), value: SHOP_PHONE, href: `tel:${SHOP_PHONE.replace(/\s/g, "")}` },
              { icon: MessageCircle, label: t("home.whatsapp"), value: t("home.whatsappDesc"), href: `https://wa.me/${SHOP_WHATSAPP}` },
            ].map(({ icon: Icon, label, value, href }) => (
              <li key={label}>
                <span className="ic"><Icon size={18} /></span>
                <div>
                  <b>{label}</b>
                  {href ? (
                    <a href={href} target={href.startsWith("http") ? "_blank" : undefined} rel="noopener noreferrer">{value}</a>
                  ) : (
                    <span>{value}</span>
                  )}
                </div>
              </li>
            ))}
          </ul>
          <a className="map" href={mapsUrl} target="_blank" rel="noopener noreferrer">
            <span>
              <MapPin size={36} className="mx-auto mb-2 text-peach" />
              {SHOP_ADDRESS}
              <b>{t("home.directions")}</b>
            </span>
          </a>
        </div>
      </div></section>
    </div>
  );
}

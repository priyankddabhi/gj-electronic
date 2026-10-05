"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ShoppingCart, Search, Wrench, ExternalLink, LogOut, Settings, Zap } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useCustomerStore } from "@/store/customer";
import { SHOP_NAME } from "@/lib/constants";
import { startLenis } from "@/lib/richMotion";
import MenuBar from "@/components/MenuBar";
import AdminThemeButton from "@/components/AdminThemeButton";

/*
  Shop header (rich theme): a top row with logo, search, Settings and Cart that scrolls away, then the
  menu bar (MenuBar) that sticks to the top. On the home page the menu bar is rendered by the page itself,
  under the full-screen hero. Also runs the shop-wide pieces: Lenis smooth scroll and the progress line.
*/
export default function Navbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const cartCount = useCartStore((s) => s.getCount());
  const customer = useCustomerStore((s) => s.customer);
  const [searchQuery, setSearchQuery] = useState("");
  const topRef = useRef<HTMLElement>(null);
  const progRef = useRef<HTMLDivElement>(null);

  // The admin panel has its own sidebar and theme, so it keeps its plain header
  const isAdmin = pathname.startsWith("/admin");
  const isHome = pathname === "/";

  // Rich theme on for shop pages only
  useEffect(() => {
    document.documentElement.classList.toggle("rich", !isAdmin);
  }, [isAdmin]);

  // Smooth scroll for the shop
  useEffect(() => {
    if (isAdmin) return;
    let stop = () => {};
    let cancelled = false;
    startLenis(() => cancelled).then((s) => { if (cancelled) s(); else stop = s; });
    return () => { cancelled = true; stop(); };
  }, [isAdmin]);

  // Hero height = one screen minus the top row (the row wraps to two lines on phones)
  useEffect(() => {
    if (isAdmin) return;
    const fit = () => {
      if (topRef.current) document.documentElement.style.setProperty("--header", `${topRef.current.offsetHeight}px`);
    };
    fit();
    window.addEventListener("resize", fit);
    return () => window.removeEventListener("resize", fit);
  }, [isAdmin]);

  // Scroll progress line
  useEffect(() => {
    if (isAdmin) return;
    let ticking = false;
    const draw = () => {
      ticking = false;
      const max = document.documentElement.scrollHeight - window.innerHeight;
      progRef.current?.style.setProperty("--p", max > 0 ? (window.scrollY / max).toFixed(4) : "0");
    };
    const onScroll = () => { if (!ticking) { ticking = true; requestAnimationFrame(draw); } };
    draw();
    window.addEventListener("scroll", onScroll, { passive: true });
    window.addEventListener("resize", onScroll);
    return () => {
      window.removeEventListener("scroll", onScroll);
      window.removeEventListener("resize", onScroll);
    };
  }, [isAdmin, pathname]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  if (isAdmin) {
    return (
      <header className="bg-navy text-white">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2.5 px-4 md:h-[52px] md:flex-nowrap md:py-0">
          <Link href="/" className="flex flex-shrink-0 items-center gap-2.5">
            <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-crimson">
              <Wrench className="size-[18px]" />
            </span>
            <span className="leading-tight">
              <span className="block whitespace-nowrap text-lg font-bold tracking-tight">{SHOP_NAME}</span>
              <span className="block text-[11px] font-medium text-on-dark-muted">India</span>
            </span>
          </Link>
          <div className="ml-auto flex flex-shrink-0 items-center gap-1.5">
            <AdminThemeButton />
            <Link
              href="/"
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-on-dark-muted hover:bg-white/[0.08] hover:text-white"
            >
              <ExternalLink className="size-4" />
              <span className="hidden sm:inline">View shop</span>
            </Link>
            <button
              type="button"
              onClick={async () => {
                await fetch("/api/auth", { method: "DELETE" });
                // Full reload: the admin layout keeps its own signed-in state until the page reloads
                // eslint-disable-next-line @next/next/no-location-assign-relative-destination
                window.location.assign("/admin");
              }}
              className="flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-sm font-medium text-on-dark-muted hover:bg-white/[0.08] hover:text-white"
            >
              <LogOut className="size-4" />
              <span className="hidden sm:inline">Logout</span>
            </button>
          </div>
        </div>
      </header>
    );
  }

  return (
    <>
      <div ref={progRef} className="progress" aria-hidden />
      <header ref={topRef} className="top">
        <div className="wrap">
          <Link className="logo" href="/">
            <i><Wrench size={18} /></i>
            <span><b>{SHOP_NAME}</b><small>India</small></span>
          </Link>
          <form className="search" role="search" onSubmit={handleSearch}>
            <Search size={18} />
            <input
              type="search"
              aria-label={t("nav.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("nav.searchPlaceholder")}
            />
          </form>
          <div className="top-ctas">
            <Link href="/book-repair" className="btn-hire">
              <Zap size={15} />
              Book Electrician
            </Link>
          </div>
          <div className="tools">
            <Link href="/settings" aria-label={t("settings.title")} className={pathname.startsWith("/settings") ? "on" : undefined}>
              <Settings size={20} />
              <span>
                {customer && <small>{t("settings.hello", { name: customer.name.split(" ")[0] })}</small>}
                {t("settings.title")}
              </span>
            </Link>
            <Link href="/cart" aria-label={t("nav.cart")}>
              <ShoppingCart size={20} />
              {cartCount > 0 && <span key={cartCount} className="badge pop">{cartCount > 99 ? "99+" : cartCount}</span>}
              <span>{t("nav.cart")}</span>
            </Link>
          </div>
        </div>
      </header>
      {!isHome && <MenuBar />}
    </>
  );
}

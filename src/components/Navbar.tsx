"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useEffect, useRef, useState } from "react";
import { useTranslation } from "react-i18next";
import { ShoppingCart, Search, Wrench, ExternalLink, LogOut, Settings } from "lucide-react";
import { useCartStore } from "@/store/cart";
import { useCustomerStore } from "@/store/customer";
import { SHOP_NAME } from "@/lib/constants";

const NAV_LINKS = [
  { href: "/",             key: "home" },
  { href: "/products",     key: "products" },
  { href: "/book-repair",  key: "bookRepair" },
  { href: "/track-repair", key: "trackRepair" },
  { href: "/track-order",  key: "trackOrder" },
  { href: "/about",        key: "about" },
];

// How much smaller the logo gets once it sits in the menu bar
const DOCKED_SCALE = 0.92;

function Logo() {
  return (
    <>
      <span className="flex size-9 flex-shrink-0 items-center justify-center rounded-[10px] bg-crimson">
        <Wrench className="size-[18px]" />
      </span>
      <span className="leading-tight">
        <span className="block whitespace-nowrap text-lg font-bold tracking-tight">{SHOP_NAME}</span>
        <span className="block text-[11px] font-medium text-on-dark-muted">India</span>
      </span>
    </>
  );
}

/*
  The top row (search, account, cart) scrolls away with the page and the menu bar sticks to the top.
  There is one logo: it lives in the menu bar but starts lifted up into the top row's logo spot.
  As the page scrolls (--dock 0 → 1) it moves down into the menu bar and shrinks a little, while the
  menu links shift right to make room. Progress glides after the scroll so the move is slow and soft.
*/
export default function Navbar() {
  const { t } = useTranslation();
  const pathname = usePathname();
  const router = useRouter();
  const cartCount = useCartStore((s) => s.getCount());
  const customer = useCustomerStore((s) => s.customer);
  const [searchQuery, setSearchQuery] = useState("");
  const topRowRef = useRef<HTMLElement>(null);
  const logoSpotRef = useRef<HTMLDivElement>(null);
  const barRef = useRef<HTMLDivElement>(null);
  const logoRef = useRef<HTMLAnchorElement>(null);

  // The admin panel has its own sidebar, so the shop menu bar (and the moving logo) is not shown there
  const isAdmin = pathname.startsWith("/admin");

  useEffect(() => {
    if (isAdmin) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    let frame = 0;
    let shown = 0;
    let lastTime = 0;

    // Measure where the logo starts (its spot in the top row) relative to where it docks (menu bar centre)
    const measure = () => {
      const bar = barRef.current, spot = logoSpotRef.current, logo = logoRef.current, top = topRowRef.current;
      if (!bar || !spot || !logo || !top) return;
      const logoWidth = logo.offsetWidth;
      spot.style.width = `${logoWidth}px`;
      const spotCentre = spot.getBoundingClientRect().top + window.scrollY + spot.offsetHeight / 2;
      const barCentre = top.getBoundingClientRect().bottom + window.scrollY + bar.offsetHeight / 2;
      bar.style.setProperty("--dock-from", `${spotCentre - barCentre}px`);
      bar.style.setProperty("--dock-w", `${logoWidth * DOCKED_SCALE + 16}px`);
    };

    // Docked once the top row has fully scrolled away
    const target = () => {
      const distance = topRowRef.current?.offsetHeight || 68;
      return Math.min(1, Math.max(0, window.scrollY / distance));
    };
    const draw = (p: number) => barRef.current?.style.setProperty("--dock", p.toFixed(4));

    // Glide toward the target (~0.8 s to settle); only one CSS variable is written per frame
    const tick = (time: number) => {
      const goal = target();
      const dt = lastTime ? Math.min(64, time - lastTime) : 16.7;
      lastTime = time;
      shown += (goal - shown) * (1 - Math.pow(1 - 0.07, dt / 16.7));
      if (Math.abs(goal - shown) < 0.002) {
        shown = goal;
        draw(shown);
        frame = 0;
        lastTime = 0;
        return;
      }
      draw(shown);
      frame = requestAnimationFrame(tick);
    };
    const schedule = () => {
      if (reduceMotion) { shown = target(); draw(shown); return; }
      if (!frame) frame = requestAnimationFrame(tick);
    };
    const onResize = () => { measure(); schedule(); };

    measure();
    shown = target();
    draw(shown);
    document.fonts?.ready.then(measure);
    window.addEventListener("scroll", schedule, { passive: true });
    window.addEventListener("resize", onResize);
    return () => {
      cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
    };
  }, [isAdmin]);

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      router.push(`/products?search=${encodeURIComponent(searchQuery.trim())}`);
      setSearchQuery("");
    }
  };

  const isActive = (href: string) => (href === "/" ? pathname === "/" : pathname.startsWith(href));

  return (
    <>
      {/* Top row: scrolls away with the page */}
      <header ref={topRowRef} className="bg-navy text-white">
        <div className={`mx-auto flex max-w-7xl flex-wrap items-center gap-x-5 gap-y-2.5 px-4 md:flex-nowrap ${isAdmin ? "md:h-[52px] md:py-0" : "py-2.5 md:h-[68px] md:py-0"}`}>
          {isAdmin ? (
            <Link href="/" className="flex flex-shrink-0 items-center gap-2.5">
              <Logo />
            </Link>
          ) : (
            // Keeps the logo's space in the top row; the logo itself is drawn by the menu bar below
            <div ref={logoSpotRef} aria-hidden className="h-10 w-[150px] flex-shrink-0" />
          )}

          {isAdmin && (
            <div className="ml-auto flex flex-shrink-0 items-center gap-1.5">
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
          )}

          {!isAdmin && (
            <>
          <form onSubmit={handleSearch} className="relative order-3 w-full md:order-none md:max-w-[560px] md:flex-1">
            <Search className="pointer-events-none absolute left-3.5 top-1/2 size-[18px] -translate-y-1/2 text-on-dark-muted" />
            <input
              type="search"
              aria-label={t("nav.search")}
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder={t("nav.searchPlaceholder")}
              className="h-11 w-full rounded-[10px] border border-white/15 bg-white/[0.06] pl-11 pr-3.5 text-sm text-white placeholder:text-on-dark-muted focus:border-peach focus:outline-none"
            />
          </form>

          <div className="ml-auto flex flex-shrink-0 items-center gap-1.5">
            <Link
              href="/settings"
              aria-label={t("settings.title")}
              className={`flex items-center gap-2.5 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-white/[0.08] ${isActive("/settings") ? "bg-white/[0.08]" : ""}`}
            >
              <Settings className="size-5" />
              <span className="hidden leading-tight sm:block">
                {customer ? (
                  <>
                    <span className="block text-[11px] font-normal text-on-dark-muted">{t("settings.hello", { name: customer.name.split(" ")[0] })}</span>
                    {t("settings.title")}
                  </>
                ) : (
                  t("settings.title")
                )}
              </span>
            </Link>
            <Link href="/cart" className="relative flex items-center gap-3 rounded-lg px-2.5 py-2 text-sm font-medium hover:bg-white/[0.08]" aria-label={t("nav.cart")}>
              <ShoppingCart className="size-5" />
              {cartCount > 0 && (
                <span key={cartCount} className="pop absolute left-[19px] top-0 grid h-[18px] min-w-[18px] place-items-center rounded-full border-2 border-navy bg-crimson px-1 text-[11px] font-bold">
                  {cartCount > 99 ? "99+" : cartCount}
                </span>
              )}
              <span className="hidden sm:block">{t("nav.cart")}</span>
            </Link>
          </div>
            </>
          )}
        </div>
      </header>

      {/* Menu bar: sticks to the top and carries the logo */}
      {!isAdmin && (
        <div
          ref={barRef}
          className="sticky top-0 z-40 border-t border-white/[0.08] bg-navy text-white"
          style={{ boxShadow: "0 8px 18px -12px rgba(0, 0, 0, calc(var(--dock, 0) * 0.6))" }}
        >
          <div className="relative mx-auto flex h-14 max-w-7xl items-stretch px-4">
            <Link
              ref={logoRef}
              href="/"
              aria-label={`${SHOP_NAME} home`}
              className="absolute left-4 top-1/2 z-10 flex origin-left items-center gap-2.5 will-change-transform"
              style={{
                transform: `translateY(calc(-50% + (1 - var(--dock, 0)) * var(--dock-from, 0px))) scale(calc(1 - var(--dock, 0) * ${1 - DOCKED_SCALE}))`,
              }}
            >
              <Logo />
            </Link>

            {/* Opens up as the logo docks, pushing the links to the right */}
            <div aria-hidden className="flex-shrink-0" style={{ width: "calc(var(--dock, 0) * var(--dock-w, 0px))" }} />

            <nav className="flex min-w-0 flex-1 items-stretch gap-1 overflow-x-auto text-[15px] font-medium [scrollbar-width:none]">
              {NAV_LINKS.map((link) => (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`flex items-center whitespace-nowrap border-b-[3px] px-3.5 transition-colors ${
                    isActive(link.href)
                      ? "border-peach text-white"
                      : "border-transparent text-on-dark-muted hover:text-white"
                  }`}
                >
                  {t(`nav.${link.key}`)}
                </Link>
              ))}
            </nav>

          </div>
        </div>
      )}
    </>
  );
}

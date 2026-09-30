"use client";

import { useCallback, useEffect, useLayoutEffect, useRef, useState } from "react";
import Link from "next/link";
import Image from "next/image";
import { useTranslation } from "react-i18next";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface Slide {
  tag: string;
  title: string;
  text: string;
  cta: string;
  href: string;
  image: string;
  // object-position: keeps the photo's subject in view when the frame crops it (phones crop the sides)
  focus: string;
}

const DELAY_MS = 3000;
const SLIDE_EASE = "transform 600ms cubic-bezier(0.22, 0.61, 0.36, 1)";

/*
  Swipe carousel. Slides sit side by side and the track slides between them; a copy of the last
  slide sits before the first (and of the first after the last) so looping never rewinds visibly.
  Dragging moves the track directly (no React re-render per frame) and snaps on release.
  Auto-advances every 3 s; pauses only while dragging or using the keyboard on it (reduced-motion users get no slide animation).
*/
export default function PromoCarousel({ maxDiscount }: { maxDiscount: number }) {
  const { t } = useTranslation();
  const slides: Slide[] = [
    {
      tag: t("promo.s1Tag"),
      title: t("promo.s1Title"),
      text: t("promo.s1Text"),
      cta: t("promo.s1Cta"),
      href: "/products",
      image: "/promo/shop-interior.jpg",
      focus: "70% 50%",
    },
    {
      tag: t("promo.s2Tag"),
      title: maxDiscount > 0 ? t("promo.dealTitle", { percent: maxDiscount }) : t("promo.dealTitleNone"),
      text: t("promo.s2Text"),
      cta: t("promo.s2Cta"),
      href: "/products",
      image: "/promo/offers.jpg",
      focus: "72% 50%",
    },
    {
      tag: t("promo.s3Tag"),
      title: t("promo.s3Title"),
      text: t("promo.s3Text"),
      cta: t("promo.s3Cta"),
      href: "/book-repair",
      image: "/promo/repair.jpg",
      focus: "72% 50%",
    },
    {
      tag: t("promo.s4Tag"),
      title: t("promo.s4Title"),
      text: t("promo.s4Text"),
      cta: t("promo.s4Cta"),
      href: "/about",
      image: "/promo/warranty.jpg",
      focus: "78% 50%",
    },
  ];
  const count = slides.length;
  // Track = [copy of last, ...slides, copy of first]; position 1 is the first real slide
  const track = [slides[count - 1], ...slides, slides[0]];

  const [pos, setPos] = useState(1);
  const [animate, setAnimate] = useState(true);
  const [paused, setPaused] = useState(false);
  const trackRef = useRef<HTMLDivElement>(null);
  const drag = useRef<{ startX: number; dx: number; width: number; id: number } | null>(null);
  const suppressClick = useRef(false);

  const current = (pos - 1 + count) % count;

  const applyTransform = useCallback((offsetPx: number, withTransition: boolean) => {
    const el = trackRef.current;
    if (!el) return;
    const reduce = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    el.style.transition = withTransition && !reduce ? SLIDE_EASE : "none";
    el.style.transform = `translate3d(calc(${-pos * 100}% + ${offsetPx}px), 0, 0)`;
  }, [pos]);

  useLayoutEffect(() => {
    applyTransform(0, animate);
  }, [applyTransform, animate]);

  const go = useCallback((realIndex: number) => {
    setAnimate(true);
    setPos(realIndex + 1);
  }, []);

  // After sliding onto a copy, jump (without animation) to the real slide it mirrors once the slide has finished.
  // A timer rather than transitionend: that event is skipped in background tabs, which froze the loop.
  useEffect(() => {
    if (pos !== 0 && pos !== count + 1) return;
    const id = setTimeout(() => { setAnimate(false); setPos(pos === 0 ? count : 1); }, 650);
    return () => clearTimeout(id);
  }, [pos, count]);

  useEffect(() => {
    if (paused) return;
    const id = setInterval(() => {
      if (!document.hidden) { setAnimate(true); setPos((p) => Math.min(p + 1, count + 1)); }
    }, DELAY_MS);
    return () => clearInterval(id);
  }, [paused, pos, count]);

  const onPointerDown = (e: React.PointerEvent<HTMLDivElement>) => {
    if (e.button !== 0 || (e.target as HTMLElement).closest("button")) return;
    drag.current = { startX: e.clientX, dx: 0, width: e.currentTarget.offsetWidth, id: e.pointerId };
    suppressClick.current = false;
    setPaused(true);
  };
  const onPointerMove = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    d.dx = e.clientX - d.startX;
    if (Math.abs(d.dx) > 6 && !suppressClick.current) {
      suppressClick.current = true;       // it's a swipe, not a tap on the slide's button
      e.currentTarget.setPointerCapture(e.pointerId);
    }
    if (suppressClick.current) applyTransform(d.dx, false);
  };
  const endDrag = (e: React.PointerEvent<HTMLDivElement>) => {
    const d = drag.current;
    if (!d || d.id !== e.pointerId) return;
    drag.current = null;
    setPaused(false);
    if (Math.abs(d.dx) > Math.min(80, d.width * 0.15)) {
      setAnimate(true);
      setPos((p) => (d.dx < 0 ? Math.min(p + 1, count + 1) : Math.max(p - 1, 0)));
    } else {
      applyTransform(0, true);              // not far enough: spring back
    }
  };

  return (
    <div
      className="relative touch-pan-y select-none overflow-hidden rounded-[10px] bg-navy text-white"
      aria-roledescription="carousel"
      aria-label={t("promo.label")}
      onFocus={(e) => setPaused(e.target.matches(":focus-visible"))}
      onBlur={() => setPaused(false)}
      onPointerDown={onPointerDown}
      onPointerMove={onPointerMove}
      onPointerUp={endDrag}
      onPointerCancel={endDrag}
      onClickCapture={(e) => {
        if (suppressClick.current) { e.preventDefault(); e.stopPropagation(); suppressClick.current = false; }
      }}
    >
      <div ref={trackRef} className="flex will-change-transform">
        {track.map((slide, i) => {
          const active = i === pos;
          return (
            <article
              key={i}
              aria-roledescription="slide"
              aria-label={t("promo.slideOf", { n: ((i - 1 + count) % count) + 1, total: count })}
              aria-hidden={!active}
              inert={!active}
              className="relative h-[460px] min-w-0 flex-[0_0_100%] overflow-hidden sm:h-[400px] md:h-[380px]"
            >
              <Image
                src={slide.image}
                alt=""
                fill
                draggable={false}
                priority={i === 1}
                sizes="(max-width: 1280px) 100vw, 1248px"
                className="object-cover"
                style={{ objectPosition: slide.focus }}
              />
              {/* Phones: shade rises from the bottom under the text. Desktop: shade from the left. */}
              <div aria-hidden className="absolute inset-0 bg-gradient-to-t from-navy via-navy/80 to-navy/5 md:hidden" />
              <div aria-hidden className="absolute inset-0 hidden bg-gradient-to-r from-navy from-[28%] via-navy/75 via-[52%] to-navy/0 to-[78%] md:block" />

              <div className="absolute inset-x-0 bottom-0 px-6 pb-[68px] md:inset-y-0 md:right-auto md:flex md:max-w-[560px] md:flex-col md:justify-center md:pb-0 md:pl-20">
                <span className="flex items-center gap-2.5 text-[11px] font-semibold uppercase tracking-[0.14em] text-peach">
                  <span aria-hidden className="h-px w-6 bg-peach" />
                  {slide.tag}
                </span>
                <h3 className="mt-3 text-[24px] font-bold leading-[1.15] tracking-tight [text-wrap:balance] md:text-[34px]">
                  {slide.title}
                </h3>
                <p className="mt-3 max-w-[42ch] text-[15px] leading-relaxed text-white/80">{slide.text}</p>
                <Link
                  href={slide.href}
                  draggable={false}
                  className="mt-5 inline-flex h-[46px] w-fit items-center gap-2 rounded-[10px] bg-crimson px-[22px] text-[15px] font-semibold transition-colors hover:bg-wine active:scale-[0.97]"
                >
                  {slide.cta}
                  <ChevronRight className="size-4" />
                </Link>
              </div>
            </article>
          );
        })}
      </div>

      <button
        type="button"
        aria-label={t("promo.prev")}
        onClick={() => go(current - 1)}
        className="absolute bottom-3 right-14 z-10 grid size-[34px] place-items-center rounded-full border border-white/25 bg-navy/50 backdrop-blur-sm transition-colors hover:bg-navy/80 focus-visible:outline-2 focus-visible:outline-peach active:scale-95 md:bottom-auto md:left-4 md:right-auto md:top-1/2 md:size-10 md:-translate-y-1/2"
      >
        <ChevronLeft className="size-[18px]" />
      </button>
      <button
        type="button"
        aria-label={t("promo.next")}
        onClick={() => go(current + 1)}
        className="absolute bottom-3 right-4 z-10 grid size-[34px] place-items-center rounded-full border border-white/25 bg-navy/50 backdrop-blur-sm transition-colors hover:bg-navy/80 focus-visible:outline-2 focus-visible:outline-peach active:scale-95 md:bottom-auto md:top-1/2 md:size-10 md:-translate-y-1/2"
      >
        <ChevronRight className="size-[18px]" />
      </button>

      <div className="absolute bottom-[25px] left-6 z-10 flex gap-1.5 md:bottom-4 md:left-1/2 md:-translate-x-1/2">
        {slides.map((slide, i) => (
          <button
            key={i}
            type="button"
            aria-label={t("promo.slideN", { n: i + 1 })}
            aria-current={i === current}
            onClick={() => go(i)}
            className={`h-2 rounded transition-[width,background-color] duration-300 focus-visible:outline-2 focus-visible:outline-peach ${
              i === current ? "w-[22px] bg-peach" : "w-2 bg-white/30"
            }`}
          />
        ))}
      </div>
    </div>
  );
}

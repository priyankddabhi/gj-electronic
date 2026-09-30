/*
  Effects for the rich theme (ported from the 3002 demo).
  Lenis (smooth scroll) and Motion (spring animations) are small prebuilt files in /public/vendor,
  loaded on demand, so no npm packages are needed. Nothing runs for reduced-motion visitors.
*/

/* eslint-disable @typescript-eslint/no-explicit-any */
type Cleanup = () => void;

declare global {
  interface Window {
    Lenis?: any;
    Motion?: any;
    __gjeLenis?: any;
  }
}

const scripts: Record<string, Promise<void>> = {};
export function loadScript(src: string): Promise<void> {
  if (!scripts[src]) {
    scripts[src] = new Promise((resolve, reject) => {
      const el = document.createElement("script");
      el.src = src;
      el.async = true;
      el.onload = () => resolve();
      el.onerror = () => { delete scripts[src]; reject(new Error(`Could not load ${src}`)); };
      document.head.appendChild(el);
    });
  }
  return scripts[src];
}

export const prefersReducedMotion = () =>
  typeof window !== "undefined" && window.matchMedia("(prefers-reduced-motion: reduce)").matches;
export const finePointer = () =>
  typeof window !== "undefined" && window.matchMedia("(hover: hover) and (pointer: fine)").matches;

export async function loadMotion(): Promise<any | null> {
  if (prefersReducedMotion()) return null;
  try {
    await loadScript("/vendor/motion.js");
    return window.Motion ?? null;
  } catch {
    return null;
  }
}

/* Lenis smooth scroll for the whole shop; menus, dialogs and dropdown lists keep their own scrolling */
export async function startLenis(isCancelled: () => boolean = () => false): Promise<Cleanup> {
  if (prefersReducedMotion() || window.__gjeLenis) return () => {};
  try {
    await loadScript("/vendor/lenis.min.js");
  } catch {
    return () => {};
  }
  if (isCancelled() || !window.Lenis || window.__gjeLenis) return () => {};
  const lenis = new window.Lenis({
    lerp: 0.09,
    wheelMultiplier: 0.9,
    prevent: (node: HTMLElement) =>
      !!node.closest?.('[role="dialog"],[role="listbox"],[role="menu"],[data-lenis-prevent],textarea'),
  });
  window.__gjeLenis = lenis;
  let frame = 0;
  const raf = (t: number) => { lenis.raf(t); frame = requestAnimationFrame(raf); };
  frame = requestAnimationFrame(raf);
  return () => {
    cancelAnimationFrame(frame);
    lenis.destroy();
    window.__gjeLenis = undefined;
  };
}

/*
  Spring reveals: ".rise" blocks and the children of ".stagger" groups start hidden and spring in when
  they scroll into view. Safe to call again after new content renders: done elements are marked.
*/
export function setupReveals(root: ParentNode, M: any): void {
  const { animate, inView, stagger } = M;
  const spring = { type: "spring", stiffness: 120, damping: 20, mass: 0.9 };
  root.querySelectorAll<HTMLElement>(".rise:not([data-rv])").forEach((el) => {
    el.dataset.rv = "1";
    const r = el.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) { el.classList.add("in"); return; } // already on screen
    el.style.opacity = "0";
    el.style.transform = "translateY(40px)";
    inView(el, () => { el.classList.add("in"); animate(el, { opacity: 1, y: 0 }, spring); }, { amount: 0.15 });
  });
  root.querySelectorAll<HTMLElement>(".stagger:not([data-rv])").forEach((group) => {
    if (!group.children.length) return;
    group.dataset.rv = "1";
    const kids = [...group.children] as HTMLElement[];
    const r = group.getBoundingClientRect();
    if (r.top < window.innerHeight && r.bottom > 0) return;
    kids.forEach((k) => { k.style.opacity = "0"; k.style.transform = "translateY(30px) scale(.97)"; });
    inView(group, () => { animate(kids, { opacity: 1, y: 0, scale: 1 }, { ...spring, delay: stagger(0.07) }); }, { amount: 0.15 });
  });
}

/* Heads without Motion (reduced motion / script failed): show the drawn rule straight away */
export function showAllReveals(root: ParentNode): void {
  root.querySelectorAll(".rise").forEach((el) => el.classList.add("in"));
}

/* Magnetic buttons, tilting category tiles and the cursor spotlight (mouse/trackpad only) */
export function setupPointerEffects(root: ParentNode, M: any | null): Cleanup {
  if (!finePointer()) return () => {};
  const offs: Cleanup[] = [];
  const on = (el: Element, type: string, fn: (e: PointerEvent) => void) => {
    el.addEventListener(type, fn as EventListener);
    offs.push(() => el.removeEventListener(type, fn as EventListener));
  };
  if (M) {
    const { animate } = M;
    root.querySelectorAll<HTMLElement>(".mag:not([data-fx])").forEach((el) => {
      el.dataset.fx = "1";
      on(el, "pointermove", (e) => {
        const r = el.getBoundingClientRect();
        animate(el, { x: (e.clientX - r.left - r.width / 2) * 0.25, y: (e.clientY - r.top - r.height / 2) * 0.35 }, { type: "spring", stiffness: 250, damping: 18 });
      });
      on(el, "pointerleave", () => animate(el, { x: 0, y: 0 }, { type: "spring", stiffness: 200, damping: 14 }));
    });
    root.querySelectorAll<HTMLElement>(".cat:not([data-fx])").forEach((el) => {
      el.dataset.fx = "1";
      on(el, "pointermove", (e) => {
        const r = el.getBoundingClientRect();
        const px = (e.clientX - r.left) / r.width - 0.5, py = (e.clientY - r.top) / r.height - 0.5;
        animate(el, { rotateY: px * 12, rotateX: -py * 12, y: -6 }, { type: "spring", stiffness: 220, damping: 20 });
      });
      on(el, "pointerleave", () => animate(el, { rotateY: 0, rotateX: 0, y: 0 }, { type: "spring", stiffness: 180, damping: 16 }));
    });
  }
  root.querySelectorAll<HTMLElement>(".spot:not([data-sp])").forEach((el) => {
    el.dataset.sp = "1";
    on(el, "pointermove", (e) => {
      const r = el.getBoundingClientRect();
      el.style.setProperty("--mx", `${e.clientX - r.left}px`);
      el.style.setProperty("--my", `${e.clientY - r.top}px`);
    });
  });
  return () => offs.forEach((off) => off());
}

/* Numbers count up from 0 when they scroll into view */
export function setupCountUp(root: ParentNode): Cleanup {
  const reduce = prefersReducedMotion();
  const fmt = (v: number, dec: number) => v.toLocaleString("en-IN", { minimumFractionDigits: dec, maximumFractionDigits: dec });
  const observers: IntersectionObserver[] = [];
  root.querySelectorAll<HTMLElement>("[data-count]").forEach((el) => {
    const end = parseFloat(el.dataset.count || "0"), dec = Number(el.dataset.dec || 0);
    const run = () => {
      if (reduce) { el.textContent = fmt(end, dec); return; }
      const t0 = performance.now(), dur = 1800;
      const tick = (t: number) => {
        const k = Math.min(1, (t - t0) / dur), e = 1 - Math.pow(1 - k, 4);
        el.textContent = fmt(end * e, dec);
        if (k < 1) requestAnimationFrame(tick);
      };
      requestAnimationFrame(tick);
    };
    const io = new IntersectionObserver((en) => { if (en[0].isIntersecting) { run(); io.disconnect(); } }, { threshold: 0.6 });
    io.observe(el);
    observers.push(io);
  });
  return () => observers.forEach((io) => io.disconnect());
}

/* Splits a headline into word spans for the BlurText effect */
export function splitWords(text: string) {
  return text.trim().split(/\s+/);
}

export const SITE_THEMES = ["light", "dark", "system"] as const;
export type SiteTheme = (typeof SITE_THEMES)[number];

export function toSiteTheme(value: unknown): SiteTheme {
  return SITE_THEMES.includes(value as SiteTheme) ? (value as SiteTheme) : "light";
}

export const ADMIN_THEME_EVENT = "gje-admin-theme";

// The theme chosen in Admin → Settings applies to the admin panel only; the shop keeps its own look
export function applyAdminTheme(theme: SiteTheme): () => void {
  const root = document.documentElement;
  if (theme !== "system") {
    root.classList.toggle("dark", theme === "dark");
    return () => root.classList.remove("dark");
  }
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  const sync = () => root.classList.toggle("dark", mq.matches);
  sync();
  mq.addEventListener("change", sync);
  return () => {
    mq.removeEventListener("change", sync);
    root.classList.remove("dark");
  };
}

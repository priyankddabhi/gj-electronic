"use client";

import { useEffect, useState } from "react";
import { Sun, Moon } from "lucide-react";
import { ADMIN_THEME_EVENT, toSiteTheme } from "@/lib/theme";

type Mode = "light" | "dark";

// One icon button in the admin header: ☀ ⇄ 🌙. Applies to the admin panel only.
// An old "system" setting is shown as whatever the computer currently uses.
export default function AdminThemeButton() {
  const [mode, setMode] = useState<Mode>("light");
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        const t = toSiteTheme(data.theme);
        setMode(t === "system" ? (window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light") : t);
      })
      .catch(() => {});
  }, []);

  const toggle = async () => {
    const previous = mode;
    const next: Mode = mode === "dark" ? "light" : "dark";
    setMode(next);
    window.dispatchEvent(new CustomEvent(ADMIN_THEME_EVENT, { detail: next }));
    setSaving(true);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: next }),
    }).catch(() => null);
    setSaving(false);
    if (!res?.ok) {
      setMode(previous);
      window.dispatchEvent(new CustomEvent(ADMIN_THEME_EVENT, { detail: previous }));
      alert("Could not save theme. Please try again.");
    }
  };

  const dark = mode === "dark";
  const icon = "absolute inset-0 m-auto size-[18px] transition-all duration-500 ease-out";
  return (
    <button
      type="button"
      onClick={toggle}
      disabled={saving}
      title={dark ? "Switch to light theme" : "Switch to dark theme"}
      aria-label={dark ? "Switch to light theme" : "Switch to dark theme"}
      className="relative size-9 rounded-full text-on-dark-muted transition-colors hover:bg-white/[0.08] hover:text-white active:scale-90"
    >
      {/* Sun spins away and the moon spins in (and back) */}
      <Sun className={`${icon} ${dark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"}`} />
      <Moon className={`${icon} ${dark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"}`} />
    </button>
  );
}

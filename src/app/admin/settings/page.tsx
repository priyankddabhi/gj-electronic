"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";
import { ADMIN_THEME_EVENT, SITE_THEMES, toSiteTheme, type SiteTheme } from "@/lib/theme";
import {
  SHOP_NAME,
  SHOP_PHONE,
  SHOP_ADDRESS,
  SHOP_HOURS,
  SHOP_WHATSAPP,
} from "@/lib/constants";

const THEME_OPTIONS: Record<SiteTheme, { label: string; icon: typeof Sun }> = {
  light: { label: "Light", icon: Sun },
  dark: { label: "Dark", icon: Moon },
  system: { label: "System", icon: Monitor },
};

export default function AdminSettingsPage() {
  const [deliveryCharge, setDeliveryCharge] = useState("50");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [theme, setTheme] = useState<SiteTheme>("light");
  const [themeSaving, setThemeSaving] = useState(false);
  const [themeError, setThemeError] = useState("");

  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.deliveryCharge) setDeliveryCharge(data.deliveryCharge);
        setTheme(toSiteTheme(data.theme));
      })
      .catch(() => {});
  }, []);

  const saveTheme = async (next: SiteTheme) => {
    const previous = theme;
    setTheme(next);
    setThemeSaving(true);
    setThemeError("");
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ theme: next }),
    }).catch(() => null);
    setThemeSaving(false);
    if (!res?.ok) {
      setTheme(previous);
      setThemeError("Could not save theme. Please try again.");
      return;
    }
    window.dispatchEvent(new CustomEvent(ADMIN_THEME_EVENT, { detail: next }));
  };

  const saveDeliveryCharge = async () => {
    setSaving(true);
    await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ deliveryCharge }),
    });
    setSaving(false);
    setSaved(true);
    setTimeout(() => setSaved(false), 2000);
  };

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Settings</h1>

      <div className="max-w-xl space-y-6">
        <div className="rounded-xl border border-border p-6">
          <h2 className="mb-1 font-semibold">Admin Panel Theme</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            Applies to this admin panel only. The shop website keeps its own look. System follows this computer&apos;s setting.
          </p>
          <div className="grid grid-cols-3 gap-2" role="radiogroup" aria-label="Admin panel theme">
            {SITE_THEMES.map((value) => {
              const { label, icon: Icon } = THEME_OPTIONS[value];
              const active = theme === value;
              return (
                <button
                  key={value}
                  type="button"
                  role="radio"
                  aria-checked={active}
                  disabled={themeSaving}
                  onClick={() => !active && saveTheme(value)}
                  className={`flex flex-col items-center gap-1.5 rounded-lg border px-3 py-3 text-sm font-medium transition-colors disabled:opacity-60 ${
                    active
                      ? "border-primary bg-accent text-accent-foreground"
                      : "border-border text-muted-foreground hover:border-foreground/30 hover:text-foreground"
                  }`}
                >
                  <Icon className="size-5" />
                  {label}
                </button>
              );
            })}
          </div>
          {themeError && <p className="mt-2 text-xs text-destructive">{themeError}</p>}
        </div>

        <div className="rounded-xl border border-border p-6">
          <h2 className="mb-4 font-semibold">Delivery Charges</h2>
          <div className="flex items-end gap-3">
            <div className="flex-1">
              <label className="mb-1.5 block text-sm font-medium">
                Home Delivery Charge (₹)
              </label>
              <input
                type="number"
                value={deliveryCharge}
                onChange={(e) => setDeliveryCharge(e.target.value)}
                min={0}
                className="w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Set to 0 for free delivery. Shop pickup is always free.
              </p>
            </div>
            <button
              onClick={saveDeliveryCharge}
              disabled={saving}
              className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
            >
              {saved ? "Saved!" : saving ? "Saving..." : "Save"}
            </button>
          </div>
        </div>

        <div className="rounded-xl border border-border p-6">
          <h2 className="mb-4 font-semibold">Shop Information</h2>
          <p className="mb-4 text-sm text-muted-foreground">
            To change these values, edit{" "}
            <code className="rounded bg-muted px-1.5 py-0.5 text-xs">
              src/lib/constants.ts
            </code>
          </p>
          <div className="space-y-3 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Shop Name</span>
              <span className="font-medium">{SHOP_NAME}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{SHOP_PHONE}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">WhatsApp</span>
              <span className="font-medium">{SHOP_WHATSAPP}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Address</span>
              <span className="font-medium text-right max-w-[250px]">
                {SHOP_ADDRESS}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Hours</span>
              <span className="font-medium">{SHOP_HOURS}</span>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border p-6">
          <h2 className="mb-4 font-semibold">Admin Account</h2>
          <p className="text-sm text-muted-foreground">
            Default credentials: admin / admin123. Change after first login via
            database.
          </p>
        </div>
      </div>
    </div>
  );
}

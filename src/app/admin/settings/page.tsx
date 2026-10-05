"use client";

import { useEffect, useState } from "react";
import { SHOP_NAME, SHOP_PHONE } from "@/lib/constants";
import { DEFAULT_SHOP_INFO, setShopInfoCache, type ShopInfo } from "@/lib/shopInfo";

const field =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

export default function AdminSettingsPage() {
  const [deliveryCharge, setDeliveryCharge] = useState("50");
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [shop, setShop] = useState<ShopInfo>(DEFAULT_SHOP_INFO);
  const [shopSaving, setShopSaving] = useState(false);
  const [shopMsg, setShopMsg] = useState<{ ok: boolean; text: string } | null>(null);
  useEffect(() => {
    fetch("/api/settings")
      .then((r) => r.json())
      .then((data) => {
        if (data.deliveryCharge) setDeliveryCharge(data.deliveryCharge);
        setShop({
          whatsapp: data.shopWhatsapp || DEFAULT_SHOP_INFO.whatsapp,
          address: data.shopAddress || DEFAULT_SHOP_INFO.address,
          hours: data.shopHours || DEFAULT_SHOP_INFO.hours,
        });
      })
      .catch(() => {});
  }, []);

  const saveShop = async () => {
    const next = { whatsapp: shop.whatsapp.replace(/\D/g, ""), address: shop.address.trim(), hours: shop.hours.trim() };
    if (next.whatsapp.length < 10 || !next.address || !next.hours) {
      setShopMsg({ ok: false, text: "Fill in all three. WhatsApp needs at least 10 digits." });
      return;
    }
    setShopSaving(true);
    setShopMsg(null);
    const res = await fetch("/api/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ shopWhatsapp: next.whatsapp, shopAddress: next.address, shopHours: next.hours }),
    }).catch(() => null);
    setShopSaving(false);
    if (!res?.ok) {
      setShopMsg({ ok: false, text: "Could not save. Please try again." });
      return;
    }
    setShop(next);
    setShopInfoCache(next);
    setShopMsg({ ok: true, text: "Saved!" });
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
          <h2 className="mb-1 font-semibold">Shop Information</h2>
          <p className="mb-4 text-sm text-muted-foreground">Shown to customers on the website.</p>
          <div className="space-y-3">
            <div>
              <label className="mb-1.5 block text-sm font-medium">WhatsApp Number</label>
              <input
                value={shop.whatsapp}
                onChange={(e) => setShop({ ...shop, whatsapp: e.target.value })}
                inputMode="numeric"
                placeholder="919876543210"
                className={field}
              />
              <p className="mt-1 text-xs text-muted-foreground">Country code + number, digits only (e.g. 919876543210).</p>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Hours</label>
              <input value={shop.hours} onChange={(e) => setShop({ ...shop, hours: e.target.value })} className={field} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">Address</label>
              <textarea
                value={shop.address}
                onChange={(e) => setShop({ ...shop, address: e.target.value })}
                rows={2}
                className={field}
              />
            </div>
            <div className="flex items-center justify-end gap-3">
              {shopMsg && (
                <span className={`text-xs ${shopMsg.ok ? "text-green-700 dark:text-green-400" : "text-destructive"}`}>{shopMsg.text}</span>
              )}
              <button
                type="button"
                onClick={saveShop}
                disabled={shopSaving}
                className="rounded-lg bg-primary px-5 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
              >
                {shopSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </div>
        </div>

        <div className="rounded-xl border border-border p-6">
          <h2 className="mb-4 font-semibold">Admin Account</h2>
          <div className="mb-4 space-y-3 text-sm">
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Shop Name</span>
              <span className="font-medium">{SHOP_NAME}</span>
            </div>
            <div className="flex justify-between border-b border-border pb-2">
              <span className="text-muted-foreground">Phone</span>
              <span className="font-medium">{SHOP_PHONE}</span>
            </div>
          </div>
          <p className="text-sm text-muted-foreground">
            Default credentials: admin / admin123. Change after first login via
            database.
          </p>
        </div>
      </div>
    </div>
  );
}

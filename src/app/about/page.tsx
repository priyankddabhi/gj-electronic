"use client";

import { useState } from "react";
import { useTranslation } from "react-i18next";
import {
  MapPin,
  Phone,
  Clock,
  MessageCircle,
  Star,
  Wrench,
  ShieldCheck,
  Zap,
  CheckCircle,
  Send,
  ChevronDown,
} from "lucide-react";
import { normalizePhone } from "@/lib/phone";
import { useCustomerStore } from "@/store/customer";
import { SHOP_PHONE, GOOGLE_REVIEW_URL } from "@/lib/constants";
import { useShopInfo } from "@/lib/shopInfo";
import PageHero from "@/components/PageHero";

export default function AboutPage() {
  const shop = useShopInfo();
  const { t } = useTranslation();

  return (
    <>
    <PageHero eyebrow={t("rich.pAbout")} title={t("about.title")} sub={t("about.description")} />
    <div className="mx-auto max-w-3xl px-4 py-8">

      <div className="mb-8 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border p-5 text-center">
          <ShieldCheck className="mx-auto mb-3 size-8 text-primary" />
          <h3 className="mb-1 font-semibold">{t("home.quality")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("home.qualityDesc")}
          </p>
        </div>
        <div className="rounded-xl border border-border p-5 text-center">
          <Wrench className="mx-auto mb-3 size-8 text-primary" />
          <h3 className="mb-1 font-semibold">{t("home.expertRepair")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("home.expertRepairDesc")}
          </p>
        </div>
        <div className="rounded-xl border border-border p-5 text-center">
          <Zap className="mx-auto mb-3 size-8 text-primary" />
          <h3 className="mb-1 font-semibold">{t("home.fastService")}</h3>
          <p className="text-sm text-muted-foreground">
            {t("home.fastServiceDesc")}
          </p>
        </div>
      </div>

      <div id="contact" className="rounded-xl border border-border p-6">
        <h2 className="mb-5 text-lg font-bold">Contact Us</h2>
        <div className="space-y-4">
          <div className="flex items-start gap-3">
            <MapPin className="mt-0.5 size-5 flex-shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">{t("about.address")}</p>
              <p className="text-sm text-muted-foreground">{shop.address}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Phone className="mt-0.5 size-5 flex-shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">{t("about.phone")}</p>
              <p className="text-sm text-muted-foreground">{SHOP_PHONE}</p>
            </div>
          </div>
          <div className="flex items-start gap-3">
            <Clock className="mt-0.5 size-5 flex-shrink-0 text-primary" />
            <div>
              <p className="text-sm font-medium">{t("about.hours")}</p>
              <p className="text-sm text-muted-foreground">{shop.hours}</p>
            </div>
          </div>
        </div>

        <div className="mt-6 flex flex-wrap gap-3">
          <a
            href={`https://wa.me/${shop.whatsapp}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg bg-[#25D366] px-5 py-2.5 text-sm font-medium text-white hover:bg-[#25D366]/90"
          >
            <MessageCircle className="size-4" />
            {t("about.whatsapp")}
          </a>
          <a
            href={GOOGLE_REVIEW_URL}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-5 py-2.5 text-sm font-medium hover:bg-muted"
          >
            <Star className="size-4" />
            {t("about.reviewUs")}
          </a>
        </div>
      </div>

      <ReportForm />
    </div>
    </>
  );
}

const TYPES = ["complaint", "query", "report"] as const;
const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function ReportForm() {
  const { t } = useTranslation();
  const customer = useCustomerStore((s) => s.customer);
  // name/phone stay null until typed, so a logged-in customer's details show as the default
  const empty = { name: null as string | null, phone: null as string | null, type: "complaint" as (typeof TYPES)[number], message: "", refId: "" };
  const [form, setForm] = useState(empty);
  const [error, setError] = useState("");
  const [sending, setSending] = useState(false);
  const [sent, setSent] = useState(false);
  const [open, setOpen] = useState(false);
  const update = (patch: Partial<typeof empty>) => {
    setForm((f) => ({ ...f, ...patch }));
    setError("");
  };
  const name = form.name ?? customer?.name ?? "";
  const phone = form.phone ?? customer?.phone ?? "";

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (name.trim().length < 2) return setError(t("errors.name"));
    if (!normalizePhone(phone)) return setError(t("errors.phone"));
    if (form.message.trim().length < 5) return setError(t("errors.message"));
    setSending(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...form, name, phone }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        setError(err.error ? t(err.error) : t("common.error"));
        return;
      }
      setSent(true);
      setForm({ ...empty, name, phone });
    } catch {
      setError(t("common.error"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div id="report" className="mt-8 rounded-xl border border-border">
      <button
        type="button"
        aria-expanded={open}
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-4 p-6 text-left"
      >
        <span>
          <span className="block text-lg font-bold">{t("report.title")}</span>
          <span className="mt-1 block text-sm text-muted-foreground">{t("report.desc")}</span>
        </span>
        <ChevronDown className={`size-5 flex-shrink-0 text-muted-foreground transition-transform ${open ? "rotate-180" : ""}`} />
      </button>
      {open && (
      <div className="px-6 pb-6">

      {sent ? (
        <div className="flex items-start gap-3 rounded-lg border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
          <CheckCircle className="mt-0.5 size-5 flex-shrink-0 text-green-600" />
          <div className="flex-1">
            <p className="font-semibold text-green-800 dark:text-green-300">{t("report.success")}</p>
            <p className="mt-0.5 text-sm text-green-700 dark:text-green-400">{t("report.successDesc")}</p>
            <button type="button" onClick={() => setSent(false)} className="mt-2 text-sm font-medium text-primary hover:underline">
              {t("report.sendAnother")}
            </button>
          </div>
        </div>
      ) : (
        <form onSubmit={submit} className="space-y-4">
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t("repair.name")} *</label>
              <input value={name} onChange={(e) => update({ name: e.target.value })} maxLength={100} className={inputClass} />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t("repair.phone")} *</label>
              <input type="tel" value={phone} onChange={(e) => update({ phone: e.target.value })} className={inputClass} />
            </div>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t("report.type")}</label>
              <select
                value={form.type}
                onChange={(e) => update({ type: e.target.value as (typeof TYPES)[number] })}
                className={inputClass}
              >
                {TYPES.map((ty) => <option key={ty} value={ty}>{t(`report.types.${ty}`)}</option>)}
              </select>
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium">{t("report.refId")}</label>
              <input
                value={form.refId}
                onChange={(e) => update({ refId: e.target.value })}
                maxLength={40}
                placeholder={t("report.refIdHint")}
                className={inputClass}
              />
            </div>
          </div>
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t("report.message")} *</label>
            <textarea
              value={form.message}
              onChange={(e) => update({ message: e.target.value })}
              rows={4}
              maxLength={2000}
              className={inputClass}
            />
          </div>
          {error && <p className="text-sm text-destructive">{error}</p>}
          <button
            type="submit"
            disabled={sending}
            className="inline-flex items-center gap-2 rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
          >
            <Send className="size-4" />
            {sending ? t("report.sending") : t("report.submit")}
          </button>
        </form>
      )}
      </div>
      )}
    </div>
  );
}

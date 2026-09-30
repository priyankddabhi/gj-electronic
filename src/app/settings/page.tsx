"use client";

import { useState } from "react";
import Link from "next/link";
import { useTranslation } from "react-i18next";
import { Check, Languages, User, KeyRound, History, LifeBuoy, LogOut, Phone, MessageCircle, Package, Wrench } from "lucide-react";
import { useCustomerStore, type CustomerInfo } from "@/store/customer";
import { MY_ORDERS_KEY, MY_REPAIRS_KEY, getSavedIds } from "@/lib/myTracking";
import { SHOP_PHONE, SHOP_WHATSAPP } from "@/lib/constants";
import { MIN_PASSWORD, normalizePhone } from "@/lib/phone";

const LANGUAGES = [
  { code: "en", label: "English", sample: "Aa" },
  { code: "gu", label: "ગુજરાતી", sample: "અ" },
  { code: "hi", label: "हिन्दी", sample: "अ" },
];

const inputClass =
  "w-full rounded-lg border border-input bg-background px-3 py-2.5 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring";

function Section({ icon: Icon, title, children }: { icon: typeof User; title: string; children: React.ReactNode }) {
  return (
    <section className="rounded-xl border border-border bg-card p-5">
      <h2 className="mb-4 flex items-center gap-2.5 font-semibold">
        <span className="grid size-8 place-items-center rounded-lg bg-accent text-wine">
          <Icon className="size-4" />
        </span>
        {title}
      </h2>
      {children}
    </section>
  );
}

function Status({ msg }: { msg: { ok: boolean; text: string } | null }) {
  if (!msg) return null;
  return <p className={`text-sm ${msg.ok ? "text-green-600" : "text-destructive"}`}>{msg.text}</p>;
}

function ProfileForm({ customer }: { customer: CustomerInfo }) {
  const { t } = useTranslation();
  const setCustomer = useCustomerStore((s) => s.setCustomer);
  const [name, setName] = useState(customer.name);
  const [address, setAddress] = useState(customer.address);
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/customer-auth", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name, address }),
    });
    const data = await res.json();
    if (res.ok) {
      setCustomer(data);
      setMsg({ ok: true, text: t("settings.saved") });
    } else {
      setMsg({ ok: false, text: data.error || t("common.error") });
    }
    setSaving(false);
  };

  return (
    <form onSubmit={save} className="space-y-4">
      <div>
        <label className="mb-1.5 block text-sm font-medium">{t("checkout.name")}</label>
        <input value={name} onChange={(e) => setName(e.target.value)} required minLength={2} className={inputClass} />
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">{t("checkout.phone")}</label>
        <input value={customer.phone} disabled className={`${inputClass} cursor-not-allowed text-muted-foreground`} />
        <p className="mt-1 text-xs text-muted-foreground">{t("settings.phoneNote")}</p>
      </div>
      <div>
        <label className="mb-1.5 block text-sm font-medium">{t("settings.savedAddress")}</label>
        <textarea
          value={address}
          onChange={(e) => setAddress(e.target.value)}
          rows={3}
          placeholder={t("settings.addressPlaceholder")}
          className={inputClass}
        />
        <p className="mt-1 text-xs text-muted-foreground">{t("settings.addressNote")}</p>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg bg-crimson px-5 py-2.5 text-sm font-semibold text-white hover:bg-wine disabled:opacity-50"
        >
          {saving ? t("common.loading") : t("common.save")}
        </button>
        <Status msg={msg} />
      </div>
    </form>
  );
}

function PasswordForm() {
  const { t } = useTranslation();
  const [open, setOpen] = useState(false);
  const [current, setCurrent] = useState("");
  const [next, setNext] = useState("");
  const [saving, setSaving] = useState(false);
  const [msg, setMsg] = useState<{ ok: boolean; text: string } | null>(null);

  const change = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMsg(null);
    const res = await fetch("/api/customer-auth", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currentPassword: current, newPassword: next }),
    });
    const data = await res.json();
    if (res.ok) {
      setCurrent("");
      setNext("");
      setOpen(false);
      setMsg({ ok: true, text: t("settings.passwordChanged") });
    } else {
      setMsg({ ok: false, text: data.error || t("common.error") });
    }
    setSaving(false);
  };

  if (!open) {
    return (
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <p className="text-sm text-muted-foreground">{t("settings.passwordDesc")}</p>
          <Status msg={msg} />
        </div>
        <button
          type="button"
          onClick={() => { setOpen(true); setMsg(null); }}
          aria-expanded={false}
          className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
        >
          {t("settings.open")}
        </button>
      </div>
    );
  }

  return (
    <form onSubmit={change} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("settings.currentPassword")}</label>
          <input type="password" value={current} onChange={(e) => setCurrent(e.target.value)} required autoComplete="current-password" className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("settings.newPassword")}</label>
          <input type="password" value={next} onChange={(e) => setNext(e.target.value)} required minLength={MIN_PASSWORD} autoComplete="new-password" className={inputClass} />
        </div>
      </div>
      <div className="flex items-center gap-3">
        <button
          type="submit"
          disabled={saving}
          className="rounded-lg border border-border px-5 py-2.5 text-sm font-semibold hover:bg-muted disabled:opacity-50"
        >
          {t("settings.changePassword")}
        </button>
        <button type="button" onClick={() => setOpen(false)} className="px-2 text-sm text-muted-foreground hover:text-foreground">
          {t("settings.close")}
        </button>
        <Status msg={msg} />
      </div>
    </form>
  );
}

function AuthForm() {
  const { t } = useTranslation();
  const { login, register } = useCustomerStore();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    if (tab === "register" && name.trim().length < 2) return setError(t("errors.name"));
    if (!normalizePhone(phone)) return setError(t("errors.phone"));
    if (tab === "register" && password.length < MIN_PASSWORD) return setError(t("errors.password"));
    setSubmitting(true);
    const err = tab === "login" ? await login(phone, password) : await register(name, phone, password);
    if (err) setError(err);
    setSubmitting(false);
  };

  return (
    <>
      <p className="-mt-2 mb-4 text-sm text-muted-foreground">{t("auth.welcomeDesc")}</p>
      <div className="mb-4 grid grid-cols-2 rounded-lg border border-border p-1" role="tablist">
        {(["login", "register"] as const).map((key) => (
          <button
            key={key}
            type="button"
            role="tab"
            aria-selected={tab === key}
            onClick={() => { setTab(key); setError(""); }}
            className={`rounded-md py-2 text-sm font-medium transition-colors ${
              tab === key ? "bg-foreground text-background" : "text-muted-foreground hover:text-foreground"
            }`}
          >
            {t(`auth.${key}`)}
          </button>
        ))}
      </div>
      <form onSubmit={submit} noValidate className="space-y-4">
        {tab === "register" && (
          <div>
            <label className="mb-1.5 block text-sm font-medium">{t("auth.name")}</label>
            <input value={name} onChange={(e) => setName(e.target.value)} autoComplete="name" placeholder={t("auth.namePlaceholder")} className={inputClass} />
          </div>
        )}
        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("auth.phone")}</label>
          <input type="tel" inputMode="numeric" value={phone} onChange={(e) => setPhone(e.target.value)} autoComplete="tel" placeholder={t("auth.phonePlaceholder")} className={inputClass} />
        </div>
        <div>
          <label className="mb-1.5 block text-sm font-medium">{t("auth.password")}</label>
          <input
            type="password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete={tab === "login" ? "current-password" : "new-password"}
            placeholder={t(tab === "login" ? "auth.passwordPlaceholder" : "auth.newPasswordPlaceholder")}
            className={inputClass}
          />
        </div>
        {error && <p className="rounded-lg bg-destructive/10 p-3 text-sm text-destructive">{error}</p>}
        <button
          type="submit"
          disabled={submitting}
          className="w-full rounded-lg bg-crimson px-6 py-3 text-sm font-semibold text-white hover:bg-wine disabled:opacity-50"
        >
          {tab === "login"
            ? submitting ? t("auth.loggingIn") : t("auth.login")
            : submitting ? t("auth.creating") : t("auth.createAccount")}
        </button>
      </form>
    </>
  );
}

export default function SettingsPage() {
  const { t, i18n } = useTranslation();
  const { customer, loading, logout } = useCustomerStore();
  const [trackedCount, setTrackedCount] = useState(
    () => getSavedIds(MY_ORDERS_KEY).length + getSavedIds(MY_REPAIRS_KEY).length
  );

  const switchLang = (code: string) => {
    i18n.changeLanguage(code);
    try {
      localStorage.setItem("gje-lang", code);
    } catch {}
  };

  const clearTracking = () => {
    try {
      localStorage.removeItem(MY_ORDERS_KEY);
      localStorage.removeItem(MY_REPAIRS_KEY);
    } catch {}
    setTrackedCount(0);
  };

  return (
    <div className="mx-auto max-w-2xl space-y-4 px-4 py-8">
      <h1 className="text-2xl font-bold">{t("settings.title")}</h1>

      {loading ? null : customer ? (
        <section className="rounded-xl border border-border bg-card p-5">
          <div className="flex items-center gap-3">
            <span className="grid size-11 place-items-center rounded-full bg-navy text-base font-bold text-white">
              {customer.name.charAt(0).toUpperCase()}
            </span>
            <div className="min-w-0">
              <p className="truncate font-semibold">{customer.name}</p>
              <p className="text-sm text-muted-foreground">{customer.phone}</p>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 gap-2.5">
            <Link href="/track-order" className="flex items-center gap-2.5 rounded-lg border border-border px-3.5 py-3 text-sm font-medium hover:bg-muted">
              <Package className="size-4 text-crimson" />
              {t("auth.myOrders")}
            </Link>
            <Link href="/track-repair" className="flex items-center gap-2.5 rounded-lg border border-border px-3.5 py-3 text-sm font-medium hover:bg-muted">
              <Wrench className="size-4 text-crimson" />
              {t("auth.myRepairs")}
            </Link>
          </div>
        </section>
      ) : (
        <Section icon={User} title={t("auth.welcome")}>
          <AuthForm />
        </Section>
      )}

      <Section icon={Languages} title={t("settings.language")}>
        <div className="grid grid-cols-3 gap-2.5">
          {LANGUAGES.map((lang) => {
            const active = i18n.language === lang.code;
            return (
              <button
                key={lang.code}
                type="button"
                onClick={() => switchLang(lang.code)}
                aria-pressed={active}
                className={`relative flex flex-col items-center gap-1 rounded-xl border-2 px-2 py-3.5 transition-colors ${
                  active ? "border-crimson bg-accent" : "border-border hover:border-foreground/30"
                }`}
              >
                {active && <Check className="absolute right-2 top-2 size-4 text-crimson" />}
                <span className="text-2xl font-bold">{lang.sample}</span>
                <span className="text-sm font-medium">{lang.label}</span>
              </button>
            );
          })}
        </div>
      </Section>

      {customer && (
        <>
          <Section icon={User} title={t("settings.profile")}>
            <ProfileForm key={customer.id} customer={customer} />
          </Section>
          <Section icon={KeyRound} title={t("settings.password")}>
            <PasswordForm />
          </Section>
        </>
      )}

      <Section icon={History} title={t("settings.tracking")}>
        <div className="flex flex-wrap items-center justify-between gap-3">
          <p className="max-w-[48ch] text-sm text-muted-foreground">
            {trackedCount > 0 ? t("settings.trackingDesc", { count: trackedCount }) : t("settings.trackingNone")}
          </p>
          {trackedCount > 0 && (
          <button
            type="button"
            onClick={clearTracking}
            className="rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            {t("settings.clear")}
          </button>
          )}
        </div>
      </Section>

      <Section icon={LifeBuoy} title={t("settings.help")}>
        <div className="flex flex-wrap gap-2.5">
          <a href={`tel:${SHOP_PHONE.replace(/\s/g, "")}`} className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted">
            <Phone className="size-4 text-crimson" />
            {t("home.call")} {SHOP_PHONE}
          </a>
          <a
            href={`https://wa.me/${SHOP_WHATSAPP}`}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 rounded-lg border border-border px-4 py-2 text-sm font-medium hover:bg-muted"
          >
            <MessageCircle className="size-4 text-crimson" />
            {t("home.whatsapp")}
          </a>
        </div>
      </Section>

      {customer && (
        <button
          type="button"
          onClick={logout}
          className="flex w-full items-center justify-center gap-2 rounded-lg border border-border px-4 py-2.5 text-sm font-medium text-destructive hover:bg-destructive/5"
        >
          <LogOut className="size-4" />
          {t("settings.logout")}
        </button>
      )}
    </div>
  );
}

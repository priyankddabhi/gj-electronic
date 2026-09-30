"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Search, CheckCircle2, Circle, Clock, LogIn, CheckCircle, Home, Lock } from "lucide-react";
import { ORDER_STATUSES, SHOP_WHATSAPP } from "@/lib/constants";
import { useCustomerStore } from "@/store/customer";
import { MY_ORDERS_KEY, getSavedIds } from "@/lib/myTracking";
import PageHero from "@/components/PageHero";

interface Order {
  orderId: string;
  status: string;
  createdAt: string;
  limited?: boolean;
  items?: { name: string; quantity: number; price: number }[];
  total?: number;
}

async function fetchOrders(q: string): Promise<{ orders: Order[]; loginRequired: boolean }> {
  try {
    const res = await fetch(`/api/track?type=order&q=${encodeURIComponent(q)}`);
    if (res.status === 403) return { orders: [], loginRequired: true };
    const data = await res.json();
    return { orders: data.orders || [], loginRequired: false };
  } catch {
    return { orders: [], loginRequired: false };
  }
}

export default function TrackOrderPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">…</div>}>
      <TrackOrderContent />
    </Suspense>
  );
}

function TrackOrderContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id") || "";
  const isNew = searchParams.get("new") === "1";

  const { customer, loading: sessionLoading } = useCustomerStore();
  const [query, setQuery] = useState("");
  const [orders, setOrders] = useState<Order[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginRequired, setLoginRequired] = useState(false);

  // Auto-load every order this browser placed, plus all orders on the logged-in phone number
  useEffect(() => {
    if (sessionLoading) return;
    const queries = [...new Set([idParam, ...getSavedIds(MY_ORDERS_KEY), customer?.phone || ""].filter(Boolean))];
    Promise.all(queries.map(fetchOrders))
      .then((results) => {
        const byId = new Map(results.flatMap((r) => r.orders).map((o) => [o.orderId, o]));
        setOrders([...byId.values()].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
      })
      .finally(() => { setSearched(true); setLoading(false); });
  }, [sessionLoading, customer, idParam]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const result = await fetchOrders(query.trim());
    setOrders(result.orders);
    setLoginRequired(result.loginRequired);
    setSearched(true);
    setLoading(false);
  };

  const getStatusIndex = (status: string) =>
    ORDER_STATUSES.indexOf(status as (typeof ORDER_STATUSES)[number]);

  return (
    <>
    <PageHero eyebrow={t("rich.pTrack")} title={t("track.orderTitle")} />
    <div className="mx-auto max-w-2xl px-4 py-8">
      {isNew && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
          <CheckCircle className="mt-0.5 size-5 flex-shrink-0 text-green-600" />
          <div className="flex-1">
            <p className="font-semibold text-green-800 dark:text-green-300">{t("track.orderPlaced")}</p>
            <p className="mt-0.5 text-sm text-green-700 dark:text-green-400">{t("track.orderPlacedDesc")}</p>
          </div>
        </div>
      )}

      {customer ? (
        <p className="mb-4 text-sm text-muted-foreground">
          {t("track.showingFor")} <span className="font-medium text-foreground">{customer.name}</span> ({customer.phone})
        </p>
      ) : (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-4">
          <LogIn className="size-5 text-primary" />
          <p className="flex-1 text-sm font-medium">{t("track.loginToSeeOrders")}</p>
          <Link href="/settings" className="rounded-lg bg-primary px-4 py-2 text-xs font-medium text-primary-foreground">
            {t("auth.login")}
          </Link>
        </div>
      )}

      <form onSubmit={handleSearch} className="mb-8 flex gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={t("track.placeholderOrder")}
            className="w-full rounded-lg border border-input bg-background py-2.5 pl-10 pr-4 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
          />
        </div>
        <button
          type="submit"
          disabled={loading}
          className="rounded-lg bg-primary px-6 py-2.5 text-sm font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
        >
          {t("track.search")}
        </button>
      </form>

      {loading && <div className="py-10 text-center text-muted-foreground">{t("common.loading")}</div>}

      {!loading && loginRequired && (
        <div className="py-10 text-center text-muted-foreground">{t("track.phoneNeedsLogin")}</div>
      )}

      {searched && !loading && !loginRequired && orders.length === 0 && (
        <div className="py-10 text-center text-muted-foreground">{t("track.notFound")}</div>
      )}

      <div className="space-y-4">
        {orders.map((order) => {
          const currentIdx = getStatusIndex(order.status);
          const isThisNew = isNew && order.orderId === idParam;
          const whatsappMsg = encodeURIComponent(t("track.whatsappOrderMsg", { id: order.orderId }));

          return (
            <div key={order.orderId} className={`rounded-xl border p-6 ${isThisNew ? "border-green-300 dark:border-green-800" : "border-border"}`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">{t("checkout.orderId")}</p>
                  <p className="text-lg font-bold text-primary">{order.orderId}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {t(`track.status.${order.status}`)}
                </span>
              </div>

              <p className="mb-4 text-sm text-muted-foreground">
                {t("track.orderDate")}:{" "}
                <span className="font-medium text-foreground">{new Date(order.createdAt).toLocaleDateString()}</span>
              </p>

              {order.items ? (
                <div className="mb-4 space-y-1 rounded-lg bg-muted p-3">
                  <p className="text-xs font-medium text-muted-foreground">{t("track.items")}</p>
                  {order.items.map((item, i) => (
                    <div key={i} className="flex justify-between text-sm">
                      <span>{item.name} x{item.quantity}</span>
                      <span className="font-medium">{t("common.rupee")}{item.price * item.quantity}</span>
                    </div>
                  ))}
                  <div className="flex justify-between border-t border-border pt-1 text-sm font-bold">
                    <span>{t("track.total")}</span>
                    <span>{t("common.rupee")}{order.total}</span>
                  </div>
                </div>
              ) : (
                <p className="mb-4 flex items-start gap-2 rounded-lg bg-muted px-3 py-2.5 text-xs text-muted-foreground">
                  <Lock className="mt-px size-3.5 flex-shrink-0" />
                  {t("track.limitedNote")}
                </p>
              )}

              {isThisNew && (
                <div className="mb-4 flex flex-wrap gap-2">
                  <a
                    href={`https://wa.me/${SHOP_WHATSAPP}?text=${whatsappMsg}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="rounded-lg bg-[#25D366] px-4 py-2 text-xs font-medium text-white hover:bg-[#25D366]/90"
                  >
                    {t("track.sendToShop")}
                  </a>
                  <Link
                    href="/"
                    className="flex items-center gap-1.5 rounded-lg border border-border px-4 py-2 text-xs font-medium hover:bg-muted"
                  >
                    <Home className="size-3.5" />
                    {t("track.backHome")}
                  </Link>
                </div>
              )}

              <div className="space-y-0">
                {ORDER_STATUSES.map((status, idx) => {
                  const isDone = idx <= currentIdx;
                  const isCurrent = idx === currentIdx;
                  return (
                    <div key={status} className="flex gap-3">
                      <div className="flex flex-col items-center">
                        {isDone ? (
                          <CheckCircle2 className={`size-5 flex-shrink-0 ${isCurrent ? "text-crimson" : "text-foreground"}`} />
                        ) : (
                          <Circle className="size-5 flex-shrink-0 text-muted-foreground/30" />
                        )}
                        {idx < ORDER_STATUSES.length - 1 && (
                          <div className={`my-1 h-6 w-0.5 ${idx < currentIdx ? "bg-foreground" : "bg-muted"}`} />
                        )}
                      </div>
                      <div className="pb-4">
                        <p className={`text-sm font-medium ${isDone ? "text-foreground" : "text-muted-foreground"}`}>
                          {t(`track.status.${status}`)}
                        </p>
                        {isCurrent && (
                          <p className="flex items-center gap-1 text-xs text-primary">
                            <Clock className="size-3" />
                            {t("track.currentStatus")}
                          </p>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          );
        })}
      </div>
    </div>
    </>
  );
}

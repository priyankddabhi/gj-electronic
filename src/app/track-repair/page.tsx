"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { useTranslation } from "react-i18next";
import { Search, CheckCircle2, Circle, Clock, LogIn, CheckCircle, Home, Lock } from "lucide-react";
import { REPAIR_STATUSES, SHOP_WHATSAPP } from "@/lib/constants";
import { useCustomerStore } from "@/store/customer";
import { MY_REPAIRS_KEY, getSavedIds } from "@/lib/myTracking";

interface Repair {
  trackingId: string;
  status: string;
  createdAt: string;
  limited?: boolean;
  deviceType?: string;
  problemDescription?: string;
  estimatedCost?: number | null;
  diagnosisNotes?: string;
}

async function fetchRepairs(q: string): Promise<{ repairs: Repair[]; loginRequired: boolean }> {
  try {
    const res = await fetch(`/api/track?type=repair&q=${encodeURIComponent(q)}`);
    if (res.status === 403) return { repairs: [], loginRequired: true };
    const data = await res.json();
    return { repairs: data.repairs || [], loginRequired: false };
  } catch {
    return { repairs: [], loginRequired: false };
  }
}

export default function TrackRepairPage() {
  return (
    <Suspense fallback={<div className="py-20 text-center text-muted-foreground">…</div>}>
      <TrackRepairContent />
    </Suspense>
  );
}

function TrackRepairContent() {
  const { t } = useTranslation();
  const searchParams = useSearchParams();
  const idParam = searchParams.get("id") || "";
  const isNew = searchParams.get("new") === "1";

  const { customer, loading: sessionLoading } = useCustomerStore();
  const [query, setQuery] = useState("");
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [searched, setSearched] = useState(false);
  const [loading, setLoading] = useState(true);
  const [loginRequired, setLoginRequired] = useState(false);

  // Auto-load every repair this browser booked, plus all repairs on the logged-in phone number
  useEffect(() => {
    if (sessionLoading) return;
    const queries = [...new Set([idParam, ...getSavedIds(MY_REPAIRS_KEY), customer?.phone || ""].filter(Boolean))];
    Promise.all(queries.map(fetchRepairs))
      .then((results) => {
        const byId = new Map(results.flatMap((r) => r.repairs).map((r) => [r.trackingId, r]));
        setRepairs([...byId.values()].sort((a, b) => +new Date(b.createdAt) - +new Date(a.createdAt)));
      })
      .finally(() => { setSearched(true); setLoading(false); });
  }, [sessionLoading, customer, idParam]);

  const handleSearch = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!query.trim()) return;
    setLoading(true);
    const result = await fetchRepairs(query.trim());
    setRepairs(result.repairs);
    setLoginRequired(result.loginRequired);
    setSearched(true);
    setLoading(false);
  };

  const getStatusIndex = (status: string) =>
    REPAIR_STATUSES.indexOf(status as (typeof REPAIR_STATUSES)[number]);

  return (
    <div className="mx-auto max-w-2xl px-4 py-8">
      {isNew && (
        <div className="mb-6 flex items-start gap-3 rounded-xl border border-green-200 bg-green-50 p-4 dark:border-green-900 dark:bg-green-950/30">
          <CheckCircle className="mt-0.5 size-5 flex-shrink-0 text-green-600" />
          <div className="flex-1">
            <p className="font-semibold text-green-800 dark:text-green-300">{t("track.repairBooked")}</p>
            <p className="mt-0.5 text-sm text-green-700 dark:text-green-400">{t("track.repairBookedDesc")}</p>
          </div>
        </div>
      )}

      <h1 className="mb-4 text-2xl font-bold">{t("track.repairTitle")}</h1>

      {customer ? (
        <p className="mb-4 text-sm text-muted-foreground">
          {t("track.showingFor")} <span className="font-medium text-foreground">{customer.name}</span> ({customer.phone})
        </p>
      ) : (
        <div className="mb-6 flex items-center gap-3 rounded-lg border border-border bg-muted/50 p-4">
          <LogIn className="size-5 text-primary" />
          <p className="flex-1 text-sm font-medium">{t("track.loginToSeeRepairs")}</p>
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
            placeholder={t("track.placeholderRepair")}
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

      {searched && !loading && !loginRequired && repairs.length === 0 && (
        <div className="py-10 text-center text-muted-foreground">{t("track.notFound")}</div>
      )}

      <div className="space-y-4">
        {repairs.map((repair) => {
          const currentIdx = getStatusIndex(repair.status);
          const isThisNew = isNew && repair.trackingId === idParam;
          const whatsappMsg = encodeURIComponent(t("track.whatsappRepairMsg", { id: repair.trackingId }));

          return (
            <div key={repair.trackingId} className={`rounded-xl border p-6 ${isThisNew ? "border-green-300 dark:border-green-800" : "border-border"}`}>
              <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                <div>
                  <p className="text-xs text-muted-foreground">{t("repair.trackingId")}</p>
                  <p className="text-lg font-bold text-primary">{repair.trackingId}</p>
                </div>
                <span className="rounded-full bg-primary/10 px-3 py-1 text-xs font-semibold text-primary">
                  {t(`track.status.${repair.status}`)}
                </span>
              </div>

              <div className="mb-6 grid gap-3 text-sm sm:grid-cols-2">
                {repair.deviceType && (
                  <div>
                    <span className="text-muted-foreground">{t("track.device")}:</span>{" "}
                    <span className="font-medium">{t(`repair.devices.${repair.deviceType}`)}</span>
                  </div>
                )}
                <div>
                  <span className="text-muted-foreground">{t("track.repairDate")}:</span>{" "}
                  <span className="font-medium">{new Date(repair.createdAt).toLocaleDateString()}</span>
                </div>
                {repair.problemDescription && (
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">{t("track.problem")}:</span>{" "}
                    <span className="font-medium">{repair.problemDescription}</span>
                  </div>
                )}
                {repair.estimatedCost != null && (
                  <div>
                    <span className="text-muted-foreground">{t("track.estimatedCost")}:</span>{" "}
                    <span className="font-medium">{t("common.rupee")}{repair.estimatedCost}</span>
                  </div>
                )}
                {repair.diagnosisNotes && (
                  <div className="sm:col-span-2">
                    <span className="text-muted-foreground">{t("track.notes")}:</span>{" "}
                    <span className="font-medium">{repair.diagnosisNotes}</span>
                  </div>
                )}
                {repair.limited && (
                  <p className="flex items-start gap-2 rounded-lg bg-muted px-3 py-2.5 text-xs text-muted-foreground sm:col-span-2">
                    <Lock className="mt-px size-3.5 flex-shrink-0" />
                    {t("track.limitedNote")}
                  </p>
                )}
              </div>

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
                {REPAIR_STATUSES.map((status, idx) => {
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
                        {idx < REPAIR_STATUSES.length - 1 && (
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
  );
}

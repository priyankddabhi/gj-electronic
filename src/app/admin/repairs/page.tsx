"use client";

import { useEffect, useState } from "react";
import Image from "next/image";
import { MessageCircle, ChevronDown, ChevronUp, ImageOff, Zap, Store, Trash2 } from "lucide-react";
import { REPAIR_STATUSES } from "@/lib/constants";
import { useShopInfo } from "@/lib/shopInfo";

interface Electrician {
  _id: string;
  name: string;
  phone: string;
  skills: string[];
  active: boolean;
}

interface Repair {
  _id: string;
  trackingId: string;
  customerName: string;
  phone: string;
  deviceType: string;
  problemDescription: string;
  preferredDate?: string;
  status: string;
  repairMethod: "electrician-visit" | "shop-repair" | null;
  electricianName: string;
  electricianPhone: string;
  estimatedPickupTime: string;
  estimatedCost: number | null;
  diagnosisNotes: string;
  paymentStatus: string;
  images?: string[];
  createdAt: string;
}

// "ready" is stored in DB but shown everywhere as "Dispatch"
const statusLabel = (s: string) =>
  s === "ready" ? "Dispatch" : s.charAt(0).toUpperCase() + s.slice(1);

const STATUSES = REPAIR_STATUSES as readonly string[];

// Customer's preferred visit/drop-off: "2026-10-05" or "2026-10-05 · Morning (10 AM – 1 PM)" → "5 Oct 2026 · Morning (10 AM – 1 PM)"
function formatPreferred(v: string) {
  const m = /^(\d{4})-(\d{2})-(\d{2})(.*)$/.exec(v.trim());
  if (!m) return v;
  const d = new Date(Number(m[1]), Number(m[2]) - 1, Number(m[3]));
  return d.toLocaleDateString("en-IN", { day: "numeric", month: "short", year: "numeric" }) + m[4];
}

interface ReviewDraft {
  method: Repair["repairMethod"];
  elecId: string;
  date: string;
  time: string;
  cost: string;
  notes: string;
}

const MONTHS = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];

// Pickup time is stored as readable text, e.g. "05 Oct 2026, 10:30 AM"
function formatPickup(date: string, time: string) {
  const parts: string[] = [];
  if (date) {
    const [y, m, d] = date.split("-");
    parts.push(`${d} ${MONTHS[Number(m) - 1]} ${y}`);
  }
  if (time) {
    const [h, min] = time.split(":").map(Number);
    parts.push(`${h % 12 || 12}:${String(min).padStart(2, "0")} ${h >= 12 ? "PM" : "AM"}`);
  }
  return parts.join(", ");
}

function parsePickup(text: string) {
  const m = /^(\d{1,2}) (\w{3}) (\d{4})(?:, (\d{1,2}):(\d{2}) (AM|PM))?$/.exec(text.trim());
  if (!m) return { date: "", time: "" };
  const mi = MONTHS.indexOf(m[2]);
  if (mi < 0) return { date: "", time: "" };
  const date = `${m[3]}-${String(mi + 1).padStart(2, "0")}-${m[1].padStart(2, "0")}`;
  if (!m[4]) return { date, time: "" };
  const h = (Number(m[4]) % 12) + (m[6] === "PM" ? 12 : 0);
  return { date, time: `${String(h).padStart(2, "0")}:${m[5]}` };
}

export default function AdminRepairsPage() {
  const shop = useShopInfo();
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [electricians, setElectricians] = useState<Electrician[]>([]);
  const [drafts, setDrafts] = useState<Record<string, ReviewDraft>>({});
  const [saving, setSaving] = useState<Record<string, boolean>>({});
  const [selected, setSelected] = useState<string[]>([]);

  const loadRepairs = () => {
    setLoading(true);
    fetch("/api/repairs")
      .then((r) => r.json())
      .then((data) => setRepairs(data.repairs || []))
      .finally(() => setLoading(false));
  };

  useEffect(loadRepairs, []);

  useEffect(() => {
    fetch("/api/electricians")
      .then((r) => r.json())
      .then((data) => Array.isArray(data) && setElectricians(data));
  }, []);

  const updateRepair = async (id: string, updates: Record<string, unknown>, key?: string): Promise<boolean> => {
    if (key) setSaving((s) => ({ ...s, [key]: true }));
    try {
      const res = await fetch(`/api/repairs/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({})) as { error?: string };
        alert(`Could not save: ${err.error || res.statusText}`);
        return false;
      }
      const saved: Repair = await res.json();
      setRepairs((prev) => prev.map((r) => (r._id === id ? { ...r, ...saved } : r)));
      return true;
    } catch (e) {
      alert(`Request failed — check your connection. (${e})`);
      return false;
    } finally {
      if (key) setSaving((s) => ({ ...s, [key]: false }));
    }
  };

  const startReview = (r: Repair) => {
    const { date, time } = parsePickup(r.estimatedPickupTime || "");
    const elec = electricians.find((e) => e.name === r.electricianName && e.phone === r.electricianPhone);
    setDrafts((d) => ({
      ...d,
      [r._id]: {
        method: r.repairMethod,
        elecId: elec?._id ?? "",
        date,
        time,
        cost: r.estimatedCost == null ? "" : String(r.estimatedCost),
        notes: r.diagnosisNotes || "",
      },
    }));
  };
  const patchDraft = (id: string, patch: Partial<ReviewDraft>) =>
    setDrafts((d) => ({ ...d, [id]: { ...d[id], ...patch } }));
  const closeReview = (id: string) =>
    setDrafts((d) => {
      const rest = { ...d };
      delete rest[id];
      return rest;
    });

  const saveReview = async (r: Repair) => {
    const d = drafts[r._id];
    if (!d.method) return alert("Choose Electrician Visit or Shop Repair first.");
    const updates: Record<string, unknown> = {
      repairMethod: d.method,
      estimatedCost: d.cost.trim() === "" ? null : Number(d.cost),
      diagnosisNotes: d.notes,
    };
    if (d.method === "electrician-visit") {
      const elec = electricians.find((e) => e._id === d.elecId);
      if (elec) Object.assign(updates, { electricianName: elec.name, electricianPhone: elec.phone });
    } else {
      updates.estimatedPickupTime = formatPickup(d.date, d.time);
    }
    if (await updateRepair(r._id, updates, `rv-${r._id}`)) closeReview(r._id);
  };

  const filtered = filter === "all" ? repairs : repairs.filter((r) => r.status === filter);
  const visibleSelected = selected.filter((id) => filtered.some((r) => r._id === id));
  const allSelected = filtered.length > 0 && visibleSelected.length === filtered.length;
  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const deleteSelected = async () => {
    const ids = visibleSelected;
    if (!confirm(`Delete ${ids.length} selected repair(s)?`)) return;
    if (!confirm(`This will PERMANENTLY delete ${ids.length} repair(s). This cannot be undone. Continue?`)) return;
    const results = await Promise.all(
      ids.map(async (id) => ({ id, ok: (await fetch(`/api/repairs/${id}`, { method: "DELETE" })).ok }))
    );
    const deleted = results.filter((r) => r.ok).map((r) => r.id);
    setRepairs((prev) => prev.filter((r) => !deleted.includes(r._id)));
    setSelected((prev) => prev.filter((id) => !deleted.includes(id)));
    if (deleted.length < results.length)
      alert(`${results.length - deleted.length} repair(s) could not be deleted. Please try again.`);
  };

  return (
    <div>
      {/* Heading left, status filters right (one scrollable row on phones) */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-bold">Repairs</h1>
        <div className="-mx-1 flex gap-1.5 overflow-x-auto px-1 pb-1 lg:flex-wrap lg:justify-end lg:pb-0">
          {["all", ...STATUSES].map((s) => (
            <button
              type="button"
              key={s}
              onClick={() => setFilter(s)}
              className={`shrink-0 whitespace-nowrap rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
                filter === s ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {s === "all" ? "All" : statusLabel(s)}
              <span className="ml-1">({s === "all" ? repairs.length : repairs.filter((r) => r.status === s).length})</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">No repairs</div>
      ) : (
        <>
        {visibleSelected.length > 0 && (
          <div className="mb-2 flex flex-wrap items-center gap-3 rounded-lg border border-destructive/30 bg-destructive/5 px-3 py-2 text-sm">
            <span className="font-medium">{visibleSelected.length} selected</span>
            <button
              type="button"
              onClick={deleteSelected}
              className="flex items-center gap-1.5 rounded border border-destructive/40 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
            >
              <Trash2 className="size-3.5" /> Delete selected
            </button>
            <button type="button" onClick={() => setSelected([])} className="text-xs text-muted-foreground hover:underline">
              Clear
            </button>
          </div>
        )}
        <div className="overflow-hidden rounded-xl border border-border">
          {/* Column header */}
          <div className="flex items-center gap-3 border-b border-border bg-muted/50 px-3 py-2.5 text-xs font-medium text-muted-foreground">
            <input
              type="checkbox"
              aria-label="Select all repairs"
              checked={allSelected}
              onChange={(e) => setSelected(e.target.checked ? filtered.map((r) => r._id) : [])}
            />
            <span className="flex-1">Repair</span>
            <span className="w-[5.5rem] text-right sm:w-44">Status · Payment</span>
            <span className="w-6" />
          </div>

          {filtered.map((repair) => {
            const currentIdx = STATUSES.indexOf(repair.status);
            // Cycle: next wraps back to 0 after last status
            const nextStatus = STATUSES[(currentIdx + 1) % STATUSES.length];
            const open = expanded === repair._id;
            const isSel = selected.includes(repair._id);

            return (
              <div key={repair._id} className={`border-b border-border last:border-0 ${isSel ? "bg-muted/40" : ""}`}>

                {/* Summary row: left = ID + device, right = status + payment */}
                <div className="flex items-center gap-3 px-3 py-2.5">
                  <input
                    type="checkbox"
                    aria-label={`Select ${repair.trackingId}`}
                    checked={isSel}
                    onChange={() => toggle(repair._id)}
                  />

                  <button
                    type="button"
                    onClick={() => setExpanded(open ? null : repair._id)}
                    className="min-w-0 flex-1 text-left"
                  >
                    <div className="flex items-baseline gap-2">
                      <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-primary">{repair.trackingId}</span>
                      <span className="truncate text-xs text-muted-foreground">{repair.customerName}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-2 gap-y-1 text-sm">
                      <span className="truncate capitalize">{repair.deviceType}</span>
                      {repair.estimatedCost !== null && (
                        <span className="font-medium tabular-nums">₹{repair.estimatedCost.toLocaleString("en-IN")}</span>
                      )}
                    </div>
                  </button>

                  <div className="flex w-[5.5rem] flex-col items-end gap-1 sm:w-44 sm:flex-row sm:items-center sm:justify-end sm:gap-1.5">
                    {/* Status badge — click to advance, cycles back after Delivered */}
                    <button
                      type="button"
                      title={`Click to mark as ${statusLabel(nextStatus)}`}
                      onClick={() => updateRepair(repair._id, { status: nextStatus })}
                      className={`rounded px-2 py-1 text-xs font-semibold transition-colors ${
                        repair.status === "applied" ? "bg-amber-500/15 text-amber-600 hover:bg-amber-500/25" :
                        repair.status === "delivered" ? "bg-green-500/15 text-green-600 hover:bg-green-500/25" :
                        "bg-blue-500/15 text-blue-600 hover:bg-blue-500/25"
                      }`}
                    >
                      {statusLabel(repair.status)}
                    </button>
                    <button
                      type="button"
                      onClick={() => updateRepair(repair._id, { paymentStatus: repair.paymentStatus === "paid" ? "unpaid" : "paid" })}
                      className={`rounded px-2 py-1 text-xs font-medium ${repair.paymentStatus === "paid" ? "bg-green-500/10 text-green-600" : "bg-accent text-wine"}`}
                    >
                      {repair.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                    </button>
                  </div>

                  <button
                    type="button"
                    aria-label={open ? "Collapse" : "Expand"}
                    onClick={() => setExpanded(open ? null : repair._id)}
                    className="w-6 rounded p-1 text-muted-foreground hover:bg-muted"
                  >
                    {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </button>
                </div>

                {/* Expanded details */}
                {open && (
                  <div className="border-t border-border bg-muted/30 px-3 py-3 text-sm space-y-4 sm:pl-10">

                    {/* Customer info */}
                    <div className="grid gap-2 sm:grid-cols-2">
                      <div><span className="text-muted-foreground">Phone:</span> <a href={`tel:${repair.phone}`} className="font-medium hover:underline">{repair.phone}</a></div>
                      <div><span className="text-muted-foreground">Device:</span> {repair.deviceType}</div>
                      <div><span className="text-muted-foreground">Booked:</span> {new Date(repair.createdAt).toLocaleString()}</div>
                      {repair.preferredDate && (
                        <div><span className="text-muted-foreground">Preferred:</span> <span className="font-medium">{formatPreferred(repair.preferredDate)}</span></div>
                      )}
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground">Problem:</span>{" "}
                        <span className="font-medium">{repair.problemDescription}</span>
                      </div>
                      {repair.diagnosisNotes && (
                        <div className="sm:col-span-2">
                          <span className="text-muted-foreground">Notes:</span> {repair.diagnosisNotes}
                        </div>
                      )}
                    </div>

                    {/* Customer photos */}
                    {repair.images && repair.images.length > 0 ? (
                      <div>
                        <p className="mb-1.5 text-xs font-medium text-muted-foreground">Customer photos</p>
                        <div className="flex flex-wrap gap-2">
                          {repair.images.map((url) => (
                            <a key={url} href={url} target="_blank" rel="noopener noreferrer"
                              className="relative block size-20 overflow-hidden rounded-lg border border-border hover:opacity-80 transition-opacity">
                              <Image src={url} alt="repair photo" fill className="object-cover" />
                            </a>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
                        <ImageOff className="size-3.5" /> No photos uploaded
                      </div>
                    )}

                    {/* Admin Review: fill in, press Save once, then it is locked until Change */}
                    {(() => {
                      const draft = drafts[repair._id];
                      const editing = !!draft || !repair.repairMethod;
                      const input = "w-full rounded border border-input bg-background px-2 py-1.5 text-sm";
                      const methodLabel = repair.repairMethod === "electrician-visit" ? "Electrician Visit" : "Shop Repair / Pickup";
                      const pickMethod = (value: "electrician-visit" | "shop-repair") => {
                        if (!draft) startReview(repair);
                        patchDraft(repair._id, { method: value });
                      };
                      return (
                        <div className="rounded-lg border border-border bg-background p-3 space-y-3">
                          <div className="flex items-center justify-between gap-2">
                            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">Admin Review</p>
                            {!editing && (
                              <button
                                type="button"
                                onClick={() => startReview(repair)}
                                className="rounded border border-border px-3 py-1 text-xs font-medium hover:bg-muted"
                              >
                                Change
                              </button>
                            )}
                          </div>

                          {!editing ? (
                            <div className="space-y-1.5">
                              <div className="grid gap-1.5 sm:grid-cols-2">
                                <div><span className="text-muted-foreground">Method:</span> <span className="font-medium">{methodLabel}</span></div>
                                {repair.repairMethod === "electrician-visit" ? (
                                  <div>
                                    <span className="text-muted-foreground">Electrician:</span>{" "}
                                    <span className="font-medium">{repair.electricianName ? `${repair.electricianName} · ${repair.electricianPhone}` : "Not assigned"}</span>
                                  </div>
                                ) : (
                                  <div>
                                    <span className="text-muted-foreground">Pickup / Drop-off:</span>{" "}
                                    <span className="font-medium">{repair.estimatedPickupTime || "Not set"}</span>
                                  </div>
                                )}
                                <div><span className="text-muted-foreground">Estimated cost:</span> <span className="font-medium">{repair.estimatedCost == null ? "Not set" : `₹${repair.estimatedCost}`}</span></div>
                                <div><span className="text-muted-foreground">Notes:</span> <span className="font-medium">{repair.diagnosisNotes || "None"}</span></div>
                              </div>
                              <p className="text-xs text-green-700 dark:text-green-400">Saved — the customer can see this on Track Repair.</p>
                            </div>
                          ) : (
                            <>
                              <div className="flex gap-2">
                                {([
                                  ["electrician-visit", Zap, "Electrician Visit"],
                                  ["shop-repair", Store, "Shop Repair / Pickup"],
                                ] as const).map(([value, Icon, label]) => (
                                  <button
                                    key={value}
                                    type="button"
                                    onClick={() => pickMethod(value)}
                                    className={`flex flex-1 items-center justify-center gap-2 rounded-lg border py-2.5 text-xs font-semibold transition-colors ${
                                      draft?.method === value ? "border-primary bg-primary/10 text-primary" : "border-border hover:bg-muted"
                                    }`}
                                  >
                                    <Icon className="size-4" /> {label}
                                  </button>
                                ))}
                              </div>

                              {!draft && <p className="text-xs text-muted-foreground">Choose how this repair will be done.</p>}

                              {draft && draft.method === "electrician-visit" && (
                                <div>
                                  <label className="mb-1 block text-xs text-muted-foreground">Assign Electrician</label>
                                  {electricians.filter((e) => e.active).length === 0 ? (
                                    <p className="text-xs text-muted-foreground">
                                      No active electricians —{" "}
                                      <a href="/admin/electricians" className="underline text-primary">add one first</a>.
                                    </p>
                                  ) : (
                                    <select
                                      value={draft.elecId}
                                      onChange={(e) => patchDraft(repair._id, { elecId: e.target.value })}
                                      className={input}
                                    >
                                      <option value="">Select electrician…</option>
                                      {electricians.filter((e) => e.active).map((e) => (
                                        <option key={e._id} value={e._id}>{e.name} — {e.phone}</option>
                                      ))}
                                    </select>
                                  )}
                                  <p className="mt-1 text-xs text-muted-foreground">Name + phone will be shown to the customer.</p>
                                </div>
                              )}

                              {draft && draft.method === "shop-repair" && (
                                <div>
                                  <label className="mb-1 block text-xs text-muted-foreground">Expected Pickup / Drop-off (date and time)</label>
                                  <div className="grid grid-cols-2 gap-2">
                                    <input
                                      type="date"
                                      value={draft.date}
                                      onChange={(e) => patchDraft(repair._id, { date: e.target.value })}
                                      className={input}
                                    />
                                    <input
                                      type="time"
                                      value={draft.time}
                                      onChange={(e) => patchDraft(repair._id, { time: e.target.value })}
                                      className={input}
                                    />
                                  </div>
                                </div>
                              )}

                              {draft && (
                                <>
                                  <div className="grid gap-2 sm:grid-cols-2">
                                    <div>
                                      <label className="mb-1 block text-xs text-muted-foreground">Estimated Cost (₹)</label>
                                      <input
                                        type="number"
                                        value={draft.cost}
                                        onChange={(e) => patchDraft(repair._id, { cost: e.target.value })}
                                        className={input}
                                        placeholder="0"
                                      />
                                    </div>
                                    <div>
                                      <label className="mb-1 block text-xs text-muted-foreground">Diagnosis Notes</label>
                                      <input
                                        value={draft.notes}
                                        onChange={(e) => patchDraft(repair._id, { notes: e.target.value })}
                                        className={input}
                                        placeholder="Add notes..."
                                      />
                                    </div>
                                  </div>
                                  <div className="flex justify-end gap-2">
                                    {repair.repairMethod && (
                                      <button
                                        type="button"
                                        onClick={() => closeReview(repair._id)}
                                        className="rounded border border-border px-4 py-1.5 text-xs font-medium hover:bg-muted"
                                      >
                                        Cancel
                                      </button>
                                    )}
                                    <button
                                      type="button"
                                      disabled={saving[`rv-${repair._id}`]}
                                      onClick={() => saveReview(repair)}
                                      className="rounded bg-primary px-5 py-1.5 text-xs font-medium text-primary-foreground hover:bg-primary/90 disabled:opacity-50"
                                    >
                                      {saving[`rv-${repair._id}`] ? "Saving…" : "Save"}
                                    </button>
                                  </div>
                                </>
                              )}
                            </>
                          )}
                        </div>
                      );
                    })()}

                    <a
                      href={`https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(
                        `Repair ${repair.trackingId} for ${repair.customerName}: status is "${statusLabel(repair.status)}".${repair.estimatedCost ? ` Est. cost: ₹${repair.estimatedCost}.` : ""}`
                      )}`}
                      target="_blank" rel="noopener noreferrer"
                      className="inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#25D366]/90"
                    >
                      <MessageCircle className="size-3.5" /> WhatsApp
                    </a>
                  </div>
                )}
              </div>
            );
          })}
        </div>
        </>
      )}
    </div>
  );
}

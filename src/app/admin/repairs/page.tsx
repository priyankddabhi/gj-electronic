"use client";

import { useEffect, useState } from "react";
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { REPAIR_STATUSES, SHOP_WHATSAPP } from "@/lib/constants";

interface Repair {
  _id: string;
  trackingId: string;
  customerName: string;
  phone: string;
  deviceType: string;
  problemDescription: string;
  status: string;
  estimatedCost: number | null;
  diagnosisNotes: string;
  paymentStatus: string;
  createdAt: string;
}

export default function AdminRepairsPage() {
  const [repairs, setRepairs] = useState<Repair[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [editCost, setEditCost] = useState<Record<string, string>>({});
  const [editNotes, setEditNotes] = useState<Record<string, string>>({});

  const loadRepairs = () => {
    setLoading(true);
    fetch("/api/repairs")
      .then((r) => r.json())
      .then((data) => setRepairs(data.repairs || []))
      .finally(() => setLoading(false));
  };

  useEffect(loadRepairs, []);

  const updateRepair = async (id: string, updates: Record<string, unknown>) => {
    const res = await fetch(`/api/repairs/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      alert("Could not update the repair. Please try again.");
      return;
    }
    const saved: Repair = await res.json();
    setRepairs((prev) => prev.map((r) => (r._id === id ? { ...r, ...saved } : r)));
  };

  const filtered =
    filter === "all" ? repairs : repairs.filter((r) => r.status === filter);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Repairs</h1>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {["all", ...REPAIR_STATUSES].map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium transition-colors ${
              filter === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground hover:text-foreground"
            }`}
          >
            {s === "all" ? "All" : s.charAt(0).toUpperCase() + s.slice(1)}
            {s !== "all" && (
              <span className="ml-1">
                ({repairs.filter((r) => r.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-10 text-center text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">No repairs</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((repair) => (
            <div key={repair._id} className="rounded-lg border border-border">
              {/* Compact summary row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
                <span className="font-semibold text-primary text-sm">
                  {repair.trackingId}
                </span>
                <span className="text-sm text-muted-foreground">
                  {repair.customerName}
                </span>
                <span className="text-sm">{repair.deviceType}</span>
                {repair.estimatedCost !== null && (
                  <span className="text-sm font-medium tabular-nums">
                    ₹{repair.estimatedCost.toLocaleString("en-IN")}
                  </span>
                )}

                {/* Inline controls */}
                <div className="flex items-center gap-2 ml-auto">
                  <select
                    value={repair.status}
                    onChange={(e) =>
                      updateRepair(repair._id, { status: e.target.value })
                    }
                    className="rounded border border-input bg-background px-2 py-1 text-xs"
                  >
                    {REPAIR_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() =>
                      updateRepair(repair._id, {
                        paymentStatus:
                          repair.paymentStatus === "paid" ? "unpaid" : "paid",
                      })
                    }
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      repair.paymentStatus === "paid"
                        ? "bg-green-500/10 text-green-600"
                        : "bg-accent text-wine"
                    }`}
                  >
                    {repair.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                  </button>

                  <a
                    href={`https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(
                      `Repair ${repair.trackingId} update for ${repair.customerName}: Your ${repair.deviceType} repair status is "${repair.status}".${
                        repair.estimatedCost
                          ? ` Estimated cost: ₹${repair.estimatedCost}.`
                          : ""
                      }`
                    )}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex items-center gap-1 rounded bg-[#25D366] px-2 py-1 text-xs font-medium text-white"
                  >
                    <MessageCircle className="size-3" />
                    <span className="hidden sm:inline">WA</span>
                  </a>

                  <button
                    onClick={() =>
                      setExpanded(expanded === repair._id ? null : repair._id)
                    }
                    className="rounded p-1 text-muted-foreground hover:bg-muted"
                  >
                    {expanded === repair._id ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {expanded === repair._id && (
                <div className="border-t border-border bg-muted/30 p-3 text-sm">
                  <div className="mb-3 grid gap-2 sm:grid-cols-2">
                    <div>
                      <span className="text-muted-foreground">Phone:</span> {repair.phone}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Device:</span> {repair.deviceType}
                    </div>
                    <div className="sm:col-span-2">
                      <span className="text-muted-foreground">Problem:</span>{" "}
                      {repair.problemDescription}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Date:</span>{" "}
                      {new Date(repair.createdAt).toLocaleString()}
                    </div>
                    {repair.diagnosisNotes && (
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground">Notes:</span>{" "}
                        {repair.diagnosisNotes}
                      </div>
                    )}
                  </div>

                  <div className="grid gap-3 sm:grid-cols-2">
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">
                        Estimated Cost (₹)
                      </label>
                      <div className="flex gap-2">
                        <input
                          type="number"
                          value={editCost[repair._id] ?? repair.estimatedCost ?? ""}
                          onChange={(e) =>
                            setEditCost({ ...editCost, [repair._id]: e.target.value })
                          }
                          className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
                          placeholder="0"
                        />
                        <button
                          onClick={() =>
                            updateRepair(repair._id, {
                              estimatedCost: Number(editCost[repair._id]),
                            })
                          }
                          className="rounded bg-muted px-3 py-1 text-xs hover:bg-muted/80"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                    <div>
                      <label className="mb-1 block text-xs text-muted-foreground">
                        Diagnosis Notes
                      </label>
                      <div className="flex gap-2">
                        <input
                          value={editNotes[repair._id] ?? repair.diagnosisNotes ?? ""}
                          onChange={(e) =>
                            setEditNotes({ ...editNotes, [repair._id]: e.target.value })
                          }
                          className="w-full rounded border border-input bg-background px-2 py-1 text-sm"
                          placeholder="Add notes..."
                        />
                        <button
                          onClick={() =>
                            updateRepair(repair._id, {
                              diagnosisNotes: editNotes[repair._id],
                            })
                          }
                          className="rounded bg-muted px-3 py-1 text-xs hover:bg-muted/80"
                        >
                          Save
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

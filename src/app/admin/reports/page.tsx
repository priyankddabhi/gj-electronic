"use client";

import { useEffect, useState } from "react";
import { MessageCircle, ChevronDown, ChevronUp, Trash2, Inbox } from "lucide-react";

interface Report {
  _id: string;
  name: string;
  phone: string;
  type: "complaint" | "query" | "report";
  message: string;
  refId: string;
  status: "new" | "read" | "resolved";
  createdAt: string;
}

const STATUSES = ["new", "read", "resolved"] as const;
const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
const nextOf = (s: string) => STATUSES[(STATUSES.indexOf(s as (typeof STATUSES)[number]) + 1) % STATUSES.length];
const statusClass: Record<string, string> = {
  new: "bg-amber-500/15 text-amber-600 hover:bg-amber-500/25",
  read: "bg-blue-500/15 text-blue-600 hover:bg-blue-500/25",
  resolved: "bg-green-500/15 text-green-600 hover:bg-green-500/25",
};

export default function AdminReportsPage() {
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    fetch("/api/reports")
      .then((r) => r.json())
      .then((data) => setReports(data.reports || []))
      .finally(() => setLoading(false));
  }, []);

  const failed = async (res: Response, action: string) => {
    if (res.ok) return false;
    const err = (await res.json().catch(() => ({}))) as { error?: string };
    alert(`Could not ${action}: ${err.error || res.statusText}`);
    return true;
  };

  const setStatus = async (id: string, status: string) => {
    try {
      const res = await fetch(`/api/reports/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status }),
      });
      if (await failed(res, "update status")) return;
      const saved: Report = await res.json();
      setReports((prev) => prev.map((r) => (r._id === id ? saved : r)));
    } catch (e) {
      alert(`Request failed — check your connection. (${e})`);
    }
  };

  const open = (r: Report) => {
    const opening = expanded !== r._id;
    setExpanded(opening ? r._id : null);
    if (opening && r.status === "new") setStatus(r._id, "read");
  };

  const remove = async (r: Report) => {
    if (!confirm(`Delete this ${r.type} from ${r.name}? This cannot be undone.`)) return;
    try {
      const res = await fetch(`/api/reports/${r._id}`, { method: "DELETE" });
      if (await failed(res, "delete")) return;
      setReports((prev) => prev.filter((x) => x._id !== r._id));
      setExpanded(null);
    } catch (e) {
      alert(`Delete failed: ${e}`);
    }
  };

  const filtered = filter === "all" ? reports : reports.filter((r) => r.status === filter);

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-bold">Reports / Queries</h1>
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
              {s === "all" ? "All" : label(s)}
              <span className="ml-1">({s === "all" ? reports.length : reports.filter((r) => r.status === s).length})</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center">
          <Inbox className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="text-muted-foreground">No reports or queries</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r._id} className="rounded-lg border border-border">
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
                <span className={`text-sm ${r.status === "new" ? "font-semibold" : "font-medium"}`}>{r.name}</span>
                <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">{label(r.type)}</span>
                <button
                  type="button"
                  title={`Click to mark as ${label(nextOf(r.status))}`}
                  onClick={() => setStatus(r._id, nextOf(r.status))}
                  className={`rounded px-2 py-1 text-xs font-semibold transition-colors ${statusClass[r.status]}`}
                >
                  {label(r.status)}
                </button>
                <span className="min-w-0 flex-1 truncate text-sm text-muted-foreground">{r.message}</span>
                <div className="ml-auto flex items-center gap-2">
                  <span className="text-xs text-muted-foreground tabular-nums">
                    {new Date(r.createdAt).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                  </span>
                  <button
                    type="button"
                    onClick={() => open(r)}
                    aria-label={expanded === r._id ? "Close" : "Open"}
                    className="rounded p-1 text-muted-foreground hover:bg-muted"
                  >
                    {expanded === r._id ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                  </button>
                </div>
              </div>

              {expanded === r._id && (
                <div className="space-y-3 border-t border-border bg-muted/30 p-3 text-sm">
                  <div className="grid gap-2 sm:grid-cols-2">
                    <div><span className="text-muted-foreground">Name:</span> <span className="font-medium">{r.name}</span></div>
                    <div>
                      <span className="text-muted-foreground">Phone:</span>{" "}
                      <a href={`tel:${r.phone}`} className="font-medium hover:underline">{r.phone}</a>
                    </div>
                    <div><span className="text-muted-foreground">Type:</span> {label(r.type)}</div>
                    {r.refId && <div><span className="text-muted-foreground">Order / Repair ID:</span> <span className="font-medium">{r.refId}</span></div>}
                    <div><span className="text-muted-foreground">Received:</span> {new Date(r.createdAt).toLocaleString("en-IN")}</div>
                  </div>
                  <p className="whitespace-pre-wrap rounded-lg border border-border bg-background p-3">{r.message}</p>
                  <div className="flex flex-wrap items-center gap-2">
                    <a
                      href={`https://wa.me/91${r.phone}?text=${encodeURIComponent(`Hi ${r.name}, this is GJ Electronic about your ${r.type}.`)}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 rounded bg-[#25D366] px-2.5 py-1 text-xs font-medium text-white"
                    >
                      <MessageCircle className="size-3" /> Reply on WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={() => remove(r)}
                      className="ml-auto flex items-center gap-1.5 rounded border border-destructive/40 px-3 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3.5" /> Delete
                    </button>
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

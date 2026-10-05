"use client";

import { useEffect, useState } from "react";
import { Eye, EyeOff, Star, MessageSquareText } from "lucide-react";

interface Review {
  _id: string;
  productName: string;
  customerName: string;
  phone: string;
  stars: number;
  review: string;
  hidden: boolean;
  date: string;
}

const FILTERS = ["all", "shown", "hidden"] as const;

export default function AdminReviewsPage() {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<(typeof FILTERS)[number]>("all");
  const [busy, setBusy] = useState<string | null>(null);

  useEffect(() => {
    fetch("/api/reviews")
      .then((r) => r.json())
      .then((data) => setReviews(data.reviews || []))
      .finally(() => setLoading(false));
  }, []);

  const toggle = async (r: Review) => {
    setBusy(r._id);
    try {
      const res = await fetch(`/api/reviews/${r._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ hidden: !r.hidden }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        alert(`Could not update: ${err.error || res.statusText}`);
        return;
      }
      setReviews((prev) => prev.map((x) => (x._id === r._id ? { ...x, hidden: !r.hidden } : x)));
    } catch (e) {
      alert(`Request failed — check your connection. (${e})`);
    } finally {
      setBusy(null);
    }
  };

  const count = (f: (typeof FILTERS)[number]) =>
    f === "all" ? reviews.length : reviews.filter((r) => (f === "hidden" ? r.hidden : !r.hidden)).length;
  const filtered = reviews.filter((r) => filter === "all" || (filter === "hidden" ? r.hidden : !r.hidden));

  return (
    <div>
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <div>
          <h1 className="text-2xl font-bold">Reviews</h1>
          <p className="text-sm text-muted-foreground">Only customers who received the product can rate. Hidden reviews don&apos;t count in the stars.</p>
        </div>
        <div className="flex gap-1.5">
          {FILTERS.map((f) => (
            <button
              type="button"
              key={f}
              onClick={() => setFilter(f)}
              className={`shrink-0 rounded-full px-3 py-1.5 text-xs font-medium capitalize transition-colors ${
                filter === f ? "bg-primary text-primary-foreground" : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f} <span className="ml-1">({count(f)})</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center">
          <MessageSquareText className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="text-muted-foreground">No reviews yet</p>
        </div>
      ) : (
        <div className="space-y-2">
          {filtered.map((r) => (
            <div key={r._id} className={`rounded-lg border border-border p-3 ${r.hidden ? "opacity-60" : ""}`}>
              <div className="flex flex-wrap items-center gap-x-3 gap-y-1.5">
                <span className="text-sm font-semibold">{r.productName}</span>
                <span className="flex items-center gap-1 rounded bg-green-600 px-1.5 py-0.5 text-xs font-bold text-white">
                  {r.stars} <Star className="size-3 fill-current" />
                </span>
                {r.hidden && <span className="rounded bg-muted px-2 py-0.5 text-xs font-medium text-muted-foreground">Hidden</span>}
                <span className="ml-auto text-xs text-muted-foreground tabular-nums">
                  {new Date(r.date).toLocaleString("en-IN", { dateStyle: "medium", timeStyle: "short" })}
                </span>
              </div>
              <p className="mt-2 text-sm">{r.review || <span className="text-muted-foreground">(stars only, no written review)</span>}</p>
              <div className="mt-2 flex flex-wrap items-center gap-2 text-xs text-muted-foreground">
                <span>
                  {r.customerName}
                  {r.phone && (
                    <>
                      {" · "}
                      <a href={`tel:${r.phone}`} className="hover:underline">{r.phone}</a>
                    </>
                  )}
                </span>
                <button
                  type="button"
                  disabled={busy === r._id}
                  onClick={() => toggle(r)}
                  className="ml-auto flex items-center gap-1.5 rounded border border-border px-3 py-1 font-medium text-foreground hover:bg-muted disabled:opacity-50"
                >
                  {r.hidden ? <Eye className="size-3.5" /> : <EyeOff className="size-3.5" />}
                  {r.hidden ? "Show" : "Hide"}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

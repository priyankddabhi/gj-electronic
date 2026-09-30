"use client";

import { useEffect, useState } from "react";

interface PaymentRecord {
  id: string;
  type: "order" | "repair";
  referenceId: string;
  customerName: string;
  amount: number;
  status: string;
  method: string;
  date: string;
}

export default function AdminPaymentsPage() {
  const [records, setRecords] = useState<PaymentRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"all" | "paid" | "unpaid">("all");

  useEffect(() => {
    setLoading(true);
    Promise.all([
      fetch("/api/orders").then((r) => r.json()),
      fetch("/api/repairs").then((r) => r.json()),
    ]).then(([orderData, repairData]) => {
      const payments: PaymentRecord[] = [];

      (orderData.orders || []).forEach(
        (o: {
          _id: string;
          orderId: string;
          customerName: string;
          total: number;
          paymentStatus: string;
          paymentMethod: string;
          createdAt: string;
        }) => {
          payments.push({
            id: o._id,
            type: "order",
            referenceId: o.orderId,
            customerName: o.customerName,
            amount: o.total,
            status: o.paymentStatus,
            method: o.paymentMethod,
            date: o.createdAt,
          });
        }
      );

      (repairData.repairs || []).forEach(
        (r: {
          _id: string;
          trackingId: string;
          customerName: string;
          estimatedCost: number | null;
          paymentStatus: string;
          paymentMethod: string;
          createdAt: string;
        }) => {
          if (r.estimatedCost) {
            payments.push({
              id: r._id,
              type: "repair",
              referenceId: r.trackingId,
              customerName: r.customerName,
              amount: r.estimatedCost,
              status: r.paymentStatus,
              method: r.paymentMethod,
              date: r.createdAt,
            });
          }
        }
      );

      payments.sort(
        (a, b) => new Date(b.date).getTime() - new Date(a.date).getTime()
      );
      setRecords(payments);
      setLoading(false);
    });
  }, []);

  const filtered =
    filter === "all"
      ? records
      : records.filter((r) => r.status === filter);

  const totalPaid = records
    .filter((r) => r.status === "paid")
    .reduce((sum, r) => sum + r.amount, 0);

  const totalUnpaid = records
    .filter((r) => r.status === "unpaid")
    .reduce((sum, r) => sum + r.amount, 0);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Payments</h1>

      <div className="mb-6 grid gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Received</p>
          <p className="text-2xl font-bold text-green-600 tabular-nums">
            ₹{totalPaid.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Pending</p>
          <p className="text-2xl font-bold text-crimson tabular-nums">
            ₹{totalUnpaid.toLocaleString()}
          </p>
        </div>
        <div className="rounded-xl border border-border p-4">
          <p className="text-sm text-muted-foreground">Total Records</p>
          <p className="text-2xl font-bold tabular-nums">{records.length}</p>
        </div>
      </div>

      <div className="mb-4 flex gap-1.5">
        {(["all", "paid", "unpaid"] as const).map((s) => (
          <button
            key={s}
            onClick={() => setFilter(s)}
            className={`rounded-full px-3 py-1.5 text-xs font-medium ${
              filter === s
                ? "bg-primary text-primary-foreground"
                : "bg-muted text-muted-foreground"
            }`}
          >
            {s.charAt(0).toUpperCase() + s.slice(1)}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-10 text-center text-muted-foreground">Loading...</div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Date</th>
                <th className="px-4 py-3 text-left font-medium">Type</th>
                <th className="px-4 py-3 text-left font-medium">Reference</th>
                <th className="px-4 py-3 text-left font-medium">Customer</th>
                <th className="px-4 py-3 text-right font-medium">Amount</th>
                <th className="px-4 py-3 text-center font-medium">Status</th>
                <th className="px-4 py-3 text-center font-medium">Method</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((r) => (
                <tr
                  key={r.id}
                  className="border-b border-border last:border-0"
                >
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">
                    {new Date(r.date).toLocaleDateString()}
                  </td>
                  <td className="px-4 py-3">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.type === "order"
                          ? "bg-foreground/10 text-foreground"
                          : "bg-accent text-wine"
                      }`}
                    >
                      {r.type}
                    </span>
                  </td>
                  <td className="px-4 py-3 font-medium text-primary">
                    {r.referenceId}
                  </td>
                  <td className="px-4 py-3">{r.customerName}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">
                    ₹{r.amount}
                  </td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded-full px-2 py-0.5 text-xs font-medium ${
                        r.status === "paid"
                          ? "bg-green-500/10 text-green-600"
                          : "bg-accent text-wine"
                      }`}
                    >
                      {r.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center text-muted-foreground">
                    {r.method}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}

"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Users, Trash2 } from "lucide-react";

interface Customer {
  name: string;
  phone: string;
  registered: boolean;
  accountId?: string;
  orders: number;
  repairs: number;
  paid: number;
}

type OrderRow = { customerName: string; phone: string; total: number; paymentStatus: string };
type RepairRow = { customerName: string; phone: string; estimatedCost: number | null; paymentStatus: string };
type AccountRow = { _id: string; name: string; phone: string };

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

  // Deletes everything for this number: login account, orders, repairs and reviews
  const deleteCustomer = async (c: Customer) => {
    const parts = [
      c.registered ? "login account" : null,
      c.orders ? `${c.orders} order(s)` : null,
      c.repairs ? `${c.repairs} repair(s)` : null,
    ].filter(Boolean).join(", ");
    if (!confirm(`Delete ${c.name} (${c.phone})?\n\nThis removes: ${parts}${c.registered ? " and their reviews" : ""}.`)) return;
    if (!confirm("This is permanent and cannot be undone. Orders and repairs will also leave Payments and revenue. Continue?")) return;
    try {
      const res = await fetch("/api/customers/purge", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone: c.phone }),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        alert(`Could not delete: ${err.error || res.statusText}`);
        return;
      }
      setCustomers((prev) => prev.filter((x) => x.phone !== c.phone));
    } catch (e) {
      alert(`Delete failed: ${e}`);
    }
  };

  useEffect(() => {
    Promise.all([
      fetch("/api/orders").then((r) => r.json()),
      fetch("/api/repairs").then((r) => r.json()),
      fetch("/api/customers").then((r) => r.json()),
    ]).then(([orderData, repairData, accountData]) => {
      const map = new Map<string, Customer>();
      // Same number saved as "0987…" or "+91 987…" in older records counts as one customer
      const get = (phone: string, name: string) => {
        const key = phone.replace(/\D/g, "").slice(-10) || phone;
        const existing = map.get(key) || { name, phone, registered: false, orders: 0, repairs: 0, paid: 0 };
        map.set(key, existing);
        return existing;
      };

      (accountData.customers || []).forEach((a: AccountRow) => {
        const c = get(a.phone, a.name);
        c.name = a.name;
        c.registered = true;
        c.accountId = a._id;
      });
      (orderData.orders || []).forEach((o: OrderRow) => {
        const c = get(o.phone, o.customerName);
        c.orders++;
        if (o.paymentStatus === "paid") c.paid += o.total;
      });
      (repairData.repairs || []).forEach((r: RepairRow) => {
        const c = get(r.phone, r.customerName);
        c.repairs++;
        if (r.paymentStatus === "paid" && r.estimatedCost) c.paid += r.estimatedCost;
      });

      setCustomers([...map.values()].sort((a, b) => b.paid - a.paid || b.orders + b.repairs - (a.orders + a.repairs)));
      setLoading(false);
    });
  }, []);

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Customers</h1>

      {loading ? (
        <div className="py-10 text-center text-muted-foreground">Loading...</div>
      ) : customers.length === 0 ? (
        <div className="py-10 text-center">
          <Users className="mx-auto mb-3 size-10 text-muted-foreground" />
          <p className="text-muted-foreground">No customers yet</p>
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-border">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-border bg-muted/50">
                <th className="px-4 py-3 text-left font-medium">Name</th>
                <th className="px-4 py-3 text-left font-medium">Phone</th>
                <th className="px-4 py-3 text-center font-medium">Account</th>
                <th className="px-4 py-3 text-center font-medium">Orders</th>
                <th className="px-4 py-3 text-center font-medium">Repairs</th>
                <th className="px-4 py-3 text-right font-medium" title="Paid orders and paid repairs only">
                  Total paid
                </th>
                <th className="px-4 py-3 text-center font-medium">Action</th>
              </tr>
            </thead>
            <tbody>
              {customers.map((c) => (
                <tr key={c.phone} className="border-b border-border last:border-0">
                  <td className="px-4 py-3 font-medium">{c.name}</td>
                  <td className="px-4 py-3 text-muted-foreground tabular-nums">{c.phone}</td>
                  <td className="px-4 py-3 text-center">
                    <span
                      className={`rounded px-2 py-0.5 text-xs font-medium ${
                        c.registered ? "bg-foreground/10 text-foreground" : "bg-muted text-muted-foreground"
                      }`}
                    >
                      {c.registered ? "Registered" : "Guest"}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-center tabular-nums">{c.orders}</td>
                  <td className="px-4 py-3 text-center tabular-nums">{c.repairs}</td>
                  <td className="px-4 py-3 text-right font-medium tabular-nums">₹{c.paid.toLocaleString("en-IN")}</td>
                  <td className="px-4 py-3 text-center">
                    <div className="inline-flex items-center gap-2">
                    <a
                      href={`https://wa.me/91${c.phone.replace(/\D/g, "").slice(-10)}?text=${encodeURIComponent(
                        `Hi ${c.name}, this is GJ Electronic.`
                      )}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-1 rounded-lg bg-[#25D366] px-2.5 py-1 text-xs font-medium text-white"
                    >
                      <MessageCircle className="size-3" />
                      WhatsApp
                    </a>
                    <button
                      type="button"
                      onClick={() => deleteCustomer(c)}
                      title="Delete this customer and all their orders, repairs and reviews"
                      className="inline-flex items-center gap-1 rounded-lg border border-destructive/40 px-2.5 py-1 text-xs font-medium text-destructive hover:bg-destructive/10"
                    >
                      <Trash2 className="size-3" /> Delete
                    </button>
                    </div>
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

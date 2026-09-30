"use client";

import { useEffect, useState } from "react";
import { MessageCircle, Users } from "lucide-react";

interface Customer {
  name: string;
  phone: string;
  registered: boolean;
  orders: number;
  repairs: number;
  paid: number;
}

type OrderRow = { customerName: string; phone: string; total: number; paymentStatus: string };
type RepairRow = { customerName: string; phone: string; estimatedCost: number | null; paymentStatus: string };
type AccountRow = { name: string; phone: string };

export default function AdminCustomersPage() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);

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

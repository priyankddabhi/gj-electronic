"use client";

import { useEffect, useState } from "react";
import { MessageCircle, ChevronDown, ChevronUp, Trash2 } from "lucide-react";
import { ORDER_STATUSES } from "@/lib/constants";
import { useShopInfo } from "@/lib/shopInfo";

const STATUSES = ORDER_STATUSES as readonly string[];
const label = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);
// After the last status it wraps back to the first, so there is never a dead end
const nextOf = (s: string) => STATUSES[(STATUSES.indexOf(s) + 1) % STATUSES.length];

interface Order {
  _id: string;
  orderId: string;
  customerName: string;
  phone: string;
  address: string;
  deliveryType: string;
  items: { name: string; quantity: number; price: number }[];
  total: number;
  status: string;
  paymentStatus: string;
  paymentMethod: string;
  createdAt: string;
}

const itemSummary = (items: Order["items"]) =>
  items.length === 0 ? "—" : items.length === 1 ? items[0].name : `${items[0].name} +${items.length - 1} more`;

export default function AdminOrdersPage() {
  const shop = useShopInfo();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");
  const [selected, setSelected] = useState<string[]>([]);

  useEffect(() => {
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  }, []);

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    try {
      const res = await fetch(`/api/orders/${id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(updates),
      });
      if (!res.ok) {
        const err = (await res.json().catch(() => ({}))) as { error?: string };
        alert(`Could not update the order: ${err.error || res.statusText}`);
        return;
      }
      const saved: Order = await res.json();
      setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, ...saved } : o)));
    } catch (e) {
      alert(`Request failed — check your connection. (${e})`);
    }
  };

  const filtered = filter === "all" ? orders : orders.filter((o) => o.status === filter);
  const visibleSelected = selected.filter((id) => filtered.some((o) => o._id === id));
  const allSelected = filtered.length > 0 && visibleSelected.length === filtered.length;

  const toggle = (id: string) =>
    setSelected((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));

  const deleteSelected = async () => {
    const ids = visibleSelected;
    if (!confirm(`Delete ${ids.length} selected order(s)?`)) return;
    if (!confirm(`This will PERMANENTLY delete ${ids.length} order(s). This cannot be undone. Continue?`)) return;
    const results = await Promise.all(
      ids.map(async (id) => ({ id, ok: (await fetch(`/api/orders/${id}`, { method: "DELETE" })).ok }))
    );
    const deleted = results.filter((r) => r.ok).map((r) => r.id);
    setOrders((prev) => prev.filter((o) => !deleted.includes(o._id)));
    setSelected((prev) => prev.filter((id) => !deleted.includes(id)));
    if (deleted.length < results.length)
      alert(`${results.length - deleted.length} order(s) could not be deleted. Please try again.`);
  };

  return (
    <div>
      {/* Heading left, status filters right (one scrollable row on phones) */}
      <div className="mb-5 flex flex-col gap-3 lg:flex-row lg:items-center lg:justify-between">
        <h1 className="text-2xl font-bold">Orders</h1>
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
              <span className="ml-1">({s === "all" ? orders.length : orders.filter((o) => o.status === s).length})</span>
            </button>
          ))}
        </div>
      </div>

      {loading ? (
        <div className="py-10 text-center text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">No orders</div>
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
                aria-label="Select all orders"
                checked={allSelected}
                onChange={(e) => setSelected(e.target.checked ? filtered.map((o) => o._id) : [])}
              />
              <span className="flex-1">Order</span>
              <span className="hidden w-20 text-right sm:block">Total</span>
              <span className="w-[5.5rem] text-right sm:w-40">Status · Payment</span>
              <span className="w-6" />
            </div>

            {filtered.map((order) => {
              const open = expanded === order._id;
              const isSel = selected.includes(order._id);
              return (
                <div key={order._id} className={`border-b border-border last:border-0 ${isSel ? "bg-muted/40" : ""}`}>
                  <div className="flex items-center gap-3 px-3 py-2.5">
                    <input
                      type="checkbox"
                      aria-label={`Select ${order.orderId}`}
                      checked={isSel}
                      onChange={() => toggle(order._id)}
                    />

                    {/* Left: ID + product */}
                    <button
                      type="button"
                      onClick={() => setExpanded(open ? null : order._id)}
                      className="min-w-0 flex-1 text-left"
                    >
                      <div className="flex items-baseline gap-2">
                        <span className="shrink-0 whitespace-nowrap text-sm font-semibold text-primary">{order.orderId}</span>
                        <span className="truncate text-xs text-muted-foreground">{order.customerName}</span>
                      </div>
                      <p className="truncate text-sm">
                        {itemSummary(order.items)}
                        <span className="ml-2 font-medium tabular-nums sm:hidden">₹{order.total.toLocaleString("en-IN")}</span>
                      </p>
                    </button>

                    <span className="hidden w-20 text-right text-sm font-medium tabular-nums sm:block">
                      ₹{order.total.toLocaleString("en-IN")}
                    </span>

                    {/* Right: status + payment */}
                    <div className="flex w-[5.5rem] flex-col items-end gap-1 sm:w-40 sm:flex-row sm:items-center sm:justify-end sm:gap-1.5">
                      <button
                        type="button"
                        title={`Click to mark as ${label(nextOf(order.status))}`}
                        onClick={() => updateOrder(order._id, { status: nextOf(order.status) })}
                        className={`rounded px-2 py-1 text-xs font-semibold transition-colors ${
                          order.status === "delivered"
                            ? "bg-green-500/15 text-green-600 hover:bg-green-500/25"
                            : "bg-blue-500/15 text-blue-600 hover:bg-blue-500/25"
                        }`}
                      >
                        {label(order.status)}
                      </button>
                      <button
                        type="button"
                        onClick={() => updateOrder(order._id, { paymentStatus: order.paymentStatus === "paid" ? "unpaid" : "paid" })}
                        className={`rounded px-2 py-1 text-xs font-medium ${
                          order.paymentStatus === "paid" ? "bg-green-500/10 text-green-600" : "bg-accent text-wine"
                        }`}
                      >
                        {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                      </button>
                    </div>

                    <button
                      type="button"
                      aria-label={open ? "Collapse" : "Expand"}
                      onClick={() => setExpanded(open ? null : order._id)}
                      className="w-6 rounded p-1 text-muted-foreground hover:bg-muted"
                    >
                      {open ? <ChevronUp className="size-4" /> : <ChevronDown className="size-4" />}
                    </button>
                  </div>

                  {/* Expanded details */}
                  {open && (
                    <div className="border-t border-border bg-muted/30 px-3 py-3 text-sm sm:pl-10">
                      <div className="mb-3 grid gap-x-6 gap-y-1.5 sm:grid-cols-2">
                        <div><span className="text-muted-foreground">Phone:</span> {order.phone}</div>
                        <div><span className="text-muted-foreground">Type:</span> {order.deliveryType}</div>
                        {order.address && (
                          <div className="sm:col-span-2"><span className="text-muted-foreground">Address:</span> {order.address}</div>
                        )}
                        <div><span className="text-muted-foreground">Date:</span> {new Date(order.createdAt).toLocaleString()}</div>
                      </div>
                      <div className="rounded-lg border border-border bg-background p-2.5">
                        {order.items.map((item, i) => (
                          <div key={i} className="flex justify-between py-0.5">
                            <span>{item.name} x{item.quantity}</span>
                            <span className="tabular-nums">₹{(item.price * item.quantity).toLocaleString("en-IN")}</span>
                          </div>
                        ))}
                        <div className="mt-1.5 flex justify-between border-t border-border pt-1.5 font-semibold">
                          <span>Total</span>
                          <span className="tabular-nums">₹{order.total.toLocaleString("en-IN")}</span>
                        </div>
                      </div>
                      <a
                        href={`https://wa.me/${shop.whatsapp}?text=${encodeURIComponent(
                          `Order ${order.orderId} update for ${order.customerName}: Your order status is "${order.status}".`
                        )}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="mt-3 inline-flex items-center gap-1.5 rounded-lg bg-[#25D366] px-3 py-1.5 text-xs font-medium text-white hover:bg-[#25D366]/90"
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

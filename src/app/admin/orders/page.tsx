"use client";

import { useEffect, useState } from "react";
import { MessageCircle, ChevronDown, ChevronUp } from "lucide-react";
import { ORDER_STATUSES, SHOP_WHATSAPP } from "@/lib/constants";

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

export default function AdminOrdersPage() {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [filter, setFilter] = useState("all");

  const loadOrders = () => {
    setLoading(true);
    fetch("/api/orders")
      .then((r) => r.json())
      .then((data) => setOrders(data.orders || []))
      .finally(() => setLoading(false));
  };

  useEffect(loadOrders, []);

  const updateOrder = async (id: string, updates: Partial<Order>) => {
    const res = await fetch(`/api/orders/${id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updates),
    });
    if (!res.ok) {
      alert("Could not update the order. Please try again.");
      return;
    }
    const saved: Order = await res.json();
    setOrders((prev) => prev.map((o) => (o._id === id ? { ...o, ...saved } : o)));
  };

  const filtered =
    filter === "all" ? orders : orders.filter((o) => o.status === filter);

  return (
    <div>
      <h1 className="mb-4 text-2xl font-bold">Orders</h1>

      <div className="mb-4 flex flex-wrap gap-1.5">
        {["all", ...ORDER_STATUSES].map((s) => (
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
                ({orders.filter((o) => o.status === s).length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="py-10 text-center text-muted-foreground">Loading...</div>
      ) : filtered.length === 0 ? (
        <div className="py-10 text-center text-muted-foreground">No orders</div>
      ) : (
        <div className="space-y-2">
          {filtered.map((order) => (
            <div key={order._id} className="rounded-lg border border-border">
              {/* Compact summary row */}
              <div className="flex flex-wrap items-center gap-x-3 gap-y-2 p-3">
                <span className="font-semibold text-primary text-sm">
                  {order.orderId}
                </span>
                <span className="text-sm text-muted-foreground">
                  {order.customerName}
                </span>
                <span className="text-sm font-medium tabular-nums">
                  ₹{order.total.toLocaleString("en-IN")}
                </span>

                {/* Inline controls */}
                <div className="flex items-center gap-2 ml-auto">
                  <select
                    value={order.status}
                    onChange={(e) => updateOrder(order._id, { status: e.target.value })}
                    className="rounded border border-input bg-background px-2 py-1 text-xs"
                  >
                    {ORDER_STATUSES.map((s) => (
                      <option key={s} value={s}>
                        {s.charAt(0).toUpperCase() + s.slice(1)}
                      </option>
                    ))}
                  </select>

                  <button
                    onClick={() =>
                      updateOrder(order._id, {
                        paymentStatus: order.paymentStatus === "paid" ? "unpaid" : "paid",
                      })
                    }
                    className={`rounded px-2 py-1 text-xs font-medium ${
                      order.paymentStatus === "paid"
                        ? "bg-green-500/10 text-green-600"
                        : "bg-accent text-wine"
                    }`}
                  >
                    {order.paymentStatus === "paid" ? "Paid" : "Unpaid"}
                  </button>

                  <a
                    href={`https://wa.me/${SHOP_WHATSAPP}?text=${encodeURIComponent(
                      `Order ${order.orderId} update for ${order.customerName}: Your order status is "${order.status}".`
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
                      setExpanded(expanded === order._id ? null : order._id)
                    }
                    className="rounded p-1 text-muted-foreground hover:bg-muted"
                  >
                    {expanded === order._id ? (
                      <ChevronUp className="size-4" />
                    ) : (
                      <ChevronDown className="size-4" />
                    )}
                  </button>
                </div>
              </div>

              {/* Expanded details */}
              {expanded === order._id && (
                <div className="border-t border-border bg-muted/30 p-3 text-sm">
                  <div className="mb-3 grid gap-2 sm:grid-cols-2">
                    <div>
                      <span className="text-muted-foreground">Phone:</span> {order.phone}
                    </div>
                    <div>
                      <span className="text-muted-foreground">Type:</span> {order.deliveryType}
                    </div>
                    {order.address && (
                      <div className="sm:col-span-2">
                        <span className="text-muted-foreground">Address:</span> {order.address}
                      </div>
                    )}
                    <div>
                      <span className="text-muted-foreground">Date:</span>{" "}
                      {new Date(order.createdAt).toLocaleString()}
                    </div>
                  </div>
                  <div className="rounded bg-background p-2">
                    {order.items.map((item, i) => (
                      <div key={i} className="flex justify-between text-sm">
                        <span>
                          {item.name} x{item.quantity}
                        </span>
                        <span className="tabular-nums">₹{item.price * item.quantity}</span>
                      </div>
                    ))}
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

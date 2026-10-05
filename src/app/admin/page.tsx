"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ShoppingCart,
  Wrench,
  Package,
  CreditCard,
  ArrowRight,
} from "lucide-react";

interface Stats {
  totalProducts: number;
  newProducts24h: number;
  totalOrders: number;
  newOrders24h: number;
  pendingOrders: number;
  totalRepairs: number;
  newRepairs24h: number;
  pendingRepairs: number;
  totalRevenue: number;
  newRevenue24h: number;
}

function New24({ n }: { n: number }) {
  if (!n) return null;
  return (
    <span className="ml-auto inline-flex items-center rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-600 dark:text-green-400">
      +{n} new
    </span>
  );
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    newProducts24h: 0,
    totalOrders: 0,
    newOrders24h: 0,
    pendingOrders: 0,
    totalRepairs: 0,
    newRepairs24h: 0,
    pendingRepairs: 0,
    totalRevenue: 0,
    newRevenue24h: 0,
  });

  useEffect(() => {
    fetch("/api/stats")
      .then((r) => r.json())
      .then((data) => setStats(data));
  }, []);

  const tiles = [
    {
      label: "Products",
      value: stats.totalProducts,
      new24: stats.newProducts24h,
      icon: Package,
      href: "/admin/products",
      color: "text-foreground bg-foreground/10",
    },
    {
      label: "Orders",
      value: stats.totalOrders,
      new24: stats.newOrders24h,
      sub: `${stats.pendingOrders} pending`,
      icon: ShoppingCart,
      href: "/admin/orders",
      color: "text-crimson bg-crimson/10",
    },
    {
      label: "Repairs",
      value: stats.totalRepairs,
      new24: stats.newRepairs24h,
      sub: `${stats.pendingRepairs} pending`,
      icon: Wrench,
      href: "/admin/repairs",
      color: "text-wine bg-accent",
    },
    {
      label: "Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
      new24: stats.newRevenue24h,
      newLabel: stats.newRevenue24h ? `+₹${stats.newRevenue24h.toLocaleString()}` : 0,
      icon: CreditCard,
      href: "/admin/payments",
      color: "text-muted-foreground bg-muted",
    },
  ];

  return (
    <div>
      <h1 className="mb-6 text-2xl font-bold">Dashboard</h1>

      <div className="mb-8 grid gap-4 grid-cols-2 lg:grid-cols-4">
        {tiles.map((tile) => {
          const Icon = tile.icon;
          const n24 = tile.new24;
          const label24 = "newLabel" in tile && tile.newLabel ? tile.newLabel : n24;
          return (
            <Link
              key={tile.label}
              href={tile.href}
              className="rounded-xl border border-border p-4 transition-shadow hover:shadow-md"
            >
              <div className="mb-3 flex items-center justify-between">
                <div
                  className={`flex h-10 w-10 items-center justify-center rounded-lg ${tile.color}`}
                >
                  <Icon className="size-5" />
                </div>
                <ArrowRight className="size-4 text-muted-foreground" />
              </div>
              <p className="text-2xl font-bold">{tile.value}</p>
              <div className="mt-1 flex items-center gap-2 flex-wrap">
                <p className="text-sm text-muted-foreground">{tile.label}</p>
                {n24 ? (
                  <span className="inline-flex items-center rounded-full bg-green-500/15 px-2 py-0.5 text-xs font-semibold text-green-600 dark:text-green-400">
                    +{label24}
                  </span>
                ) : null}
              </div>
              {tile.sub && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {tile.sub}
                </p>
              )}
            </Link>
          );
        })}
      </div>

      <p className="mb-4 text-xs text-muted-foreground">
        <span className="inline-block size-2 rounded-full bg-green-500 mr-1 align-middle" />
        Green badges show new items added in the last 24 hours.
      </p>

      <div className="grid gap-4 lg:grid-cols-2">
        <div className="rounded-xl border border-border p-4">
          <h2 className="mb-4 font-semibold">Quick Actions</h2>
          <div className="space-y-2">
            <Link
              href="/admin/products"
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-muted"
            >
              <Package className="size-4 text-primary" />
              Add New Product
              <New24 n={stats.newProducts24h} />
            </Link>
            <Link
              href="/admin/repairs"
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-muted"
            >
              <Wrench className="size-4 text-primary" />
              View Pending Repairs
              <New24 n={stats.newRepairs24h} />
            </Link>
            <Link
              href="/admin/orders"
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-muted"
            >
              <ShoppingCart className="size-4 text-primary" />
              View Recent Orders
              <New24 n={stats.newOrders24h} />
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

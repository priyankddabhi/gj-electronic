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
  totalOrders: number;
  pendingOrders: number;
  totalRepairs: number;
  pendingRepairs: number;
  totalRevenue: number;
}

export default function AdminDashboard() {
  const [stats, setStats] = useState<Stats>({
    totalProducts: 0,
    totalOrders: 0,
    pendingOrders: 0,
    totalRepairs: 0,
    pendingRepairs: 0,
    totalRevenue: 0,
  });

  useEffect(() => {
    Promise.all([
      fetch("/api/products?limit=1").then((r) => r.json()),
      fetch("/api/orders").then((r) => r.json()),
      fetch("/api/repairs").then((r) => r.json()),
    ]).then(([prodData, orderData, repairData]) => {
      const orders = orderData.orders || [];
      const repairs = repairData.repairs || [];
      setStats({
        totalProducts: prodData.total || 0,
        totalOrders: orders.length,
        pendingOrders: orders.filter(
          (o: { status: string }) => o.status !== "delivered"
        ).length,
        totalRepairs: repairs.length,
        pendingRepairs: repairs.filter(
          (r: { status: string }) => r.status !== "delivered"
        ).length,
        totalRevenue: orders
          .filter((o: { paymentStatus: string }) => o.paymentStatus === "paid")
          .reduce((sum: number, o: { total: number }) => sum + o.total, 0),
      });
    });
  }, []);

  const tiles = [
    {
      label: "Products",
      value: stats.totalProducts,
      icon: Package,
      href: "/admin/products",
      color: "text-foreground bg-foreground/10",
    },
    {
      label: "Orders",
      value: stats.totalOrders,
      sub: `${stats.pendingOrders} pending`,
      icon: ShoppingCart,
      href: "/admin/orders",
      color: "text-crimson bg-crimson/10",
    },
    {
      label: "Repairs",
      value: stats.totalRepairs,
      sub: `${stats.pendingRepairs} pending`,
      icon: Wrench,
      href: "/admin/repairs",
      color: "text-wine bg-accent",
    },
    {
      label: "Revenue",
      value: `₹${stats.totalRevenue.toLocaleString()}`,
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
              <p className="text-sm text-muted-foreground">{tile.label}</p>
              {tile.sub && (
                <p className="mt-0.5 text-xs text-muted-foreground">
                  {tile.sub}
                </p>
              )}
            </Link>
          );
        })}
      </div>

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
            </Link>
            <Link
              href="/admin/repairs"
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-muted"
            >
              <Wrench className="size-4 text-primary" />
              View Pending Repairs
            </Link>
            <Link
              href="/admin/orders"
              className="flex items-center gap-2 rounded-lg border border-border px-4 py-3 text-sm font-medium hover:bg-muted"
            >
              <ShoppingCart className="size-4 text-primary" />
              View Recent Orders
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}

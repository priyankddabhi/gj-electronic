import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import Product from "@/models/Product";
import Order from "@/models/Order";
import Repair from "@/models/Repair";

export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();

  const since24h = new Date(Date.now() - 24 * 60 * 60 * 1000);

  const [
    totalProducts,
    newProducts24h,
    allOrders,
    newOrders24h,
    allRepairs,
    newRepairs24h,
  ] = await Promise.all([
    Product.countDocuments(),
    Product.countDocuments({ createdAt: { $gte: since24h } }),
    Order.find().lean() as Promise<{ status: string; paymentStatus: string; total: number; createdAt: Date }[]>,
    Order.countDocuments({ createdAt: { $gte: since24h } }),
    Repair.find().lean() as Promise<{ status: string; createdAt: Date }[]>,
    Repair.countDocuments({ createdAt: { $gte: since24h } }),
  ]);

  const pendingOrders = allOrders.filter((o) => o.status !== "delivered").length;
  const pendingRepairs = allRepairs.filter((r) => r.status !== "delivered").length;

  const totalRevenue = allOrders
    .filter((o) => o.paymentStatus === "paid")
    .reduce((sum, o) => sum + o.total, 0);

  const newRevenue24h = allOrders
    .filter((o) => o.paymentStatus === "paid" && new Date(o.createdAt) >= since24h)
    .reduce((sum, o) => sum + o.total, 0);

  return NextResponse.json({
    totalProducts,
    newProducts24h,
    totalOrders: allOrders.length,
    newOrders24h,
    pendingOrders,
    totalRepairs: allRepairs.length,
    newRepairs24h,
    pendingRepairs,
    totalRevenue,
    newRevenue24h,
  });
}

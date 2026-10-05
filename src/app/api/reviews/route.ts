import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import Customer from "@/models/Customer";
import Product from "@/models/Product";
import Rating from "@/models/Rating";

// Admin: every rating/review with product name and customer phone
export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const rows = await Rating.find().sort({ updatedAt: -1 }).lean<
    { _id: unknown; product: unknown; customer: unknown; customerName?: string; stars: number; review?: string; hidden?: boolean; updatedAt: Date }[]
  >();
  const [products, customers] = await Promise.all([
    Product.find({ _id: { $in: rows.map((r) => r.product) } }, { name: 1 }).lean<{ _id: unknown; name: string }[]>(),
    Customer.find({ _id: { $in: rows.map((r) => r.customer) } }, { phone: 1 }).lean<{ _id: unknown; phone: string }[]>(),
  ]);
  const productName = new Map(products.map((p) => [String(p._id), p.name]));
  const phone = new Map(customers.map((c) => [String(c._id), c.phone]));
  return NextResponse.json({
    reviews: rows.map((r) => ({
      _id: String(r._id),
      productId: String(r.product),
      productName: productName.get(String(r.product)) ?? "(deleted product)",
      customerName: r.customerName || "Customer",
      phone: phone.get(String(r.customer)) ?? "",
      stars: r.stars,
      review: r.review ?? "",
      hidden: !!r.hidden,
      date: r.updatedAt,
    })),
  });
}

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import { normalizePhone, phoneVariants } from "@/lib/phone";
import { refreshProductRating } from "@/lib/ratings";
import Customer from "@/models/Customer";
import Order from "@/models/Order";
import Rating from "@/models/Rating";
import Repair from "@/models/Repair";

// Admin → Customers "Delete": removes everything for one phone number —
// login account, orders, repairs and that customer's reviews. Cannot be undone.
export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const { phone } = await req.json().catch(() => ({}));
  const ten = normalizePhone(phone);
  if (!ten) return NextResponse.json({ error: "Invalid phone number" }, { status: 400 });
  const match = { phone: { $in: phoneVariants(ten) } };

  const accounts = await Customer.find(match, { _id: 1 }).lean<{ _id: unknown }[]>();
  const ratings = await Rating.find({ customer: { $in: accounts.map((a) => a._id) } }, { product: 1 }).lean<{ product: unknown }[]>();
  const [r1, o, rp, c] = await Promise.all([
    Rating.deleteMany({ customer: { $in: accounts.map((a) => a._id) } }),
    Order.deleteMany(match),
    Repair.deleteMany(match),
    Customer.deleteMany(match),
  ]);
  // Their reviews no longer count in product stars
  for (const id of new Set(ratings.map((r) => String(r.product)))) await refreshProductRating(id);

  return NextResponse.json({
    ok: true,
    deleted: { account: c.deletedCount, orders: o.deletedCount, repairs: rp.deletedCount, reviews: r1.deletedCount },
  });
}

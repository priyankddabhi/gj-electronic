import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import { refreshProductRating } from "@/lib/ratings";
import Rating from "@/models/Rating";

// Admin: hide or show a review. Hidden ratings drop out of the product's average.
export async function PUT(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const { id } = await params;
  if (!/^[0-9a-fA-F]{24}$/.test(id)) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  const { hidden } = await req.json().catch(() => ({}));
  if (typeof hidden !== "boolean") return NextResponse.json({ error: "hidden must be true or false" }, { status: 400 });
  const rating = await Rating.findByIdAndUpdate(id, { $set: { hidden } }, { new: true }).lean<{ product: unknown }>();
  if (!rating) return NextResponse.json({ error: "Review not found" }, { status: 404 });
  await refreshProductRating(String(rating.product));
  return NextResponse.json({ ok: true, hidden });
}

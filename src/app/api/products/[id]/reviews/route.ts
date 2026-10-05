import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import Product from "@/models/Product";
import Rating from "@/models/Rating";

// Public list of visible reviews for a product (newest first). Only first names are shown.
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const id = (await params).id;
  const p = await Product.findOne(/^[0-9a-fA-F]{24}$/.test(id) ? { _id: id } : { slug: id }, { _id: 1 }).lean<{ _id: mongoose.Types.ObjectId }>();
  if (!p) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  const rows = await Rating.find({ product: p._id, hidden: { $ne: true } })
    .sort({ updatedAt: -1 })
    .limit(20)
    .lean<{ stars: number; review?: string; customerName?: string; updatedAt: Date }[]>();
  return NextResponse.json({
    reviews: rows.map((r) => ({
      stars: r.stars,
      review: r.review ?? "",
      name: (r.customerName || "Customer").trim().split(/\s+/)[0],
      date: r.updatedAt,
      // Ratings saved since the buyers-only rule always carry the customer name
      verified: !!r.customerName,
    })),
  });
}

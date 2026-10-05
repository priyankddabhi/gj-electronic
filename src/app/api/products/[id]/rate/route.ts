import { NextRequest, NextResponse } from "next/server";
import mongoose from "mongoose";
import { connectDB } from "@/lib/mongodb";
import { getCustomerSession } from "@/lib/customerSession";
import { refreshProductRating } from "@/lib/ratings";
import Customer from "@/models/Customer";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Rating from "@/models/Rating";

async function findProductId(id: string) {
  const p = await Product.findOne(/^[0-9a-fA-F]{24}$/.test(id) ? { _id: id } : { slug: id }, { _id: 1 }).lean<{ _id: mongoose.Types.ObjectId }>();
  return p?._id ?? null;
}

// "Verified buyer": has an order with this product that reached Delivered
async function boughtIt(phone: string, productId: mongoose.Types.ObjectId) {
  return !!(await Order.exists({ phone, status: "delivered", "items.productId": String(productId) }));
}

// The logged-in customer's own rating, and whether they may rate this product
export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const productId = await findProductId((await params).id);
  if (!productId) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ myStars: 0, myReview: "", canRate: false });
  const mine = await Rating.findOne({ product: productId, customer: session.id }).lean<{ stars: number; review?: string }>();
  return NextResponse.json({
    myStars: mine?.stars ?? 0,
    myReview: mine?.review ?? "",
    canRate: await boughtIt(session.phone, productId),
  });
}

// Save (or change) the customer's stars + review, then refresh the product's average
export async function POST(req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  await connectDB();
  const session = await getCustomerSession();
  const customer = session ? await Customer.findOne({ _id: session.id, phone: session.phone }, { name: 1 }).lean<{ name: string }>() : null;
  if (!session || !customer) return NextResponse.json({ error: "Please log in to rate products" }, { status: 401 });

  const productId = await findProductId((await params).id);
  if (!productId) return NextResponse.json({ error: "Product not found" }, { status: 404 });
  if (!(await boughtIt(session.phone, productId)))
    return NextResponse.json({ error: "Only customers who received this product can rate it" }, { status: 403 });

  const body = await req.json().catch(() => ({}));
  const stars = body.stars;
  if (!Number.isInteger(stars) || stars < 1 || stars > 5)
    return NextResponse.json({ error: "Stars must be 1 to 5" }, { status: 400 });
  const review = typeof body.review === "string" ? body.review.trim().slice(0, 500) : "";

  await Rating.updateOne(
    { product: productId, customer: session.id },
    { $set: { stars, review, customerName: customer.name } },
    { upsert: true }
  );
  const { ratingAvg, ratingCount } = await refreshProductRating(productId);
  return NextResponse.json({ ratingAvg, ratingCount, myStars: stars, myReview: review });
}

import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import Product from "@/models/Product";

export async function GET(req: NextRequest) {
  try {
  await connectDB();
  const params = req.nextUrl.searchParams;
  const search = params.get("search");
  const category = params.get("category");
  const featured = params.get("featured");
  const sort = params.get("sort");
  const limit = parseInt(params.get("limit") || "50", 10);
  const page = parseInt(params.get("page") || "1", 10);

  const filter: Record<string, unknown> = {};
  if (category && category !== "All") filter.category = category;
  if (featured === "true") filter.featured = true;
  if (search) {
    filter.$or = [
      { name: { $regex: search, $options: "i" } },
      { description: { $regex: search, $options: "i" } },
      { brand: { $regex: search, $options: "i" } },
    ];
  }

  const sortObj: Record<string, 1 | -1> =
    sort === "price_asc"
      ? { price: 1 }
      : sort === "price_desc"
        ? { price: -1 }
        : sort === "popular"
          ? { ratingAvg: -1, ratingCount: -1, createdAt: -1 }
          : { createdAt: -1 };

  const total = await Product.countDocuments(filter);
  const products = await Product.find(filter)
    .sort(sortObj)
    .skip((page - 1) * limit)
    .limit(limit)
    .lean();

  return NextResponse.json({ products, total, page, limit });
  } catch (error) {
    console.error("GET /api/products error:", error);
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const body = await req.json();
  if (!body.slug) {
    body.slug = body.name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/(^-|-$)/g, "");
  }
  const product = await Product.create(body);
  return NextResponse.json(product, { status: 201 });
}

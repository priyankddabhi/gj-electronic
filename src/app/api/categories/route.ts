import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import Category from "@/models/Category";
import { CATEGORIES } from "@/lib/constants";

export async function GET() {
  try {
    await connectDB();
    const dbCategories = await Category.find().sort({ order: 1 }).lean();
    if (dbCategories.length === 0) {
      return NextResponse.json({ categories: [...CATEGORIES] });
    }
    return NextResponse.json({
      categories: dbCategories.map((c) => c.name),
    });
  } catch {
    return NextResponse.json({ categories: [...CATEGORIES] });
  }
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return unauthorized();
  try {
    await connectDB();
    const { name } = await req.json();
    if (!name?.trim()) {
      return NextResponse.json({ error: "Name required" }, { status: 400 });
    }
    const count = await Category.countDocuments();
    const category = await Category.create({ name: name.trim(), order: count });
    return NextResponse.json(category, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function DELETE(req: NextRequest) {
  if (!(await requireAdmin())) return unauthorized();
  try {
    await connectDB();
    const { name } = await req.json();
    await Category.deleteOne({ name });
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

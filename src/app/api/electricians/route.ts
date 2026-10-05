import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import Electrician from "@/models/Electrician";

export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const list = await Electrician.find().sort({ name: 1 }).lean();
  return NextResponse.json(list);
}

export async function POST(req: NextRequest) {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const body = await req.json();
  if (!body.name?.trim() || !body.phone?.trim())
    return NextResponse.json({ error: "Name and phone required" }, { status: 400 });
  const doc = await Electrician.create({
    name: body.name.trim(),
    phone: body.phone.trim(),
    skills: Array.isArray(body.skills) ? body.skills.filter(Boolean) : [],
    active: body.active !== false,
  });
  return NextResponse.json(doc, { status: 201 });
}

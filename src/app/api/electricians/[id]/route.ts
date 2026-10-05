import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import Electrician from "@/models/Electrician";

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const { id } = await params;
  const body = await req.json();
  const doc = await Electrician.findByIdAndUpdate(
    id,
    {
      $set: {
        name: body.name?.trim(),
        phone: body.phone?.trim(),
        skills: Array.isArray(body.skills) ? body.skills.filter(Boolean) : [],
        active: body.active,
      },
    },
    { new: true }
  ).lean();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const { id } = await params;
  await Electrician.findByIdAndDelete(id);
  return NextResponse.json({ ok: true });
}

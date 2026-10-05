import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import Report, { REPORT_STATUSES } from "@/models/Report";

const validId = (id: string) => /^[0-9a-fA-F]{24}$/.test(id);

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  const { status } = await req.json();
  if (!REPORT_STATUSES.includes(status)) return NextResponse.json({ error: "Invalid status" }, { status: 400 });
  await connectDB();
  const doc = await Report.findByIdAndUpdate(id, { $set: { status } }, { new: true }).lean();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json(doc);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return unauthorized();
  const { id } = await params;
  if (!validId(id)) return NextResponse.json({ error: "Not found" }, { status: 404 });
  await connectDB();
  const doc = await Report.findByIdAndDelete(id).lean();
  if (!doc) return NextResponse.json({ error: "Not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

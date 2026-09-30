import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import Repair from "@/models/Repair";

const EDITABLE = ["status", "paymentStatus", "estimatedCost", "diagnosisNotes"] as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const { id } = await params;
  const repair = await Repair.findOne({
    $or: [
      { trackingId: id },
      { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : undefined },
    ],
  }).lean();

  if (!repair) {
    return NextResponse.json({ error: "Repair not found" }, { status: 404 });
  }
  return NextResponse.json(repair);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const { id } = await params;
  const body = await req.json();

  const update: Record<string, unknown> = {};
  for (const key of EDITABLE) if (key in body) update[key] = body[key];
  if (body.status) {
    update.$push = {
      statusHistory: { status: body.status, date: new Date(), note: body.note || "" },
    };
  }

  if (!/^[0-9a-fA-F]{24}$/.test(id)) {
    return NextResponse.json({ error: "Repair not found" }, { status: 404 });
  }
  let repair;
  try {
    repair = await Repair.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
  } catch {
    return NextResponse.json({ error: "Invalid value" }, { status: 400 });
  }
  if (!repair) {
    return NextResponse.json({ error: "Repair not found" }, { status: 404 });
  }
  return NextResponse.json(repair);
}

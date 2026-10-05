import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import Order from "@/models/Order";

const EDITABLE = ["status", "paymentStatus"] as const;

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const { id } = await params;
  const order = await Order.findOne({
    $or: [{ orderId: id }, { _id: id.match(/^[0-9a-fA-F]{24}$/) ? id : undefined }],
  }).lean();

  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function PUT(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const { id } = await params;
  if (!/^[0-9a-fA-F]{24}$/.test(id))
    return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const body = await req.json();

  const setFields: Record<string, unknown> = {};
  for (const key of EDITABLE) if (key in body) setFields[key] = body[key];

  const update: Record<string, unknown> = {};
  if (Object.keys(setFields).length > 0) update.$set = setFields;
  if (body.status) {
    update.$push = {
      statusHistory: { status: body.status, date: new Date(), note: body.note || "" },
    };
  }

  let order;
  try {
    order = await Order.findByIdAndUpdate(id, update, { new: true, runValidators: true }).lean();
  } catch (e) {
    return NextResponse.json({ error: `Validation failed: ${e}` }, { status: 400 });
  }
  if (!order) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json(order);
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const { id } = await params;
  if (!/^[0-9a-fA-F]{24}$/.test(id))
    return NextResponse.json({ error: "Order not found" }, { status: 404 });

  const deleted = await Order.findByIdAndDelete(id).lean();
  if (!deleted) return NextResponse.json({ error: "Order not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

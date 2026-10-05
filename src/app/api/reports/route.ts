import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import { normalizePhone } from "@/lib/phone";
import Report, { REPORT_TYPES } from "@/models/Report";

export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const reports = await Report.find().sort({ createdAt: -1 }).limit(500).lean();
  return NextResponse.json({ reports });
}

// Public: customers submit from the About page
export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => ({}));
  const name = typeof body.name === "string" ? body.name.trim() : "";
  const message = typeof body.message === "string" ? body.message.trim() : "";
  const phone = normalizePhone(body.phone);
  const type = REPORT_TYPES.includes(body.type) ? body.type : "complaint";
  const refId = typeof body.refId === "string" ? body.refId.trim().toUpperCase().slice(0, 40) : "";

  if (name.length < 2 || name.length > 100) return NextResponse.json({ error: "errors.name" }, { status: 400 });
  if (!phone) return NextResponse.json({ error: "errors.phone" }, { status: 400 });
  if (message.length < 5 || message.length > 2000) return NextResponse.json({ error: "errors.message" }, { status: 400 });

  await connectDB();
  await Report.create({ name, phone, type, message, refId });
  return NextResponse.json({ ok: true }, { status: 201 });
}

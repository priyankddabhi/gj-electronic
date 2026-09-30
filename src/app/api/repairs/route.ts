import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import Repair from "@/models/Repair";
import { normalizePhone } from "@/lib/phone";

function generateTrackingId() {
  const year = new Date().getFullYear();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `GJE-${year}-${num}`;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const params = req.nextUrl.searchParams;
  const phone = params.get("phone");
  const trackingId = params.get("trackingId");
  const status = params.get("status");
  const limit = parseInt(params.get("limit") || "50", 10);

  const filter: Record<string, unknown> = {};
  if (phone) filter.phone = phone;
  if (trackingId) filter.trackingId = trackingId;
  if (status) filter.status = status;

  const repairs = await Repair.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({ repairs });
}

export async function POST(req: NextRequest) {
  await connectDB();
  const { customerName, phone: rawPhone, deviceType, problemDescription, preferredDate, images } =
    await req.json();
  const phone = normalizePhone(rawPhone);
  if (!phone) return NextResponse.json({ error: "Enter a valid 10-digit mobile number" }, { status: 400 });
  const repair = await Repair.create({
    customerName,
    phone,
    deviceType,
    problemDescription,
    preferredDate,
    images,
    trackingId: generateTrackingId(),
    statusHistory: [{ status: "received", date: new Date(), note: "Repair booked" }],
  });
  return NextResponse.json({ trackingId: repair.trackingId }, { status: 201 });
}

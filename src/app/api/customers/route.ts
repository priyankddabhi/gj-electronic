import { NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import Customer from "@/models/Customer";

export async function GET() {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const customers = await Customer.find({}, { name: 1, phone: 1, createdAt: 1 })
    .sort({ createdAt: -1 })
    .lean();
  return NextResponse.json({ customers });
}

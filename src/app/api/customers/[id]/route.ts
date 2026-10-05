import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import Customer from "@/models/Customer";

// Deletes only the login account; orders and repairs are linked by phone and are kept.
export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const { id } = await params;
  if (!/^[0-9a-fA-F]{24}$/.test(id))
    return NextResponse.json({ error: "Customer not found" }, { status: 404 });

  const deleted = await Customer.findByIdAndDelete(id).lean();
  if (!deleted) return NextResponse.json({ error: "Customer not found" }, { status: 404 });
  return NextResponse.json({ ok: true });
}

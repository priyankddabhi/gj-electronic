import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { getCustomerSession } from "@/lib/customerSession";
import { normalizePhone, phoneVariants } from "@/lib/phone";
import Customer from "@/models/Customer";
import Repair from "@/models/Repair";
import Order from "@/models/Order";

type Tracked = { phone: string; status: string; createdAt: Date; statusHistory?: { status: string; date: Date }[] };

// Anyone with the ID sees the progress only; the logged-in owner sees everything
function statusOnly<T extends Tracked>(doc: T, idField: "orderId" | "trackingId") {
  return {
    [idField]: (doc as unknown as Record<string, string>)[idField],
    status: doc.status,
    createdAt: doc.createdAt,
    statusHistory: (doc.statusHistory || []).map(({ status, date }) => ({ status, date })),
    limited: true,
  };
}

export async function GET(req: NextRequest) {
  const query = req.nextUrl.searchParams.get("q")?.trim();
  const type = req.nextUrl.searchParams.get("type");
  if (!query) return NextResponse.json({ error: "Query required" }, { status: 400 });
  if (type !== "repair" && type !== "order") {
    return NextResponse.json({ error: "Type required (repair or order)" }, { status: 400 });
  }

  await connectDB();
  const session = await getCustomerSession();
  const ownerPhone =
    session && (await Customer.exists({ _id: session.id, phone: session.phone })) ? session.phone : null;

  const samePhone = (p: string) => normalizePhone(p) ?? p;
  const ownerKey = ownerPhone ? samePhone(ownerPhone) : null;
  const phone = normalizePhone(query) ?? (query === ownerPhone ? ownerPhone : null);
  if (phone && phone !== ownerKey) {
    return NextResponse.json({ error: "login-required" }, { status: 403 });
  }

  const Model = type === "repair" ? Repair : Order;
  const idField = type === "repair" ? "trackingId" : "orderId";
  const filter = phone ? { phone: { $in: [...phoneVariants(phone), ownerPhone] } } : { [idField]: query.toUpperCase() };
  const docs = (await Model.find(filter).sort({ createdAt: -1 }).limit(50).lean()) as unknown as (Tracked &
    Record<string, unknown>)[];

  const result = docs.map((d) => (ownerKey && samePhone(d.phone) === ownerKey ? d : statusOnly(d, idField)));
  return NextResponse.json({ [type === "repair" ? "repairs" : "orders"]: result });
}

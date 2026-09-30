import { NextRequest, NextResponse } from "next/server";
import { connectDB } from "@/lib/mongodb";
import { requireAdmin, unauthorized } from "@/lib/adminAuth";
import Order from "@/models/Order";
import Product from "@/models/Product";
import Settings from "@/models/Settings";
import Customer from "@/models/Customer";
import { getCustomerSession } from "@/lib/customerSession";
import { normalizePhone } from "@/lib/phone";

function generateOrderId() {
  const year = new Date().getFullYear();
  const num = Math.floor(1000 + Math.random() * 9000);
  return `ORD-${year}-${num}`;
}

export async function GET(req: NextRequest) {
  if (!(await requireAdmin())) return unauthorized();
  await connectDB();
  const params = req.nextUrl.searchParams;
  const phone = params.get("phone");
  const orderId = params.get("orderId");
  const status = params.get("status");
  const limit = parseInt(params.get("limit") || "50", 10);

  const filter: Record<string, unknown> = {};
  if (phone) filter.phone = phone;
  if (orderId) filter.orderId = orderId;
  if (status) filter.status = status;

  const orders = await Order.find(filter)
    .sort({ createdAt: -1 })
    .limit(limit)
    .lean();

  return NextResponse.json({ orders });
}

export async function POST(req: NextRequest) {
  await connectDB();
  const { customerName, phone: rawPhone, address, deliveryType, items, paymentMethod } = await req.json();
  const phone = normalizePhone(rawPhone);
  if (!phone) return NextResponse.json({ error: "Enter a valid 10-digit mobile number" }, { status: 400 });

  const requested: { productId: string; quantity: number }[] = Array.isArray(items) ? items : [];
  const ids = requested.map((i) => i?.productId);
  if (
    requested.length === 0 ||
    requested.length > 50 ||
    ids.some((id) => typeof id !== "string" || !/^[0-9a-fA-F]{24}$/.test(id)) ||
    requested.some((i) => !Number.isInteger(i.quantity) || i.quantity < 1 || i.quantity > 99)
  ) {
    return NextResponse.json({ error: "Invalid cart" }, { status: 400 });
  }

  const products = await Product.find({ _id: { $in: ids } }).lean();
  const byId = new Map(products.map((p) => [String(p._id), p]));
  const lines = [];
  for (const { productId, quantity } of requested) {
    const product = byId.get(productId);
    if (!product || !product.inStock) {
      return NextResponse.json(
        { error: `${product?.name ?? "A product in your cart"} is no longer available` },
        { status: 409 }
      );
    }
    lines.push({
      productId,
      name: product.name,
      price: product.price,
      quantity,
      image: product.images?.[0] || "",
    });
  }

  const delivery = deliveryType === "pickup" ? "pickup" : "delivery";
  const setting = await Settings.findOne({ key: "deliveryCharge" }).lean();
  const deliveryCharge = delivery === "delivery" ? Number(setting?.value ?? 50) || 0 : 0;
  const total = lines.reduce((sum, l) => sum + l.price * l.quantity, 0) + deliveryCharge;

  const order = await Order.create({
    customerName,
    phone,
    address,
    deliveryType: delivery,
    items: lines,
    total,
    paymentMethod,
    orderId: generateOrderId(),
    statusHistory: [{ status: "placed", date: new Date(), note: "Order placed" }],
  });

  const session = await getCustomerSession();
  if (session && delivery === "delivery" && typeof address === "string" && address.trim()) {
    await Customer.updateOne(
      { _id: session.id, phone: session.phone },
      { $set: { address: address.trim().slice(0, 300) } }
    );
  }
  return NextResponse.json({ orderId: order.orderId }, { status: 201 });
}

import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import { getCustomerSession } from "@/lib/customerSession";
import Customer from "@/models/Customer";
import { MIN_PASSWORD, normalizePhone, phoneVariants } from "@/lib/phone";

const COOKIE_OPTIONS = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
  maxAge: 60 * 60 * 24 * 365,
  path: "/",
};

type CustomerDoc = { _id: unknown; name: string; phone: string; address?: string };

function publicProfile(c: CustomerDoc) {
  return { id: String(c._id), name: c.name, phone: c.phone, address: c.address || "" };
}

async function setSession(c: CustomerDoc) {
  (await cookies()).set(
    "gje-customer",
    JSON.stringify({ id: String(c._id), name: c.name, phone: c.phone }),
    COOKIE_OPTIONS
  );
}

export async function POST(req: NextRequest) {
  try {
    await connectDB();
    const body = await req.json();
    const { action, password } = body;
    const name = typeof body.name === "string" ? body.name.trim() : "";
    const phone = normalizePhone(body.phone);

    if (action === "register") {
      if (name.length < 2) return NextResponse.json({ error: "Please enter your name" }, { status: 400 });
      if (!phone) return NextResponse.json({ error: "Enter a valid 10-digit mobile number" }, { status: 400 });
      if (typeof password !== "string" || password.length < MIN_PASSWORD) {
        return NextResponse.json({ error: `Password must be at least ${MIN_PASSWORD} characters` }, { status: 400 });
      }
      const exists = await Customer.findOne({ phone: { $in: phoneVariants(phone) } });
      if (exists) {
        return NextResponse.json(
          { error: "Phone number already registered. Please login." },
          { status: 400 }
        );
      }
      const customer = await Customer.create({ name, phone, password });
      await setSession(customer);
      return NextResponse.json(publicProfile(customer));
    }

    if (action === "login") {
      const typed = typeof body.phone === "string" ? body.phone.trim() : "";
      if (!typed || typeof password !== "string") {
        return NextResponse.json({ error: "Invalid phone or password" }, { status: 401 });
      }
      // Accounts made before phone validation may have a number saved exactly as typed
      const phones = phone ? [...phoneVariants(phone), typed] : [typed];
      const customer = await Customer.findOne({ phone: { $in: phones }, password }).lean<CustomerDoc>();
      if (!customer) {
        return NextResponse.json({ error: "Invalid phone or password" }, { status: 401 });
      }
      await setSession(customer);
      return NextResponse.json(publicProfile(customer));
    }

    if (action === "logout") {
      (await cookies()).delete("gje-customer");
      return NextResponse.json({ ok: true });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

export async function GET() {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ customer: null });
  await connectDB();
  const customer = await Customer.findOne({ _id: session.id, phone: session.phone }).lean<CustomerDoc>();
  return NextResponse.json({ customer: customer ? publicProfile(customer) : null });
}

// Update profile (name, address) or change password
export async function PUT(req: NextRequest) {
  const session = await getCustomerSession();
  if (!session) return NextResponse.json({ error: "Please log in again" }, { status: 401 });
  await connectDB();
  const customer = await Customer.findOne({ _id: session.id, phone: session.phone });
  if (!customer) return NextResponse.json({ error: "Please log in again" }, { status: 401 });

  const body = await req.json();

  if ("newPassword" in body) {
    if (customer.password !== body.currentPassword) {
      return NextResponse.json({ error: "Current password is wrong" }, { status: 400 });
    }
    if (typeof body.newPassword !== "string" || body.newPassword.length < MIN_PASSWORD) {
      return NextResponse.json({ error: "New password must be at least 6 characters" }, { status: 400 });
    }
    customer.password = body.newPassword;
    await customer.save();
    return NextResponse.json({ ok: true });
  }

  if (typeof body.name === "string") {
    if (body.name.trim().length < 2) {
      return NextResponse.json({ error: "Name is too short" }, { status: 400 });
    }
    customer.name = body.name.trim().slice(0, 80);
  }
  if (typeof body.address === "string") customer.address = body.address.trim().slice(0, 300);
  await customer.save();
  await setSession(customer);
  return NextResponse.json(publicProfile(customer));
}

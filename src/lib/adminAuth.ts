import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";

export async function requireAdmin(): Promise<boolean> {
  const session = (await cookies()).get("gje-admin-session");
  if (!session?.value || !/^[0-9a-fA-F]{24}$/.test(session.value)) return false;
  await connectDB();
  return !!(await Admin.findById(session.value).lean());
}

export function unauthorized() {
  return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
}

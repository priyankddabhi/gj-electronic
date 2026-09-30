import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";
import { connectDB } from "@/lib/mongodb";
import Admin from "@/models/Admin";
import Settings from "@/models/Settings";
import { SITE_THEMES, type SiteTheme } from "@/lib/theme";

async function requireAdmin(): Promise<boolean> {
  const cookieStore = await cookies();
  const session = cookieStore.get("gje-admin-session");
  if (!session?.value) return false;
  await connectDB();
  const admin = await Admin.findById(session.value).lean();
  return !!admin;
}

export async function GET() {
  try {
    await connectDB();
    const all = await Settings.find().lean();
    const settings: Record<string, string> = {};
    for (const s of all) {
      settings[s.key] = s.value;
    }
    if (!settings.deliveryCharge) settings.deliveryCharge = "50";
    if (!settings.theme) settings.theme = "light";
    return NextResponse.json(settings);
  } catch {
    return NextResponse.json({ deliveryCharge: "50", theme: "light" });
  }
}

export async function PUT(req: NextRequest) {
  try {
    if (!(await requireAdmin())) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    const body = await req.json();
    if ("theme" in body && !SITE_THEMES.includes(body.theme as SiteTheme)) {
      return NextResponse.json({ error: "Invalid theme" }, { status: 400 });
    }
    for (const [key, value] of Object.entries(body)) {
      await Settings.updateOne(
        { key },
        { $set: { key, value: String(value) } },
        { upsert: true }
      );
    }
    return NextResponse.json({ ok: true });
  } catch (error) {
    return NextResponse.json({ error: String(error) }, { status: 500 });
  }
}

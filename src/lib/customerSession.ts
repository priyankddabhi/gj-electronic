import { cookies } from "next/headers";

export async function getCustomerSession(): Promise<{ id: string; phone: string } | null> {
  try {
    const raw = (await cookies()).get("gje-customer")?.value;
    if (!raw) return null;
    const { id, phone } = JSON.parse(raw);
    if (typeof id !== "string" || !/^[0-9a-fA-F]{24}$/.test(id) || typeof phone !== "string") return null;
    return { id, phone };
  } catch {
    return null;
  }
}

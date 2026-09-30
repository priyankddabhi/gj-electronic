export const MY_ORDERS_KEY = "gje-my-orders";
export const MY_REPAIRS_KEY = "gje-my-repairs";

export function getSavedIds(key: string): string[] {
  try {
    const parsed = JSON.parse(localStorage.getItem(key) || "[]");
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

export function saveId(key: string, id: string) {
  try {
    const ids = getSavedIds(key).filter((x) => x !== id);
    localStorage.setItem(key, JSON.stringify([id, ...ids].slice(0, 20)));
  } catch {}
}

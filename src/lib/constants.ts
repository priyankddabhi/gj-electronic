export const SHOP_NAME = "GJ Electronic";
export const SHOP_PHONE = "+91 98765 43210";
export const SHOP_WHATSAPP = "919876543210";
export const SHOP_ADDRESS = "Shop No. 12, Shivam Complex, Station Road, Gujarat 360001, India";
export const SHOP_HOURS = "Mon – Sat: 10:00 AM – 8:30 PM (Sunday closed)";
export const GOOGLE_REVIEW_URL = "https://www.google.com/maps/search/?api=1&query=GJ+Electronic";

export const CATEGORIES = [
  "Fans",
  "Lights",
  "Bulbs",
  "Switches",
  "Wires",
  "Motors",
  "Inverters",
  "Heaters",
  "Other",
] as const;

export const DEVICE_TYPES = [
  "fan",
  "light",
  "bulb",
  "mixer",
  "iron",
  "switch",
  "inverter",
  "motor",
  "heater",
  "other",
] as const;

export const REPAIR_STATUSES = [
  "applied",
  "received",
  "diagnosing",
  "repairing",
  "testing",
  "ready",
  "delivered",
] as const;

export const ORDER_STATUSES = [
  "placed",
  "confirmed",
  "dispatched",
  "delivered",
] as const;

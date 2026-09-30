// Accepts "98765 43210", "+91 98765-43210", "09876543210"; returns the 10-digit number or null
export function normalizePhone(input: unknown): string | null {
  if (typeof input !== "string") return null;
  let digits = input.replace(/\D/g, "");
  if (digits.length === 12 && digits.startsWith("91")) digits = digits.slice(2);
  if (digits.length === 11 && digits.startsWith("0")) digits = digits.slice(1);
  return /^[6-9]\d{9}$/.test(digits) ? digits : null;
}

export const MIN_PASSWORD = 6;

// Older records were saved as typed ("0987…", "+91 987…"); match all spellings of one number
export function phoneVariants(tenDigits: string): string[] {
  return [tenDigits, `0${tenDigits}`, `91${tenDigits}`, `+91${tenDigits}`, `+91 ${tenDigits}`];
}

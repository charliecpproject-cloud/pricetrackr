import { z } from "zod";

/**
 * Convert full‑width digits (０‑９) to ASCII, remove currency symbols,
 * commas and spaces, then parse as a number.
 * Returns a number > 0 and ≤ 1,000,000 with at most two decimal places,
 * otherwise returns null.
 */
export function parsePriceYen(input: string): number | null {
  if (typeof input !== "string") return null;

  // 1. Convert full‑width digits to ASCII
  const toAscii = (s: string) =>
    s.replace(/[０-９]/g, (ch) =>
      String.fromCharCode(ch.charCodeAt(0) - 0xFF10 + 0x30)
    );

  // 2. Strip currency symbols, commas and whitespace
  const cleaned = toAscii(input)
    .replace(/[¥￥円,\s]/g, "")
    .trim();

  if (cleaned === "") return null;

  // 3. Validate numeric format
  if (!/^\d+(\.\d+)?$/.test(cleaned)) return null;

  const value = parseFloat(cleaned);
  if (!Number.isFinite(value)) return null;

  // 4. Range check
  if (value <= 0 || value > 1_000_000) return null;

  // 5. Decimal places (max 2)
  const decimalPart = cleaned.split(".")[1];
  if (decimalPart && decimalPart.length > 2) return null;

  return value;
}

/**
 * Convert a datetime‑local string (YYYY-MM-DDTHH:mm) to an ISO‑like
 * timestamp with seconds and JST offset.
 * Returns `${value}:00+09:00` if the input is a valid datetime and not
 * more than 1 day in the future; otherwise returns null.
 */
export function toObservedAt(value: string): string | null {
  if (typeof value !== "string") return null;

  // Expected format: 2024-09-30T14:05
  const datetimeRegex = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}$/;
  if (!datetimeRegex.test(value)) return null;

  // Parse as JST (Asia/Tokyo) – the input does not contain a timezone,
  // so we treat it as JST.
  const [datePart, timePart] = value.split("T");
  const [year, month, day] = datePart.split("-").map(Number);
  const [hour, minute] = timePart.split(":").map(Number);

  // Construct a Date object in UTC that represents the same moment in JST.
  // Using the ISO string with explicit +09:00 offset ensures correct parsing.
  const isoString = `${datePart}T${timePart}:00+09:00`;
  const parsed = new Date(isoString);
  if (isNaN(parsed.getTime())) return null;

  const now = new Date();

  // Allow dates up to 1 day (24 h) in the future
  const diffMs = parsed.getTime() - now.getTime();
  if (diffMs > 24 * 60 * 60 * 1000) return null;

  // Return the required format (seconds forced to 00)
  return `${value}:00+09:00`;
}

/**
 * Zod schema for a price entry form.
 * - product_package_id: UUID string
 * - shop_id: UUID string
 * - is_sale: boolean
 * - notes: optional, trimmed, max 200 characters
 */
export const priceEntrySchema = z.object({
  product_package_id: z.string().uuid(),
  shop_id: z.string().uuid(),
  is_sale: z.boolean(),
  notes: z.string().trim().max(200).optional(),
});

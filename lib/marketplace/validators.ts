/**
 * Validate dữ liệu request cho API Marketplace v2.
 */

export function mustString(value: unknown): value is string {
  return typeof value === "string" && value.trim().length > 0;
}

export function mustNumber(value: unknown): value is number {
  return typeof value === "number" && Number.isFinite(value);
}

export function parsePositiveInt(value: unknown): number | null {
  const n = typeof value === "string" ? Number(value) : typeof value === "number" ? value : NaN;
  if (!Number.isFinite(n)) return null;
  const i = Math.floor(n);
  if (i <= 0) return null;
  return i;
}


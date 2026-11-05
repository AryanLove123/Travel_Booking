import { IsoDate } from "../../models/domain.model";

const ISO_DATE = /^(\d{4})-(\d{2})-(\d{2})$/;
const MS_PER_DAY = 86_400_000;

export function isoToUtcMs(value: string): number | null {
  const match = ISO_DATE.exec(value);
  if (!match) return null;
  const [, y, m, d] = match;
  const ms = Date.UTC(Number(y), Number(m) - 1, Number(d));
  const check = new Date(ms);
  // Rejects overflow such as 2026-02-31.
  if (
    check.getUTCFullYear() !== Number(y) ||
    check.getUTCMonth() !== Number(m) - 1 ||
    check.getUTCDate() !== Number(d)
  ) {
    return null;
  }
  return ms;
}

export function isValidIsoDate(value: string): boolean {
  return isoToUtcMs(value) !== null;
}

export function msToIso(ms: number): IsoDate {
  return new Date(ms).toISOString().slice(0, 10);
}

export function todayIso(now: Date = new Date()): IsoDate {
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

export function addDays(iso: IsoDate, days: number): IsoDate {
  const ms = isoToUtcMs(iso);
  if (ms === null) throw new Error(`Invalid date: ${iso}`);
  return msToIso(ms + days * MS_PER_DAY);
}

export function nightsBetween(checkIn: IsoDate, checkOut: IsoDate): number {
  const a = isoToUtcMs(checkIn);
  const b = isoToUtcMs(checkOut);
  if (a === null || b === null || b <= a) return 0;
  return Math.round((b - a) / MS_PER_DAY);
}

export function stayOverlaps(aIn: IsoDate, aOut: IsoDate, bIn: IsoDate, bOut: IsoDate): boolean {
  return aIn < bOut && bIn < aOut;
}
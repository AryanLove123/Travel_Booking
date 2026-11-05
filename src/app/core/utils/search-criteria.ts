import { SearchCriteria } from "../../models/domain.model";
import { addDays, isValidIsoDate, nightsBetween } from "./date.util";

export const MAX_GUESTS_PER_SEARCH = 16;
export const MAX_ROOMS_PER_SEARCH = 5;
export const MAX_STAY_NIGHTS = 30;

export type CriteriaError =
  | 'destination-required'
  | 'check-in-invalid'
  | 'check-in-past'
  | 'check-out-invalid'
  | 'check-out-before-check-in'
  | 'stay-too-long'
  | 'guests-invalid'
  | 'rooms-invalid';

export const CRITERIA_ERROR_MESSAGES: Record<CriteriaError, string> = {
  'destination-required': 'Choose a destination.',
  'check-in-invalid': 'Enter a valid check-in date.',
  'check-in-past': 'Check-in cannot be in the past.',
  'check-out-invalid': 'Enter a valid check-out date.',
  'check-out-before-check-in': 'Check-out must be after check-in.',
  'stay-too-long': `Stays are limited to ${MAX_STAY_NIGHTS} nights.`,
  'guests-invalid': `Guests must be between 1 and ${MAX_GUESTS_PER_SEARCH}.`,
  'rooms-invalid': `Rooms must be between 1 and ${MAX_ROOMS_PER_SEARCH}.`,
};

export function defaultCriteria(today: string): SearchCriteria {
  return {
    destinationId: '',
    checkIn: addDays(today, 7),
    checkOut: addDays(today, 10),
    guests: 2,
    rooms: 1,
  };
}

export function criteriaToParams(c: SearchCriteria): Record<string, string> {
  return {
    destination: c.destinationId,
    checkIn: c.checkIn,
    checkOut: c.checkOut,
    guests: String(c.guests),
    rooms: String(c.rooms),
  };
}

export function paramsToCriteria(
  get: (key: string) => string | null,
  today: string,
): SearchCriteria {
  const fallback = defaultCriteria(today);
  const toInt = (value: string | null, def: number): number => {
    if (value === null || value.trim() === '') return def;
    const n = Number(value);
    return Number.isFinite(n) ? Math.trunc(n) : def;
  };
  return {
    destinationId: get('destination') ?? '',
    checkIn: get('checkIn') ?? fallback.checkIn,
    checkOut: get('checkOut') ?? fallback.checkOut,
    guests: toInt(get('guests'), fallback.guests),
    rooms: toInt(get('rooms'), fallback.rooms),
  };
}


export function validateCriteria(c: SearchCriteria, today: string): CriteriaError[] {
  const errors: CriteriaError[] = [];
  if (!c.destinationId) errors.push('destination-required');

  if (!isValidIsoDate(c.checkIn)) errors.push('check-in-invalid');
  else if (c.checkIn < today) errors.push('check-in-past');

  if (!isValidIsoDate(c.checkOut)) errors.push('check-out-invalid');
  else if (isValidIsoDate(c.checkIn) && c.checkOut <= c.checkIn) errors.push('check-out-before-check-in');
  else if (nightsBetween(c.checkIn, c.checkOut) > MAX_STAY_NIGHTS) errors.push('stay-too-long');

  if (!Number.isInteger(c.guests) || c.guests < 1 || c.guests > MAX_GUESTS_PER_SEARCH) errors.push('guests-invalid');
  if (!Number.isInteger(c.rooms) || c.rooms < 1 || c.rooms > MAX_ROOMS_PER_SEARCH) errors.push('rooms-invalid');
  return errors;
}
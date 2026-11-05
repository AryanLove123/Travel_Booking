import { AppUser, Booking, IsoDate } from '../../models/domain.model';
import { isBlocking } from '../utils/availability';
import { BOOKING_STATUS_LABELS } from './booking-state';

export type StayPhase = 'upcoming' | 'in-progress' | 'completed';
export type CancelBlockReason = 'not-confirmed' | 'in-progress' | 'completed';

export interface CancelEligibility {
  readonly allowed: boolean;
  readonly reason?: CancelBlockReason;
  readonly message?: string;
}

export interface PayEligibility {
  readonly allowed: boolean;
  readonly message?: string;
}

export function stayPhase(b: Pick<Booking, 'checkIn' | 'checkOut'>, today: IsoDate): StayPhase {
  if (today >= b.checkOut) return 'completed';
  if (today >= b.checkIn) return 'in-progress';
  return 'upcoming';
}

export function formatDay(iso: IsoDate): string {
  return new Intl.DateTimeFormat('en-US', { dateStyle: 'medium', timeZone: 'UTC' }).format(
    new Date(`${iso}T00:00:00Z`),
  );
}

export function canAccessBooking(b: Booking, user: AppUser | null, isAdmin: boolean): boolean {
  return !!user && (b.userId === user.uid || isAdmin);
}

export function stayPassedMessage(checkIn: IsoDate): string {
  return `The check-in date for this stay (${formatDay(checkIn)}) has already passed, so it can no longer be booked or paid for. Please search again with new dates.`;
}

export function paymentEligibility(b: Pick<Booking, 'checkIn'>, today: IsoDate): PayEligibility {
  return b.checkIn < today ? { allowed: false, message: stayPassedMessage(b.checkIn) } : { allowed: true };
}


//A confirmed booking can be cancelled only before its check-in day
export function cancellationEligibility(b: Booking, today: IsoDate): CancelEligibility {
  if (b.status !== 'confirmed') {
    const message =
      b.status === 'cancelled'
        ? 'This booking has already been cancelled.'
        : `This booking is ${BOOKING_STATUS_LABELS[b.status].toLowerCase()}, so as it not confirmed so nothing to cancel.`;

    return { allowed: false, reason: 'not-confirmed', message };
  }
  switch (stayPhase(b, today)) {
    case 'completed':
      return {
        allowed: false,
        reason: 'completed',
        message: `This stay ended on ${formatDay(b.checkOut)}, so it can't be cancelled.`,
      };
    case 'in-progress':
      return {
        allowed: false,
        reason: 'in-progress',
        message: `Your stay started on ${formatDay(b.checkIn)}, so it can no longer be cancelled online. If something has come up, please contact ${b.snapshot.hotelName} directly.`,
      };
    default:
      return { allowed: true };
  }
}

export function upcomingBookings(
  bookings: readonly Booking[],
  matches: (b: Booking) => boolean,
  today: IsoDate,
  nowMs: number,
): Booking[] {
  return bookings.filter((b) => matches(b) && isBlocking(b, nowMs) && b.checkOut > today);
}

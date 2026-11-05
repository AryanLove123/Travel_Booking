import { BookingStatus } from "../../models/domain.model";

const TRANSITIONS: Readonly<Record<BookingStatus, readonly BookingStatus[]>> = {
  pending_payment: ['confirmed', 'payment_failed', 'payment_cancelled', 'cancelled'],
  payment_failed: ['pending_payment', 'cancelled'],
  payment_cancelled: ['pending_payment', 'cancelled'],
  confirmed: ['cancelled'],
  cancelled: [],
};

export function canTransition(from: BookingStatus, to: BookingStatus): boolean {
  return TRANSITIONS[from].includes(to);
}

export const BOOKING_STATUS_LABELS: Readonly<Record<BookingStatus, string>> = {
  pending_payment: 'Awaiting payment',
  confirmed: 'Confirmed',
  payment_failed: 'Payment failed',
  payment_cancelled: 'Payment cancelled',
  cancelled: 'Cancelled',
};
import { computed, inject, Injectable, signal } from '@angular/core';
import {
  BookingSnapshot,
  IsoDate,
  PriceBreakdown,
  GuestDetails,
  BookingStatus,
  Booking,
  PaymentReference,
} from '../../models/domain.model';
import { STORAGE_KEYS, StorageService } from '../storage/storage.service';
import { isBookingList } from '../storage/guard';
import { newConfirmationCode, newId } from '../utils/id.util';
import { PENDING_HOLD_MINUTES } from '../utils/availability';
import { canTransition } from './booking-state';
import { cancellationEligibility } from './booking-rules';
import { todayIso } from '../utils/date.util';

export interface NewBookingInput {
  userId: string;
  destinationId: string;
  hotelId: string;
  roomId: string;
  snapshot: BookingSnapshot;
  checkIn: IsoDate;
  checkOut: IsoDate;
  guests: number;
  rooms: number;
  price: PriceBreakdown;
  guest: GuestDetails;
}

export class BookingTransitionError extends Error {
  constructor(from: BookingStatus, to: BookingStatus) {
    super(`Illegal booking transition: ${from} -> ${to}`);
    this.name = 'BookingTransitionError';
  }
}

export class BookingRuleError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'BookingRuleError';
  }
}

@Injectable({ providedIn: 'root' })
export class BookingStore {
  storgae = inject(StorageService);
  bookings = signal<Booking[]>([]);

  confirmedBookings = computed(() => this.bookings().filter((b) => b.status === 'confirmed'));

  hydrate(): void{
    this.bookings.set(this.storgae.read(STORAGE_KEYS.bookings, isBookingList) ?? []);
  }

  byId(id: string): Booking | undefined {
    return this.bookings().find((b) => b.id === id);
  }

  forUser(userId: string): Booking[] {
    return this.bookings()
      .filter((b) => b.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  isFirstBooking(userId: string): boolean{
    return !this.bookings().some((b) =>b.userId === userId && b.status === 'confirmed');
  }

  findActivePending(userId: string, roomId: string, checkIn: IsoDate, checkOut: IsoDate, nowMs: number): Booking | undefined{
    return this.bookings().find(
      (b) => 
        b.userId === userId && 
        b.roomId === roomId &&
        b.checkIn === checkIn &&
        b.checkOut === checkOut &&
        b.status === 'pending_payment' &&
        b.holdExpiresAt !== null &&
        b.holdExpiresAt > nowMs,
    );
  }

  createPending(input: NewBookingInput, nowMs: number = Date.now()): Booking{
    const existingCodes = new Set(this.bookings().map((b) => b.confirmationCode));
    const stamp = new Date(nowMs).toISOString();
    const booking: Booking ={
      id: newId('bk'),
      confirmationCode: newConfirmationCode(existingCodes),
      ...input,
      status: 'pending_payment',
      payment: null,
      holdExpiresAt: nowMs + PENDING_HOLD_MINUTES * 60_000,
      cancelReason: null,
      createdAt: stamp,
      updatedAt: stamp,
    };
    this.bookings.update((list) => [...list, booking]);
    this.persist();
    return booking;
  }

  //before payment confirmation attaching a reference to the particular booking for tracking purpose 
  attachPaymentRef(id: string, payment: PaymentReference, nowMs: number = Date.now()): Booking{
    return this.patch(id, (b) => ({
      ...b,
      payment,
      holdExpiresAt: b.status === 'pending_payment' ? nowMs + PENDING_HOLD_MINUTES * 60_000 : b.holdExpiresAt,
    }), nowMs);
  }

  //moves a failed or cancelled booking back to pending state so that the user can retry
  reopenForPayment(id: string, nowMs: number = Date.now()) : Booking{
    return this.transition(id, 'pending_payment', nowMs, (b) =>({
      ...b,
      payment: null,
      holdExpiresAt: nowMs + PENDING_HOLD_MINUTES * 60_000,
      cancelReason: null,
    }));
  }

  confirmPayment(id: string, payment: PaymentReference, nowMs: number = Date.now()): Booking{
    if(payment.status !== 'succeeded'){
      throw new Error('Only a succeeded payment can confirm a booking');
    }
    return this.transition(id, 'confirmed', nowMs, (b) => ({...b, payment, holdExpiresAt: null, cancelReason: null}));
  }

  markPaymentFailed(id: string, payment: PaymentReference, nowMs: number = Date.now()): Booking{
    return this.transition(id, 'payment_failed', nowMs, (b)=> ({...b, payment, holdExpiresAt: null}));
  }

  markPaymentCancelled(id: string, payment: PaymentReference, nowMs: number = Date.now()): Booking {
    return this.transition(id, 'payment_cancelled', nowMs, (b) => ({ ...b, payment, holdExpiresAt: null }));
  }

  requestCancellation(id: string, nowMs: number = Date.now()): Booking{
    const booking = this.byId(id);
    if(!booking) throw new BookingRuleError("We couldn't find that booking.");
    const eligibility = cancellationEligibility(booking, todayIso(new Date(nowMs)));
    if(!eligibility.allowed) throw new BookingRuleError(eligibility.message ?? "This booking can't be cancelled.");
    return this.cancel(id, 'customer-request', nowMs);
  }

  cancel(id: string, reason: string, nowMs: number = Date.now()): Booking {
    return this.transition(id, 'cancelled', nowMs, (b) => ({ ...b, holdExpiresAt: null, cancelReason: reason }));
  }

  //we will be wrapping every action method with tranisition so that we do a validation check
  transition(id: string, to: BookingStatus, nowMs: number, change: (b: Booking) => Booking) : Booking {
    const current = this.byId(id);
    if (!current) throw new Error(`Booking ${id} not found`);
    if (!canTransition(current.status, to)) throw new BookingTransitionError(current.status, to);
    return this.patch(id, (b) => ({ ...change(b), status: to }), nowMs);
  }

  /**
   The action method passes a callback as they don't have the booking object 
  and inside patch helper method it first unwrap the booking object and then run the callback
  which basically add the customfileds
  **/
  patch(id: string, change: (b: Booking) => Booking, nowMs: number): Booking{
    let updated: Booking | undefined;
    this.bookings.update((list) =>
      list.map((b) => {
        if (b.id !== id) return b;
        updated = { ...change(b), updatedAt: new Date(nowMs).toISOString() };
        return updated;
      }),
    );
    if (!updated) throw new Error(`Booking ${id} not found`);
    this.persist();
    return updated;
  }

  persist(): void{
    this.storgae.write(STORAGE_KEYS.bookings, this.bookings());
  }

  
}

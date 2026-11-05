import { inject, Injectable, signal } from '@angular/core';
import { AppUser, Booking, GuestDetails, PaymentReference, PaymentStatus, SearchCriteria } from '../../models/domain.model';
import { CatalogStore } from '../data/catalog.store';
import { BookingStore } from '../booking/booking.store';
import { PaymentGateway } from './payment-gateway';
import { validateCriteria } from '../utils/search-criteria';
import { nightsBetween, todayIso } from '../utils/date.util';
import { availableUnits, fitsGuests } from '../utils/availability';
import { calculatePrice } from '../utils/pricing';
import { PaymentResult, PaymentSession } from './payment.models';
import { paymentEligibility, stayPassedMessage } from '../booking/booking-rules';

export type CheckoutErrorCode =
  | 'room-unavailable'
  | 'invalid-criteria'
  | 'capacity-exceeded'
  | 'not-found'
  | 'stay-date-passed'
  | 'payment-start-failed';

export class CheckoutError extends Error {
  constructor(code: CheckoutErrorCode, message: string) {
    super(message);
    this.name = 'CheckoutError';
  }
}

export type FinalizeOutcome =
  | { kind: 'confirmed'; booking: Booking }
  | { kind: 'processing'; booking: Booking }
  | { kind: 'failed'; booking: Booking; reason: string }
  | { kind: 'cancelled'; booking: Booking }
  | { kind: 'verification-failed'; booking: Booking; reason: string }
  | { kind: 'inventory-conflict'; booking: Booking }
  | { kind: 'expired'; booking: Booking; message: string }
  | { kind: 'not-found' };

@Injectable({
  providedIn: 'root',
})
export class CheckoutService {
  catalog = inject(CatalogStore);
  bookings = inject(BookingStore);
  gateway = inject(PaymentGateway);

  inFlight = new Set<string>();
  busy = signal<boolean>(false);

  createBooking(
    user: AppUser,
    roomId: string,
    criteria: Omit<SearchCriteria, 'destinationId'>,
    guest: GuestDetails,
    nowMs: number = Date.now(),
  ): Booking {
    const detail = this.catalog.visibleRoomDetail(roomId);
    if (!detail)
      throw new CheckoutError('not-found', 'This room is no longer available for booking.');

    const { room, hotel, destination } = detail;

    const full: SearchCriteria = { ...criteria, destinationId: destination.id };

    if (validateCriteria(full, todayIso(new Date(nowMs))).length > 0) {
      throw new CheckoutError('invalid-criteria', 'Please check your dates and guest numbers.');
    }
    if (!fitsGuests(room, criteria.guests, criteria.rooms)) {
      throw new CheckoutError(
        'capacity-exceeded',
        `This room accomodates ${room.maxGuests} guests per unit.`,
      );
    }

    const existing = this.bookings.findActivePending(user.uid, room.id, criteria.checkIn, criteria.checkOut, nowMs);
    if(existing) return existing;

    const units = availableUnits(room, criteria.checkIn, criteria.checkOut, this.bookings.bookings(), nowMs);
    if (units < criteria.rooms) {
      throw new CheckoutError('room-unavailable', 'Sorry, this room is no longer available for those dates.');
    }

    const price = calculatePrice({
      nightlyRate: room.pricePerNight,
      nights: nightsBetween(criteria.checkIn, criteria.checkOut),
      rooms: criteria.rooms,
      isFirstBooking: this.bookings.isFirstBooking(user.uid),
    });

    return this.bookings.createPending(
      {
        userId: user.uid,
        destinationId: destination.id,
        hotelId: hotel.id,
        roomId: room.id,
        snapshot: {
          destinationName: destination.name,
          hotelName: hotel.name,
          roomName: room.name,
          address: hotel.address,
          imageUrl: room.imageUrls[0] ?? hotel.imageUrls[0] ?? '',
          maxGuests: room.maxGuests,
          beds: room.beds,
          bathrooms: room.bathrooms,
          freeCancellation: room.freeCancellation,
        },
        checkIn: criteria.checkIn,
        checkOut: criteria.checkOut,
        guests: criteria.guests,
        rooms: criteria.rooms,
        price,
        guest,
      },
      nowMs,
    ); 
  }

  async startPayment(bookingId: string, nowMs: number = Date.now()): Promise<PaymentSession>{
    if(this.inFlight.has(bookingId)){
      throw new CheckoutError('payment-start-failed', 'A payment is already being started for this booking.');
    }
    this.begin(bookingId);
    try{
      let booking = this.bookings.byId(bookingId);
      if(!booking) throw new CheckoutError('not-found', 'Booking not found');

      const isUnpaid = booking.status === 'pending_payment' || booking.status === 'payment_failed' || booking.status === 'payment_cancelled';
      if(isUnpaid){
        const when = paymentEligibility(booking, todayIso(new Date(nowMs)));
        if(!when.allowed){
          this.bookings.cancel(bookingId,'stay-date-passed',nowMs);
          throw new CheckoutError('stay-date-passed',stayPassedMessage(booking.checkIn));
        }

        try{
          this.assertStillAvailable(booking,nowMs);
        }
        catch(error){
          this.bookings.cancel(bookingId,'inventory-conflict', nowMs);
          throw error;
        }
      }
      if(booking.status === 'payment_failed' || booking.status === 'payment_cancelled'){
        booking = this.bookings.reopenForPayment(bookingId,nowMs);
      }

      if(booking.payment && booking.payment.status === 'created'){
        return {paymentId: booking.payment.paymentId, bookingId, checkoutPath: `/pay/${bookingId}`};
      }

      try{
        const session = await this.gateway.initiatePayment({
          bookingId,
          amount: booking.price.total,
          currency: booking.price.currency,
          description: `${booking.snapshot.roomName}, ${booking.snapshot.hotelName}`,
        });
        this.bookings.attachPaymentRef(bookingId, reference(session.paymentId, 'created'), nowMs);
        return session;
      }
      catch (error){
        if(error instanceof CheckoutError) throw error;
        throw new CheckoutError('payment-start-failed', 'We could not start the payment. Please try again.');
      }
    }
    finally{
      this.end(bookingId);
    }
  }

  async finalize(bookingId: string, nowMs: number = Date.now()): Promise<FinalizeOutcome>{
    const booking = this.bookings.byId(bookingId);
    if (!booking) return { kind: 'not-found' };
    
    if (booking.status === 'confirmed') return { kind: 'confirmed', booking };
    if (booking.status === 'cancelled') {
      if (booking.cancelReason === 'inventory-conflict') return { kind: 'inventory-conflict', booking };
      if (booking.cancelReason === 'stay-date-passed') {
        return { kind: 'expired', booking, message: stayPassedMessage(booking.checkIn) };
      }
      return { kind: 'cancelled', booking };
    }
    if (booking.status === 'payment_failed') {
      return { kind: 'failed', booking, reason: 'The payment did not go through.' };
    }
    if (booking.status === 'payment_cancelled') return { kind: 'cancelled', booking };

    const when = paymentEligibility(booking, todayIso(new Date(nowMs)));

    if (!when.allowed) {
      const cancelled = this.bookings.cancel(booking.id, 'stay-date-passed', nowMs);
      return { kind: 'expired', booking: cancelled, message: stayPassedMessage(booking.checkIn) };
    }

    const paymentId = booking.payment?.paymentId;
    if (!paymentId) {
      return { kind: 'verification-failed', booking, reason: 'No payment has been started for this booking.' };
    }
    if (this.inFlight.has(bookingId)) {
      return { kind: 'processing', booking };
    }

    this.begin(bookingId);

    try{
      let result: PaymentResult;
      try{
        result = await this.gateway.getPaymentResult(paymentId);
      }
      catch{
        return {
          kind: 'verification-failed',
          booking,
          reason: 'We could not retrieve the payment result. Your booking is not confirmed yet; please try again.',
        };
      }

      if (
        result.paymentId !== paymentId ||
        result.bookingId !== booking.id ||
        result.currency !== booking.price.currency ||
        result.amount !== booking.price.total
      ) {
        return {
          kind: 'verification-failed',
          booking,
          reason: 'The payment result does not match this booking, so it was not confirmed.',
        };
      }

      const ref =  reference(paymentId, result.status, result.updatedAt);
      switch (result.status) {
        case 'succeeded': {
          const others = this.bookings.bookings();
          const stillFree =
            availableUnits({ id: booking.roomId, totalUnits: this.totalUnitsFor(booking) }, booking.checkIn, booking.checkOut, others, nowMs, booking.id) >=
            booking.rooms;
          if (!stillFree) {
            const cancelled = this.bookings.cancel(booking.id, 'inventory-conflict', nowMs);
            return { kind: 'inventory-conflict', booking: cancelled };
          }
          return { kind: 'confirmed', booking: this.bookings.confirmPayment(booking.id, ref, nowMs) };
        }
        case 'failed':
          return {
            kind: 'failed',
            booking: this.bookings.markPaymentFailed(booking.id, ref, nowMs),
            reason: result.failureReason ?? 'The payment did not go through.',
          };
        case 'cancelled':
          return { kind: 'cancelled', booking: this.bookings.markPaymentCancelled(booking.id, ref, nowMs) };
        case 'processing':
        case 'created':
          this.bookings.attachPaymentRef(booking.id, ref, nowMs);
          return { kind: 'processing', booking: this.bookings.byId(booking.id) ?? booking };
      }
    }
    finally{
      this.end(bookingId);
    }
  }

  assertStillAvailable(booking: Booking, nowMs: number): void{
    const units = availableUnits(
      { id: booking.roomId, totalUnits: this.totalUnitsFor(booking) },
      booking.checkIn,
      booking.checkOut,
      this.bookings.bookings(),
      nowMs,
      booking.id,
    );
    if (units < booking.rooms) {
      throw new CheckoutError('room-unavailable', 'Sorry, this room has been booked by someone else in the meantime.');
    }
  }

  totalUnitsFor(booking: Booking): number {
    return this.catalog.roomById(booking.roomId)?.totalUnits ?? 0;
  }

  begin(id: string): void{
    this.inFlight.add(id);
    this.busy.set(true);
  }

  end(id: string): void {
    this.inFlight.delete(id);
    this.busy.set(this.inFlight.size > 0);
  }
}

function reference(paymentId: string, status: PaymentStatus, at: string = new Date().toISOString()): PaymentReference {
  return { paymentId, provider: 'local-mock', status, updatedAt: at };
}

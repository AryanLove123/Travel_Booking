import { Component, computed, inject } from '@angular/core';
import { Booking } from '../../../models/domain.model';
import { AuthService } from '../../../core/auth/auth.service';
import { stayPhase, paymentEligibility } from '../../../core/booking/booking-rules';
import { BookingStore } from '../../../core/booking/booking.store';
import { todayIso } from '../../../core/utils/date.util';
import { CommonModule } from '@angular/common';
import { StayRangePipe } from '../../../shared/pipes/stay-range.pipe';
import { BookingStatusClassPipe, BookingStatusPipe } from '../../../shared/pipes/booking-status.pipe';
import { RouterLink } from '@angular/router';

interface BookingRow {
  readonly booking: Booking;
  readonly expired: boolean;
  readonly unpaid: boolean;
  readonly completed: boolean;
  readonly inProgress: boolean;
}

@Component({
  selector: 'app-booking-page',
  imports: [CommonModule, RouterLink, StayRangePipe, BookingStatusClassPipe, BookingStatusPipe],
  templateUrl: './booking-page.html',
  styleUrl: './booking-page.scss',
})
export class BookingPage {
  auth = inject(AuthService);
  store = inject(BookingStore);

  // Recomputes when either the signed-in user or any booking changes.
  rows = computed<BookingRow[]>(() => {
    const user = this.auth.user();
    this.store.bookings();
    if (!user) return [];
    const today = todayIso();
    return this.store.forUser(user.uid).map((booking) => {
      const unpaid = booking.status === 'pending_payment' || booking.status === 'payment_failed' || booking.status === 'payment_cancelled';
      const phase = stayPhase(booking, today);
      return {
        booking,
        unpaid,
        expired: (unpaid && !paymentEligibility(booking, today).allowed) || booking.cancelReason === 'stay-date-passed',
        completed: booking.status === 'confirmed' && phase === 'completed',
        inProgress: booking.status === 'confirmed' && phase === 'in-progress',
      };
    });
  });
}

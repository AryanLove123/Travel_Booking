import { Component, computed, inject, input, signal } from '@angular/core';
import { AuthService } from '../../../core/auth/auth.service';
import { BookingRuleError, BookingStore } from '../../../core/booking/booking.store';
import { ToastService } from '../../../shared/ui/toast.service';
import {
  canAccessBooking,
  stayPhase,
  cancellationEligibility,
} from '../../../core/booking/booking-rules';
import { todayIso } from '../../../core/utils/date.util';
import { CommonModule } from '@angular/common';
import { StayRangePipe } from '../../../shared/pipes/stay-range.pipe';
import { BookingStatusClassPipe, BookingStatusPipe } from '../../../shared/pipes/booking-status.pipe';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-booking-detail-page',
  imports: [RouterLink, CommonModule, StayRangePipe, BookingStatusClassPipe, BookingStatusPipe],
  templateUrl: './booking-detail-page.html',
  styleUrl: './booking-detail-page.scss',
})
export class BookingDetailPage {
  store = inject(BookingStore);
  auth = inject(AuthService);
  toast = inject(ToastService);

  bookingId = input.required<string>();
  confirming = signal(false);
  error = signal<string | null>(null);

  booking = computed(() => {
    const b = this.store.byId(this.bookingId());
    return b && canAccessBooking(b, this.auth.user(), this.auth.isAdmin()) ? b : undefined;
  });

  phase = computed(() => {
    const b = this.booking();
    return b ? stayPhase(b, todayIso()) : 'upcoming';
  });

  eligibility = computed(() => {
    const b = this.booking();
    return b ? cancellationEligibility(b, todayIso()) : null;
  });

  cancel(id: string): void {
    try {
      this.store.requestCancellation(id);
      this.error.set(null);
      this.toast.success('Booking cancelled. The room has been released.');
    } catch (e) {
      this.error.set(e instanceof BookingRuleError ? e.message : 'We couldn’t cancel this booking. Please try again.');
    } finally {
      this.confirming.set(false);
    }
  }
}

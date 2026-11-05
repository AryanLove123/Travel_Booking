import { Component, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { BookingStore } from '../../../core/booking/booking.store';
import { LocalMockGateway } from '../../../core/payment/local-mock-gateway';
import { MOCK_OUTCOMES, MockOutcome } from '../../../core/payment/payment.models';
import { FormControl, FormGroup, ReactiveFormsModule } from '@angular/forms';
import { canAccessBooking, paymentEligibility } from '../../../core/booking/booking-rules';
import { todayIso } from '../../../core/utils/date.util';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-mock-gateway-page',
  imports: [RouterLink, ReactiveFormsModule, CommonModule],
  templateUrl: './mock-gateway-page.html',
  styleUrl: './mock-gateway-page.scss',
})
export class MockGatewayPage {
  bookings = inject(BookingStore);
  gateway = inject(LocalMockGateway);
  router = inject(Router);
  auth = inject(AuthService);

  bookingId = input.required<string>();
  outcomes = MOCK_OUTCOMES;
  busy = signal(false);

  form = new FormGroup({
    outcome: new FormControl<MockOutcome>('success', {nonNullable: true})
  });

  booking() {
    const b = this.bookings.byId(this.bookingId());
    return b && canAccessBooking(b, this.auth.user(), this.auth.isAdmin()) ? b : undefined;
  }

  stale(): string | null {
    const b = this.booking();
    return b ? (paymentEligibility(b, todayIso()).message ?? null) : null;
  }

  async pay(): Promise<void> {
    const booking = this.booking();
    if (booking && this.stale()) return; // never complete a payment for a stay that has already started
    const paymentId = booking?.payment?.paymentId;
    if (!booking || !paymentId || this.busy()) return;
    this.busy.set(true);
    try {
      await this.gateway.completeSession(paymentId, this.form.controls.outcome.value);
    } finally {
      this.busy.set(false);
    }
    await this.router.navigate(['/booking', booking.id, 'result']);
  }
}

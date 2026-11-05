import { CommonModule } from '@angular/common';
import { Component, DestroyRef, effect, inject, input, signal, untracked } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { StayRangePipe } from '../../../shared/pipes/stay-range.pipe';
import { AuthService } from '../../../core/auth/auth.service';
import { BookingStore } from '../../../core/booking/booking.store';
import { CheckoutService, FinalizeOutcome } from '../../../core/payment/checkout.service';
import { canAccessBooking } from '../../../core/booking/booking-rules';

/**
 * It NEVER trusts the URL: on load it asks
 * CheckoutService.finalize(), which re-fetches the gateway result, verifies it
 * and only then moves the booking to `confirmed`.
 */
@Component({
  selector: 'app-payment-result-page',
  imports: [RouterLink, CommonModule, StayRangePipe],
  templateUrl: './payment-result-page.html',
  styleUrl: './payment-result-page.scss',
})
export class PaymentResultPage {
  checkout = inject(CheckoutService);
  destroyed = inject(DestroyRef);
  router = inject(Router);
  auth = inject(AuthService);
  bookings = inject(BookingStore);

  bookingId = input.required<string>();
  outcome = signal<FinalizeOutcome | null>(null);
  loading = signal(true);
  retrying = signal(false);
  retryError = signal<string | null>(null);
  alive = true;

  constructor() {
    this.destroyed.onDestroy(() => (this.alive = false));

    effect(() => {
      this.bookingId();
      untracked(() => void this.load());
    });
  }

  confirmed() {
    const o = this.outcome();
    return o?.kind === 'confirmed' ? o : null;
  }

  expiredMessage(): string {
    const o = this.outcome();
    return o?.kind === 'expired' ? o.message : '';
  }

  reason(): string {
    const o = this.outcome();
    return o && (o.kind === 'failed' || o.kind === 'verification-failed') ? o.reason : '';
  }

  async load(): Promise<void> {
    this.loading.set(true);
    const mine = this.bookings.byId(this.bookingId());
    const result: FinalizeOutcome =
      mine && canAccessBooking(mine, this.auth.user(), this.auth.isAdmin())
        ? await this.checkout.finalize(this.bookingId())
        : { kind: 'not-found' };
    if (!this.alive) return;
    this.outcome.set(result);
    this.loading.set(false);
  }

  protected async retry(): Promise<void> {
    this.retrying.set(true);
    this.retryError.set(null);
    try {
      const session = await this.checkout.startPayment(this.bookingId());
      await this.router.navigateByUrl(session.checkoutPath);
    } catch (error) {
      this.retryError.set(error instanceof Error ? error.message : 'Could not restart payment.');
    } finally {
      this.retrying.set(false);
    }
  }
}

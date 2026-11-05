import { Component, computed, inject, input, signal } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { BookingStore } from '../../../core/booking/booking.store';
import { CatalogStore } from '../../../core/data/catalog.store';
import { CheckoutError, CheckoutService } from '../../../core/payment/checkout.service';
import { nightsBetween, todayIso } from '../../../core/utils/date.util';
import { CRITERIA_ERROR_MESSAGES, paramsToCriteria, validateCriteria } from '../../../core/utils/search-criteria';
import { calculatePrice } from '../../../core/utils/pricing';
import { fitsGuests, availableUnits } from '../../../core/utils/availability';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { StayRangePipe } from '../../../shared/pipes/stay-range.pipe';
import { ImgFallbackDirective } from '../../../shared/directives/img-fallback.directive';
import { StarRating } from '../../../shared/ui/star-rating';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-checkout-page',
  imports: [RouterLink, CommonModule, ReactiveFormsModule, StayRangePipe, ImgFallbackDirective, StarRating],
  templateUrl: './checkout-page.html',
  styleUrl: './checkout-page.scss',
})
export class CheckoutPage {
  catalog = inject(CatalogStore);
  bookings = inject(BookingStore);
  checkout = inject(CheckoutService);
  auth = inject(AuthService);
  router = inject(Router);

  roomId = input.required<string>();
  checkIn = input<string>();
  checkOut = input<string>();
  guests = input<string>();
  rooms = input<string>();

  messages = CRITERIA_ERROR_MESSAGES;
  submitting = signal(false);
  attempted = signal(false);
  serverError = signal<string | null>(null);

  detail = computed(() => this.catalog.visibleRoomDetail(this.roomId()));
  criteria = computed(() => {
    const raw: Record<string, string | undefined> = {
      destination: this.detail()?.destination.id,
      checkIn: this.checkIn(),
      checkOut: this.checkOut(),
      guests: this.guests(),
      rooms: this.rooms(),
    };
    return paramsToCriteria((k) => raw[k] ?? null, todayIso());
  });
  errors = computed(() => validateCriteria(this.criteria(), todayIso()));
  stayParams = computed(() => {
    const { checkIn, checkOut, guests, rooms } = this.criteria();
    return { checkIn, checkOut, guests, rooms };
  });

  price = computed(() => {
    const c = this.criteria();
    const userId = this.auth.user()?.uid ?? '';
    return calculatePrice({
      nightlyRate: this.detail()?.room.pricePerNight ?? 0,
      nights: nightsBetween(c.checkIn, c.checkOut),
      rooms: c.rooms,
      isFirstBooking: this.bookings.isFirstBooking(userId),
    });
  });

  issues = computed<string | null>(() => {
    const d = this.detail();
    if (!d || this.errors().length > 0) return null;
    const c = this.criteria();
    if (!fitsGuests(d.room, c.guests, c.rooms)) {
      return `This room accomodates ${d.room.maxGuests} guests per unit, so ${c.guests} guests won’t fit in ${c.rooms} rooms`;
    }
    if (availableUnits(d.room, c.checkIn, c.checkOut, this.bookings.bookings(), Date.now()) < c.rooms) {
      return 'Sorry, this room is no longer available for those dates. Please go back and choose different dates or another room.';
    }
    return null;
  });

  form = new FormGroup({
    fullName: new FormControl(this.auth.user()?.displayName ?? '', { nonNullable: true, validators: [Validators.required, Validators.minLength(2), Validators.maxLength(80)] }),
    email: new FormControl(this.auth.user()?.email ?? '', { nonNullable: true, validators: [Validators.required, Validators.email] }),
    phone: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(10), Validators.minLength(8), Validators.pattern(/^[0-9]+$/)] }),
    specialRequests: new FormControl('', { nonNullable: true, validators: [Validators.maxLength(300)] }),
    terms: new FormControl(false, { nonNullable: true, validators: [Validators.requiredTrue] }),
  });

  invalid(name: keyof typeof this.form.controls): boolean{
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.attempted());
  }

  async submit(): Promise<void>{
    this.attempted.set(true);
    this.form.markAllAsTouched();
    const user = this.auth.user();

    if(this.form.invalid || this.errors().length > 0 || !user || this.submitting()) return;

    this.submitting.set(true);
    this.serverError.set(null);

    try{
      const c = this.criteria();
      const { fullName, email, phone, specialRequests } = this.form.getRawValue();
      const booking = this.checkout.createBooking(
        user,
        this.roomId(),
        { checkIn: c.checkIn, checkOut: c.checkOut, guests: c.guests, rooms: c.rooms },
        { fullName: fullName.trim(), email: email.trim(), phone: phone.trim(), specialRequests: specialRequests.trim()},
      );

      const session = await this.checkout.startPayment(booking.id);
      await this.router.navigateByUrl(session.checkoutPath);
    }
    catch (error){
      this.serverError.set(error instanceof CheckoutError ? error.message: 'Something went wrong. Please try again.');
    }
    finally{
      this.submitting.set(false);
    }
  }


}

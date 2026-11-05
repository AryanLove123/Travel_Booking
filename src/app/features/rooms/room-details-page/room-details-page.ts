import { Component, computed, inject, input, signal } from '@angular/core';
import { CatalogStore } from '../../../core/data/catalog.store';
import { BookingStore } from '../../../core/booking/booking.store';
import { Router, RouterLink } from '@angular/router';
import { CRITERIA_ERROR_MESSAGES, criteriaToParams, paramsToCriteria, validateCriteria } from '../../../core/utils/search-criteria';
import { SearchCriteria } from '../../../models/domain.model';
import { todayIso } from '../../../core/utils/date.util';
import { fitsGuests, availableUnits } from '../../../core/utils/availability';
import { calculatePrice } from '../../../core/utils/pricing';
import { StarRating } from '../../../shared/ui/star-rating';
import { CommonModule } from '@angular/common';
import { StayRangePipe } from '../../../shared/pipes/stay-range.pipe';
import { ImgFallbackDirective } from '../../../shared/directives/img-fallback.directive';

@Component({
  selector: 'app-room-details-page',
  imports: [RouterLink, StarRating, CommonModule, StayRangePipe, ImgFallbackDirective],
  templateUrl: './room-details-page.html',
  styleUrl: './room-details-page.scss',
})
export class RoomDetailsPage {
  catalog = inject(CatalogStore);
  bookings = inject(BookingStore);
  router = inject(Router);

  roomId = input.required<string>();
  checkIn = input<string>();
  checkOut = input<string>();
  guests = input<string>();
  rooms = input<string>();

  messages = CRITERIA_ERROR_MESSAGES;

  detail = computed(() => this.catalog.visibleRoomDetail(this.roomId()));
  images = computed(() => {
    const d = this.detail();
    if (!d) return [''];
    const list = [...d.room.imageUrls, ...d.hotel.imageUrls];
    return list.length > 0 ? list : [''];
  });

  activeImage = signal(0);
  feePercent = 5;

  criteria = computed<SearchCriteria>(() => {
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
  searchParams = computed(() => criteriaToParams(this.criteria()));

  fits = computed(() => {
    const d = this.detail();
    return !!d && fitsGuests(d.room, this.criteria().guests, this.criteria().rooms);
  });
  units = computed(() => {
    const d = this.detail();
    if (!d || this.errors().length > 0) return 0;
    const c = this.criteria();
    return availableUnits(d.room, c.checkIn, c.checkOut, this.bookings.bookings(), Date.now());
  });
  price = computed(() => {
    const d = this.detail();
    const c = this.criteria();
    return calculatePrice({
      nightlyRate: d?.room.pricePerNight ?? 0,
      nights: this.errors().length > 0 ? 0 : Math.round((Date.parse(c.checkOut) - Date.parse(c.checkIn)) / 86_400_000),
      rooms: c.rooms,
    });
  });

  reserve(): void {
    const c = this.criteria();
    void this.router.navigate(['/checkout', this.roomId()], {
      queryParams: { checkIn: c.checkIn, checkOut: c.checkOut, guests: c.guests, rooms: c.rooms },
    });
  }
}

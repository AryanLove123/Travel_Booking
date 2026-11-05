import { Component, computed, inject } from '@angular/core';
import { BookingStore } from '../../../core/booking/booking.store';
import { CatalogStore } from '../../../core/data/catalog.store';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-dashboard-page.ts',
  imports: [CommonModule, RouterLink],
  templateUrl: './dashboard-page.ts.html',
  styleUrl: './dashboard-page.ts.scss',
})
export class DashboardPage {
  catalog = inject(CatalogStore);
  bookings = inject(BookingStore);

  protected readonly confirmed = computed(() => this.bookings.confirmedBookings().length);
  protected readonly revenue = computed(() => this.bookings.confirmedBookings().reduce((sum, b) => sum + b.price.total, 0));
  protected readonly stats = computed(() => {
    const d = this.catalog.destinations();
    const h = this.catalog.hotels();
    const r = this.catalog.rooms();
    return [
      { label: 'Destinations', value: d.length, sub: `${d.filter((x) => x.published).length} published`, link: '/admin/destinations' },
      { label: 'Hotels', value: h.length, sub: `${h.filter((x) => x.published).length} published`, link: '/admin/hotels' },
      { label: 'Rooms', value: r.length, sub: `${r.reduce((n, x) => n + x.totalUnits, 0)} units`, link: '/admin/rooms' },
    ];
  });
}

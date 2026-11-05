import { Component, inject } from '@angular/core';
import { upcomingBookings } from '../../../../core/booking/booking-rules';
import { BookingStore } from '../../../../core/booking/booking.store';
import { CatalogStore } from '../../../../core/data/catalog.store';
import { todayIso } from '../../../../core/utils/date.util';
import { Hotel } from '../../../../models/domain.model';
import { ToastService } from '../../../../shared/ui/toast.service';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-hotel-admin-page',
  imports: [RouterLink],
  templateUrl: './hotel-admin-page.html',
  styleUrl: './hotel-admin-page.scss',
})
export class HotelAdminPage {
  protected readonly catalog = inject(CatalogStore);
  private readonly bookings = inject(BookingStore);
  private readonly toast = inject(ToastService);

  protected toggle(h: Hotel): void {
    this.catalog.setHotelPublished(h.id, !h.published);
    this.toast.success(`${h.name} is now ${h.published ? 'hidden' : 'published'}.`);
  }
  protected remove(h: Hotel): void {
    const rooms = this.catalog.roomsOf(h.id).length;
    const upcoming = upcomingBookings(this.bookings.bookings(), (b) => b.hotelId === h.id, todayIso(), Date.now()).length;
    const warn = upcoming ? `\n\n ${upcoming} upcoming booking(s) exist at this hotel.` : '';
    if (!confirm(`Delete “${h.name}”?${rooms ? `\n\nThis also deletes ${rooms} room(s).` : ''}${warn}`)) return;
    this.catalog.deleteHotel(h.id);
    this.toast.success(`${h.name} deleted.`);
  }
}

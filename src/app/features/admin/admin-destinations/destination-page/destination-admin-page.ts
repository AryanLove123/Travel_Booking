import { Component, inject } from '@angular/core';
import { BookingStore } from '../../../../core/booking/booking.store';
import { CatalogStore } from '../../../../core/data/catalog.store';
import { todayIso } from '../../../../core/utils/date.util';
import { Destination } from '../../../../models/domain.model';
import { ToastService } from '../../../../shared/ui/toast.service';
import { RouterLink } from '@angular/router';
import { upcomingBookings } from '../../../../core/booking/booking-rules';

@Component({
  selector: 'app-destination-admin-page',
  imports: [RouterLink],
  templateUrl: './destination-admin-page.html',
  styleUrl: './destination-admin-page.scss',
})
export class DestinationAdminPage {
  protected readonly catalog = inject(CatalogStore);
  private readonly bookings = inject(BookingStore);
  private readonly toast = inject(ToastService);

  protected toggle(d: Destination): void {
    this.catalog.setDestinationPublished(d.id, !d.published);
    this.toast.success(`${d.name} is now ${d.published ? 'hidden' : 'published'}.`);
  }

  protected remove(d: Destination): void {
    const hotels = this.catalog.hotelsOf(d.id);
    const rooms = hotels.reduce((n, h) => n + this.catalog.roomsOf(h.id).length, 0);
    const detail = hotels.length ? `\n\nThis also deletes ${hotels.length} hotel(s) and ${rooms} room(s).` : '';
    const upcoming = upcomingBookings(this.bookings.bookings(), (b) => b.destinationId === d.id, todayIso(), Date.now()).length;
    const warn = upcoming ? `\n\n ${upcoming} upcoming booking(s) exist here.` : '';
    if (!confirm(`Delete “${d.name}”?${detail}${warn}`)) return;
    this.catalog.deleteDestination(d.id);
    this.toast.success(`${d.name} deleted.`);
  }
}

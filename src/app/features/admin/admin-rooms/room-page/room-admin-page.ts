import { Component, inject } from '@angular/core';
import { upcomingBookings } from '../../../../core/booking/booking-rules';
import { BookingStore } from '../../../../core/booking/booking.store';
import { CatalogStore } from '../../../../core/data/catalog.store';
import { todayIso } from '../../../../core/utils/date.util';
import { Room } from '../../../../models/domain.model';
import { ToastService } from '../../../../shared/ui/toast.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';

@Component({
  selector: 'app-room-admin-page',
  imports: [CommonModule, RouterLink],
  templateUrl: './room-admin-page.html',
  styleUrl: './room-admin-page.scss',
})
export class RoomAdminPage {
  protected readonly catalog = inject(CatalogStore);
  private readonly bookings = inject(BookingStore);
  private readonly toast = inject(ToastService);

  protected toggle(r: Room): void {
    this.catalog.setRoomPublished(r.id, !r.published);
    this.toast.success(`${r.name} is now ${r.published ? 'hidden' : 'published'}.`);
  }
  protected remove(r: Room): void {
    const upcoming = upcomingBookings(this.bookings.bookings(), (b) => b.roomId === r.id, todayIso(), Date.now()).length;
    const warn = upcoming ? `\n\n ${upcoming} upcoming booking(s) exist for this room.` : '';
    if (!confirm(`Delete “${r.name}”? Existing bookings keep their saved details.${warn}`)) return;
    this.catalog.deleteRoom(r.id);
    this.toast.success(`${r.name} deleted.`);
  }
}

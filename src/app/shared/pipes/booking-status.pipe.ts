import { Pipe, PipeTransform } from '@angular/core';
import { BookingStatus } from '../../models/domain.model';
import { BOOKING_STATUS_LABELS } from '../../core/booking/booking-state';

@Pipe({ name: 'bookingStatus' })
export class BookingStatusPipe implements PipeTransform {
  transform(status: BookingStatus) {
    return BOOKING_STATUS_LABELS[status];
  }
}

@Pipe({ name: 'bookingStatusClass' })
export class BookingStatusClassPipe implements PipeTransform {
  transform(status: BookingStatus) {
    switch (status) {
      case 'confirmed':
        return 'badge badge--success';
      case 'pending_payment':
        return 'badge badge--warn';
      case 'payment_failed':
      case 'cancelled':
        return 'badge badge--danger';
      default:
        return 'badge';
    }
  }
}

import { Booking, IsoDate, Room } from "../../models/domain.model";
import { stayOverlaps } from "./date.util";

export const PENDING_HOLD_MINUTES = 15; //duration for which a pending(unpaid) booking hold in the inventory 

/**
 * A booking blocks inventory when it is confirmed, or pending with an
 * unexpired hold. Failed, cancelled and expired bookings release inventory.
 */
export function isBlocking(booking: Booking, nowMs: number): boolean {
  switch (booking.status) {
    case 'confirmed':
      return true;
    case 'pending_payment':
      return booking.holdExpiresAt !== null && booking.holdExpiresAt > nowMs;
    default:
      return false;
  }
}

/** Units of `roomId` already taken for the requested stay. */
export function occupiedUnits(
  roomId: string,
  checkIn: IsoDate,
  checkOut: IsoDate,
  bookings: readonly Booking[],
  nowMs: number,
  ignoreBookingId?: string,
): number {
  let occupied = 0;
  for (const b of bookings) {
    if (b.roomId !== roomId || b.id === ignoreBookingId) continue;
    if (!isBlocking(b, nowMs)) continue;
    if (stayOverlaps(checkIn, checkOut, b.checkIn, b.checkOut)) occupied += b.rooms;
  }
  return occupied;
}

export function availableUnits(
  room: Pick<Room, 'id' | 'totalUnits'>,
  checkIn: IsoDate,
  checkOut: IsoDate,
  bookings: readonly Booking[],
  nowMs: number,
  ignoreBookingId?: string,
): number {
  return Math.max(0, room.totalUnits - occupiedUnits(room.id, checkIn, checkOut, bookings, nowMs, ignoreBookingId));
}

/** Checks whether the selected rooms have sufficient capacity for the guests. */
export function fitsGuests(room: Pick<Room, 'maxGuests'>, guests: number, rooms: number): boolean {
  return guests >= 1 && rooms >= 1 && room.maxGuests * rooms >= guests;
}
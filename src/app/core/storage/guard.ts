import { Booking, CatalogData, SavedSearch } from "../../models/domain.model";

function isRecord(value: unknown): value is Record<string, unknown>{
    return typeof value === 'object' && value !== null && !Array.isArray(value);
}

export function isRecordList<T>(value: unknown): value is T[] {
  return Array.isArray(value);
}

function everyRecordHas(list: unknown, ...keys: string[]): boolean {
  return (
    Array.isArray(list) &&
    list.every((item) => isRecord(item) && keys.every((k) => item[k] !== undefined && item[k] !== null))
  );
}

export function isCatalogData(value: unknown): value is CatalogData {
  return (
    isRecord(value) &&
    everyRecordHas(value['destinations'], 'id', 'name', 'published') &&
    everyRecordHas(value['hotels'], 'id', 'destinationId', 'name', 'published') &&
    everyRecordHas(value['rooms'], 'id', 'hotelId', 'name', 'pricePerNight', 'totalUnits', 'published')
  );
}

export function isBookingList(value: unknown): value is Booking[] {
  return everyRecordHas(value, 'id', 'roomId', 'checkIn', 'checkOut', 'status', 'price', 'snapshot', 'guest');
}

export function isSavedSearchList(value: unknown): value is SavedSearch[] {
  return everyRecordHas(value, 'id', 'userId', 'criteria');
}

export function isMeta(value: unknown): value is {seededAt: string}{
    return isRecord(value) && typeof value['seededAt'] === 'string';
}
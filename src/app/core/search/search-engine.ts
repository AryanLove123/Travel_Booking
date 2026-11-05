import {
  Booking,
  CatalogData,
  Hotel,
  Room,
  SearchCriteria,
  SearchFilters,
  SearchResult,
} from '../../models/domain.model';
import { availableUnits, fitsGuests } from '../utils/availability';
import { nightsBetween } from '../utils/date.util';

export interface SearchRequest {
  requestId: number;
  criteria: SearchCriteria;
  filters: SearchFilters;
  catalog: CatalogData;
  bookings: readonly Booking[];
  nowMs: number;
}

export type SearchResponse =
  | { requestId: number; ok: true; results: SearchResult[] }
  | { requestId: number; ok: false; error: string };

export function relevanceScore(
  room: Room,
  hotel: Hotel,
  filters: SearchFilters,
  nights: number,
): number {
  const quality = hotel.rating * 20;
  const popularity = Math.min(10, Math.log10(hotel.reviewCount + 1) * 3);
  const valuePenalty = Math.min(25, room.pricePerNight / 40);
  const amenityBonus = filters.amenities.filter((a) => room.amenities.includes(a)).length * 4;
  const longStayBonus = nights >= 7 && room.freeCancellation ? 2 : 0;
  return (
    Math.round((quality + popularity - valuePenalty + amenityBonus + longStayBonus) * 100) / 100
  );
}

export function runSearch(request: SearchRequest): SearchResult[] {
  const { criteria, filters, catalog, bookings, nowMs } = request;
  const nights = nightsBetween(criteria.checkIn, criteria.checkOut);
  if (nights <= 0 || !criteria.destinationId) return [];

  const destination = catalog.destinations.find((d) => d.id === criteria.destinationId);
  if (!destination || !destination.published) return [];

  const hotelsById = new Map(
    catalog.hotels
      .filter((h) => h.destinationId === destination.id && h.published)
      .map((h) => [h.id, h]),
  );

  const results: SearchResult[] = [];

  for (const room of catalog.rooms) {
    if (!room.published) continue;
    const hotel = hotelsById.get(room.hotelId);
    if (!hotel) continue;

    if (!fitsGuests(room, criteria.guests, criteria.rooms)) continue;

    if (filters.propertyTypes.length > 0 && !filters.propertyTypes.includes(hotel.propertyType))
      continue;
    if (filters.maxPricePerNight !== null && room.pricePerNight > filters.maxPricePerNight)
      continue;
    if (hotel.rating < filters.minRating) continue;
    if (filters.amenities.length > 0 && !filters.amenities.every((a) => room.amenities.includes(a)))
      continue;

    const units = availableUnits(room, criteria.checkIn, criteria.checkOut, bookings, nowMs);
    if (units < criteria.rooms) continue;

    results.push({
      room,
      hotel,
      destination,
      availableUnits: units,
      nights,
      estimatedSubtotal: Math.round(room.pricePerNight * nights * criteria.rooms * 100) / 100,
      relevance: relevanceScore(room, hotel, filters, nights),
    });
  }
  return sortResults(results, filters.sort);
}

export function sortResults(results: SearchResult[], sort: SearchFilters['sort']): SearchResult[] {
  const byName = (a: SearchResult, b: SearchResult) => a.room.name.localeCompare(b.room.name);
  const copy = [...results];
  switch (sort) {
    case 'price-asc':
      return copy.sort((a, b) => a.room.pricePerNight - b.room.pricePerNight || byName(a, b));
    case 'price-desc':
      return copy.sort((a, b) => b.room.pricePerNight - a.room.pricePerNight || byName(a, b));
    case 'rating':
      return copy.sort((a, b) => b.hotel.rating - a.hotel.rating || byName(a, b));
    default:
      return copy.sort((a, b) => b.relevance - a.relevance || byName(a, b));
  }
}

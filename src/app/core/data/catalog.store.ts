import { computed, inject, Injectable, signal } from '@angular/core';
import { CatalogData, Destination, Hotel, Room } from '../../models/domain.model';
import { STORAGE_KEYS, StorageService } from '../storage/storage.service';
import { isCatalogData } from '../storage/guard';
import { buildSeedCatalog } from './seed-data';
import { newId } from '../utils/id.util';

export type DestinationInput = Omit<Destination, 'id'> & { id?: string };
export type HotelInput = Omit<Hotel, 'id'> & { id?: string };
export type RoomInput = Omit<Room, 'id'> & { id?: string };

export interface DeleteSummary {
  hotels: number;
  rooms: number;
}

@Injectable({ providedIn: 'root' })
export class CatalogStore {
  storage = inject(StorageService);
  destinations = signal<Destination[]>([]);
  hotels = signal<Hotel[]>([]);
  rooms = signal<Room[]>([]);
  ready = signal(false);

  data = computed<CatalogData>(() => ({
    destinations: this.destinations(),
    hotels: this.hotels(),
    rooms: this.rooms(),
  }));

  visibleCatalog = computed<CatalogData>(() => {
    const destinations = this.destinations().filter((d) => d.published);
    const destinationIds = new Set(destinations.map((d) => d.id));
    const hotels = this.hotels().filter((h) => h.published && destinationIds.has(h.destinationId));
    const hotelIds = new Set(hotels.map((h) => h.id));
    const rooms = this.rooms().filter((r) => r.published && hotelIds.has(r.hotelId));
    return { destinations, hotels, rooms };
  });

  visibleDestinations = computed(() => this.visibleCatalog().destinations);

  destinationMap = computed(() => new Map(this.destinations().map((d) => [d.id, d])));
  hotelMap = computed(() => new Map(this.hotels().map((h) => [h.id, h])));
  roomMap = computed(() => new Map(this.rooms().map((r) => [r.id, r])));

  hydrate(): void {
    const stored = this.storage.read(STORAGE_KEYS.catalog, isCatalogData);
    const catalog = stored ?? buildSeedCatalog();
    this.apply(catalog);
    if (!stored) this.persist();
    this.ready.set(true);
  }

  //.....................Destinations.............//

  saveDestination(input: DestinationInput): Destination {
    const destination: Destination = { ...input, id: input.id ?? newId('dest') };
    this.destinations.update((list) => upsert(list, destination));
    this.persist();
    return destination;
  }

  deleteDestination(id: string): DeleteSummary {
    const hotelIds = new Set(this.hotelsOf(id).map((h) => h.id));
    const rooms =  this.rooms().filter((r) => hotelIds.has(r.hotelId));
    this.rooms.update((list) => list.filter((r) => !hotelIds.has(r.hotelId)));
    this.hotels.update((list) => list.filter((h) => h.destinationId != id));
    this.destinations.update((list) => list.filter((d) => d.id != id));
    this.persist();
    return {hotels: hotelIds.size, rooms: rooms.length};
  }

  setDestinationPublished(id: string, published: boolean): void{
    const current =  this.destinationById(id);
    if(current) this.saveDestination({...current, published});
  }

  //....................Hotels....................//

  saveHotel(input: HotelInput): Hotel {
    const hotel: Hotel = { ...input, id: input.id ?? newId('hotel') };
    this.hotels.update((list) => upsert(list, hotel));
    this.persist();
    return hotel;
  }

  deleteHotel(id: string): DeleteSummary {
    const roomCount = this.roomsOf(id).length;
    this.rooms.update((list) => list.filter((r) => r.hotelId !== id));
    this.hotels.update((list) => list.filter((h) => h.id !== id));
    this.persist();
    return { hotels: 1, rooms: roomCount };
  }

  setHotelPublished(id: string, published: boolean): void {
    const current = this.hotelById(id);
    if (current) this.saveHotel({ ...current, published });
  }

  //....................Rooms.....................//

  saveRoom(input: RoomInput): Room {
    const room: Room = { ...input, id: input.id ?? newId('room') };
    this.rooms.update((list) => upsert(list, room));
    this.persist();
    return room;
  }

  deleteRoom(id: string): void {
    this.rooms.update((list) => list.filter((r) => r.id !== id));
    this.persist();
  }

  setRoomPublished(id: string, published: boolean): void {
    const current = this.roomById(id);
    if (current) this.saveRoom({ ...current, published });
  }

  //....................Lookups...................//

  destinationById(id: string): Destination | undefined {
    return this.destinationMap().get(id);
  }
  hotelById(id: string): Hotel | undefined {
    return this.hotelMap().get(id);
  }
  roomById(id: string): Room | undefined {
    return this.roomMap().get(id);
  }
  hotelsOf(destinationId: string): Hotel[] {
    return this.hotels().filter((h) => h.destinationId === destinationId);
  }
  roomsOf(hotelId: string): Room[] {
    return this.rooms().filter((r) => r.hotelId === hotelId);
  }

  visibleRoomDetail(roomId: string): { room: Room; hotel: Hotel; destination: Destination } | null {
    const room = this.roomById(roomId);
    const hotel = room && this.hotelById(room.hotelId);
    const destination = hotel && this.destinationById(hotel.destinationId);
    if (!room || !hotel || !destination) return null;
    if (!room.published || !hotel.published || !destination.published) return null;
    return { room, hotel, destination };
  }

  //.................Private Methods............//

  private apply(catalog: CatalogData): void {
    this.destinations.set(catalog.destinations);
    this.hotels.set(catalog.hotels);
    this.rooms.set(catalog.rooms);
  }

  private persist(): void {
    this.storage.write(STORAGE_KEYS.catalog, this.data());
  }
}

function upsert<T extends { id: string }>(list: T[], item: T): T[] {
  const index = list.findIndex((x) => x.id === item.id);
  if (index === -1) return [...list, item];
  const copy = [...list];
  copy[index] = item;
  return copy;
}

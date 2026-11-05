import { inject, Injectable, signal } from '@angular/core';
import { MigrationReport, SCHEMA_VERSION, STORAGE_KEYS, StorageService } from '../storage/storage.service';
import { CatalogStore } from './catalog.store';
import { BookingStore } from '../booking/booking.store';
import { SavedSearchStore } from './saved-search.store';
import { isCatalogData, isMeta } from '../storage/guard';
import { buildSeedCatalog } from './seed-data';

@Injectable({
  providedIn: 'root',
})
export class DataBootstarpService {
  private storage = inject(StorageService);
  private schemaVersion = inject(SCHEMA_VERSION);
  private catalog = inject(CatalogStore);
  private bookings = inject(BookingStore);
  private savedSearches = inject(SavedSearchStore);

  migrations: MigrationReport[] = [];

  ready = signal<boolean>(false);

  initalize(now: Date = new Date()): void{
    this.migrations = this.storage.migrateAll();
    this.seedIfNeeded(now);
    this.hydrateStores();
    this.ready.set(true);
  }

  seedIfNeeded(now: Date = new Date()): void{
    const hasMeta = this.storage.read(STORAGE_KEYS.meta, isMeta) !== null;
    let catalog = this.storage.read(STORAGE_KEYS.catalog, isCatalogData);

    if(!catalog){
      catalog = buildSeedCatalog();
      this.storage.write(STORAGE_KEYS.catalog,catalog);
    }
    if(!hasMeta){
      this.storage.write(STORAGE_KEYS.meta, {seededAt: now.toISOString(), schemaVersion: this.schemaVersion});
    }
  }

  private hydrateStores(): void{
    this.catalog.hydrate();
    this.bookings.hydrate();
    this.savedSearches.hydrate();
  }
}

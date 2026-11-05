import { inject, Injectable, signal } from '@angular/core';
import { STORAGE_KEYS, StorageService } from '../storage/storage.service';
import { SavedSearch, SearchCriteria } from '../../models/domain.model';
import { isSavedSearchList } from '../storage/guard';
import { newId } from '../utils/id.util';

@Injectable({ providedIn: 'root' })
export class SavedSearchStore {
  storage = inject(StorageService);
  items = signal<SavedSearch[]>([]);

  hydrate(): void {
    this.items.set(this.storage.read(STORAGE_KEYS.savedSearches, isSavedSearchList) ?? []);
  }

  forUser(userId: string): SavedSearch[] {
    return this.items()
      .filter((s) => s.userId === userId)
      .sort((a, b) => b.createdAt.localeCompare(a.createdAt));
  }

  add(userId: string, label: string, criteria: SearchCriteria): SavedSearch {
    const duplicate = this.items().find((s) => s.userId === userId && sameCriteria(s.criteria, criteria));
    if (duplicate) return duplicate;
    const item: SavedSearch = {
      id: newId('ss'),
      userId,
      label: label.trim() || 'Saved search',
      criteria,
      createdAt: new Date().toISOString(),
    };
    this.items.update((list) => [...list, item]);
    this.persist();
    return item;
  }

  remove(id: string): void {
    this.items.update((list) => list.filter((s) => s.id !== id));
    this.persist();
  }

  persist(): void {
    this.storage.write(STORAGE_KEYS.savedSearches, this.items());
  }
  
}

export function sameCriteria(a: SearchCriteria, b: SearchCriteria): boolean {
  return (
    a.destinationId === b.destinationId &&
    a.checkIn === b.checkIn &&
    a.checkOut === b.checkOut &&
    a.guests === b.guests &&
    a.rooms === b.rooms
  );
}

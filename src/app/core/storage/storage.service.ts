import { inject, Injectable, InjectionToken, PLATFORM_ID } from '@angular/core';
import { migrateEnvelope, MigrationRegistry, MIGRATIONS, VersionedPayload } from './migration';
import { isPlatformBrowser } from '@angular/common';

export const STORAGE_SCHEMA_VERSION = 1;

export const SCHEMA_VERSION = new InjectionToken<number>('SCHEMA_VERSION', {
  providedIn: 'root',
  factory: () => STORAGE_SCHEMA_VERSION,
});
export const STORAGE_MIGRATIONS = new InjectionToken<MigrationRegistry>('STORAGE_MIGRATIONS', {
  providedIn: 'root',
  factory: () => MIGRATIONS,
});

export const STORAGE_KEYS = {
  meta: 'tb.meta',
  catalog: 'tb.catalog',
  bookings: 'tb.bookings',
  savedSearches: 'tb.savedSearches',
  paymentSessions: 'tb.paymentSessions',
  session: 'tb.session',
  demoRole: 'tb.demoRole',
} as const;

export type StorageKey = (typeof STORAGE_KEYS)[keyof typeof STORAGE_KEYS];

export type KeyMigrationStatus =
  'current' | 'migrated' | 'backed-up-newer' | 'backed-up-corrupt' | 'backed-up-failed';

export interface MigrationReport {
  key: StorageKey;
  status: KeyMigrationStatus;
  detail?: string;
}

@Injectable({
  providedIn: 'root',
})
export class StorageService {
  private isBrowser = isPlatformBrowser(inject(PLATFORM_ID));
  private version = inject(SCHEMA_VERSION);
  private registry = inject(STORAGE_MIGRATIONS);
  private memory = new Map<string, string>();

  private parse(raw: string | null): VersionedPayload | null {
    if (raw === null) return null;
    try {
      const parsed: unknown = JSON.parse(raw);
      return isPayload(parsed) ? parsed : null;
    } catch {
      return null;
    }
  }

  private getRaw(key: string): string | null {
    if (this.isBrowser) {
      try {
        const value = localStorage.getItem(key);
        if (value !== null) return value;
      } catch {
        return null;
      }
    }
    return this.memory.get(key) ?? null;
  }

  private setRaw(key: string, raw: string): boolean {
    this.memory.set(key, raw);
    if (!this.isBrowser) return true;
    try {
      localStorage.setItem(key, raw);
      return true;
    } catch {
      return false;
    }
  }

  private quarantine(
    key: StorageKey,
    raw: string,
    status: KeyMigrationStatus,
    detail: string,
  ): MigrationReport {
    this.setRaw(`${key}.backup`, raw);
    this.remove(key);
    return { key, status, detail };
  }

  read<T>(key: StorageKey, guard: (value: unknown) => value is T): T | null {
    const payload = this.parse(this.getRaw(key));
    if(!payload || payload.v !== this.version) return null;
    return guard(payload.data) ? payload.data : null;
  }

  write<T>(key: StorageKey, data: T): boolean{
    return this.setRaw(key, JSON.stringify({v: this.version, data} satisfies VersionedPayload)); 
  }

  remove(key: StorageKey): void{
    this.memory.delete(key);
    if(!this.isBrowser) return;

    try{
      localStorage.removeItem(key);
    }
    catch{

    }
  }

  removeAll(): void{
    (Object.values(STORAGE_KEYS) as StorageKey[]).forEach((k) => this.remove(k));
  }

  migrateAll(): MigrationReport[]{
    const reports: MigrationReport[] = [];
    for(const key of Object.values(STORAGE_KEYS) as StorageKey[]){
      const raw = this.getRaw(key);
      if(raw === null) continue;

      const payload = this.parse(raw);
      if(!payload){
        reports.push(this.quarantine(key, raw, 'backed-up-corrupt', 'Not valid versioned JSON'));
        continue;
      }

      const outcome = migrateEnvelope(key, payload, this.version, this.registry);
      switch(outcome.status){
        case 'current': 
          reports.push({key, status: 'current'});
          break;
        case 'migrated': 
          this.setRaw(key, JSON.stringify(outcome.payload));
          reports.push({key, status: 'migrated', detail: `v${payload.v} → v${outcome.payload.v}`})
          break;
        case 'newer': 
          reports.push(this.quarantine(key,raw,'backed-up-newer', `Stored v${payload.v}, app understands v${this.version}`));
          break;
        case 'failed': 
          reports.push(this.quarantine(key, raw, 'backed-up-failed', outcome.reason));
          break;
      }
    }
    return reports;
  }
}

function isPayload(value: unknown): value is VersionedPayload {
  return (
    typeof value === 'object' &&
    value !== null &&
    typeof (value as { v?: unknown }).v === 'number' &&
    'data' in value
  );
}

import { Component, computed, inject, signal } from '@angular/core';
import { CatalogStore } from '../../../core/data/catalog.store';
import { ActivatedRoute, Router } from '@angular/router';
import { BookingStore } from '../../../core/booking/booking.store';
import { AuthService } from '../../../core/auth/auth.service';
import { SearchWorkerService } from '../../../core/search/search-worker.service';
import {
  DEFAULT_FILTERS,
  PROPERTY_TYPES,
  PropertyType,
  SearchCriteria,
  SearchFilters,
  SearchResult,
  SortKey,
} from '../../../models/domain.model';
import {
  CRITERIA_ERROR_MESSAGES,
  criteriaToParams,
  paramsToCriteria,
  validateCriteria,
} from '../../../core/utils/search-criteria';
import { takeUntilDestroyed, toObservable, toSignal } from '@angular/core/rxjs-interop';
import { todayIso } from '../../../core/utils/date.util';
import { switchMap } from 'rxjs/internal/operators/switchMap';
import { tap } from 'rxjs/internal/operators/tap';
import { catchError } from 'rxjs/internal/operators/catchError';
import { map, of } from 'rxjs';
import { SearchForm } from '../search-form/search-form';
import { SavedSearchStore } from '../../../core/data/saved-search.store';
import { ToastService } from '../../../shared/ui/toast.service';
import { ResultCard } from '../result-card/result-card';

type SearchState =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'error' }
  | { status: 'done'; results: SearchResult[] };

const PAGE_SIZE = 6;

@Component({
  selector: 'app-search-page',
  imports: [SearchForm, ResultCard],
  templateUrl: './search-page.html',
  styleUrl: './search-page.scss',
})
export class SearchPage {
  catalog = inject(CatalogStore);
  router = inject(Router);
  route = inject(ActivatedRoute);
  bookings = inject(BookingStore);
  savedSearches = inject(SavedSearchStore);
  auth = inject(AuthService);
  worker = inject(SearchWorkerService);
  toast = inject(ToastService);

  propertyTypes = PROPERTY_TYPES;
  ratingOptions = [0, 4, 4.5, 4.8];
  messages = CRITERIA_ERROR_MESSAGES;

  queryParmas = toSignal(this.route.queryParamMap, { requireSync: true });
  criteria = computed<SearchCriteria>(() =>
    paramsToCriteria((k) => this.queryParmas().get(k), todayIso()),
  );
  errors = computed(() => validateCriteria(this.criteria(), todayIso()));

  filters = signal<SearchFilters>(DEFAULT_FILTERS);
  page = signal(1);
  state = signal<SearchState>({ status: 'idle' });

  payload = computed(() => {
    if (this.errors().length > 0) return null;
    return {
      criteria: this.criteria(),
      filters: this.filters(),
      catalog: this.catalog.visibleCatalog(),
      bookings: this.bookings.bookings(),
      nowMs: Date.now(),
    };
  });

  results = computed(() => {
    console.log(this.errors());
    const s = this.state();
    return s.status === 'done' ? s.results : [];
  });

  totalPages = computed(() => Math.max(1, Math.ceil(this.results().length / PAGE_SIZE)));
  currentPage = computed(() => Math.min(this.page(), this.totalPages()));
  pageItems = computed(() => {
    const start = (this.currentPage() - 1) * PAGE_SIZE;
    return this.results().slice(start, start + PAGE_SIZE);
  });

  destinationName = computed(
    () => this.catalog.destinationById(this.criteria().destinationId)?.name || '',
  );
  headline = computed(() => {
    const s = this.state();
    const dest = this.destinationName() || 'your destination';
    if (s.status === 'loading') return `Searching for rooms in ${dest}...`;
    if (s.status === 'error') return `Error searching for rooms in ${dest}.`;
    if (s.status === 'done' && s.results.length === 0) return `No rooms found in ${dest}.`;
    return `Rooms found in ${dest}:`;
  });

  amenityOptions = computed(() => {
    const dest = this.criteria().destinationId;
    const hotelIds = new Set(
      this.catalog
        .visibleCatalog()
        .hotels.filter((h) => h.destinationId === dest)
        .map((h) => h.id),
    );
    const all = new Set<string>();
    for (const r of this.catalog.visibleCatalog().rooms) {
      if (hotelIds.has(r.hotelId)) {
        for (const a of r.amenities) {
          all.add(a);
        }
      }
    }
    return Array.from(all).sort();
  });

  priceBounds = computed(() => {
    const dest = this.criteria().destinationId;
    const hotelIds = new Set(
      this.catalog
        .visibleCatalog()
        .hotels.filter((h) => h.destinationId === dest)
        .map((h) => h.id),
    );
    const prices = this.catalog
      .visibleCatalog()
      .rooms.filter((r) => hotelIds.has(r.hotelId))
      .map((r) => r.pricePerNight);
    if (prices.length === 0) return { min: 0, max: 500 };
    return {
      min: Math.floor(Math.min(...prices) / 10) * 10,
      max: Math.ceil(Math.max(...prices) / 10) * 10,
    };
  });

  maxPriceLabel = computed(() => `$${this.filters().maxPricePerNight ?? this.priceBounds().max}`);
  anyFilterActive = computed(() => {
    const f = this.filters();
    return (
      f.propertyTypes.length > 0 ||
      f.maxPricePerNight !== null ||
      f.minRating > 0 ||
      f.amenities.length > 0
    );
  });

  constructor() {
    toObservable(this.payload)
      .pipe(
        tap((p) => this.state.set(p ? { status: 'loading' } : { status: 'idle' })),
        switchMap((p) =>
          p
            ? this.worker.search(p).pipe(
                map((results): SearchState => ({ status: 'done', results })),
                catchError(() => of<SearchState>({ status: 'error' })),
              )
            : of<SearchState>({ status: 'idle' }),
        ),
        takeUntilDestroyed(),
      )
      .subscribe((s) => this.state.set(s));
  }

  onSearch(criteria: SearchCriteria): void {
    this.page.set(1);
    this.router.navigate([], { queryParams: criteriaToParams(criteria) });
  }

  toggleType(type: PropertyType): void {
    this.updateFilters((f) => ({ ...f, propertyTypes: toggle(f.propertyTypes, type) }));
  }

  setMaxPrice(value: number): void {
    const max = this.priceBounds().max;
    this.updateFilters((f) => ({ ...f, maxPricePerNight: value >= max ? null : value }));
  }

  setMinRating(value: string): void {
    this.updateFilters((f) => ({ ...f, minRating: Number(value) }));
  }
  
  setSort(value: string): void {
    this.updateFilters((f) => ({ ...f, sort: value as SortKey }));
  }

  goTo(page: number): void {
    this.page.set(page);
  }

  toggleAmenity(amenity: string): void {
    this.updateFilters((f) => ({ ...f, amenities: toggle(f.amenities, amenity) }));
  }

  saveSearch(): void {
    const user = this.auth.user();
    if (!user) {
      void this.router.navigate(['/login'], { queryParams: { returnUrl: this.router.url } });
      return;
    }
    const c = this.criteria();
    const label = `${this.destinationName() || 'Search'} · ${c.checkIn} → ${c.checkOut}`;
    const before = this.savedSearches.forUser(user.uid).length;
    this.savedSearches.add(user.uid, label, c);
    const added = this.savedSearches.forUser(user.uid).length > before;
    this.toast.success(added ? 'Search saved. Find it under “Saved searches”.' : 'You already saved this search.');
  }

  updateFilters(change: (f: SearchFilters) => SearchFilters): void {
    this.page.set(1);
    this.filters.update(change);
  }

  resetFilters(): void {
    this.page.set(1);
    this.filters.set(DEFAULT_FILTERS);
  }
}

function toggle<T>(list: T[], item: T): T[] {
  return list.includes(item) ? list.filter((i) => i !== item) : [...list, item];
}

import { Component, computed, inject } from '@angular/core';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../core/auth/auth.service';
import { BookingStore } from '../../../core/booking/booking.store';
import { CatalogStore } from '../../../core/data/catalog.store';
import { SavedSearchStore } from '../../../core/data/saved-search.store';
import { ToastService } from '../../../shared/ui/toast.service';
import { runSearch } from '../../../core/search/search-engine';
import { todayIso } from '../../../core/utils/date.util';
import { validateCriteria, criteriaToParams } from '../../../core/utils/search-criteria';
import { DEFAULT_FILTERS, SavedSearch } from '../../../models/domain.model';
import { StayRangePipe } from '../../../shared/pipes/stay-range.pipe';


interface SavedView {
  readonly item: SavedSearch;
  readonly destination: string;
  readonly expired: boolean;
  readonly matches: number;
}
@Component({
  selector: 'app-saved-searches-page',
  imports: [RouterLink, StayRangePipe],
  templateUrl: './saved-searches-page.html',
  styleUrl: './saved-searches-page.scss',
})
export class SavedSearchesPage {
  auth = inject(AuthService);
  store = inject(SavedSearchStore);
  catalog = inject(CatalogStore);
  bookings = inject(BookingStore);
  router = inject(Router);
  toast = inject(ToastService);

  views = computed<SavedView[]>(() => {
    const user = this.auth.user();
    if (!user) return [];
    this.store.items();
    const today = todayIso();
    const catalog = this.catalog.visibleCatalog();
    const bookings = this.bookings.bookings();
    return this.store.forUser(user.uid).map((item) => {
      const expired = validateCriteria(item.criteria, today).includes('check-in-past');
      const matches = expired
        ? 0
        : runSearch({ requestId: 0, criteria: item.criteria, filters: DEFAULT_FILTERS, catalog, bookings, nowMs: Date.now() }).length;
      return { item, expired, matches, destination: this.catalog.destinationById(item.criteria.destinationId)?.name ?? '' };
    });
  });

  protected rerun(view: SavedView): void {
    void this.router.navigate(['/search'], { queryParams: criteriaToParams(view.item.criteria) });
  }

  protected remove(view: SavedView): void {
    this.store.remove(view.item.id);
    this.toast.info('Saved search removed.');
  }
}

import { ChangeDetectionStrategy, Component, computed, inject } from '@angular/core';
import { CatalogStore } from '../../core/data/catalog.store';
import { ActivatedRoute, Router, RouterLink } from '@angular/router';
import { addDays, todayIso } from '../../core/utils/date.util';
import { criteriaToParams } from '../../core/utils/search-criteria';
import { SearchCriteria } from '../../models/domain.model';
import { ImgFallbackDirective } from '../../shared/directives/img-fallback.directive';
import { SearchForm } from '../search/search-form/search-form';

@Component({
  selector: 'app-home-page',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [RouterLink, SearchForm, ImgFallbackDirective],
  templateUrl: './home-page.html',
  styleUrl: './home-page.scss',
})
export class HomePage {
  catalog = inject(CatalogStore);
  router = inject(Router);
  route = inject(ActivatedRoute);

  destinations =  this.catalog.visibleDestinations;

  hotelCounts = computed(() =>{
    const counts = new Map<string, number>();
    for (const h of this.catalog.visibleCatalog().hotels){
      counts.set(h.destinationId, (counts.get(h.destinationId) ?? 0) +1);
    }
    return counts;
  });

  hotelCount(destinationId: string): number{
    return this.hotelCounts().get(destinationId) ?? 0;
  }

  paramsFor(destinationId: string): Record<string, string> {
    const today = todayIso();
    return criteriaToParams({ destinationId, checkIn: addDays(today, 7), checkOut: addDays(today, 10), guests: 2, rooms: 1 });
  }

  onSearch(criteria: SearchCriteria): void {
    void this.router.navigate(['/search'], { queryParams: criteriaToParams(criteria) });
  }  

}

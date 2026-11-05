import { Component, computed, input } from '@angular/core';
import { SearchCriteria, SearchResult } from '../../../models/domain.model';
import { RouterLink } from '@angular/router';
import { ImgFallbackDirective } from '../../../shared/directives/img-fallback.directive';
import { CommonModule } from '@angular/common';
import { StarRating } from '../../../shared/ui/star-rating';

@Component({
  selector: 'app-result-card',
  imports: [RouterLink, ImgFallbackDirective, StarRating, CommonModule],
  templateUrl: './result-card.html',
  styleUrl: './result-card.scss',
})
export class ResultCard {
  result = input.required<SearchResult>();
  criteria = input.required<SearchCriteria>();

  params = computed(() => {
    const c = this.criteria();
    return {
      checkIn: c.checkIn,
      checkOut: c.checkOut,
      guests: c.guests,
      rooms: c.rooms,
    };
  });

  cover = computed(() => this.result().room.imageUrls.at(0) ?? this.result().hotel.imageUrls.at(0) ?? '');
  typeLabel = computed(() =>{
    const t = this.result().hotel.propertyType;
    return t.charAt(0).toUpperCase() + t.slice(1);
  });

  amenitySummary = computed(() => {
    const a = this.result().room.amenities;
    return a.length > 3 ? `${a.slice(0, 3).join(', ')} +${a.length - 3} more` : a.join(', ');
  });
}

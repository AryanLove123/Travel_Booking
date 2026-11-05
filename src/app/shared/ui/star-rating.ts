import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { DecimalPipe } from '@angular/common';

@Component({
  selector: 'app-star-rating',
  imports: [DecimalPipe],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `<span class="star">★</span>
    <strong>{{ rating() | number: '1.1-2' }}</strong>
    @if (reviews() !== null) {
      <span class="muted"> ({{ reviews() }} reviews)</span>
    }
    <span class="sr-only">Rated {{ rating() }} out of 5</span>`,
  styles: `
    .star {
      color: var(--c-star);
    }
  `,
})
export class StarRating {
  readonly rating = input.required<number>();
  readonly reviews = input<number | null>(null);
}

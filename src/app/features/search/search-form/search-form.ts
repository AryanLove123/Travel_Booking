import { Component, DestroyRef, effect, inject, input, output, signal } from '@angular/core';
import { CatalogStore } from '../../../core/data/catalog.store';
import { SearchCriteria } from '../../../models/domain.model';
import { addDays, todayIso } from '../../../core/utils/date.util';
import {
  defaultCriteria,
  MAX_GUESTS_PER_SEARCH,
  MAX_ROOMS_PER_SEARCH,
} from '../../../core/utils/search-criteria';
import { FormControl, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { checkOutAfterCheckIn, notInPast } from '../../../shared/forms/validators';
import { takeUntilDestroyed } from '@angular/core/rxjs-interop';

type FieldName = 'destinationId' | 'checkIn' | 'checkOut' | 'guests' | 'rooms';

@Component({
  selector: 'app-search-form',
  imports: [ReactiveFormsModule],
  templateUrl: './search-form.html',
  styleUrl: './search-form.scss',
})
export class SearchForm {
  catalog = inject(CatalogStore);
  destroyRef = inject(DestroyRef);

  initial = input<SearchCriteria | null>(null);
  compact = input<boolean>(false);
  search = output<SearchCriteria>();

  today = todayIso();
  maxGuests = MAX_GUESTS_PER_SEARCH;
  maxRooms = MAX_ROOMS_PER_SEARCH;
  submitted = signal(false);
  minCheckOut = signal(addDays(this.today, 1));

  form = new FormGroup(
    {
      destinationId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      checkIn: new FormControl('', { nonNullable: true, validators: [Validators.required, notInPast(() => this.today)] }),
      checkOut: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
      rooms: new FormControl(1, {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.min(1),
          Validators.max(MAX_ROOMS_PER_SEARCH),
          Validators.pattern(/^\d+$/),
        ],
      }),
      guests: new FormControl(1, {
        nonNullable: true,
        validators: [
          Validators.required,
          Validators.min(1),
          Validators.max(MAX_GUESTS_PER_SEARCH),
          Validators.pattern(/^\d+$/),
        ],
      }),
    },
    { validators: [checkOutAfterCheckIn()] },
  );

  constructor() {
    effect(() => {
      const criteria = this.initial() ?? defaultCriteria(this.today);
      this.form.reset({ ...criteria }, { emitEvent: false });
      this.updateMinCheckOut(criteria.checkIn);
      this.submitted.set(false);
    });

    this.form.controls.checkIn.valueChanges
      .pipe(takeUntilDestroyed(this.destroyRef))
      .subscribe((checkIn) => {
        this.updateMinCheckOut(checkIn);
        const out = this.form.controls.checkOut.value;
        if (/^\d{4}-\d{2}-\d{2}$/.test(checkIn) && (!out || out <= checkIn)) {
          this.form.controls.checkOut.setValue(addDays(checkIn, 1));
        }
      });
  }

  showError(name: FieldName): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || this.submitted());
  }

  showGroupError(): boolean {
    return !!this.form.errors?.['checkOutBeforeCheckIn'] && (this.form.controls.checkOut.touched || this.submitted());
  }

  updateMinCheckOut(checkIn: string): void {
    this.minCheckOut.set(
      /^\d{4}-\d{2}-\d{2}$/.test(checkIn) ? addDays(checkIn, 1) : addDays(this.today, 1),
    );
  }

  submit(): void{
    this.submitted.set(true);
    this.form.markAllAsTouched();
    if(this.form.invalid) return;
    this.search.emit(this.form.getRawValue());
  }
}

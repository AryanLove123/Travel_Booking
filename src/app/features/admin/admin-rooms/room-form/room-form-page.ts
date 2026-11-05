import { Component, computed, effect, inject, input } from '@angular/core';
import { FormGroup, FormControl, Validators, AbstractControl, FormArray, ValidationErrors, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { BookingStore } from '../../../../core/booking/booking.store';
import { CatalogStore } from '../../../../core/data/catalog.store';
import { todayIso } from '../../../../core/utils/date.util';
import { ToastService } from '../../../../shared/ui/toast.service';
import { urlValidator } from '../../../../shared/forms/validators';

const urlControl = (value = '') => new FormControl(value, { nonNullable: true, validators: [Validators.required, urlValidator] });
const amenityControl = (value = '') => new FormControl(value, { nonNullable: true, validators: [Validators.required] });
@Component({
  selector: 'app-room-form-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './room-form-page.html',
  styleUrl: './room-form-page.scss',
})
export class RoomFormPage {
  protected readonly catalog = inject(CatalogStore);
  private readonly router = inject(Router);
  private readonly bookings = inject(BookingStore);
  private readonly toast = inject(ToastService);

  readonly id = input<string>();
  protected readonly newUrl = () => urlControl();
  protected readonly newAmenity = () => amenityControl();
  protected readonly isEdit = computed(() => !!this.id());
  protected readonly existing = computed(() => (this.id() ? this.catalog.roomById(this.id()!) : undefined));

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    hotelId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    pricePerNight: new FormControl(100, { nonNullable: true, validators: [Validators.required, Validators.min(1)] }),
    maxGuests: new FormControl(2, { nonNullable: true, validators: [Validators.required, Validators.min(1), Validators.max(16)] }),
    beds: new FormControl(1, { nonNullable: true, validators: [Validators.min(1)] }),
    bathrooms: new FormControl(1, { nonNullable: true, validators: [Validators.min(1)] }),
    totalUnits: new FormControl(1, { nonNullable: true, validators: [Validators.required, Validators.min(1), Validators.max(100)]}),
    amenities: new FormArray<FormControl<string>>([amenityControl('Wifi')]),
    imageUrls: new FormArray<FormControl<string>>([urlControl()]),
    freeCancellation: new FormControl(true, { nonNullable: true }),
    published: new FormControl(true, { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const r = this.existing();
      if (!r) return;
      const { amenities, imageUrls } = this.form.controls;
      amenities.clear();
      r.amenities.forEach((a) => amenities.push(amenityControl(a)));
      imageUrls.clear();
      r.imageUrls.forEach((u) => imageUrls.push(urlControl(u)));
      this.form.patchValue({
        name: r.name, hotelId: r.hotelId, description: r.description, pricePerNight: r.pricePerNight,
        maxGuests: r.maxGuests, beds: r.beds, bathrooms: r.bathrooms, totalUnits: r.totalUnits,
        freeCancellation: r.freeCancellation, published: r.published,
      });
    });
  }

  protected bad(name: 'name' | 'hotelId' | 'pricePerNight' | 'maxGuests' | 'totalUnits'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  protected save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.catalog.saveRoom({
      id: this.existing()?.id,
      hotelId: v.hotelId,
      name: v.name.trim(),
      description: v.description.trim(),
      pricePerNight: v.pricePerNight,
      maxGuests: v.maxGuests,
      beds: v.beds,
      bathrooms: v.bathrooms,
      totalUnits: v.totalUnits,
      amenities: [...new Set(v.amenities.map((a) => a.trim()).filter(Boolean))],
      imageUrls: v.imageUrls.map((u) => u.trim()).filter(Boolean),
      freeCancellation: v.freeCancellation,
      published: v.published,
    });
    this.toast.success(`Room ${this.isEdit() ? 'updated' : 'created'}.`);
    void this.router.navigate(['/admin/rooms']);
  }
}

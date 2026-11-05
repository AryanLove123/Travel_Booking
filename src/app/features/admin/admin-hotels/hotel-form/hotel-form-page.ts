import { Component, computed, effect, inject, input } from '@angular/core';
import { FormGroup, FormControl, Validators, FormArray, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CatalogStore } from '../../../../core/data/catalog.store';
import { PROPERTY_TYPES, PropertyType } from '../../../../models/domain.model';
import { ToastService } from '../../../../shared/ui/toast.service';
import { urlValidator } from '../../../../shared/forms/validators';

const urlControl = (value = '') =>
  new FormControl(value, { nonNullable: true, validators: [Validators.required, urlValidator] });

@Component({
  selector: 'app-hotel-form-page',
  imports: [ReactiveFormsModule, RouterLink],
  templateUrl: './hotel-form-page.html',
  styleUrl: './hotel-form-page.scss',
})
export class HotelFormPage {
  protected readonly catalog = inject(CatalogStore);
  private readonly router = inject(Router);
  private readonly toast = inject(ToastService);

  readonly id = input<string>();
  protected readonly types = PROPERTY_TYPES;
  protected readonly newUrl = () => urlControl();
  protected readonly isEdit = computed(() => !!this.id());
  protected readonly existing = computed(() =>
    this.id() ? this.catalog.hotelById(this.id()!) : undefined,
  );

  protected readonly form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    destinationId: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    propertyType: new FormControl<PropertyType>('hotel', { nonNullable: true }),
    rating: new FormControl(4.5, {
      nonNullable: true,
      validators: [Validators.required, Validators.min(0), Validators.max(5)],
    }),
    reviewCount: new FormControl(0, { nonNullable: true, validators: [Validators.min(0)] }),
    address: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    description: new FormControl('', { nonNullable: true }),
    imageUrls: new FormArray<FormControl<string>>([urlControl()]),
    published: new FormControl(true, { nonNullable: true }),
  });

  constructor() {
    effect(() => {
      const h = this.existing();
      if (!h) return;
      this.form.controls.imageUrls.clear();
      h.imageUrls.forEach((u) => this.form.controls.imageUrls.push(urlControl(u)));
      this.form.patchValue({
        name: h.name,
        destinationId: h.destinationId,
        propertyType: h.propertyType,
        rating: h.rating,
        reviewCount: h.reviewCount,
        address: h.address,
        description: h.description,
        published: h.published,
      });
    });
  }

  bad(name: 'name' | 'destinationId' | 'rating' | 'address'): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.catalog.saveHotel({
      id: this.existing()?.id,
      destinationId: v.destinationId,
      name: v.name.trim(),
      propertyType: v.propertyType,
      address: v.address.trim(),
      description: v.description.trim(),
      rating: v.rating,
      reviewCount: v.reviewCount,
      imageUrls: v.imageUrls.map((u) => u.trim()).filter(Boolean),
      published: v.published,
    });
    this.toast.success(`Hotel ${this.isEdit() ? 'updated' : 'created'}.`);
    void this.router.navigate(['/admin/hotels']);
  }
}

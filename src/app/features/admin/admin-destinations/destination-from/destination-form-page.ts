import { Component, computed, effect, inject, input } from '@angular/core';
import { FormGroup, FormControl, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { CatalogStore } from '../../../../core/data/catalog.store';
import { ToastService } from '../../../../shared/ui/toast.service';
import { urlValidator } from '../../../../shared/forms/validators';

@Component({
  selector: 'app-destination-form-page',
  imports: [ReactiveFormsModule,RouterLink],
  templateUrl: './destination-form-page.html',
  styleUrl: './destination-form-page.scss',
})
export class DestinationFormPage {
  catalog = inject(CatalogStore);
  router = inject(Router);
  toast = inject(ToastService);

  id = input<string>();
  isEdit = computed(() => !!this.id());
  existing = computed(() => (this.id() ? this.catalog.destinationById(this.id()!) : undefined));

  form = new FormGroup({
    name: new FormControl('', { nonNullable: true, validators: [Validators.required, Validators.maxLength(60)] }),
    country: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    tagline: new FormControl('', { nonNullable: true }),
    description: new FormControl('', { nonNullable: true, validators: [Validators.required] }),
    imageUrl: new FormControl('', { nonNullable: true, validators: [urlValidator] }),
    published: new FormControl(true, { nonNullable: true }),
  });

  constructor(){
    effect(() =>{
      const d = this.existing();
      if (d) this.form.reset({ name: d.name, country: d.country, tagline: d.tagline, description: d.description, imageUrl: d.imageUrl, published: d.published });
    })
  }

  bad(name: keyof typeof this.form.controls): boolean {
    const c = this.form.controls[name];
    return c.invalid && (c.touched || c.dirty);
  }

  save(): void {
    this.form.markAllAsTouched();
    if (this.form.invalid) return;
    const v = this.form.getRawValue();
    this.catalog.saveDestination({
      id: this.existing()?.id,
      name: v.name.trim(),
      country: v.country.trim(),
      tagline: v.tagline.trim(),
      description: v.description.trim(),
      imageUrl: v.imageUrl.trim(),
      published: v.published,
    });
    this.toast.success(`Destination ${this.isEdit() ? 'updated' : 'created'}.`);
    void this.router.navigate(['/admin/destinations']);
  }
}

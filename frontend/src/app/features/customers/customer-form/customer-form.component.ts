import { ChangeDetectionStrategy, Component, inject, input, OnInit, signal } from '@angular/core';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { ClarityModule } from '@clr/angular';
import { CustomerService } from '@core/services/customer.service';
import { ToastService } from '@core/services/toast.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { errorMessage } from '@shared/utils/http-error.util';
import { I18NEXT_SERVICE, I18NextPipe } from 'angular-i18next';

@Component({
  selector: 'app-customer-form',
  imports: [ClarityModule, ReactiveFormsModule, RouterLink, I18NextPipe, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './customer-form.component.html',
})
export class CustomerFormComponent implements OnInit {
  readonly id = input<string>();

  private readonly fb = inject(FormBuilder);
  private readonly customers = inject(CustomerService);
  private readonly toast = inject(ToastService);
  private readonly router = inject(Router);
  private readonly i18n = inject(I18NEXT_SERVICE);

  readonly saving = signal(false);
  readonly error = signal<string | null>(null);

  readonly form = this.fb.nonNullable.group({
    fullName: ['', [Validators.required, Validators.maxLength(200)]],
    phoneNo: ['', [Validators.required, Validators.pattern(/^\+?[0-9 ]{7,18}$/)]],
    email: ['', Validators.email],
    address: [''],
    birthdate: [''],
  });

  ngOnInit(): void {
    const id = this.id();
    if (!id) return;
    this.customers.get(Number(id)).subscribe({
      next: (c) =>
        this.form.patchValue({
          fullName: c.fullName,
          phoneNo: c.phoneNo,
          email: c.email ?? '',
          address: c.address ?? '',
          birthdate: c.birthdate ?? '',
        }),
      error: (err) => this.error.set(errorMessage(err)),
    });
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload = {
      fullName: v.fullName.trim(),
      phoneNo: v.phoneNo.replace(/\s+/g, ''),
      email: v.email.trim() || null,
      address: v.address.trim() || null,
      birthdate: v.birthdate || null,
    };
    const id = this.id();
    this.saving.set(true);
    (id ? this.customers.update(Number(id), payload) : this.customers.create(payload)).subscribe({
      next: (c) => {
        this.toast.success(
          this.i18n.t(id ? 'common.updated' : 'common.created', { name: c.fullName }) as string,
        );
        void this.router.navigate(['/customers', c.id]);
      },
      error: (err) => {
        this.error.set(errorMessage(err));
        this.saving.set(false);
      },
    });
  }
}

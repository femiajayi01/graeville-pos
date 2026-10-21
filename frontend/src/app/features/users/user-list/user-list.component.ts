import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, computed, inject, signal } from '@angular/core';
import { FormBuilder, FormsModule, ReactiveFormsModule, Validators } from '@angular/forms';
import { ClarityModule, ClrDatagridStateInterface } from '@clr/angular';
import { AuthService } from '@core/auth/auth.service';
import { Role, User, UserPayload } from '@core/models';
import { ConfirmService } from '@core/services/confirm.service';
import { ToastService } from '@core/services/toast.service';
import { UserService } from '@core/services/user.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { errorMessage } from '@shared/utils/http-error.util';
import { I18NEXT_SERVICE, I18NextPipe } from 'angular-i18next';

/** Laravel: UserAccount/index + UserAccount/create (+ edit/delete). */
@Component({
  selector: 'app-user-list',
  imports: [
    ClarityModule,
    FormsModule,
    ReactiveFormsModule,
    DatePipe,
    I18NextPipe,
    PageHeaderComponent,
  ],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './user-list.component.html',
})
export class UserListComponent {
  readonly auth = inject(AuthService);
  private readonly users = inject(UserService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18NEXT_SERVICE);
  private readonly fb = inject(FormBuilder);

  readonly rows = signal<User[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly formOpen = signal(false);
  readonly editing = signal<User | null>(null);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);
  readonly roles = computed(() =>
    Object.values(Role).filter(
      (r) => r !== Role.SuperAdmin || this.auth.user()?.role === Role.SuperAdmin,
    ),
  );

  search = '';
  private lastState: ClrDatagridStateInterface = {};

  readonly form = this.fb.nonNullable.group({
    firstName: ['', Validators.required],
    lastName: ['', Validators.required],
    email: ['', [Validators.required, Validators.email]],
    role: [Role.User as Role, Validators.required],
    password: ['', Validators.minLength(6)],
  });

  refresh(state: ClrDatagridStateInterface = this.lastState): void {
    this.lastState = state;
    this.loading.set(true);
    this.users
      .list({
        page: state.page?.current ?? 1,
        limit: state.page?.size ?? 20,
        search: this.search.trim() || undefined,
      })
      .subscribe({
        next: (page) => {
          this.rows.set(page.data);
          this.total.set(page.meta.total);
          this.loading.set(false);
        },
        error: (err) => {
          this.toast.error(errorMessage(err));
          this.loading.set(false);
        },
      });
  }

  applySearch(): void {
    this.refresh({ ...this.lastState, page: { ...this.lastState.page, current: 1 } });
  }

  open(user: User | null = null): void {
    this.editing.set(user);
    this.formError.set(null);
    this.form.reset({
      firstName: user?.firstName ?? '',
      lastName: user?.lastName ?? '',
      email: user?.email ?? '',
      role: user?.role ?? Role.User,
      password: '',
    });
    this.formOpen.set(true);
  }

  save(): void {
    if (this.form.invalid) {
      this.form.markAllAsTouched();
      return;
    }
    const v = this.form.getRawValue();
    const payload: UserPayload = {
      firstName: v.firstName.trim(),
      lastName: v.lastName.trim(),
      email: v.email.trim(),
      role: v.role,
      ...(v.password ? { password: v.password } : {}),
    };
    const user = this.editing();
    this.saving.set(true);
    (user ? this.users.update(user.id, payload) : this.users.create(payload)).subscribe({
      next: (saved) => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.toast.success(
          this.i18n.t(user ? 'common.updated' : 'users.created', {
            name: saved.fullName,
          }) as string,
        );
        this.refresh();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(errorMessage(err));
      },
    });
  }

  async remove(user: User): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.i18n.t('users.deleteTitle') as string,
      message: this.i18n.t('users.deleteMessage', { name: user.fullName }) as string,
      confirmLabel: this.i18n.t('common.delete') as string,
      danger: true,
    });
    if (!ok) return;
    this.users.delete(user.id).subscribe({
      next: () => {
        this.toast.success(this.i18n.t('common.deleted', { name: user.fullName }) as string);
        this.refresh();
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }
}

import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, signal } from '@angular/core';
import { FormsModule } from '@angular/forms';
import { ClarityModule, ClrDatagridStateInterface } from '@clr/angular';
import { AuthService } from '@core/auth/auth.service';
import { Brand } from '@core/models';
import { BrandService } from '@core/services/catalog.service';
import { ConfirmService } from '@core/services/confirm.service';
import { ToastService } from '@core/services/toast.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { errorMessage } from '@shared/utils/http-error.util';
import { I18NEXT_SERVICE, I18NextPipe } from 'angular-i18next';

/** Laravel: brand/index, create, edit, delete — as one page with a modal form. */
@Component({
  selector: 'app-brand-list',
  imports: [ClarityModule, FormsModule, DatePipe, I18NextPipe, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './brand-list.component.html',
})
export class BrandListComponent {
  readonly auth = inject(AuthService);
  private readonly service = inject(BrandService);
  private readonly confirm = inject(ConfirmService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18NEXT_SERVICE);

  readonly rows = signal<Brand[]>([]);
  readonly total = signal(0);
  readonly loading = signal(false);
  readonly editing = signal<Brand | null>(null);
  readonly formOpen = signal(false);
  readonly saving = signal(false);
  readonly formError = signal<string | null>(null);

  search = '';
  name = '';
  private lastState: ClrDatagridStateInterface = {};

  refresh(state: ClrDatagridStateInterface = this.lastState): void {
    this.lastState = state;
    this.loading.set(true);
    this.service
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

  open(item: Brand | null = null): void {
    this.editing.set(item);
    this.name = item?.name ?? '';
    this.formError.set(null);
    this.formOpen.set(true);
  }

  save(): void {
    const name = this.name.trim();
    if (!name) {
      this.formError.set(this.i18n.t('validation.required') as string);
      return;
    }
    const item = this.editing();
    this.saving.set(true);
    (item ? this.service.update(item.id, name) : this.service.create(name)).subscribe({
      next: () => {
        this.saving.set(false);
        this.formOpen.set(false);
        this.toast.success(
          this.i18n.t(item ? 'common.updated' : 'common.created', { name }) as string,
        );
        this.refresh();
      },
      error: (err) => {
        this.saving.set(false);
        this.formError.set(errorMessage(err));
      },
    });
  }

  async remove(item: Brand): Promise<void> {
    const ok = await this.confirm.ask({
      title: this.i18n.t('brands.deleteTitle') as string,
      message: this.i18n.t('brands.deleteMessage', { name: item.name }) as string,
      confirmLabel: this.i18n.t('common.delete') as string,
      danger: true,
    });
    if (!ok) return;
    this.service.delete(item.id).subscribe({
      next: () => {
        this.toast.success(this.i18n.t('common.deleted', { name: item.name }) as string);
        this.refresh();
      },
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }
}

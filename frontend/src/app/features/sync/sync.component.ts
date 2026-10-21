import { DatePipe } from '@angular/common';
import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { ClarityModule } from '@clr/angular';
import { AuthService } from '@core/auth/auth.service';
import { SyncRunResult, SyncStatus } from '@core/models';
import { SyncApiService } from '@core/services/report.service';
import { ToastService } from '@core/services/toast.service';
import { PageHeaderComponent } from '@shared/components/page-header.component';
import { errorMessage } from '@shared/utils/http-error.util';
import { I18NEXT_SERVICE, I18NextPipe } from 'angular-i18next';
import { Observable } from 'rxjs';

/** Laravel: sync/index — push local changes to / pull changes from the online store. */
@Component({
  selector: 'app-sync',
  imports: [ClarityModule, DatePipe, I18NextPipe, PageHeaderComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './sync.component.html',
})
export class SyncComponent implements OnInit {
  readonly auth = inject(AuthService);
  private readonly sync = inject(SyncApiService);
  private readonly toast = inject(ToastService);
  private readonly i18n = inject(I18NEXT_SERVICE);

  readonly status = signal<SyncStatus | null>(null);
  readonly busy = signal<string | null>(null);
  readonly results = signal<SyncRunResult[]>([]);

  ngOnInit(): void {
    this.load();
  }

  load(): void {
    this.sync.status().subscribe({
      next: (s) => this.status.set(s),
      error: (err) => this.toast.error(errorMessage(err)),
    });
  }

  runAll(): void {
    this.run('all', this.sync.runAll());
  }

  push(entity: string): void {
    this.run(`push:${entity}`, this.sync.push(entity));
  }

  pull(entity: string): void {
    this.run(`pull:${entity}`, this.sync.pull(entity));
  }

  private run(key: string, request: Observable<SyncRunResult | SyncRunResult[]>): void {
    this.busy.set(key);
    request.subscribe({
      next: (res) => {
        const list = Array.isArray(res) ? res : [res];
        this.results.set(list);
        const moved = list.reduce((acc, r) => acc + r.count, 0);
        this.toast.success(this.i18n.t('sync.done', { count: moved }) as string);
        this.busy.set(null);
        this.load();
      },
      error: (err) => {
        this.toast.error(errorMessage(err));
        this.busy.set(null);
      },
    });
  }
}

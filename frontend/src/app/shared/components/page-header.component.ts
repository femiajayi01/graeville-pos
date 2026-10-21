import { ChangeDetectionStrategy, Component, input } from '@angular/core';

/** Page title with an optional subtitle and a right-aligned actions slot. */
@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="page-header">
      <div>
        <h2>{{ title() }}</h2>
        @if (subtitle()) {
          <p class="p6 subtitle">{{ subtitle() }}</p>
        }
      </div>
      <div class="actions"><ng-content /></div>
    </div>
  `,
  styles: `
    .page-header {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-end;
      justify-content: space-between;
      gap: 0.75rem;
      margin-bottom: 1rem;
    }
    h2 {
      margin: 0;
    }
    .subtitle {
      margin: 0.25rem 0 0;
      color: var(--cds-global-typography-color-300, #666);
    }
    .actions {
      display: flex;
      flex-wrap: wrap;
      gap: 0.5rem;
      align-items: center;
    }
  `,
})
export class PageHeaderComponent {
  readonly title = input.required<string>();
  readonly subtitle = input<string>();
}

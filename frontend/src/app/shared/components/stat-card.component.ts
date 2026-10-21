import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { ClarityModule } from '@clr/angular';

@Component({
  selector: 'app-stat-card',
  imports: [ClarityModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="card stat-card" [class.warn]="tone() === 'warn'">
      <div class="card-block">
        <div class="stat-label">
          @if (icon()) {
            <cds-icon [shape]="icon()!" size="20"></cds-icon>
          }
          {{ label() }}
        </div>
        <div class="value">{{ value() }}</div>
        @if (hint()) {
          <div class="hint">{{ hint() }}</div>
        }
      </div>
    </div>
  `,
  styles: `
    .stat-card {
      margin-top: 0;
      height: 100%;
    }
    .stat-label {
      display: flex;
      align-items: center;
      gap: 0.4rem;
      color: var(--cds-global-typography-color-300, #666);
      font-size: 0.75rem;
      text-transform: uppercase;
      letter-spacing: 0.04em;
    }
    .value {
      font-size: 1.6rem;
      font-weight: 600;
      margin-top: 0.4rem;
      font-variant-numeric: tabular-nums;
    }
    .hint {
      font-size: 0.75rem;
      color: var(--cds-global-typography-color-300, #666);
      margin-top: 0.25rem;
    }
    .warn .value {
      color: var(--cds-alias-status-danger, #c21d00);
    }
  `,
})
export class StatCardComponent {
  readonly label = input.required<string>();
  readonly value = input.required<string | number>();
  readonly hint = input<string>();
  readonly icon = input<string>();
  readonly tone = input<'default' | 'warn'>('default');
}

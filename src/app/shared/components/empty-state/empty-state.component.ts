import { ChangeDetectionStrategy, Component, input } from '@angular/core';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-empty-state',
  imports: [MatIconModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="empty-state" role="status">
      <mat-icon class="empty-icon" aria-hidden="true">inbox</mat-icon>
      <p class="empty-title">{{ title() }}</p>
      @if (subtitle()) {
        <p class="empty-subtitle">{{ subtitle() }}</p>
      }
    </div>
  `,
  styles: `
    .empty-state {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      padding: 64px 24px;
      color: var(--phonus-text-secondary);
      text-align: center;
    }
    .empty-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      margin-bottom: 16px;
      color: var(--phonus-border);
    }
    .empty-title {
      margin: 0;
      font-size: 16px;
      font-weight: 500;
      color: var(--phonus-text);
    }
    .empty-subtitle {
      margin: 8px 0 0;
      font-size: 14px;
    }
  `,
})
export class EmptyStateComponent {
  title = input.required<string>();
  subtitle = input<string>();
}

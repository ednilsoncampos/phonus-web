import { ChangeDetectionStrategy, Component, input } from '@angular/core';

@Component({
  selector: 'app-page-header',
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <header class="page-header">
      <div class="page-header__text">
        <h1 class="page-header__title">{{ title() }}</h1>
        @if (subtitle()) {
          <p class="page-header__subtitle">{{ subtitle() }}</p>
        }
      </div>
      <div class="page-header__actions">
        <ng-content />
      </div>
    </header>
  `,
  styles: `
    .page-header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      margin-bottom: 24px;
    }
    .page-header__title {
      margin: 0;
      font-size: 22px;
      font-weight: 600;
      color: var(--phonus-text);
    }
    .page-header__subtitle {
      margin: 4px 0 0;
      font-size: 14px;
      color: var(--phonus-text-secondary);
    }
    .page-header__actions {
      display: flex;
      gap: 8px;
      align-items: center;
    }
  `,
})
export class PageHeaderComponent {
  title = input.required<string>();
  subtitle = input<string>();
}

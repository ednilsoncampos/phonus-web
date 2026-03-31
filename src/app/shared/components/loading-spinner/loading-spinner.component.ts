import { ChangeDetectionStrategy, Component } from '@angular/core';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';

@Component({
  selector: 'app-loading-spinner',
  imports: [MatProgressSpinnerModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <div class="spinner-wrapper" role="status" aria-label="Carregando">
      <mat-spinner diameter="48" />
    </div>
  `,
  styles: `
    .spinner-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      padding: 48px;
    }
  `,
})
export class LoadingSpinnerComponent {}

import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatToolbarModule } from '@angular/material/toolbar';
import { AuthService } from '../../core/auth/auth.service';

@Component({
  selector: 'app-topbar',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <mat-toolbar class="topbar">
      <button
        mat-icon-button
        class="topbar__menu-btn"
        aria-label="Alternar menu lateral"
        (click)="menuToggle.emit()"
      >
        <mat-icon>menu</mat-icon>
      </button>

      <span class="topbar__brand">Phonus</span>

      <span class="topbar__spacer"></span>

      <button
        mat-button
        [matMenuTriggerFor]="userMenu"
        class="topbar__user-btn"
        aria-label="Menu do usuário"
      >
        <mat-icon aria-hidden="true">account_circle</mat-icon>
        <span class="topbar__username">{{ auth.currentUser()?.nome }}</span>
        <mat-icon aria-hidden="true">arrow_drop_down</mat-icon>
      </button>

      <mat-menu #userMenu="matMenu">
        <button mat-menu-item (click)="auth.logout()">
          <mat-icon aria-hidden="true">logout</mat-icon>
          Sair
        </button>
      </mat-menu>
    </mat-toolbar>
  `,
  styles: `
    .topbar {
      position: fixed;
      top: 0;
      left: 0;
      right: 0;
      z-index: 100;
      background: var(--phonus-surface);
      border-bottom: 1px solid var(--phonus-border);
      height: 64px;
      padding: 0 16px;
      color: var(--phonus-text);
    }
    .topbar__menu-btn {
      margin-right: 8px;
    }
    .topbar__brand {
      font-size: 18px;
      font-weight: 700;
      color: var(--phonus-primary);
      letter-spacing: -0.5px;
    }
    .topbar__spacer {
      flex: 1;
    }
    .topbar__user-btn {
      display: flex;
      align-items: center;
      gap: 4px;
      color: var(--phonus-text);
    }
    .topbar__username {
      font-size: 14px;
      font-weight: 500;
      max-width: 160px;
      overflow: hidden;
      text-overflow: ellipsis;
      white-space: nowrap;
    }
  `,
})
export class TopbarComponent {
  protected readonly auth = inject(AuthService);
  readonly menuToggle = output<void>();
}

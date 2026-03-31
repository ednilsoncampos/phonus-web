import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { TopbarComponent } from '../topbar/topbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, TopbarComponent, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  template: `
    <a class="skip-link" href="#main-content">Pular para o conteúdo principal</a>
    <app-topbar (menuToggle)="toggleSidebar()" />
    <app-sidebar [collapsed]="sidebarCollapsed()" />
    <main
      class="shell-content"
      [class.shell-content--collapsed]="sidebarCollapsed()"
      id="main-content"
      tabindex="-1"
    >
      <router-outlet />
    </main>
  `,
  styles: `
    .skip-link {
      position: absolute;
      top: -100%;
      left: 8px;
      z-index: 9999;
      padding: 8px 16px;
      background: var(--phonus-primary);
      color: #fff;
      border-radius: 0 0 4px 4px;
      font-weight: 600;
      text-decoration: none;
      transition: top 0.1s;
    }
    .skip-link:focus {
      top: 0;
    }

    .shell-content {
      margin-top: 64px;
      margin-left: 220px;
      padding: 32px;
      min-height: calc(100vh - 64px);
      transition: margin-left 0.2s ease;
    }
    .shell-content--collapsed {
      margin-left: 64px;
    }

    @media (max-width: 768px) {
      .shell-content {
        margin-left: 0;
        padding: 16px;
      }
      .shell-content--collapsed {
        margin-left: 0;
      }
    }
  `,
})
export class ShellComponent implements OnInit {
  private readonly breakpointObserver = inject(BreakpointObserver);

  protected readonly sidebarCollapsed = signal(false);

  ngOnInit(): void {
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small])
      .subscribe((state) => {
        this.sidebarCollapsed.set(state.matches);
      });
  }

  protected toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }
}

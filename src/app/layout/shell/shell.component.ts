import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { TopbarComponent } from '../topbar/topbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, TopbarComponent, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
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

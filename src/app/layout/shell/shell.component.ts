import { ChangeDetectionStrategy, Component, inject, OnInit, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { BreakpointObserver, Breakpoints } from '@angular/cdk/layout';
import { MatDialog } from '@angular/material/dialog';
import { TopbarComponent } from '../topbar/topbar.component';
import { SidebarComponent } from '../sidebar/sidebar.component';
import { TermosService } from '../../core/services/termos.service';
import { ReaceiteTermosDialog } from '../../features/termos/reaceite-termos-dialog/reaceite-termos-dialog';

@Component({
  selector: 'app-shell',
  imports: [RouterOutlet, TopbarComponent, SidebarComponent],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './shell.component.html',
  styleUrl: './shell.component.scss',
})
export class ShellComponent implements OnInit {
  private readonly breakpointObserver = inject(BreakpointObserver);
  private readonly termosService = inject(TermosService);
  private readonly dialog = inject(MatDialog);

  protected readonly sidebarCollapsed = signal(false);

  ngOnInit(): void {
    this.breakpointObserver
      .observe([Breakpoints.XSmall, Breakpoints.Small])
      .subscribe((state) => {
        this.sidebarCollapsed.set(state.matches);
      });

    this.verificarReaceiteTermos();
  }

  private verificarReaceiteTermos(): void {
    this.termosService.statusAceite().subscribe({
      next: (status) => {
        if (!status.aceito) {
          this.dialog.open(ReaceiteTermosDialog, { width: '640px', disableClose: true });
        }
      },
      error: () => {
        // Se a verificação falhar, não bloqueia o acesso ao painel
      },
    });
  }

  protected toggleSidebar(): void {
    this.sidebarCollapsed.update((v) => !v);
  }
}

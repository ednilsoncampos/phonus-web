import { ChangeDetectionStrategy, Component, inject, output } from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatToolbarModule } from '@angular/material/toolbar';
import { RouterLink } from '@angular/router';
import { AuthService } from '../../core/auth/auth.service';
import { AlterarSenhaDialog } from '../../features/conta/alterar-senha-dialog/alterar-senha-dialog';

@Component({
  selector: 'app-topbar',
  imports: [MatToolbarModule, MatButtonModule, MatIconModule, MatMenuModule, RouterLink],
  changeDetection: ChangeDetectionStrategy.OnPush,
  templateUrl: './topbar.component.html',
  styleUrl: './topbar.component.scss',
})
export class TopbarComponent {
  protected readonly auth = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);
  readonly menuToggle = output<void>();

  protected abrirAlterarSenha(): void {
    const ref = this.dialog.open<AlterarSenhaDialog, unknown, boolean>(AlterarSenhaDialog, {
      width: '420px',
    });

    ref.afterClosed().subscribe((sucesso) => {
      if (!sucesso) return;

      this.snackBar.open('Senha alterada com sucesso. Faça login novamente.', 'Fechar', {
        duration: 6000,
        horizontalPosition: 'center',
        verticalPosition: 'top',
        panelClass: ['snack-success'],
      });
      this.auth.logout();
    });
  }
}

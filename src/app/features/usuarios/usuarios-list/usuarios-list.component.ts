import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { AuthService } from '../../../core/auth/auth.service';
import { UsuarioService } from '../../../core/services/usuario.service';
import { Papel, Usuario } from '../../../core/models/usuario.model';
import { ConfirmDialogComponent } from '../../../shared/components/confirm-dialog/confirm-dialog.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import {
  ConvidarUsuarioDialogComponent,
  ConvidarUsuarioDialogData,
} from '../convidar-usuario-dialog/convidar-usuario-dialog.component';

const PAPEL_CONFIG: Record<Papel, { label: string; css: string }> = {
  SUPER_ROOT: { label: 'Super Root', css: 'badge--purple' },
  ROOT:       { label: 'Root',       css: 'badge--green'  },
  ADMIN:      { label: 'Admin',      css: 'badge--blue'   },
  OPERADOR:   { label: 'Operador',   css: 'badge--orange' },
};

@Component({
  selector: 'app-usuarios-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './usuarios-list.component.html',
  styleUrl: './usuarios-list.component.scss',
})
export class UsuariosListComponent implements OnInit {
  private readonly usuarioService = inject(UsuarioService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);

  readonly colunas = ['nome', 'email', 'papel', 'status', 'acoes'];
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly usuarios = signal<Usuario[]>([]);

  readonly podeConvidar = computed(() =>
    this.authService.hasRole('SUPER_ROOT', 'ROOT', 'ADMIN'),
  );

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.usuarioService.listar().subscribe({
      next: (lista) => {
        this.usuarios.set(lista);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar os usuários.');
        this.carregando.set(false);
      },
    });
  }

  papelLabel(papel: Papel): string {
    return PAPEL_CONFIG[papel]?.label ?? papel;
  }

  papelCss(papel: Papel): string {
    return `badge ${PAPEL_CONFIG[papel]?.css ?? ''}`;
  }

  podeDesativar(usuario: Usuario): boolean {
    return usuario.papel !== 'SUPER_ROOT';
  }

  abrirConvidar(): void {
    const papelDoConvidante = this.authService.papel();
    if (!papelDoConvidante) return;

    const ref = this.dialog.open<
      ConvidarUsuarioDialogComponent,
      ConvidarUsuarioDialogData,
      Usuario | undefined
    >(ConvidarUsuarioDialogComponent, {
      data: { papelDoConvidante },
      width: '440px',
    });

    ref.afterClosed().subscribe((novoUsuario) => {
      if (novoUsuario) {
        this.usuarios.update((lista) => [...lista, novoUsuario]);
      }
    });
  }

  confirmarDesativar(usuario: Usuario): void {
    const ref = this.dialog.open(ConfirmDialogComponent, {
      data: {
        title: 'Desativar usuário',
        message: `Deseja desativar o usuário "${usuario.nome}"? Ele perderá o acesso ao sistema.`,
        confirmLabel: 'Desativar',
      },
    });

    ref.afterClosed().subscribe((confirmado: boolean) => {
      if (!confirmado) return;

      this.usuarioService.desativar(usuario.id).subscribe({
        next: () => {
          this.usuarios.update((lista) =>
            lista.map((u) => (u.id === usuario.id ? { ...u, ativo: false } : u)),
          );
        },
        error: () => {
          // erro silencioso — o usuário pode tentar novamente via reload
        },
      });
    });
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnDestroy,
  OnInit,
  signal,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBar } from '@angular/material/snack-bar';
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

const REENVIO_COOLDOWN_SECONDS = 120;

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
export class UsuariosListComponent implements OnInit, OnDestroy {
  private readonly usuarioService = inject(UsuarioService);
  private readonly authService = inject(AuthService);
  private readonly dialog = inject(MatDialog);
  private readonly snackBar = inject(MatSnackBar);

  readonly colunas = ['nome', 'email', 'papel', 'status', 'acoes'];
  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly usuarios = signal<Usuario[]>([]);
  readonly reenviandoPara = signal<string | null>(null);
  readonly cooldowns = signal<Record<string, number>>({});
  private cooldownTimer?: ReturnType<typeof setInterval>;

  readonly podeConvidar = computed(() =>
    this.authService.hasPermissao('USUARIOS_GERENCIAR'),
  );

  ngOnInit(): void {
    this.carregar();
  }

  ngOnDestroy(): void {
    if (this.cooldownTimer) clearInterval(this.cooldownTimer);
  }

  cooldownRestante(usuarioId: string): number {
    return this.cooldowns()[usuarioId] ?? 0;
  }

  private iniciarCooldown(usuarioId: string): void {
    this.cooldowns.update((map) => ({ ...map, [usuarioId]: REENVIO_COOLDOWN_SECONDS }));

    if (this.cooldownTimer) return;

    this.cooldownTimer = setInterval(() => {
      this.cooldowns.update((map) => {
        const next: Record<string, number> = {};
        for (const [id, seconds] of Object.entries(map)) {
          if (seconds - 1 > 0) next[id] = seconds - 1;
        }
        return next;
      });

      if (Object.keys(this.cooldowns()).length === 0 && this.cooldownTimer) {
        clearInterval(this.cooldownTimer);
        this.cooldownTimer = undefined;
      }
    }, 1000);
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
    if (usuario.papel === 'SUPER_ROOT') return false;
    if (usuario.id === this.authService.currentUser()?.id) return false;

    const meuPapel = this.authService.papel();
    if (meuPapel === 'ADMIN') return usuario.papel === 'OPERADOR';
    return meuPapel === 'ROOT' || meuPapel === 'SUPER_ROOT';
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

  reenviarConvite(usuario: Usuario): void {
    if (this.cooldownRestante(usuario.id) > 0) return;

    this.reenviandoPara.set(usuario.id);

    this.authService.reenviarAtivacao(usuario.email).subscribe({
      next: () => {
        this.reenviandoPara.set(null);
        this.iniciarCooldown(usuario.id);
        this.snackBar.open(
          `Convite reenviado para ${usuario.email}! Peça ao usuário para verificar o e-mail e a pasta de spam.`,
          'Fechar',
          { duration: 8000, horizontalPosition: 'center', verticalPosition: 'top', panelClass: ['snack-success'] },
        );
      },
      error: () => {
        this.reenviandoPara.set(null);
        this.iniciarCooldown(usuario.id);
        this.snackBar.open(
          'Não foi possível reenviar o convite. Tente novamente.',
          'Fechar',
          { duration: 7000, horizontalPosition: 'center', verticalPosition: 'top', panelClass: ['snack-error'] },
        );
      },
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

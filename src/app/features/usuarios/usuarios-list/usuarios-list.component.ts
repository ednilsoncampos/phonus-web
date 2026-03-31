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
  styles: `
    .state-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      min-height: 200px;
      color: var(--phonus-text-secondary);
    }

    .table-wrap {
      border: 1px solid var(--phonus-border);
      border-radius: 12px;
      overflow: hidden;
    }

    table { width: 100%; }

    th.mat-header-cell {
      font-weight: 600;
      color: var(--phonus-text-secondary);
      font-size: 13px;
      background: var(--phonus-background);
    }

    td.mat-cell { color: var(--phonus-text); }

    tr.mat-row:last-child td { border-bottom: none; }

    .col-acoes { width: 80px; text-align: right; }

    .badge {
      display: inline-flex;
      align-items: center;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge--green  { background: var(--phonus-primary-light); color: var(--phonus-primary-dark); }
    .badge--purple { background: #ede9fe; color: #6d28d9; }
    .badge--blue   { background: #dbeafe; color: #1d4ed8; }
    .badge--orange { background: #ffedd5; color: #c2410c; }

    .status-ativo   { color: var(--phonus-primary); font-weight: 600; }
    .status-inativo { color: var(--phonus-text-secondary); }
  `,
  template: `
    <app-page-header title="Usuários">
      @if (podeConvidar()) {
        <button mat-flat-button color="primary" (click)="abrirConvidar()">
          <mat-icon>person_add</mat-icon>
          Convidar
        </button>
      }
    </app-page-header>

    @if (carregando()) {
      <div class="state-center" role="status" aria-label="Carregando usuários">
        <mat-spinner diameter="48" />
        <span>Carregando...</span>
      </div>
    } @else if (erro()) {
      <div class="state-center" role="alert">
        <mat-icon aria-hidden="true">error_outline</mat-icon>
        <span>{{ erro() }}</span>
        <button mat-stroked-button (click)="carregar()">Tentar novamente</button>
      </div>
    } @else if (usuarios().length === 0) {
      <div class="state-center">
        <mat-icon aria-hidden="true">group</mat-icon>
        <span>Nenhum usuário encontrado.</span>
      </div>
    } @else {
      <div class="table-wrap">
        <table mat-table [dataSource]="usuarios()" aria-label="Lista de usuários">

          <ng-container matColumnDef="nome">
            <th mat-header-cell *matHeaderCellDef>Nome</th>
            <td mat-cell *matCellDef="let u">{{ u.nome }}</td>
          </ng-container>

          <ng-container matColumnDef="email">
            <th mat-header-cell *matHeaderCellDef>E-mail</th>
            <td mat-cell *matCellDef="let u">{{ u.email }}</td>
          </ng-container>

          <ng-container matColumnDef="papel">
            <th mat-header-cell *matHeaderCellDef>Papel</th>
            <td mat-cell *matCellDef="let u">
              <span class="badge" [class]="papelCss(u.papel)">
                {{ papelLabel(u.papel) }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef>Status</th>
            <td mat-cell *matCellDef="let u">
              <span
                [class]="u.ativo ? 'status-ativo' : 'status-inativo'"
                [attr.aria-label]="u.ativo ? 'Ativo' : 'Inativo'"
              >
                {{ u.ativo ? 'Ativo' : 'Inativo' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef class="col-acoes"></th>
            <td mat-cell *matCellDef="let u" class="col-acoes">
              @if (podeDesativar(u)) {
                <button
                  mat-icon-button
                  [matTooltip]="u.ativo ? 'Desativar' : 'Usuário inativo'"
                  [disabled]="!u.ativo"
                  [attr.aria-label]="'Desativar ' + u.nome"
                  (click)="confirmarDesativar(u)"
                >
                  <mat-icon>person_off</mat-icon>
                </button>
              }
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas;"></tr>
        </table>
      </div>
    }
  `,
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

import { ChangeDetectionStrategy, Component, computed, effect, inject, input, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { FormControl, ReactiveFormsModule, Validators } from '@angular/forms';
import { RouterLink } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSnackBar } from '@angular/material/snack-bar';
import { AuthService } from '../../../core/auth/auth.service';
import { Papel, Usuario } from '../../../core/models/usuario.model';
import { UsuarioService } from '../../../core/services/usuario.service';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

type PapelAtribuivel = 'ADMIN' | 'OPERADOR';

const PAPEL_LABEL: Record<Papel, string> = {
  SUPER_ROOT: 'Super Root',
  ROOT: 'Root',
  ADMIN: 'Admin',
  OPERADOR: 'Operador',
};

const STATUS_LABEL = { ATIVO: 'Ativo', INATIVO: 'Inativo', CONVIDADO: 'Convidado' } as const;

@Component({
  selector: 'app-usuario-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    DatePipe,
    ReactiveFormsModule,
    RouterLink,
    MatButtonModule,
    MatFormFieldModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSelectModule,
    PageHeaderComponent,
  ],
  templateUrl: './usuario-detail.component.html',
})
export class UsuarioDetailComponent {
  private readonly usuarioService = inject(UsuarioService);
  private readonly authService = inject(AuthService);
  private readonly snackBar = inject(MatSnackBar);

  /** Vem do parâmetro `:id` da rota (withComponentInputBinding). */
  readonly id = input.required<string>();

  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly usuario = signal<Usuario | null>(null);
  readonly salvando = signal(false);

  readonly novoPapel = new FormControl<PapelAtribuivel | null>(null, Validators.required);

  /**
   * O backend só devolve o próprio usuário em GET /usuarios/{id}; os dados de terceiros
   * vêm da lista. Só ROOT altera papel, nunca o próprio nem o de outro ROOT/SUPER_ROOT.
   */
  readonly podeAlterarPapel = computed(() => {
    const alvo = this.usuario();
    if (!alvo) return false;
    return (
      this.authService.hasPermissao('USUARIOS_ALTERAR_PAPEL') &&
      alvo.id !== this.authService.currentUser()?.id &&
      alvo.papel !== 'ROOT' &&
      alvo.papel !== 'SUPER_ROOT'
    );
  });

  /** ADMIN e OPERADOR, sem o papel atual. */
  readonly papeisDisponiveis = computed(() => {
    const atual = this.usuario()?.papel;
    return (['ADMIN', 'OPERADOR'] as const)
      .filter((p) => p !== atual)
      .map((p) => ({ value: p, label: PAPEL_LABEL[p] }));
  });

  constructor() {
    effect(() => {
      this.id();
      this.carregar();
    });
  }

  papelLabel(papel: Papel): string {
    return PAPEL_LABEL[papel] ?? papel;
  }

  statusLabel(status: Usuario['status']): string {
    return STATUS_LABEL[status] ?? status;
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.usuarioService.listar().subscribe({
      next: (lista) => {
        const encontrado = lista.find((u) => u.id === this.id()) ?? null;
        this.usuario.set(encontrado);
        this.novoPapel.setValue(this.papeisDisponiveis()[0]?.value ?? null);
        this.carregando.set(false);
      },
      error: (err) => {
        this.erro.set(err?.error?.message ?? 'Não foi possível carregar o usuário.');
        this.carregando.set(false);
      },
    });
  }

  salvarPapel(): void {
    const alvo = this.usuario();
    const papel = this.novoPapel.value;
    if (!alvo || !papel || this.salvando()) return;

    this.salvando.set(true);

    this.usuarioService.alterarPapel(alvo.id, { papel }).subscribe({
      next: () => {
        this.usuario.set({ ...alvo, papel });
        this.novoPapel.setValue(this.papeisDisponiveis()[0]?.value ?? null);
        this.salvando.set(false);
        this.notificar(`Papel de ${alvo.nome} alterado para ${PAPEL_LABEL[papel]}.`, 'snack-success');
      },
      error: (err) => {
        this.salvando.set(false);
        this.notificar(err?.error?.message ?? 'Não foi possível alterar o papel.', 'snack-error');
      },
    });
  }

  private notificar(mensagem: string, classe: 'snack-success' | 'snack-error'): void {
    this.snackBar.open(mensagem, 'Fechar', {
      duration: classe === 'snack-success' ? 6000 : 7000,
      horizontalPosition: 'center',
      verticalPosition: 'top',
      panelClass: [classe],
    });
  }
}

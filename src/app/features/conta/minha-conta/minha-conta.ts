import { ChangeDetectionStrategy, Component, computed, inject, OnInit, signal } from '@angular/core';
import { DatePipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../../core/auth/auth.service';
import { EntitlementResponse, Papel } from '../../../core/models/usuario.model';
import { UsuarioService } from '../../../core/services/usuario.service';
import { CurrencyBrlPipe } from '../../../shared/pipes/currency-brl.pipe';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

const PAPEL_LABEL: Record<Papel, string> = {
  SUPER_ROOT: 'Super Root',
  ROOT: 'Root',
  ADMIN: 'Admin',
  OPERADOR: 'Operador',
};

const PERIODO_LABEL = { MONTHLY: 'Mensal', YEARLY: 'Anual' } as const;

@Component({
  selector: 'app-minha-conta',
  imports: [
    DatePipe,
    CurrencyBrlPipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    PageHeaderComponent,
  ],
  templateUrl: './minha-conta.html',
  styleUrl: './minha-conta.scss',
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class MinhaConta implements OnInit {
  private readonly authService = inject(AuthService);
  private readonly usuarioService = inject(UsuarioService);

  protected readonly usuario = this.authService.currentUser;
  protected readonly papelLabel = computed(() => {
    const papel = this.usuario()?.papel;
    return papel ? PAPEL_LABEL[papel] : '';
  });

  protected readonly carregando = signal(false);
  protected readonly erro = signal<string | null>(null);
  protected readonly entitlement = signal<EntitlementResponse | null>(null);

  /** O backend não informa se a assinatura renova, então só se diz até quando vale. */
  protected readonly situacao = computed<'CORTESIA' | 'ASSINATURA' | 'FREE' | null>(() => {
    const e = this.entitlement();
    if (!e) return null;
    if (e.planoAtual) return 'ASSINATURA';
    if (e.isPremium && e.diasCortesiaRestantes > 0) return 'CORTESIA';
    if (e.isPremium) return 'ASSINATURA';
    return 'FREE';
  });

  protected readonly periodoLabel = computed(() => {
    const periodo = this.entitlement()?.planoAtual?.periodoCobranca;
    return periodo ? PERIODO_LABEL[periodo] : '';
  });

  ngOnInit(): void {
    this.carregar();
  }

  protected carregar(): void {
    const id = this.usuario()?.id;
    if (!id) return;

    this.carregando.set(true);
    this.erro.set(null);

    this.usuarioService.buscarEntitlement(id).subscribe({
      next: (e) => {
        this.entitlement.set(e);
        this.carregando.set(false);
      },
      error: (err) => {
        this.erro.set(err?.error?.message ?? 'Não foi possível carregar os dados da assinatura.');
        this.carregando.set(false);
      },
    });
  }
}

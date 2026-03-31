import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatCardModule } from '@angular/material/card';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { AuthService } from '../../core/auth/auth.service';
import { DashboardService } from '../../core/services/dashboard.service';
import { DashboardData } from '../../core/models/dashboard.model';
import { PageHeaderComponent } from '../../shared/components/page-header/page-header.component';
import { CurrencyBrlPipe } from '../../shared/pipes/currency-brl.pipe';

interface KpiCard {
  label: string;
  value: string;
  icon: string;
  color: 'green' | 'blue' | 'red' | 'orange' | 'purple';
  route?: string[];
  queryParams?: Record<string, string>;
}

@Component({
  selector: 'app-dashboard',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
  ],
  styles: `
    .dashboard { padding: 0; }

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(220px, 1fr));
      gap: 16px;
      margin-bottom: 32px;
    }

    .kpi-card {
      cursor: default;
      border-radius: 12px;
      border: 1px solid var(--phonus-border);
    }
    .kpi-card--link { cursor: pointer; }
    .kpi-card--link:hover { box-shadow: 0 4px 12px rgba(0,0,0,.08); }

    .kpi-card__inner {
      display: flex;
      align-items: center;
      gap: 16px;
      padding: 20px;
    }

    .kpi-icon {
      width: 48px;
      height: 48px;
      border-radius: 12px;
      display: flex;
      align-items: center;
      justify-content: center;
      flex-shrink: 0;
    }
    .kpi-icon mat-icon { font-size: 24px; width: 24px; height: 24px; }

    .kpi-icon--green  { background: var(--phonus-primary-light); color: var(--phonus-primary-dark); }
    .kpi-icon--blue   { background: #dbeafe; color: #1d4ed8; }
    .kpi-icon--red    { background: #fee2e2; color: #b91c1c; }
    .kpi-icon--orange { background: #ffedd5; color: #c2410c; }
    .kpi-icon--purple { background: #ede9fe; color: #6d28d9; }

    .kpi-info { min-width: 0; }
    .kpi-label {
      font-size: 13px;
      color: var(--phonus-text-secondary);
      white-space: nowrap;
      overflow: hidden;
      text-overflow: ellipsis;
    }
    .kpi-value {
      font-size: 22px;
      font-weight: 700;
      color: var(--phonus-text);
      line-height: 1.3;
    }
    .kpi-value--alert { color: var(--phonus-error); }

    .section-title {
      font-size: 16px;
      font-weight: 600;
      color: var(--phonus-text);
      margin: 0 0 12px;
    }

    .shortcuts {
      display: flex;
      flex-wrap: wrap;
      gap: 12px;
    }

    .state-center {
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      gap: 16px;
      min-height: 200px;
      color: var(--phonus-text-secondary);
    }
  `,
  template: `
    <div class="dashboard">
      <app-page-header title="Dashboard" [subtitle]="saudacao()" />

      @if (carregando()) {
        <div class="state-center" role="status" aria-label="Carregando dados do dashboard">
          <mat-spinner diameter="48" />
          <span>Carregando...</span>
        </div>
      } @else if (erro()) {
        <div class="state-center" role="alert">
          <mat-icon aria-hidden="true">error_outline</mat-icon>
          <span>{{ erro() }}</span>
          <button mat-stroked-button (click)="carregar()">Tentar novamente</button>
        </div>
      } @else {
        <!-- KPIs -->
        <div class="kpi-grid" role="list" aria-label="Indicadores do negócio">
          @for (card of kpiCards(); track card.label) {
            <mat-card
              class="kpi-card"
              [class.kpi-card--link]="!!card.route"
              role="listitem"
              [attr.tabindex]="card.route ? 0 : null"
              [attr.aria-label]="card.label + ': ' + card.value"
              (click)="navegar(card)"
              (keydown.enter)="navegar(card)"
              (keydown.space)="navegar(card)"
            >
              <div class="kpi-card__inner">
                <div class="kpi-icon" [class]="'kpi-icon--' + card.color" aria-hidden="true">
                  <mat-icon>{{ card.icon }}</mat-icon>
                </div>
                <div class="kpi-info">
                  <div class="kpi-label">{{ card.label }}</div>
                  <div
                    class="kpi-value"
                    [class.kpi-value--alert]="card.color === 'red' || card.color === 'orange'"
                  >
                    {{ card.value }}
                  </div>
                </div>
              </div>
            </mat-card>
          }
        </div>

        <!-- Atalhos rápidos -->
        @if (podeVerAtalhos()) {
          <p class="section-title">Atalhos rápidos</p>
          <div class="shortcuts">
            <button mat-stroked-button color="primary" (click)="ir(['/produtos'], { acao: 'novo' })">
              <mat-icon>add</mat-icon>
              Novo produto
            </button>
            <button mat-stroked-button color="primary" (click)="ir(['/estoque'])">
              <mat-icon>inventory</mat-icon>
              Ajustar estoque
            </button>
            <button mat-stroked-button color="primary" (click)="ir(['/usuarios'], { acao: 'convidar' })">
              <mat-icon>person_add</mat-icon>
              Convidar usuário
            </button>
          </div>
        }
      }
    </div>
  `,
})
export class DashboardComponent implements OnInit {
  private readonly dashboardService = inject(DashboardService);
  private readonly authService = inject(AuthService);
  private readonly router = inject(Router);

  private readonly currencyPipe = new CurrencyBrlPipe();

  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  private readonly dados = signal<DashboardData | null>(null);

  readonly podeVerAtalhos = computed(() =>
    this.authService.hasRole('ROOT', 'ADMIN', 'SUPER_ROOT'),
  );

  readonly saudacao = computed(() => {
    const nome = this.authService.currentUser()?.nome;
    return nome ? `Olá, ${nome}` : undefined;
  });

  readonly kpiCards = computed<KpiCard[]>(() => {
    const d = this.dados();
    if (!d) return [];

    return [
      {
        label: 'Saldo de Caixa',
        value: this.currencyPipe.transform(d.saldoCaixa),
        icon: 'account_balance_wallet',
        color: 'green',
      },
      {
        label: 'A Receber',
        value: this.currencyPipe.transform(d.totalAReceber),
        icon: 'trending_up',
        color: 'blue',
      },
      {
        label: 'A Pagar',
        value: this.currencyPipe.transform(d.totalAPagar),
        icon: 'trending_down',
        color: 'red',
      },
      {
        label: 'Contas Vencidas',
        value: String(d.contasVencidas),
        icon: 'warning',
        color: 'orange',
        route: ['/contas/receber'],
      },
      {
        label: 'Produtos abaixo do mínimo',
        value: String(d.produtosAbaixoDoMinimo),
        icon: 'inventory_2',
        color: 'purple',
        route: ['/produtos'],
        queryParams: { abaixoDoMinimo: 'true' },
      },
    ];
  });

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.dashboardService.carregar().subscribe({
      next: (data) => {
        this.dados.set(data);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar os dados do dashboard.');
        this.carregando.set(false);
      },
    });
  }

  navegar(card: KpiCard): void {
    if (card.route) {
      this.router.navigate(card.route, { queryParams: card.queryParams });
    }
  }

  ir(commands: string[], queryParams?: Record<string, string>): void {
    this.router.navigate(commands, { queryParams });
  }
}

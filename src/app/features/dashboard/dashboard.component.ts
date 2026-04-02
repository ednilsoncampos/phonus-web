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
  templateUrl: './dashboard.component.html',
  styleUrl: './dashboard.component.scss',
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

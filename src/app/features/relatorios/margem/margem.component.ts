import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { DecimalPipe } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { RelatorioService } from '../../../core/services/relatorio.service';
import { RelatorioMargemItem, RelatorioMargemResponse } from '../../../core/models/relatorio.model';
import { CurrencyBrlPipe } from '../../../shared/pipes/currency-brl.pipe';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

const MARGEM_BAIXA = 10;

@Component({
  selector: 'app-margem',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    CurrencyBrlPipe,
    DecimalPipe,
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

    .kpi-grid {
      display: grid;
      grid-template-columns: repeat(auto-fill, minmax(200px, 1fr));
      gap: 16px;
      margin-bottom: 28px;
    }
    .kpi-card {
      background: var(--phonus-surface);
      border: 1px solid var(--phonus-border);
      border-radius: 12px;
      padding: 20px;
    }
    .kpi-label {
      font-size: 13px;
      color: var(--phonus-text-secondary);
      margin-bottom: 4px;
    }
    .kpi-value {
      font-size: 26px;
      font-weight: 700;
      color: var(--phonus-text);
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

    .col-preco  { width: 140px; text-align: right; }
    .col-margem { width: 120px; text-align: right; }

    .margem-cell {
      display: flex;
      align-items: center;
      justify-content: flex-end;
      gap: 6px;
    }
    .margem-ok   { color: var(--phonus-primary); font-weight: 600; }
    .margem-low  { color: var(--phonus-error);   font-weight: 600; }
  `,
  template: `
    <app-page-header title="Relatório de Margem" subtitle="Produtos com custo cadastrado">
      <button mat-stroked-button (click)="carregar()">
        <mat-icon>refresh</mat-icon>
        Atualizar
      </button>
    </app-page-header>

    @if (carregando()) {
      <div class="state-center" role="status" aria-label="Carregando relatório">
        <mat-spinner diameter="48" />
        <span>Carregando...</span>
      </div>
    } @else if (erro()) {
      <div class="state-center" role="alert">
        <mat-icon aria-hidden="true">error_outline</mat-icon>
        <span>{{ erro() }}</span>
        <button mat-stroked-button (click)="carregar()">Tentar novamente</button>
      </div>
    } @else if (dados()) {
      <!-- KPIs -->
      <div class="kpi-grid">
        <div class="kpi-card">
          <p class="kpi-label">Total de produtos</p>
          <p class="kpi-value">{{ dados()!.totalProdutos }}</p>
        </div>
        <div class="kpi-card">
          <p class="kpi-label">Margem média</p>
          <p
            class="kpi-value"
            [class]="dados()!.margemMedia < MARGEM_BAIXA ? 'kpi-value margem-low' : 'kpi-value margem-ok'"
          >
            {{ dados()!.margemMedia | number:'1.1-1' }}%
          </p>
        </div>
        <div class="kpi-card">
          <p class="kpi-label">Produtos com margem baixa (&lt; {{ MARGEM_BAIXA }}%)</p>
          <p class="kpi-value" [class]="qtdBaixa() > 0 ? 'kpi-value margem-low' : 'kpi-value'">
            {{ qtdBaixa() }}
          </p>
        </div>
      </div>

      <!-- Tabela -->
      <div class="table-wrap">
        <table mat-table [dataSource]="dados()!.itens" aria-label="Relatório de margem por produto">

          <ng-container matColumnDef="nome">
            <th mat-header-cell *matHeaderCellDef>Produto</th>
            <td mat-cell *matCellDef="let item">{{ item.nome }}</td>
          </ng-container>

          <ng-container matColumnDef="precoVenda">
            <th mat-header-cell *matHeaderCellDef class="col-preco">Preço de venda</th>
            <td mat-cell *matCellDef="let item" class="col-preco">
              {{ item.precoVenda | currencyBrl }}
            </td>
          </ng-container>

          <ng-container matColumnDef="precoCusto">
            <th mat-header-cell *matHeaderCellDef class="col-preco">Preço de custo</th>
            <td mat-cell *matCellDef="let item" class="col-preco">
              {{ item.precoCusto | currencyBrl }}
            </td>
          </ng-container>

          <ng-container matColumnDef="margem">
            <th mat-header-cell *matHeaderCellDef class="col-margem">Margem</th>
            <td mat-cell *matCellDef="let item" class="col-margem">
              <div class="margem-cell">
                @if (item.margemPercentual < MARGEM_BAIXA) {
                  <mat-icon
                    style="font-size:16px;width:16px;height:16px"
                    [matTooltip]="'Margem abaixo de ' + MARGEM_BAIXA + '%'"
                    aria-label="Margem baixa"
                  >warning</mat-icon>
                }
                <span [class]="item.margemPercentual < MARGEM_BAIXA ? 'margem-low' : 'margem-ok'">
                  {{ item.margemPercentual | number:'1.1-1' }}%
                </span>
              </div>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas;"></tr>
        </table>
      </div>
    }
  `,
})
export class MargemComponent implements OnInit {
  private readonly service = inject(RelatorioService);

  readonly MARGEM_BAIXA = MARGEM_BAIXA;
  readonly colunas = ['nome', 'precoVenda', 'precoCusto', 'margem'];

  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly dados = signal<RelatorioMargemResponse | null>(null);

  readonly qtdBaixa = computed(
    () => this.dados()?.itens.filter((i) => i.margemPercentual < MARGEM_BAIXA).length ?? 0,
  );

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.service.buscarMargem().subscribe({
      next: (res) => {
        this.dados.set(res);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar o relatório de margem.');
        this.carregando.set(false);
      },
    });
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { Router } from '@angular/router';
import { FormsModule } from '@angular/forms';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { LancamentoService } from '../../../core/services/lancamento.service';
import {
  FormaPagamento,
  LancamentoResponse,
  ParcelaResponse,
  TipoLancamento,
} from '../../../core/models/lancamento.model';
import { CurrencyBrlPipe } from '../../../shared/pipes/currency-brl.pipe';
import { DateBrPipe } from '../../../shared/pipes/date-br.pipe';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

const FORMA_LABELS: Record<FormaPagamento, string> = {
  PIX: 'PIX',
  DINHEIRO: 'Dinheiro',
  DEBITO: 'Débito',
  CREDITO: 'Crédito',
  CHEQUE: 'Cheque',
  PROMISSORIA: 'Promissória',
};

@Component({
  selector: 'app-lancamentos-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageHeaderComponent,
    CurrencyBrlPipe,
    DateBrPipe,
    MatFormFieldModule,
    MatInputModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  styles: `
    .filters {
      display: flex;
      flex-wrap: wrap;
      align-items: center;
      gap: 16px;
      margin-bottom: 20px;
    }
    .filter-tipo { min-width: 160px; }

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
      overflow-x: auto;
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

    .col-tipo     { width: 100px; }
    .col-valor    { width: 140px; text-align: right; }
    .col-forma    { width: 120px; }
    .col-data     { width: 110px; }
    .col-parcelas { width: 130px; }
    .col-acoes    { width: 64px; text-align: right; }

    .badge {
      display: inline-block;
      padding: 2px 10px;
      border-radius: 999px;
      font-size: 12px;
      font-weight: 600;
    }
    .badge-entrada  { background: #dcfce7; color: #15803d; }
    .badge-saida    { background: #fee2e2; color: #b91c1c; }
    .badge-pago     { background: #dcfce7; color: #15803d; }
    .badge-pendente { background: #fef9c3; color: #854d0e; }
  `,
  template: `
    <app-page-header title="Lançamentos">
      <button mat-flat-button color="primary" (click)="novo()">
        <mat-icon>add</mat-icon>
        Novo lançamento
      </button>
    </app-page-header>

    <div class="filters">
      <mat-select
        class="filter-tipo"
        [(ngModel)]="filtroTipo"
        (ngModelChange)="onFiltroChange()"
        placeholder="Todos os tipos"
        aria-label="Filtrar por tipo"
      >
        <mat-option value="">Todos os tipos</mat-option>
        <mat-option value="ENTRADA">Entrada</mat-option>
        <mat-option value="SAIDA">Saída</mat-option>
      </mat-select>

      <mat-form-field appearance="outline">
        <mat-label>Data início</mat-label>
        <input
          matInput
          type="date"
          [(ngModel)]="filtroDataInicio"
          (ngModelChange)="onFiltroChange()"
          aria-label="Data início"
        />
      </mat-form-field>

      <mat-form-field appearance="outline">
        <mat-label>Data fim</mat-label>
        <input
          matInput
          type="date"
          [(ngModel)]="filtroDataFim"
          (ngModelChange)="onFiltroChange()"
          aria-label="Data fim"
        />
      </mat-form-field>
    </div>

    @if (carregando()) {
      <div class="state-center" role="status" aria-label="Carregando lançamentos">
        <mat-spinner diameter="48" />
        <span>Carregando...</span>
      </div>
    } @else if (erro()) {
      <div class="state-center" role="alert">
        <mat-icon aria-hidden="true">error_outline</mat-icon>
        <span>{{ erro() }}</span>
        <button mat-stroked-button (click)="carregar()">Tentar novamente</button>
      </div>
    } @else if (lancamentos().length === 0) {
      <div class="state-center">
        <mat-icon aria-hidden="true">receipt_long</mat-icon>
        <span>Nenhum lançamento encontrado.</span>
      </div>
    } @else {
      <div class="table-wrap">
        <table mat-table [dataSource]="lancamentos()" aria-label="Lista de lançamentos">

          <ng-container matColumnDef="descricao">
            <th mat-header-cell *matHeaderCellDef>Descrição</th>
            <td mat-cell *matCellDef="let l">{{ l.descricao }}</td>
          </ng-container>

          <ng-container matColumnDef="tipo">
            <th mat-header-cell *matHeaderCellDef class="col-tipo">Tipo</th>
            <td mat-cell *matCellDef="let l" class="col-tipo">
              <span [class]="l.tipo === 'ENTRADA' ? 'badge badge-entrada' : 'badge badge-saida'">
                {{ l.tipo === 'ENTRADA' ? 'Entrada' : 'Saída' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="valorTotal">
            <th mat-header-cell *matHeaderCellDef class="col-valor">Valor</th>
            <td mat-cell *matCellDef="let l" class="col-valor">{{ l.valorTotal | currencyBrl }}</td>
          </ng-container>

          <ng-container matColumnDef="formaPagamento">
            <th mat-header-cell *matHeaderCellDef class="col-forma">Pagamento</th>
            <td mat-cell *matCellDef="let l" class="col-forma">{{ formaLabel(l.formaPagamento) }}</td>
          </ng-container>

          <ng-container matColumnDef="dataLancamento">
            <th mat-header-cell *matHeaderCellDef class="col-data">Data</th>
            <td mat-cell *matCellDef="let l" class="col-data">{{ l.dataLancamento | dateBr }}</td>
          </ng-container>

          <ng-container matColumnDef="parcelas">
            <th mat-header-cell *matHeaderCellDef class="col-parcelas">Parcelas</th>
            <td mat-cell *matCellDef="let l" class="col-parcelas">
              <span [class]="todosPago(l.parcelas) ? 'badge badge-pago' : 'badge badge-pendente'">
                {{ resumoParcelas(l.parcelas) }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef class="col-acoes"></th>
            <td mat-cell *matCellDef="let l" class="col-acoes">
              <button
                mat-icon-button
                matTooltip="Ver detalhes"
                [attr.aria-label]="'Ver detalhes de ' + l.descricao"
                (click)="verDetalhe(l.id)"
              >
                <mat-icon>chevron_right</mat-icon>
              </button>
            </td>
          </ng-container>

          <tr mat-header-row *matHeaderRowDef="colunas"></tr>
          <tr mat-row *matRowDef="let row; columns: colunas;"></tr>
        </table>
      </div>

      <mat-paginator
        [length]="totalElements()"
        [pageSize]="pageSize"
        [pageIndex]="page()"
        [pageSizeOptions]="[20]"
        (page)="onPage($event)"
        aria-label="Paginação de lançamentos"
      />
    }
  `,
})
export class LancamentosListComponent implements OnInit {
  private readonly service = inject(LancamentoService);
  private readonly router = inject(Router);

  readonly colunas = ['descricao', 'tipo', 'valorTotal', 'formaPagamento', 'dataLancamento', 'parcelas', 'acoes'];
  readonly pageSize = 20;

  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly lancamentos = signal<LancamentoResponse[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(0);

  filtroTipo: TipoLancamento | '' = '';
  filtroDataInicio = '';
  filtroDataFim = '';

  ngOnInit(): void {
    this.carregar();
  }

  carregar(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.service
      .listar({
        page: this.page(),
        size: this.pageSize,
        tipo: this.filtroTipo || undefined,
        dataInicio: this.filtroDataInicio || undefined,
        dataFim: this.filtroDataFim || undefined,
      })
      .subscribe({
        next: (res) => {
          this.lancamentos.set(res.content);
          this.totalElements.set(res.totalElements);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar os lançamentos.');
          this.carregando.set(false);
        },
      });
  }

  onFiltroChange(): void {
    this.page.set(0);
    this.carregar();
  }

  onPage(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.carregar();
  }

  novo(): void {
    this.router.navigate(['/lancamentos/novo']);
  }

  verDetalhe(id: string): void {
    this.router.navigate(['/lancamentos', id]);
  }

  formaLabel(forma: FormaPagamento): string {
    return FORMA_LABELS[forma] ?? forma;
  }

  todosPago(parcelas: ParcelaResponse[]): boolean {
    return parcelas?.length > 0 && parcelas.every((p) => p.status === 'PAGA');
  }

  resumoParcelas(parcelas: ParcelaResponse[]): string {
    if (!parcelas?.length) return '—';
    const total = parcelas.length;
    const pagas = parcelas.filter((p) => p.status === 'PAGA').length;
    if (pagas === total) return 'Pago';
    if (total === 1) return 'Em aberto';
    return `${pagas}/${total} pagas`;
  }
}

import {
  ChangeDetectionStrategy,
  Component,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { FormControl, ReactiveFormsModule } from '@angular/forms';
import { ActivatedRoute } from '@angular/router';
import { MatAutocompleteModule } from '@angular/material/autocomplete';
import { MatButtonModule } from '@angular/material/button';
import { MatDialog } from '@angular/material/dialog';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { EstoqueService } from '../../../core/services/estoque.service';
import { ProdutoService } from '../../../core/services/produto.service';
import { MovimentacaoEstoque, OrigemMovimentacao } from '../../../core/models/estoque.model';
import { Produto } from '../../../core/models/produto.model';
import { DateBrPipe } from '../../../shared/pipes/date-br.pipe';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';
import {
  AjusteEstoqueDialogComponent,
  AjusteEstoqueDialogData,
} from '../ajuste-estoque-dialog/ajuste-estoque-dialog.component';

const ORIGEM_LABEL: Record<OrigemMovimentacao, string> = {
  VENDA:            'Venda',
  COMPRA:           'Compra',
  AJUSTE_POSITIVO:  'Ajuste (entrada)',
  AJUSTE_NEGATIVO:  'Ajuste (saída)',
};

const ORIGENS: { value: OrigemMovimentacao; label: string }[] = [
  { value: 'VENDA',           label: 'Venda'           },
  { value: 'COMPRA',          label: 'Compra'          },
  { value: 'AJUSTE_POSITIVO', label: 'Ajuste (entrada)'},
  { value: 'AJUSTE_NEGATIVO', label: 'Ajuste (saída)'  },
];

@Component({
  selector: 'app-estoque-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    ReactiveFormsModule,
    PageHeaderComponent,
    DateBrPipe,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatAutocompleteModule,
    MatSelectModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  styles: `
    .filters {
      display: flex;
      flex-wrap: wrap;
      align-items: flex-start;
      gap: 12px;
      margin-bottom: 20px;
    }
    .filter-produto   { min-width: 220px; }
    .filter-origem    { min-width: 180px; }
    .filter-data      { width: 150px; }

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

    .col-tipo     { width: 100px; }
    .col-qtd      { width: 90px; text-align: right; }
    .col-origem   { width: 160px; }
    .col-data     { width: 110px; }
    .col-obs      { max-width: 200px; overflow: hidden; text-overflow: ellipsis; white-space: nowrap; }

    .badge-entrada { color: var(--phonus-primary); font-weight: 600; }
    .badge-saida   { color: var(--phonus-error);   font-weight: 600; }
  `,
  template: `
    <app-page-header title="Controle de Estoque">
      <button mat-flat-button color="primary" (click)="abrirAjuste()">
        <mat-icon>tune</mat-icon>
        Ajustar estoque
      </button>
    </app-page-header>

    <!-- Filtros -->
    <div class="filters">
      <mat-form-field appearance="outline" class="filter-produto">
        <mat-label>Produto</mat-label>
        <input
          matInput
          [formControl]="produtoCtrl"
          [matAutocomplete]="autoProduto"
          placeholder="Buscar produto..."
        />
        <mat-autocomplete
          #autoProduto="matAutocomplete"
          [displayWith]="displayProduto"
          (optionSelected)="onProdutoSelected()"
        >
          @for (p of produtosFiltrados(); track p.id) {
            <mat-option [value]="p">{{ p.nome }}</mat-option>
          }
        </mat-autocomplete>
        @if (produtoCtrl.value) {
          <button matSuffix mat-icon-button aria-label="Limpar" (click)="limparProduto()">
            <mat-icon>close</mat-icon>
          </button>
        }
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-origem">
        <mat-label>Origem</mat-label>
        <mat-select [formControl]="origemCtrl" (ngModelChange)="onFiltroChange()">
          <mat-option value="">Todas</mat-option>
          @for (o of origens; track o.value) {
            <mat-option [value]="o.value">{{ o.label }}</mat-option>
          }
        </mat-select>
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-data">
        <mat-label>Data início</mat-label>
        <input matInput type="date" [formControl]="dataInicioCtrl" />
      </mat-form-field>

      <mat-form-field appearance="outline" class="filter-data">
        <mat-label>Data fim</mat-label>
        <input matInput type="date" [formControl]="dataFimCtrl" />
      </mat-form-field>

      <button mat-stroked-button (click)="onFiltroChange()">
        <mat-icon>search</mat-icon>
        Filtrar
      </button>
    </div>

    @if (carregando()) {
      <div class="state-center" role="status" aria-label="Carregando movimentações">
        <mat-spinner diameter="48" />
        <span>Carregando...</span>
      </div>
    } @else if (erro()) {
      <div class="state-center" role="alert">
        <mat-icon aria-hidden="true">error_outline</mat-icon>
        <span>{{ erro() }}</span>
        <button mat-stroked-button (click)="carregarMovimentacoes()">Tentar novamente</button>
      </div>
    } @else if (movimentacoes().length === 0) {
      <div class="state-center">
        <mat-icon aria-hidden="true">inventory</mat-icon>
        <span>Nenhuma movimentação encontrada.</span>
      </div>
    } @else {
      <div class="table-wrap">
        <table mat-table [dataSource]="movimentacoes()" aria-label="Histórico de estoque">

          <ng-container matColumnDef="produto">
            <th mat-header-cell *matHeaderCellDef>Produto</th>
            <td mat-cell *matCellDef="let m">{{ nomeProduto(m.produtoId) }}</td>
          </ng-container>

          <ng-container matColumnDef="tipo">
            <th mat-header-cell *matHeaderCellDef class="col-tipo">Tipo</th>
            <td mat-cell *matCellDef="let m" class="col-tipo">
              <span [class]="m.tipo === 'ENTRADA' ? 'badge-entrada' : 'badge-saida'">
                {{ m.tipo === 'ENTRADA' ? 'Entrada' : 'Saída' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="quantidade">
            <th mat-header-cell *matHeaderCellDef class="col-qtd">Quantidade</th>
            <td mat-cell *matCellDef="let m" class="col-qtd">{{ m.quantidade }}</td>
          </ng-container>

          <ng-container matColumnDef="origem">
            <th mat-header-cell *matHeaderCellDef class="col-origem">Origem</th>
            <td mat-cell *matCellDef="let m" class="col-origem">{{ origemLabel(m.origem) }}</td>
          </ng-container>

          <ng-container matColumnDef="data">
            <th mat-header-cell *matHeaderCellDef class="col-data">Data</th>
            <td mat-cell *matCellDef="let m" class="col-data">
              {{ m.createdAt?.substring(0, 10) | dateBr }}
            </td>
          </ng-container>

          <ng-container matColumnDef="observacao">
            <th mat-header-cell *matHeaderCellDef>Observação</th>
            <td mat-cell *matCellDef="let m" class="col-obs" [matTooltip]="m.observacao ?? ''">
              {{ m.observacao || '—' }}
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
        aria-label="Paginação de movimentações"
      />
    }
  `,
})
export class EstoqueListComponent implements OnInit {
  private readonly estoqueService = inject(EstoqueService);
  private readonly produtoService = inject(ProdutoService);
  private readonly dialog = inject(MatDialog);
  private readonly route = inject(ActivatedRoute);

  readonly colunas = ['produto', 'tipo', 'quantidade', 'origem', 'data', 'observacao'];
  readonly pageSize = 20;
  readonly origens = ORIGENS;

  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly movimentacoes = signal<MovimentacaoEstoque[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(0);

  private todosProdutos: Produto[] = [];
  private produtosMap = new Map<string, string>();
  readonly produtosFiltrados = signal<Produto[]>([]);

  readonly produtoCtrl = new FormControl<Produto | string | null>(null);
  readonly origemCtrl = new FormControl<OrigemMovimentacao | ''>('');
  readonly dataInicioCtrl = new FormControl('');
  readonly dataFimCtrl = new FormControl('');

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    const produtoIdParam = qp.get('produtoId');

    this.produtoService.listar({ size: 200, ativos: true }).subscribe((res) => {
      this.todosProdutos = res.content;
      res.content.forEach((p) => this.produtosMap.set(p.id, p.nome));
      this.produtosFiltrados.set(res.content.slice(0, 10));

      if (produtoIdParam) {
        const produto = res.content.find((p) => p.id === produtoIdParam);
        if (produto) this.produtoCtrl.setValue(produto);
      }
    });

    this.produtoCtrl.valueChanges.subscribe((val) => {
      const text = typeof val === 'string' ? val : '';
      if (text.length === 0) {
        this.produtosFiltrados.set(this.todosProdutos.slice(0, 10));
      } else {
        this.produtosFiltrados.set(
          this.todosProdutos
            .filter((p) => p.nome.toLowerCase().includes(text.toLowerCase()))
            .slice(0, 10),
        );
      }
    });

    this.carregarMovimentacoes();
  }

  carregarMovimentacoes(): void {
    this.carregando.set(true);
    this.erro.set(null);

    const produtoSelecionado = this.produtoCtrl.value;
    const produtoId =
      produtoSelecionado && typeof produtoSelecionado !== 'string'
        ? produtoSelecionado.id
        : undefined;

    const origem = this.origemCtrl.value || undefined;
    const dataInicio = this.dataInicioCtrl.value || undefined;
    const dataFim = this.dataFimCtrl.value || undefined;

    this.estoqueService
      .listarMovimentacoes({
        page: this.page(),
        size: this.pageSize,
        produtoId,
        origem: origem as OrigemMovimentacao | undefined,
        dataInicio,
        dataFim,
      })
      .subscribe({
        next: (res) => {
          this.movimentacoes.set(res.content);
          this.totalElements.set(res.totalElements);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar o histórico.');
          this.carregando.set(false);
        },
      });
  }

  nomeProduto(id: string): string {
    return this.produtosMap.get(id) ?? id;
  }

  origemLabel(origem: OrigemMovimentacao): string {
    return ORIGEM_LABEL[origem] ?? origem;
  }

  displayProduto = (p: Produto | string | null): string => {
    if (!p) return '';
    if (typeof p === 'string') return p;
    return p.nome;
  };

  onProdutoSelected(): void {
    this.page.set(0);
    this.carregarMovimentacoes();
  }

  limparProduto(): void {
    this.produtoCtrl.setValue(null);
    this.produtosFiltrados.set(this.todosProdutos.slice(0, 10));
    this.page.set(0);
    this.carregarMovimentacoes();
  }

  onFiltroChange(): void {
    this.page.set(0);
    this.carregarMovimentacoes();
  }

  onPage(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.carregarMovimentacoes();
  }

  abrirAjuste(produto?: Produto): void {
    const ref = this.dialog.open<
      AjusteEstoqueDialogComponent,
      AjusteEstoqueDialogData,
      MovimentacaoEstoque | undefined
    >(AjusteEstoqueDialogComponent, {
      data: { produto, produtos: this.todosProdutos },
      width: '440px',
    });

    ref.afterClosed().subscribe((mov) => {
      if (mov) this.carregarMovimentacoes();
    });
  }
}

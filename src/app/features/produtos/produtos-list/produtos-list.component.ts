import {
  ChangeDetectionStrategy,
  Component,
  computed,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatPaginatorModule, PageEvent } from '@angular/material/paginator';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSelectModule } from '@angular/material/select';
import { MatSlideToggleModule } from '@angular/material/slide-toggle';
import { MatTableModule } from '@angular/material/table';
import { MatTooltipModule } from '@angular/material/tooltip';
import { FormsModule } from '@angular/forms';
import { ProdutoService } from '../../../core/services/produto.service';
import { CategoriaProdutoService } from '../../../core/services/categoria-produto.service';
import { Produto } from '../../../core/models/produto.model';
import { CategoriaProduto } from '../../../core/models/categoria-produto.model';
import { CurrencyBrlPipe } from '../../../shared/pipes/currency-brl.pipe';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';

@Component({
  selector: 'app-produtos-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    CurrencyBrlPipe,
    FormsModule,
    MatTableModule,
    MatButtonModule,
    MatIconModule,
    MatSelectModule,
    MatSlideToggleModule,
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
    .filter-categoria { min-width: 200px; }

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

    .col-preco  { width: 130px; text-align: right; }
    .col-estoque { width: 130px; text-align: center; }
    .col-status { width: 100px; }
    .col-acoes  { width: 80px;  text-align: right; }

    .status-ativo   { color: var(--phonus-primary); font-weight: 600; }
    .status-inativo { color: var(--phonus-text-secondary); }

    .estoque-cell { display: flex; align-items: center; justify-content: center; gap: 4px; }
    .badge-minimo {
      display: inline-flex;
      align-items: center;
      padding: 1px 6px;
      border-radius: 999px;
      font-size: 11px;
      font-weight: 600;
      background: #fee2e2;
      color: #b91c1c;
    }
  `,
  template: `
    <app-page-header title="Produtos">
      <button mat-flat-button color="primary" (click)="novo()">
        <mat-icon>add</mat-icon>
        Novo produto
      </button>
    </app-page-header>

    <!-- Filtros -->
    <div class="filters">
      <mat-select
        class="filter-categoria"
        [(ngModel)]="categoriaId"
        (ngModelChange)="onFiltroChange()"
        placeholder="Todas as categorias"
        aria-label="Filtrar por categoria"
      >
        <mat-option value="">Todas as categorias</mat-option>
        @for (cat of categorias(); track cat.id) {
          <mat-option [value]="cat.id">{{ cat.nome }}</mat-option>
        }
      </mat-select>

      <mat-slide-toggle
        [checked]="apenasAtivos()"
        (change)="setApenasAtivos($event.checked)"
      >
        Somente ativos
      </mat-slide-toggle>

      <mat-slide-toggle
        [checked]="abaixoDoMinimo()"
        (change)="setAbaixoDoMinimo($event.checked)"
      >
        Abaixo do mínimo
      </mat-slide-toggle>
    </div>

    @if (carregando()) {
      <div class="state-center" role="status" aria-label="Carregando produtos">
        <mat-spinner diameter="48" />
        <span>Carregando...</span>
      </div>
    } @else if (erro()) {
      <div class="state-center" role="alert">
        <mat-icon aria-hidden="true">error_outline</mat-icon>
        <span>{{ erro() }}</span>
        <button mat-stroked-button (click)="carregarProdutos()">Tentar novamente</button>
      </div>
    } @else if (produtos().length === 0) {
      <div class="state-center">
        <mat-icon aria-hidden="true">inventory_2</mat-icon>
        <span>Nenhum produto encontrado.</span>
      </div>
    } @else {
      <div class="table-wrap">
        <table mat-table [dataSource]="produtos()" aria-label="Lista de produtos">

          <ng-container matColumnDef="nome">
            <th mat-header-cell *matHeaderCellDef>Nome</th>
            <td mat-cell *matCellDef="let p">{{ p.nome }}</td>
          </ng-container>

          <ng-container matColumnDef="categoria">
            <th mat-header-cell *matHeaderCellDef>Categoria</th>
            <td mat-cell *matCellDef="let p">{{ nomeCategoria(p.categoriaId) }}</td>
          </ng-container>

          <ng-container matColumnDef="precoVenda">
            <th mat-header-cell *matHeaderCellDef class="col-preco">Preço de venda</th>
            <td mat-cell *matCellDef="let p" class="col-preco">
              {{ p.precoVenda | currencyBrl }}
            </td>
          </ng-container>

          <ng-container matColumnDef="estoque">
            <th mat-header-cell *matHeaderCellDef class="col-estoque">Estoque</th>
            <td mat-cell *matCellDef="let p" class="col-estoque">
              <div class="estoque-cell">
                <span>{{ p.quantidadeEstoque }} {{ p.unidadeMedida }}</span>
                @if (p.abaixoDoMinimo) {
                  <span class="badge-minimo" title="Abaixo do estoque mínimo">Min</span>
                }
              </div>
            </td>
          </ng-container>

          <ng-container matColumnDef="status">
            <th mat-header-cell *matHeaderCellDef class="col-status">Status</th>
            <td mat-cell *matCellDef="let p" class="col-status">
              <span [class]="p.ativo ? 'status-ativo' : 'status-inativo'">
                {{ p.ativo ? 'Ativo' : 'Inativo' }}
              </span>
            </td>
          </ng-container>

          <ng-container matColumnDef="acoes">
            <th mat-header-cell *matHeaderCellDef class="col-acoes"></th>
            <td mat-cell *matCellDef="let p" class="col-acoes">
              <button
                mat-icon-button
                matTooltip="Ver detalhes"
                [attr.aria-label]="'Ver detalhes de ' + p.nome"
                (click)="verDetalhe(p.id)"
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
        aria-label="Paginação de produtos"
      />
    }
  `,
})
export class ProdutosListComponent implements OnInit {
  private readonly produtoService = inject(ProdutoService);
  private readonly categoriaService = inject(CategoriaProdutoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  readonly colunas = ['nome', 'categoria', 'precoVenda', 'estoque', 'status', 'acoes'];
  readonly pageSize = 20;

  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly produtos = signal<Produto[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(0);
  readonly categorias = signal<CategoriaProduto[]>([]);
  readonly apenasAtivos = signal(true);
  readonly abaixoDoMinimo = signal(false);

  categoriaId = '';

  private readonly categoriasMap = computed(() => {
    const map = new Map<string, string>();
    this.categorias().forEach((c) => map.set(c.id, c.nome));
    return map;
  });

  ngOnInit(): void {
    const qp = this.route.snapshot.queryParamMap;
    if (qp.get('abaixoDoMinimo') === 'true') {
      this.abaixoDoMinimo.set(true);
    }
    this.categoriaService.listar().subscribe((lista) => this.categorias.set(lista));
    this.carregarProdutos();
  }

  carregarProdutos(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.produtoService
      .listar({
        page: this.page(),
        size: this.pageSize,
        categoriaId: this.categoriaId || undefined,
        ativos: this.apenasAtivos() ? true : undefined,
        abaixoDoMinimo: this.abaixoDoMinimo() ? true : undefined,
      })
      .subscribe({
        next: (res) => {
          this.produtos.set(res.content);
          this.totalElements.set(res.totalElements);
          this.carregando.set(false);
        },
        error: () => {
          this.erro.set('Não foi possível carregar os produtos.');
          this.carregando.set(false);
        },
      });
  }

  nomeCategoria(id?: string): string {
    if (!id) return '—';
    return this.categoriasMap().get(id) ?? '—';
  }

  onFiltroChange(): void {
    this.page.set(0);
    this.carregarProdutos();
  }

  setApenasAtivos(value: boolean): void {
    this.apenasAtivos.set(value);
    this.page.set(0);
    this.carregarProdutos();
  }

  setAbaixoDoMinimo(value: boolean): void {
    this.abaixoDoMinimo.set(value);
    this.page.set(0);
    this.carregarProdutos();
  }

  onPage(event: PageEvent): void {
    this.page.set(event.pageIndex);
    this.carregarProdutos();
  }

  novo(): void {
    this.router.navigate(['/produtos/novo']);
  }

  verDetalhe(id: string): void {
    this.router.navigate(['/produtos', id]);
  }
}

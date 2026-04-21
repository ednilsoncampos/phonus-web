import {
  AfterViewInit,
  ChangeDetectionStrategy,
  Component,
  computed,
  ElementRef,
  inject,
  OnInit,
  signal,
  ViewChild,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatIconModule } from '@angular/material/icon';
import { MatInputModule } from '@angular/material/input';
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
    MatFormFieldModule,
    MatIconModule,
    MatInputModule,
    MatSelectModule,
    MatSlideToggleModule,
    MatPaginatorModule,
    MatTooltipModule,
    MatProgressSpinnerModule,
  ],
  templateUrl: './produtos-list.component.html',
  styleUrl: './produtos-list.component.scss',
})
export class ProdutosListComponent implements OnInit, AfterViewInit {
  private readonly produtoService = inject(ProdutoService);
  private readonly categoriaService = inject(CategoriaProdutoService);
  private readonly router = inject(Router);
  private readonly route = inject(ActivatedRoute);

  @ViewChild('buscaInput') buscaInput?: ElementRef<HTMLInputElement>;

  readonly colunas = ['nome', 'categoria', 'precoVenda', 'precoCusto', 'estoque', 'status', 'acoes'];
  readonly pageSize = 20;

  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly produtos = signal<Produto[]>([]);
  readonly totalElements = signal(0);
  readonly page = signal(0);
  readonly categorias = signal<CategoriaProduto[]>([]);
  readonly apenasAtivos = signal(true);
  readonly abaixoDoMinimo = signal(false);
  readonly busca = signal('');

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

  ngAfterViewInit(): void {
    this.buscaInput?.nativeElement.focus();
  }

  carregarProdutos(): void {
    this.carregando.set(true);
    this.erro.set(null);

    this.produtoService
      .listar({
        page: this.page(),
        size: this.pageSize,
        categoriaId: this.categoriaId || undefined,
        ativos: this.apenasAtivos(),
        abaixoDoMinimo: this.abaixoDoMinimo() ? true : undefined,
        busca: this.busca() || undefined,
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

  onBusca(event: Event): void {
    this.busca.set((event.target as HTMLInputElement).value);
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

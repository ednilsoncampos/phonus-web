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
  templateUrl: './estoque-list.component.html',
  styleUrl: './estoque-list.component.scss',
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

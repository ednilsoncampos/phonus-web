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
import { RelatorioMargemResponse } from '../../../core/models/relatorio.model';
import { CategoriaProdutoService } from '../../../core/services/categoria-produto.service';
import { ProdutoService } from '../../../core/services/produto.service';
import { CategoriaProduto } from '../../../core/models/categoria-produto.model';
import { Produto } from '../../../core/models/produto.model';
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
  templateUrl: './margem.component.html',
  styleUrl: './margem.component.scss',
})
export class MargemComponent implements OnInit {
  private readonly service = inject(RelatorioService);
  private readonly categoriaService = inject(CategoriaProdutoService);
  private readonly produtoService = inject(ProdutoService);

  readonly MARGEM_BAIXA = MARGEM_BAIXA;
  readonly colunas = ['nome', 'categoria', 'precoVenda', 'precoCusto', 'margem'];

  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly dados = signal<RelatorioMargemResponse | null>(null);
  readonly categorias = signal<CategoriaProduto[]>([]);
  readonly produtos = signal<Produto[]>([]);

  readonly qtdBaixa = computed(
    () => this.dados()?.itens.filter((i) => i.margemPercentual < MARGEM_BAIXA).length ?? 0,
  );

  private readonly produtoCatMap = computed(() => {
    const catMap = new Map<string, string>();
    this.categorias().forEach((c) => catMap.set(c.id, c.nome));

    const map = new Map<string, string>();
    this.produtos().forEach((p) => {
      map.set(p.id, p.categoriaId ? (catMap.get(p.categoriaId) ?? '—') : '—');
    });
    return map;
  });

  ngOnInit(): void {
    this.carregar();
    this.categoriaService.listar().subscribe((lista) => this.categorias.set(lista));
    this.produtoService.listar({ size: 500 }).subscribe((res) => this.produtos.set(res.content));
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

  nomeCategoria(produtoId: string): string {
    return this.produtoCatMap().get(produtoId) ?? '—';
  }
}

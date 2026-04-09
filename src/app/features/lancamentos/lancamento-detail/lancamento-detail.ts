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
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { LancamentoService } from '../../../core/services/lancamento.service';
import { ProdutoService } from '../../../core/services/produto.service';
import {
  FORMA_PAGAMENTO_LABELS,
  FormaPagamento,
  LancamentoResponse,
  TIPO_LANCAMENTO_LABELS,
  TipoLancamento,
} from '../../../core/models/lancamento.model';
import { Produto } from '../../../core/models/produto.model';
import { CurrencyBrlPipe } from '../../../shared/pipes/currency-brl.pipe';
import { DateBrPipe } from '../../../shared/pipes/date-br.pipe';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';


@Component({
  selector: 'app-lancamento-detail',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    PageHeaderComponent,
    CurrencyBrlPipe,
    DateBrPipe,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatTableModule,
  ],
  templateUrl: './lancamento-detail.html',
  styleUrl: './lancamento-detail.scss',
})
export class LancamentoDetail implements OnInit {
  private readonly lancamentoService = inject(LancamentoService);
  private readonly produtoService = inject(ProdutoService);
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);

  private lancamentoId = '';

  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly lancamento = signal<LancamentoResponse | null>(null);
  private readonly produtos = signal<Produto[]>([]);

  tipoLabel(tipo: TipoLancamento): string {
    return TIPO_LANCAMENTO_LABELS[tipo];
  }
  readonly colunasItens = ['produto', 'quantidade', 'valorUnitario', 'desconto', 'subtotal'];
  readonly colunasParcelas = ['numero', 'vencimento', 'valor', 'status'];

  readonly itensComNome = computed(() => {
    const l = this.lancamento();
    if (!l) return [];
    return (l.itens ?? []).map((item) => ({
      ...item,
      nomeProduto: this.produtos().find((p) => p.id === item.produtoId)?.nome ?? item.produtoId,
    }));
  });

  ngOnInit(): void {
    this.lancamentoId = this.route.snapshot.paramMap.get('id') ?? '';
    this.produtoService.listar({ size: 200 }).subscribe({
      next: (r) => this.produtos.set(r.content),
    });
    this.carregar();
  }

  carregar(): void {
    if (!this.lancamentoId) return;
    this.carregando.set(true);
    this.erro.set(null);

    this.lancamentoService.buscar(this.lancamentoId).subscribe({
      next: (l) => {
        this.lancamento.set(l);
        this.carregando.set(false);
      },
      error: () => {
        this.erro.set('Não foi possível carregar o lançamento.');
        this.carregando.set(false);
      },
    });
  }

  formaLabel(forma: FormaPagamento): string {
    return FORMA_PAGAMENTO_LABELS[forma] ?? forma;
  }

  voltar(): void {
    this.router.navigate(['/lancamentos']);
  }
}

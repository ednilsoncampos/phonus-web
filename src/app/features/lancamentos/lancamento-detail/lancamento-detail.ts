import {
  ChangeDetectionStrategy,
  Component,
  computed,
  DestroyRef,
  inject,
  OnInit,
  signal,
} from '@angular/core';
import { ActivatedRoute, Router } from '@angular/router';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatMenuModule } from '@angular/material/menu';
import { MatSnackBar } from '@angular/material/snack-bar';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatTableModule } from '@angular/material/table';
import { HttpErrorResponse } from '@angular/common/http';
import { ArquivoRecibo, FormatoRecibo, ReciboService } from '../../../core/services/recibo.service';
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
    MatMenuModule,
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
  private readonly reciboService = inject(ReciboService);
  private readonly snackBar = inject(MatSnackBar);
  private readonly destroyRef = inject(DestroyRef);
  private timerEspera?: ReturnType<typeof setInterval>;

  private lancamentoId = '';

  readonly carregando = signal(false);
  readonly erro = signal<string | null>(null);
  readonly lancamento = signal<LancamentoResponse | null>(null);
  private readonly produtos = signal<Produto[]>([]);

  readonly gerandoRecibo = signal(false);
  /** Segundos restantes até o limite de recibos (429) liberar; 0 = liberado. */
  readonly esperaRecibo = signal(0);
  readonly reciboIndisponivel = computed(() => this.gerandoRecibo() || this.esperaRecibo() > 0);
  readonly ehVenda = computed(() => this.lancamento()?.tipo === 'ENTRADA_CAIXA');

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
      subtotal: Math.round(item.quantidade * item.valorUnitario),
      nomeProduto: this.produtos().find((p) => p.id === item.produtoId)?.nome ?? item.produtoId,
    }));
  });

  ngOnInit(): void {
    this.destroyRef.onDestroy(() => clearInterval(this.timerEspera));
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

  baixarRecibo(formato: FormatoRecibo): void {
    this.obterRecibo(formato, (arquivo) => {
      const url = URL.createObjectURL(arquivo.blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = arquivo.nome;
      a.click();
      URL.revokeObjectURL(url);
    });
  }

  compartilharRecibo(): void {
    this.obterRecibo('pdf', async (arquivo) => {
      const file = new File([arquivo.blob], arquivo.nome, { type: arquivo.blob.type });
      if (navigator.canShare?.({ files: [file] })) {
        try {
          await navigator.share({ files: [file], title: arquivo.nome });
        } catch (e) {
          if ((e as DOMException).name !== 'AbortError') this.baixarRecibo('pdf');
        }
      } else {
        this.baixarRecibo('pdf');
      }
    });
  }

  private obterRecibo(formato: FormatoRecibo, usar: (arquivo: ArquivoRecibo) => void): void {
    if (this.reciboIndisponivel()) return;
    this.gerandoRecibo.set(true);

    this.reciboService.baixar(this.lancamentoId, formato).subscribe({
      next: (arquivo) => {
        this.gerandoRecibo.set(false);
        usar(arquivo);
      },
      error: (err: unknown) => {
        this.gerandoRecibo.set(false);
        const espera = this.reciboService.segundosParaTentarNovamente(err);
        if (espera) {
          this.iniciarEspera(espera);
        } else if (err instanceof HttpErrorResponse && err.status === 422) {
          this.snackBar.open('Venda grande demais para gerar recibo.', 'Fechar', { duration: 7000 });
        }
      },
    });
  }

  private iniciarEspera(segundos: number): void {
    clearInterval(this.timerEspera);
    this.esperaRecibo.set(segundos);
    this.timerEspera = setInterval(() => {
      this.esperaRecibo.update((s) => Math.max(0, s - 1));
      if (this.esperaRecibo() === 0) clearInterval(this.timerEspera);
    }, 1000);
  }

  voltar(): void {
    this.router.navigate(['/lancamentos']);
  }
}

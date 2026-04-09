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
  FORMA_PAGAMENTO_LABELS,
  FormaPagamento,
  LancamentoResponse,
  ParcelaResponse,
  TIPO_LANCAMENTO_LABELS,
  TipoLancamento,
} from '../../../core/models/lancamento.model';
import { CurrencyBrlPipe } from '../../../shared/pipes/currency-brl.pipe';
import { DateBrPipe } from '../../../shared/pipes/date-br.pipe';
import { DateFieldComponent } from '../../../shared/components/date-field/date-field.component';
import { PageHeaderComponent } from '../../../shared/components/page-header/page-header.component';


@Component({
  selector: 'app-lancamentos-list',
  changeDetection: ChangeDetectionStrategy.OnPush,
  imports: [
    FormsModule,
    PageHeaderComponent,
    CurrencyBrlPipe,
    DateBrPipe,
    DateFieldComponent,
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
  templateUrl: './lancamentos-list.component.html',
  styleUrl: './lancamentos-list.component.scss',
})
export class LancamentosListComponent implements OnInit {
  private readonly service = inject(LancamentoService);
  private readonly router = inject(Router);

  readonly tipoLabels = TIPO_LANCAMENTO_LABELS;
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
    return FORMA_PAGAMENTO_LABELS[forma] ?? forma;
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

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
  templateUrl: './margem.component.html',
  styleUrl: './margem.component.scss',
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
